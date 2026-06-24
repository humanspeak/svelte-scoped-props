import { describe, expect, it } from 'vitest'
import scopedPropsEslint, { configs, createScopedPropsProcessor, processor } from '../src/eslint.js'

const filename = '/demo/Parent.svelte'

describe('ESLint processor', () => {
    it('rewrites scoped props before Svelte lint rules see the source', () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="parent-owned" />
<style>.parent-owned{color:purple}</style>`
        const processed = processSource(source)

        expect(processed).not.toContain('scoped:class')
        expect(processed).toContain('<Child class="parent-owned svelte-')
        expect(processed).toContain('.parent-owned.parent-owned{color:purple}')
        expect(processed).toContain('{#snippet __svelte_scoped_props_marker()}')
    })

    it('maps lint messages inside rewritten dynamic attributes back to the authored attribute', () => {
        const localProcessor = createScopedPropsProcessor()
        const source = `<script>
  import Child from './Child.svelte';
  const classValue = ['parent-owned'];
</script>
<Child scoped:class={classValue} />
<style>.parent-owned{color:purple}</style>`
        const processed = readBlock(localProcessor.preprocess(source, filename))
        const generatedIndex = processed.lastIndexOf('classValue')
        const originalIndex = source.lastIndexOf('classValue')
        const generatedLoc = locFromIndex(processed, generatedIndex)
        const originalLoc = locFromIndex(source, originalIndex)

        const [message] = localProcessor.postprocess(
            [
                [
                    {
                        ruleId: 'no-undef',
                        message: 'classValue is not defined',
                        line: generatedLoc.line,
                        column: generatedLoc.column,
                        endLine: generatedLoc.line,
                        endColumn: generatedLoc.column + 'classValue'.length
                    }
                ]
            ],
            filename
        )

        expect(message).toMatchObject({
            line: originalLoc.line,
            column: originalLoc.column,
            endLine: originalLoc.line,
            endColumn: originalLoc.column + 'classValue'.length
        })
    })

    it('maps messages after generated runtime imports back to their original lines', () => {
        const localProcessor = createScopedPropsProcessor()
        const source = `<script>
  import Child from './Child.svelte';
  const classValue = ['parent-owned'];
</script>
<Child scoped:class={classValue} />
<p>{after}</p>
<style>.parent-owned{color:purple}</style>`
        const processed = readBlock(localProcessor.preprocess(source, filename))
        const generatedIndex = processed.indexOf('after')
        const originalIndex = source.indexOf('after')
        const generatedLoc = locFromIndex(processed, generatedIndex)
        const originalLoc = locFromIndex(source, originalIndex)

        const [message] = localProcessor.postprocess(
            [
                [
                    {
                        ruleId: 'no-undef',
                        message: 'after is not defined',
                        line: generatedLoc.line,
                        column: generatedLoc.column
                    }
                ]
            ],
            filename
        )

        expect(message).toMatchObject({
            line: originalLoc.line,
            column: originalLoc.column
        })
    })

    it('drops messages reported only against generated marker code', () => {
        const localProcessor = createScopedPropsProcessor()
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="parent-owned" />
<style>.parent-owned{color:purple}</style>`
        const processed = readBlock(localProcessor.preprocess(source, filename))
        const generatedLoc = locFromIndex(
            processed,
            processed.indexOf('__svelte_scoped_props_marker')
        )

        const messages = localProcessor.postprocess(
            [
                [
                    {
                        ruleId: 'generated-only',
                        message: 'generated marker',
                        line: generatedLoc.line,
                        column: generatedLoc.column
                    }
                ]
            ],
            filename
        )

        expect(messages).toEqual([])
    })

    it('remaps clean autofix ranges and removes fixes that touch generated text', () => {
        const localProcessor = createScopedPropsProcessor()
        const source = `<script>
  import Child from './Child.svelte';
  const classValue = ['parent-owned'];
</script>
<Child scoped:class={classValue} />
<p>{after}</p>
<style>.parent-owned{color:purple}</style>`
        const processed = readBlock(localProcessor.preprocess(source, filename))
        const generatedAfterIndex = processed.indexOf('after')
        const originalAfterIndex = source.indexOf('after')
        const generatedClassValueIndex = processed.lastIndexOf('classValue')
        const generatedHelperStart = processed.lastIndexOf('__svelte_scoped_props_class')
        const generatedLoc = locFromIndex(processed, generatedAfterIndex)

        const [cleanMessage, generatedFixMessage] = localProcessor.postprocess(
            [
                [
                    {
                        ruleId: 'clean-fix',
                        message: 'clean fix',
                        line: generatedLoc.line,
                        column: generatedLoc.column,
                        fix: {
                            range: [generatedAfterIndex, generatedAfterIndex + 'after'.length],
                            text: 'renamed'
                        }
                    },
                    {
                        ruleId: 'generated-fix',
                        message: 'generated fix',
                        line: generatedLoc.line,
                        column: generatedLoc.column,
                        fix: {
                            range: [
                                generatedHelperStart,
                                generatedClassValueIndex + 'classValue'.length
                            ],
                            text: 'classValue'
                        }
                    }
                ]
            ],
            filename
        )

        expect(cleanMessage?.fix).toEqual({
            range: [originalAfterIndex, originalAfterIndex + 'after'.length],
            text: 'renamed'
        })
        expect(generatedFixMessage?.fix).toBeUndefined()
    })

    it('exports a flat config preset and default helper object', () => {
        expect(configs.recommended).toEqual([
            {
                files: ['**/*.svelte'],
                processor
            }
        ])
        expect(scopedPropsEslint.processor).toBe(processor)
        expect(scopedPropsEslint.configs).toBe(configs)
        expect(scopedPropsEslint.createProcessor).toBe(createScopedPropsProcessor)
    })
})

function processSource(source: string): string {
    const block = readBlock(processor.preprocess(source, filename))
    processor.postprocess([[]], filename)
    return block
}

function readBlock(blocks: ReturnType<typeof processor.preprocess>): string {
    const [block] = blocks

    if (typeof block === 'string') return block

    return block?.text ?? ''
}

function locFromIndex(source: string, index: number): { line: number; column: number } {
    const safeIndex = Math.max(0, index)
    const before = source.slice(0, safeIndex)
    const lines = before.split('\n')

    return {
        line: lines.length,
        column: lines[lines.length - 1]!.length + 1
    }
}
