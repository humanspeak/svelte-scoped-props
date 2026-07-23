import path from 'node:path'
import type { PreprocessorGroup } from 'svelte/compiler'
import { defaultCssHash, hash, type CssHashGetter } from './hash.js'

type AttributeValue =
    | {
          kind: 'quoted'
          quote: '"' | "'"
          content: string
      }
    | {
          kind: 'expression'
          content: string
      }
    | {
          kind: 'bare'
          content: string
      }

type Attribute = {
    name: string
    start: number
    end: number
    value?: AttributeValue
}

type Replacement = {
    start: number
    end: number
    value: string
}

export type ScopedPropsOptions = {
    cssHash?: CssHashGetter
    marker?: false | 'snippet'
    normalizeFilename?: false | ((filename: string) => string)
    runtimeModule?: string
}

export type TransformResult = {
    code: string
    scopedAttributeCount: number
    dynamicAttributeCount: number
    hash: string
}

type TagTransformResult = {
    code: string
    scopedAttributeCount: number
    dynamicAttributeCount: number
}

type ScopedAttributeScanResult = {
    scopedAttributeCount: number
    dynamicAttributeCount: number
    literalClassNames: Set<string>
}

const DEFAULT_RUNTIME_MODULE = 'svelte-scoped-props/runtime'
const RUNTIME_IMPORT_NAME = '__svelte_scoped_props_class'

export function scopedProps(options: ScopedPropsOptions = {}): PreprocessorGroup {
    return {
        name: 'svelte-scoped-props',
        markup({ content, filename }) {
            const result = transformScopedProps(content, {
                ...options,
                filename
            })

            return {
                code: result.code
            }
        }
    }
}

export function transformScopedProps(
    source: string,
    options: ScopedPropsOptions & { filename?: string } = {}
): TransformResult {
    const scanned = scanScopedAttributes(source)
    const boostedClassNames = new Set(scanned.literalClassNames)

    if (scanned.dynamicAttributeCount > 0) {
        for (const className of readCssClassNames(source)) {
            boostedClassNames.add(className)
        }
    }

    const scopedSource =
        scanned.scopedAttributeCount > 0
            ? boostScopedStyleSpecificity(source, boostedClassNames)
            : source

    const css = readStyleContent(scopedSource)
    const cssHash = options.cssHash ?? defaultCssHash
    const filename = normalizeFilename(options.filename, options.normalizeFilename)
    const scopeHash = cssHash({
        css,
        filename,
        hash
    })

    const runtimeModule = options.runtimeModule ?? DEFAULT_RUNTIME_MODULE
    const marker = options.marker ?? 'snippet'

    const transformed = transformTags(scopedSource, scopeHash)
    let code = transformed.code

    if (transformed.dynamicAttributeCount > 0) {
        code = addRuntimeImport(code, runtimeModule)
    }

    if (marker === 'snippet' && transformed.scopedAttributeCount > 0) {
        code = addCssMarkerSnippet(code)
    }

    return {
        code,
        scopedAttributeCount: transformed.scopedAttributeCount,
        dynamicAttributeCount: transformed.dynamicAttributeCount,
        hash: scopeHash
    }
}

function scanScopedAttributes(source: string): ScopedAttributeScanResult {
    let index = 0
    let scopedAttributeCount = 0
    let dynamicAttributeCount = 0
    const literalClassNames = new Set<string>()

    while (index < source.length) {
        if (source.startsWith('<!--', index)) {
            index = findCommentEnd(source, index)
            continue
        }

        if (startsWithTag(source, index, 'script') || startsWithTag(source, index, 'style')) {
            index = findPairedTagEnd(source, index)
            continue
        }

        if (source[index] !== '<' || !isTagNameStart(source[index + 1])) {
            index += 1
            continue
        }

        const tag = readOpenTag(source, index)

        if (!tag) {
            index += 1
            continue
        }

        if (tag.source.includes('scoped:')) {
            const tagName = readTagName(tag.source)
            const attributes = readAttributes(tag.source, tagName.length + 1)

            for (const attribute of attributes) {
                if (!attribute.name.startsWith('scoped:')) continue

                scopedAttributeCount += 1

                if (!attribute.value) continue

                if (attribute.value.kind === 'expression') {
                    dynamicAttributeCount += 1
                } else {
                    addClassNameTokens(literalClassNames, attribute.value.content)
                }
            }
        }

        index = tag.end
    }

    return {
        scopedAttributeCount,
        dynamicAttributeCount,
        literalClassNames
    }
}

