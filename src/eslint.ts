import type { ScopedPropsOptions } from './index.js'
import { transformScopedProps } from './index.js'

type LintFix = {
    range: [number, number]
    text: string
}

type LintSuggestion = {
    fix?: LintFix
    [key: string]: unknown
}

type LintMessage = {
    line?: number
    column?: number
    endLine?: number
    endColumn?: number
    fix?: LintFix
    suggestions?: LintSuggestion[]
    [key: string]: unknown
}

type ProcessorBlock = string | { text: string; filename?: string }

export type ScopedPropsEslintProcessor = {
    meta: {
        name: string
    }
    preprocess(text: string, filename: string): ProcessorBlock[]
    postprocess(messages: LintMessage[][], filename: string): LintMessage[]
    supportsAutofix: true
}

export type ScopedPropsEslintOptions = ScopedPropsOptions

type ProcessorState = {
    mapper: OffsetMapper
}

type Loc = {
    line: number
    column: number
}

const states = new Map<string, ProcessorState[]>()

export function createScopedPropsProcessor(
    options: ScopedPropsEslintOptions = {}
): ScopedPropsEslintProcessor {
    return {
        meta: {
            name: '@humanspeak/svelte-scoped-props/scoped-props'
        },
        preprocess(text, filename) {
            const result = transformScopedProps(text, {
                ...options,
                filename
            })

            pushState(filename, {
                mapper: new OffsetMapper(text, result.code)
            })

            return [
                {
                    text: result.code,
                    filename
                }
            ]
        },
        postprocess(messages, filename) {
            const state = shiftState(filename)
            const mapper = state?.mapper

            if (!mapper) {
                return messages.flat()
            }

            return messages.flat().flatMap((message) => remapMessage(message, mapper))
        },
        supportsAutofix: true
    }
}

export const createProcessor = createScopedPropsProcessor
export const processor = createScopedPropsProcessor()

export const configs = {
    recommended: [
        {
            files: ['**/*.svelte'],
            processor
        }
    ]
}

const scopedPropsEslint = {
    processor,
    configs,
    createProcessor
}

export default scopedPropsEslint

function pushState(filename: string, state: ProcessorState): void {
    const queue = states.get(filename)

    if (queue) {
        queue.push(state)
        return
    }

    states.set(filename, [state])
}

function shiftState(filename: string): ProcessorState | undefined {
    const queue = states.get(filename)
    const state = queue?.shift()

    if (queue && queue.length === 0) {
        states.delete(filename)
    }

    return state
}

function remapMessage(message: LintMessage, mapper: OffsetMapper): LintMessage[] {
    const remapped = { ...message }

    if (message.line !== undefined && message.column !== undefined) {
        const loc = mapper.remapLoc(
            {
                line: message.line,
                column: message.column
            },
            'start'
        )

        if (!loc) return []

        remapped.line = loc.line
        remapped.column = loc.column
    }

    if (message.endLine !== undefined && message.endColumn !== undefined) {
        const loc = mapper.remapLoc(
            {
                line: message.endLine,
                column: message.endColumn
            },
            'end'
        )

        if (loc) {
            remapped.endLine = loc.line
            remapped.endColumn = loc.column
        } else {
            delete remapped.endLine
            delete remapped.endColumn
        }
    }

    if (message.fix) {
        const fix = mapper.remapFix(message.fix)

        if (fix) {
            remapped.fix = fix
        } else {
            delete remapped.fix
        }
    }

    if (message.suggestions) {
        const suggestions = message.suggestions.flatMap((suggestion) => {
            if (!suggestion.fix) return [suggestion]

            const fix = mapper.remapFix(suggestion.fix)

            return fix ? [{ ...suggestion, fix }] : []
        })

        if (suggestions.length > 0) {
            remapped.suggestions = suggestions
        } else {
            delete remapped.suggestions
        }
    }

    return [remapped]
}

class OffsetMapper {
    private readonly originalLineStarts: number[]
    private readonly generatedLineStarts: number[]
    private readonly generatedToOriginal: Array<number | null>

    constructor(
        private readonly original: string,
        private readonly generated: string
    ) {
        this.originalLineStarts = getLineStarts(original)
        this.generatedLineStarts = getLineStarts(generated)
        this.generatedToOriginal = buildCharacterMap(original, generated)
    }

    remapLoc(loc: Loc, bias: 'start' | 'end'): Loc | null {
        const index = getIndexFromLoc(this.generatedLineStarts, this.generated, loc)
        const remapped = this.remapIndex(index, bias)

        if (remapped === null) return null

        return getLocFromIndex(this.originalLineStarts, this.original, remapped)
    }

    remapFix(fix: LintFix): LintFix | null {
        if (!this.canMapRange(fix.range[0], fix.range[1])) return null

        const start = this.remapIndex(fix.range[0], 'start')
        const end = this.remapIndex(fix.range[1], 'end')

        if (start === null || end === null || end < start) return null

        return {
            ...fix,
            range: [start, end]
        }
    }

