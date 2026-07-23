import { compile, preprocess } from 'svelte/compiler'
import { describe, expect, it } from 'vitest'
import { defaultCssHash, hash } from '../src/hash.js'
import { scopedProps, transformScopedProps } from '../src/index.js'

const filename = '/demo/Parent.svelte'
const expectedHash = defaultCssHash({
    css: '.parent-owned.parent-owned{color:purple}',
    filename,
    hash
})

describe('transformScopedProps', () => {
    it('rewrites literal scoped props into normal props with the parent scope hash', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:class="parent-owned" />
<style>.parent-owned{color:purple}</style>`,
            { filename }
        )

        expect(result.code).toContain(`<Child class="parent-owned ${expectedHash}" />`)
        expect(result.code).toContain('.parent-owned.parent-owned{color:purple}')
        expect(result.code).toContain('{#snippet __svelte_scoped_props_marker()}')
    })

    it('rewrites dynamic scoped props through the runtime helper', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte'; let dynamicClass = ['parent-owned'];</script>
<Child scoped:class={dynamicClass} />
<style>.parent-owned{color:purple}</style>`,
            { filename }
        )

        expect(result.code).toContain(
            `import { scopedClass as __svelte_scoped_props_class } from "svelte-scoped-props/runtime";`
        )
        expect(result.code).toContain(
            `<Child class={__svelte_scoped_props_class(dynamicClass, "${expectedHash}")} />`
        )
    })

    it('supports scoped prop aliases', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:internalClass="parent-owned" />
<style>.parent-owned{color:purple}</style>`,
            { filename }
        )

        expect(result.code).toContain(`<Child internalClass="parent-owned ${expectedHash}" />`)
    })

    it('preserves parent selectors during Svelte CSS analysis', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="parent-owned" />
<style>.parent-owned{color:purple}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(compiled.css?.code).toContain(`.parent-owned.parent-owned.${expectedHash}`)
        expect(compiled.css?.code).not.toContain('(unused) .parent-owned')
    })

    it('keeps compound selectors of scoped classes during Svelte CSS analysis', async () => {
        const source = `<script>import Child from './Child.svelte'; let paged = true;</script>
<Child scoped:class={['page-rows', { paged }]} />
<style>.page-rows{display:flex}.page-rows.paged{min-height:61px}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(compiled.css?.code).toContain('.page-rows.page-rows.paged.paged')
        expect(compiled.css?.code).not.toContain('(unused)')
    })

    it('collects every class of a compound selector onto the marker', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:class="page-rows paged" />
<style>.page-rows{display:flex}.page-rows.paged{min-height:61px}</style>`,
            { filename }
        )

        expect(result.code).toContain('<div class="page-rows paged"></div>')
        expect(result.code).toContain('.page-rows.page-rows.paged.paged{min-height:61px}')
    })

    it('rejects scoped props on native elements', () => {
        expect(() =>
            transformScopedProps(`<div scoped:class="parent-owned"></div>`, { filename })
        ).toThrow('component tags')
    })
})