function normalizeFilename(
    filename: string | undefined,
    normalize: ScopedPropsOptions['normalizeFilename']
): string | undefined {
    if (!filename || normalize === false) return filename

    if (normalize) {
        return normalize(filename)
    }

    if (!path.isAbsolute(filename)) {
        return toPosixPath(filename)
    }

    const relative = path.relative(process.cwd(), filename)

    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        return toPosixPath(relative)
    }

    return toPosixPath(filename)
}

function toPosixPath(filename: string): string {
    return filename.split(path.sep).join('/')
}

function transformTags(source: string, scopeHash: string): TagTransformResult {
    let output = ''
    let cursor = 0
    let index = 0
    let scopedAttributeCount = 0
    let dynamicAttributeCount = 0

    while (index < source.length) {
        if (source.startsWith('<!--', index)) {
            index = findCommentEnd(source, index)
            continue
        }

        if (startsWithTag(source, index, 'script') || startsWithTag(source, index, 'style')) {
            index = findPairedTagEnd(source, index)
            continue
        }

        if (source[index] !== '<' || !isTagNameStart(source[index + 1])) {
            index += 1
            continue
        }

        const tag = readOpenTag(source, index)

        if (!tag) {
            index += 1
            continue
        }

        if (tag.source.includes('scoped:')) {
            const transformed = transformTag(tag.source, scopeHash)

            scopedAttributeCount += transformed.scopedAttributeCount
            dynamicAttributeCount += transformed.dynamicAttributeCount

            if (transformed.code !== tag.source) {
                output += source.slice(cursor, index)
                output += transformed.code
                cursor = tag.end
            }
        }

        index = tag.end
    }

    return {
        code: output + source.slice(cursor),
        scopedAttributeCount,
        dynamicAttributeCount
    }
}

function transformTag(tagSource: string, scopeHash: string): TagTransformResult {
    const tagName = readTagName(tagSource)
    const attributes = readAttributes(tagSource, tagName.length + 1)
    const replacements: Replacement[] = []
    let scopedAttributeCount = 0
    let dynamicAttributeCount = 0

    for (const attribute of attributes) {
        if (!attribute.name.startsWith('scoped:')) continue

        scopedAttributeCount += 1

        if (!isComponentTag(tagName)) {
            throw new Error(
                `scoped: directives can only be used on component tags, not <${tagName}>.`
            )
        }

        const propName = attribute.name.slice('scoped:'.length)

        if (!propName) {
            throw new Error('scoped: directives must name the prop they target.')
        }

        if (propName.includes('|')) {
            throw new Error(`scoped:${propName} does not support modifiers.`)
        }

        if (!attribute.value) {
            throw new Error(`scoped:${propName} requires an explicit value.`)
        }

        if (attributes.some((other) => other !== attribute && other.name === propName)) {
            throw new Error(
                `Cannot combine scoped:${propName} with ${propName} on the same component.`
            )
        }

        const replacement = buildReplacement(propName, attribute.value, scopeHash)

        if (attribute.value.kind === 'expression') {
            dynamicAttributeCount += 1
        }

        replacements.push({
            start: attribute.start,
            end: attribute.end,
            value: replacement
        })
    }

    if (replacements.length === 0) {
        return {
            code: tagSource,
            scopedAttributeCount,
            dynamicAttributeCount
        }
    }

    replacements.sort((left, right) => right.start - left.start)

    let transformed = tagSource

    for (const replacement of replacements) {
        transformed =
            transformed.slice(0, replacement.start) +
            replacement.value +
            transformed.slice(replacement.end)
    }

    return {
        code: transformed,
        scopedAttributeCount,
        dynamicAttributeCount
    }
}

function buildReplacement(propName: string, value: AttributeValue, scopeHash: string): string {
    if (value.kind === 'expression') {
        return `${propName}={${RUNTIME_IMPORT_NAME}(${value.content}, ${JSON.stringify(scopeHash)})}`
    }

    const className = `${value.content} ${scopeHash}`.trim()

    if (value.kind === 'bare') {
        return `${propName}="${escapeAttribute(className)}"`
    }

    return `${propName}=${value.quote}${escapeAttribute(className, value.quote)}${value.quote}`
}