    private remapIndex(index: number, bias: 'start' | 'end'): number | null {
        if (bias === 'start') {
            if (index < this.generatedToOriginal.length) {
                const direct = this.generatedToOriginal[index] ?? null
                if (direct !== null) return direct
            }

            for (let cursor = index + 1; cursor < this.generatedToOriginal.length; cursor += 1) {
                const mapped = this.generatedToOriginal[cursor] ?? null
                if (mapped !== null) return mapped
                if (this.generated[cursor - 1] === '\n') break
            }

            for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
                const mapped = this.generatedToOriginal[cursor] ?? null
                if (mapped !== null) return mapped + 1
                if (this.generated[cursor] === '\n') break
            }

            return null
        }

        for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
            const mapped = this.generatedToOriginal[cursor] ?? null
            if (mapped !== null) return mapped + 1
            if (this.generated[cursor] === '\n') break
        }

        if (index < this.generatedToOriginal.length) {
            const direct = this.generatedToOriginal[index] ?? null
            if (direct !== null) return direct
        }

        return null
    }

    private canMapRange(start: number, end: number): boolean {
        if (start === end) {
            return this.remapIndex(start, 'start') !== null
        }

        for (let index = start; index < end; index += 1) {
            if (this.generatedToOriginal[index] == null) return false
        }

        return true
    }
}

function buildCharacterMap(original: string, generated: string): Array<number | null> {
    const map = new Array<number | null>(generated.length).fill(null)
    const originalLines = splitLines(original)
    const generatedLines = splitLines(generated)
    const matches = matchEqualLines(originalLines, generatedLines)
    let originalCursor = 0
    let generatedCursor = 0

    for (const match of matches) {
        const originalEnd = sumLengths(originalLines, match.originalLine)
        const generatedEnd = sumLengths(generatedLines, match.generatedLine)

        mapBlock(
            original,
            generated,
            originalCursor,
            originalEnd,
            generatedCursor,
            generatedEnd,
            map
        )

        const originalMatchEnd = originalEnd + originalLines[match.originalLine]!.length
        const generatedMatchEnd = generatedEnd + generatedLines[match.generatedLine]!.length

        for (
            let offset = 0;
            offset < generatedMatchEnd - generatedEnd && originalEnd + offset < originalMatchEnd;
            offset += 1
        ) {
            map[generatedEnd + offset] = originalEnd + offset
        }

        originalCursor = originalMatchEnd
        generatedCursor = generatedMatchEnd
    }

    mapBlock(
        original,
        generated,
        originalCursor,
        original.length,
        generatedCursor,
        generated.length,
        map
    )

    return map
}

function mapBlock(
    original: string,
    generated: string,
    originalStart: number,
    originalEnd: number,
    generatedStart: number,
    generatedEnd: number,
    map: Array<number | null>
): void {
    const originalBlock = original.slice(originalStart, originalEnd)
    const generatedBlock = generated.slice(generatedStart, generatedEnd)
    const blockMap = buildBlockCharacterMap(originalBlock, generatedBlock)

    for (let index = 0; index < blockMap.length; index += 1) {
        const mapped = blockMap[index] ?? null
        map[generatedStart + index] = mapped === null ? null : originalStart + mapped
    }
}

function buildBlockCharacterMap(original: string, generated: string): Array<number | null> {
    const map = new Array<number | null>(generated.length).fill(null)
    let prefix = 0

    while (
        prefix < original.length &&
        prefix < generated.length &&
        original[prefix] === generated[prefix]
    ) {
        map[prefix] = prefix
        prefix += 1
    }

    let suffix = 0

    while (
        suffix < original.length - prefix &&
        suffix < generated.length - prefix &&
        original[original.length - suffix - 1] === generated[generated.length - suffix - 1]
    ) {
        map[generated.length - suffix - 1] = original.length - suffix - 1
        suffix += 1
    }

    const originalMiddle = original.slice(prefix, original.length - suffix)
    const generatedMiddle = generated.slice(prefix, generated.length - suffix)

    if (originalMiddle.length === 0 || generatedMiddle.length === 0) {
        return map
    }

    const product = originalMiddle.length * generatedMiddle.length

    if (product > 250_000) {
        mapByAnchors(originalMiddle, generatedMiddle, prefix, map)
        return map
    }

    const pairs = longestCommonSubsequencePairs(originalMiddle, generatedMiddle)

    for (const [originalIndex, generatedIndex] of pairs) {
        map[prefix + generatedIndex] = prefix + originalIndex
    }

    return map
}

function mapByAnchors(
    original: string,
    generated: string,
    offset: number,
    map: Array<number | null>
): void {
    let originalCursor = 0
    let generatedCursor = 0

    while (generatedCursor < generated.length) {
        const anchor = findNextAnchor(original, generated, originalCursor, generatedCursor)

        if (!anchor) break

        for (let index = 0; index < anchor.length; index += 1) {
            map[offset + anchor.generated + index] = offset + anchor.original + index
        }

        originalCursor = anchor.original + anchor.length
        generatedCursor = anchor.generated + anchor.length
    }
}