function readTagName(tagSource: string): string {
    let index = 1

    while (index < tagSource.length && isTagNameCharacter(tagSource[index])) {
        index += 1
    }

    return tagSource.slice(1, index)
}

function readAttributes(tagSource: string, start: number): Attribute[] {
    const attributes: Attribute[] = []
    let index = start

    while (index < tagSource.length) {
        while (/\s/.test(tagSource[index] ?? '')) index += 1

        if (tagSource[index] === '>' || tagSource[index] === '/') break

        const attributeStart = index

        while (index < tagSource.length && !/\s|=|\/|>/.test(tagSource[index] ?? '')) {
            index += 1
        }

        const name = tagSource.slice(attributeStart, index)

        while (/\s/.test(tagSource[index] ?? '')) index += 1

        if (tagSource[index] !== '=') {
            attributes.push({
                name,
                start: attributeStart,
                end: index
            })
            continue
        }

        index += 1

        while (/\s/.test(tagSource[index] ?? '')) index += 1

        const valueStart = index
        const quote = tagSource[index]

        if (quote === '"' || quote === "'") {
            index += 1
            const contentStart = index

            while (index < tagSource.length && tagSource[index] !== quote) {
                index += 1
            }

            const content = tagSource.slice(contentStart, index)
            index += 1

            attributes.push({
                name,
                start: attributeStart,
                end: index,
                value: {
                    kind: 'quoted',
                    quote,
                    content
                }
            })
            continue
        }

        if (quote === '{') {
            const expressionEnd = findBalancedBraceEnd(tagSource, index)

            attributes.push({
                name,
                start: attributeStart,
                end: expressionEnd + 1,
                value: {
                    kind: 'expression',
                    content: tagSource.slice(index + 1, expressionEnd).trim()
                }
            })

            index = expressionEnd + 1
            continue
        }

        while (index < tagSource.length && !/\s|\/|>/.test(tagSource[index] ?? '')) {
            index += 1
        }

        attributes.push({
            name,
            start: attributeStart,
            end: index,
            value: {
                kind: 'bare',
                content: tagSource.slice(valueStart, index)
            }
        })
    }

    return attributes
}

function readOpenTag(source: string, start: number): { source: string; end: number } | null {
    let index = start + 1

    while (index < source.length && isTagNameCharacter(source[index])) {
        index += 1
    }

    if (index === start + 1) return null

    const end = findOpenTagEnd(source, index)

    if (end === -1) return null

    return {
        source: source.slice(start, end + 1),
        end: end + 1
    }
}

function findOpenTagEnd(source: string, start: number): number {
    let quote: string | null = null
    let braceDepth = 0

    for (let index = start; index < source.length; index += 1) {
        const character = source[index]
        const previous = source[index - 1]

        if (quote) {
            if (character === quote && previous !== '\\') {
                quote = null
            }
            continue
        }

        if (character === '"' || character === "'" || character === '`') {
            quote = character
            continue
        }

        if (character === '{') {
            braceDepth += 1
            continue
        }

        if (character === '}') {
            braceDepth -= 1
            continue
        }

        if (character === '>' && braceDepth === 0) {
            return index
        }
    }

    return -1
}

function findBalancedBraceEnd(source: string, start: number): number {
    let quote: string | null = null
    let braceDepth = 0

    for (let index = start; index < source.length; index += 1) {
        const character = source[index]
        const previous = source[index - 1]

        if (quote) {
            if (character === quote && previous !== '\\') {
                quote = null
            }
            continue
        }

        if (character === '"' || character === "'" || character === '`') {
            quote = character
            continue
        }

        if (character === '{') {
            braceDepth += 1
            continue
        }

        if (character === '}') {
            braceDepth -= 1

            if (braceDepth === 0) {
                return index
            }
        }
    }

    throw new Error('Could not find the end of a scoped: expression.')
}

function addRuntimeImport(source: string, runtimeModule: string): string {
    const importStatement = `import { scopedClass as ${RUNTIME_IMPORT_NAME} } from ${JSON.stringify(runtimeModule)};`

    if (source.includes(importStatement)) return source

    const script = findInstanceScript(source)

    if (!script) {
        return `<script>\n  ${importStatement}\n</script>\n${source}`
    }

    return `${source.slice(0, script.contentStart)}\n  ${importStatement}${source.slice(script.contentStart)}`
}

function findInstanceScript(source: string): { contentStart: number } | null {
    const scriptPattern = /<script(?<attrs>[^>]*)>/g
    let match: RegExpExecArray | null

    while ((match = scriptPattern.exec(source)) !== null) {
        const attrs = match.groups?.attrs ?? ''

        if (/\bmodule\b|\bcontext\s*=\s*["']module["']/.test(attrs)) {
            continue
        }

        return {
            contentStart: match.index + match[0].length
        }
    }

    return null
}

function addCssMarkerSnippet(source: string): string {
    const classes = Array.from(readCssClassNames(source))

    if (classes.length === 0) return source

    const snippetName = uniqueSnippetName(source)
    const chains = readMarkerChains(source).join('')
    const fallback = `<div class="${classes.join(' ')}"></div>`
    const marker = `\n{#snippet ${snippetName}()}${chains}${fallback}{/snippet}\n`

    return `${source}${marker}`
}

type SelectorCompound = { type: string | null; classes: string[] }
type MarkerNode = { tag: string; classes: string[]; children: MarkerNode[] }
type SelectorCombinator = 'descendant' | 'child' | 'sibling'

const UNSYNTHESIZABLE_TYPES = new Set([
    'html',
    'body',
    'head',
    'title',
    'meta',
    'link',
    'script',
    'style',
    'slot'
])
const VOID_TYPES = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'source',
    'track',
    'wbr'
])

function readMarkerChains(source: string): string[] {
    const chains = new Set<string>()

    for (const css of readStyleContents(source)) {
        mapCssPreludes(css, (prelude) => {
            if (prelude.trimStart().startsWith('@')) return prelude

            for (const selector of splitTopLevelSelectors(prelude)) {
                const chain = synthesizeSelectorChain(selector)
                if (chain !== null) chains.add(chain)
            }

            return prelude
        })
    }

    return Array.from(chains)
}

function splitTopLevelSelectors(prelude: string): string[] {
    const scannable = stripQuotedSections(prelude)
    const selectors: string[] = []
    let depth = 0
    let start = 0

    for (let index = 0; index < prelude.length; index += 1) {
        const character = scannable[index]

        if (character === '(' || character === '[') {
            depth += 1
        } else if (character === ')' || character === ']') {
            depth = Math.max(0, depth - 1)
        } else if (character === ',' && depth === 0) {
            selectors.push(prelude.slice(start, index))
            start = index + 1
        }
    }

    selectors.push(prelude.slice(start))

    return selectors.map((selector) => selector.trim()).filter((selector) => selector.length > 0)
}

function synthesizeSelectorChain(selector: string): string | null {
    const { compounds, combinators } = splitSelectorCompounds(selector)
    if (compounds.length === 0) return null

    const parsed: SelectorCompound[] = []
    for (const compound of compounds) {
        const result = parseSelectorCompound(compound)
        if (result === null) return null
        parsed.push(result)
    }

    for (const [index, compound] of parsed.entries()) {
        const type = compound.type
        if (type === null) continue

        const lower = type.toLowerCase()
        if (UNSYNTHESIZABLE_TYPES.has(lower)) return null
        if (VOID_TYPES.has(lower) && index < parsed.length - 1) return null
    }

    const roots: MarkerNode[] = []
    let path: MarkerNode[] = []

    for (const [index, compound] of parsed.entries()) {
        const node: MarkerNode = {
            tag: compound.type ?? 'div',
            classes: compound.classes,
            children: []
        }

        if (index === 0) {
            roots.push(node)
            path = [node]
            continue
        }

        const combinator = combinators[index - 1]

        if (combinator === 'sibling') {
            const parent = path[path.length - 2]
            if (parent) {
                parent.children.push(node)
            } else {
                roots.push(node)
            }
            path = path.slice(0, -1)
            path.push(node)
        } else {
            const parent = path[path.length - 1]
            if (parent) parent.children.push(node)
            path.push(node)
        }
    }

    const root = roots[0]
    if (roots.length === 1 && root && root.tag === 'div' && root.children.length === 0) {
        return null
    }

    return roots.map(renderMarkerNode).join('')
}