function findNextAnchor(
    original: string,
    generated: string,
    originalStart: number,
    generatedStart: number
): { original: number; generated: number; length: number } | null {
    for (const length of [24, 16, 12, 8, 4]) {
        for (
            let generatedIndex = generatedStart;
            generatedIndex <= generated.length - length;
            generatedIndex += 1
        ) {
            const candidate = generated.slice(generatedIndex, generatedIndex + length)
            const originalIndex = original.indexOf(candidate, originalStart)

            if (originalIndex !== -1) {
                return {
                    original: originalIndex,
                    generated: generatedIndex,
                    length
                }
            }
        }
    }

    return null
}

function longestCommonSubsequencePairs(
    original: string,
    generated: string
): Array<[number, number]> {
    const width = generated.length + 1
    const table = new Uint16Array((original.length + 1) * width)

    for (let originalIndex = original.length - 1; originalIndex >= 0; originalIndex -= 1) {
        for (let generatedIndex = generated.length - 1; generatedIndex >= 0; generatedIndex -= 1) {
            const cursor = originalIndex * width + generatedIndex

            table[cursor] =
                original[originalIndex] === generated[generatedIndex]
                    ? table[(originalIndex + 1) * width + generatedIndex + 1]! + 1
                    : Math.max(
                          table[(originalIndex + 1) * width + generatedIndex]!,
                          table[originalIndex * width + generatedIndex + 1]!
                      )
        }
    }

    const pairs: Array<[number, number]> = []
    let originalIndex = 0
    let generatedIndex = 0

    while (originalIndex < original.length && generatedIndex < generated.length) {
        if (original[originalIndex] === generated[generatedIndex]) {
            pairs.push([originalIndex, generatedIndex])
            originalIndex += 1
            generatedIndex += 1
            continue
        }

        if (
            table[(originalIndex + 1) * width + generatedIndex]! >=
            table[originalIndex * width + generatedIndex + 1]!
        ) {
            originalIndex += 1
        } else {
            generatedIndex += 1
        }
    }

    return pairs
}

function matchEqualLines(
    originalLines: string[],
    generatedLines: string[]
): Array<{ originalLine: number; generatedLine: number }> {
    const width = generatedLines.length + 1
    const table = new Uint16Array((originalLines.length + 1) * width)

    for (let originalIndex = originalLines.length - 1; originalIndex >= 0; originalIndex -= 1) {
        for (
            let generatedIndex = generatedLines.length - 1;
            generatedIndex >= 0;
            generatedIndex -= 1
        ) {
            const cursor = originalIndex * width + generatedIndex

            table[cursor] =
                originalLines[originalIndex] === generatedLines[generatedIndex]
                    ? table[(originalIndex + 1) * width + generatedIndex + 1]! + 1
                    : Math.max(
                          table[(originalIndex + 1) * width + generatedIndex]!,
                          table[originalIndex * width + generatedIndex + 1]!
                      )
        }
    }

    const matches: Array<{ originalLine: number; generatedLine: number }> = []
    let originalIndex = 0
    let generatedIndex = 0

    while (originalIndex < originalLines.length && generatedIndex < generatedLines.length) {
        if (originalLines[originalIndex] === generatedLines[generatedIndex]) {
            matches.push({
                originalLine: originalIndex,
                generatedLine: generatedIndex
            })
            originalIndex += 1
            generatedIndex += 1
            continue
        }

        if (
            table[(originalIndex + 1) * width + generatedIndex]! >=
            table[originalIndex * width + generatedIndex + 1]!
        ) {
            originalIndex += 1
        } else {
            generatedIndex += 1
        }
    }

    return matches
}

function splitLines(source: string): string[] {
    const lines: string[] = []
    let start = 0

    for (let index = 0; index < source.length; index += 1) {
        if (source[index] === '\n') {
            lines.push(source.slice(start, index + 1))
            start = index + 1
        }
    }

    if (start < source.length || source.length === 0) {
        lines.push(source.slice(start))
    }

    return lines
}

function sumLengths(lines: string[], end: number): number {
    let total = 0

    for (let index = 0; index < end; index += 1) {
        total += lines[index]?.length ?? 0
    }

    return total
}

function getLineStarts(source: string): number[] {
    const starts = [0]

    for (let index = 0; index < source.length; index += 1) {
        if (source[index] === '\n') {
            starts.push(index + 1)
        }
    }

    return starts
}

function getIndexFromLoc(lineStarts: number[], source: string, loc: Loc): number {
    const lineStart = lineStarts[Math.max(0, loc.line - 1)] ?? source.length
    return Math.min(source.length, lineStart + Math.max(0, loc.column - 1))
}

function getLocFromIndex(lineStarts: number[], source: string, index: number): Loc {
    const safeIndex = Math.max(0, Math.min(index, source.length))
    let low = 0
    let high = lineStarts.length - 1

    while (low <= high) {
        const middle = Math.floor((low + high) / 2)

        if (lineStarts[middle]! <= safeIndex) {
            low = middle + 1
        } else {
            high = middle - 1
        }
    }

    const lineIndex = Math.max(0, high)

    return {
        line: lineIndex + 1,
        column: safeIndex - lineStarts[lineIndex]! + 1
    }
}