function splitSelectorCompounds(selector: string): {
    compounds: string[]
    combinators: SelectorCombinator[]
} {
    const scannable = stripQuotedSections(selector)
    const compounds: string[] = []
    const combinators: SelectorCombinator[] = []
    let depth = 0
    let index = 0

    while (index < selector.length) {
        let combinator: SelectorCombinator = 'descendant'
        let sawSeparator = false

        while (index < selector.length) {
            const character = scannable[index] ?? ''
            const isSeparator = depth === 0 && (/\s/.test(character) || '>+~'.includes(character))

            if (!isSeparator) break

            sawSeparator = true
            if (character === '>') combinator = 'child'
            else if (character === '+' || character === '~') combinator = 'sibling'
            index += 1
        }

        if (index >= selector.length) break

        const compoundStart = index
        while (index < selector.length) {
            const character = scannable[index] ?? ''

            if (character === '(' || character === '[') {
                depth += 1
            } else if (character === ')' || character === ']') {
                depth = Math.max(0, depth - 1)
            } else if (depth === 0 && (/\s/.test(character) || '>+~'.includes(character))) {
                break
            }

            index += 1
        }

        if (compounds.length > 0 && sawSeparator) {
            combinators.push(combinator)
        }
        compounds.push(selector.slice(compoundStart, index))
    }

    return { compounds, combinators }
}

function parseSelectorCompound(compound: string): SelectorCompound | null {
    const scannable = stripQuotedSections(compound)
    if (scannable.includes('[')) return null
    if (scannable.includes(':global')) return null

    let type: string | null = null
    const classes: string[] = []
    let index = 0

    const typeMatch = /^(\*|[a-zA-Z][a-zA-Z0-9-]*)/.exec(compound)
    if (typeMatch) {
        const typeToken = typeMatch[1] as string
        type = typeToken === '*' ? null : typeToken
        index = typeMatch[0].length
    }

    while (index < compound.length) {
        const character = compound[index]

        if (character === '.') {
            const classMatch = /^\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/.exec(compound.slice(index))
            if (!classMatch) return null
            const className = classMatch[1] as string
            if (!classes.includes(className)) classes.push(className)
            index += classMatch[0].length
            continue
        }

        if (character === ':') {
            index += 1
            if (compound[index] === ':') index += 1

            const nameMatch = /^[a-zA-Z-]+/.exec(compound.slice(index))
            if (!nameMatch) return null
            index += nameMatch[0].length

            if (compound[index] === '(') {
                let depth = 0
                while (index < compound.length) {
                    const inner = compound[index]
                    if (inner === '(') {
                        depth += 1
                    } else if (inner === ')') {
                        depth -= 1
                        index += 1
                        if (depth === 0) break
                        continue
                    }
                    index += 1
                }
            }
            continue
        }

        return null
    }

    return { type, classes }
}

function renderMarkerNode(node: MarkerNode): string {
    const classAttribute = node.classes.length > 0 ? ` class="${node.classes.join(' ')}"` : ''
    const children = node.children.map(renderMarkerNode).join('')

    return `<${node.tag}${classAttribute}>${children}</${node.tag}>`
}

function boostScopedStyleSpecificity(source: string, classNames: Set<string>): string {
    if (classNames.size === 0) return source

    return source.replace(
        /(<style(?:\s[^>]*)?>)([\s\S]*?)(<\/style>)/gi,
        (_match, open: string, css: string, close: string) =>
            `${open}${boostCssSpecificity(css, classNames)}${close}`
    )
}

function mapCssPreludes(css: string, map: (prelude: string) => string): string {
    let output = ''
    let segmentStart = 0
    let quote: string | null = null
    let inComment = false

    for (let index = 0; index < css.length; index += 1) {
        const character = css[index]
        const previous = css[index - 1]

        if (inComment) {
            if (previous === '*' && character === '/') {
                inComment = false
            }
            continue
        }

        if (quote) {
            if (character === quote && previous !== '\\') {
                quote = null
            }
            continue
        }

        if (character === '/' && css[index + 1] === '*') {
            inComment = true
            index += 1
            continue
        }

        if (character === '"' || character === "'") {
            quote = character
            continue
        }

        if (character === '{') {
            const prelude = css.slice(segmentStart, index)
            output += map(prelude)
            output += character
            segmentStart = index + 1
            continue
        }

        if (character === '}') {
            output += css.slice(segmentStart, index + 1)
            segmentStart = index + 1
        }
    }

    return output + css.slice(segmentStart)
}

function boostCssSpecificity(css: string, classNames: Set<string>): string {
    return mapCssPreludes(css, (prelude) => boostSelectorPrelude(prelude, classNames))
}

function stripQuotedSections(text: string): string {
    return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (match) => ' '.repeat(match.length))
}

function boostSelectorPrelude(prelude: string, classNames: Set<string>): string {
    if (prelude.trimStart().startsWith('@')) return prelude

    const scannable = stripQuotedSections(prelude)
    const pattern = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g
    let output = ''
    let cursor = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(scannable)) !== null) {
        const token = match[0]
        const className = match[1] as string
        if (!classNames.has(className)) continue

        const previous = scannable.slice(Math.max(0, match.index - token.length), match.index)
        const next = scannable.slice(match.index + token.length, match.index + token.length * 2)
        if (previous === token || next === token) continue

        const end = match.index + token.length
        output += prelude.slice(cursor, end) + token
        cursor = end
    }

    return output + prelude.slice(cursor)
}

function addClassNameTokens(classNames: Set<string>, value: string): void {
    for (const token of value.split(/\s+/)) {
        if (token) {
            classNames.add(token)
        }
    }
}

function uniqueSnippetName(source: string): string {
    let name = '__svelte_scoped_props_marker'
    let suffix = 0

    while (source.includes(name)) {
        suffix += 1
        name = `__svelte_scoped_props_marker_${suffix}`
    }

    return name
}

function readCssClassNames(source: string): Set<string> {
    const classes = new Set<string>()
    const classPattern = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g

    for (const css of readStyleContents(source)) {
        mapCssPreludes(css, (prelude) => {
            if (prelude.trimStart().startsWith('@')) return prelude

            const scannable = stripQuotedSections(prelude)
            let match: RegExpExecArray | null

            classPattern.lastIndex = 0
            while ((match = classPattern.exec(scannable)) !== null) {
                classes.add(match[1] as string)
            }

            return prelude
        })
    }

    return classes
}

function readStyleContent(source: string): string {
    return readStyleContents(source).join('\n')
}

function readStyleContents(source: string): string[] {
    const styles: string[] = []
    const stylePattern = /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi
    let match: RegExpExecArray | null

    while ((match = stylePattern.exec(source)) !== null) {
        styles.push(match[1] ?? '')
    }

    return styles
}

function startsWithTag(source: string, index: number, tagName: 'script' | 'style'): boolean {
    if (source[index] !== '<') return false

    const candidate = source.slice(index + 1, index + 1 + tagName.length).toLowerCase()
    const next = source[index + 1 + tagName.length]

    return candidate === tagName && (next === '>' || /\s/.test(next ?? ''))
}

function findPairedTagEnd(source: string, start: number): number {
    const tagName = source
        .slice(start + 1, start + 7)
        .toLowerCase()
        .startsWith('script')
        ? 'script'
        : 'style'
    const close = `</${tagName}>`
    const closeIndex = source.toLowerCase().indexOf(close, start)

    return closeIndex === -1 ? source.length : closeIndex + close.length
}

function findCommentEnd(source: string, start: number): number {
    const end = source.indexOf('-->', start + 4)

    return end === -1 ? source.length : end + 3
}

function isComponentTag(tagName: string): boolean {
    return /^[A-Z]/.test(tagName) || tagName.includes('.')
}

function isTagNameStart(character: string | undefined): boolean {
    return Boolean(character && /[A-Za-z_]/.test(character))
}

function isTagNameCharacter(character: string | undefined): boolean {
    return Boolean(character && /[A-Za-z0-9_.$:-]/.test(character))
}

function escapeAttribute(value: string, quote: '"' | "'" = '"'): string {
    const escaped = value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')

    return quote === '"' ? escaped.replaceAll('"', '&quot;') : escaped.replaceAll("'", '&#39;')
}
