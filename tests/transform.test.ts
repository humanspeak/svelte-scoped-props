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

    it('keeps element-qualified and combinator selectors of scoped classes', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>
button.a{color:red}
.a .b{color:blue}
.a > .b{color:green}
span.a + button.b{color:purple}
</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(compiled.css?.code).not.toContain('(unused)')
        expect(compiled.css?.code).toContain('button.a')
        expect(compiled.css?.code).toContain('.a')
    })

    it('collects every class of a compound selector onto the marker', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:class="page-rows paged" />
<style>.page-rows{display:flex}.page-rows.paged{min-height:61px}</style>`,
            { filename }
        )

        expect(result.code).toContain(
            `<svelte:element this={'x'} class="page-rows paged"></svelte:element>`
        )
        expect(result.code).toContain('.page-rows.page-rows.paged.paged{min-height:61px}')
    })

    it('keeps selectors with a final void element compound', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>input.a{color:red}img.b{color:blue}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(compiled.css?.code).toContain('input.a.a')
        expect(compiled.css?.code).toContain('img.b.b')
        expect(compiled.css?.code).not.toContain('(unused)')
    })

    it('keeps single void-element selectors via the dynamic fallback node', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a" />
<style>input.a{color:red}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(processed.code).toContain(`<svelte:element this={'x'} class="a"></svelte:element>`)
        expect(processed.code).not.toContain('<input')
        expect(compiled.css?.code).toContain('input.a.a')
        expect(compiled.css?.code).not.toContain('(unused)')
    })

    it('strips pseudo-classes and pseudo-elements when synthesizing marker chains', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>.a:hover .b::before{color:red}</style>`,
            { filename }
        )

        expect(result.code).toContain(
            `<svelte:element this={'x'} class="a"><svelte:element this={'x'} class="b"></svelte:element></svelte:element>`
        )
    })

    it('skips selectors with attribute selectors but keeps the fallback node', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>.a[data-x="1"]{color:red}</style>`,
            { filename }
        )

        const marker = result.code.slice(result.code.indexOf('{#snippet'))
        expect(marker).not.toContain('data-x')
        expect(marker).toContain(`<svelte:element this={'x'} class="a"></svelte:element>`)
    })

    it('skips :global selectors when synthesizing marker chains', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>:global(.a) .b{color:red}</style>`,
            { filename }
        )

        expect(result.code.split('{#snippet').length - 1).toBe(1)
        // Only the all-classes fallback node — no synthesized chain for :global.
        expect(result.code.split('<svelte:element').length - 1).toBe(1)
    })

    it('deduplicates synthesized marker chains across type-agnostic selectors', () => {
        const result = transformScopedProps(
            `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>.a .b{color:red}.a .b:hover{color:blue}p.a p.b{color:green}</style>`,
            { filename }
        )

        const chain = `<svelte:element this={'x'} class="a"><svelte:element this={'x'} class="b"></svelte:element></svelte:element>`
        expect(result.code.split(chain).length - 1).toBe(1)
    })

    it('keeps void-in-non-final-compound chains via dynamic marker nodes', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>input.a .b{color:red}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(processed.code).not.toContain('<input')
        expect(compiled.css?.code).toContain('input.a.a')
        expect(compiled.css?.code).not.toContain('(unused)')
    })

    it('keeps custom-element type selectors via the dynamic fallback node', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a" />
<style>my-widget.a{color:red}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(processed.code).not.toContain('<my-widget')
        expect(compiled.css?.code).toContain('my-widget.a.a')
        expect(compiled.css?.code).not.toContain('(unused)')
    })

    it('rejects scoped props on native elements', () => {
        expect(() =>
            transformScopedProps(`<div scoped:class="parent-owned"></div>`, { filename })
        ).toThrow('component tags')
    })

    it('keeps combinator selectors behind leading CSS comments', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a" />
<Child scoped:class="b" />
<style>/* explanation */ .a .b { color: red; }</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(compiled.css?.code).toContain('.a.a')
        expect(compiled.css?.code).toContain('.b.b')
        expect(compiled.css?.code).not.toContain('(unused)')
    })

    it('compiles typed markers without accessibility warnings', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="foo" />
<style>a.foo{color:red}img.foo{width:1px}label.foo{color:blue}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client'
        })

        expect(compiled.warnings.filter((w) => w.code.startsWith('a11y'))).toEqual([])
        expect(compiled.css?.code).not.toContain('(unused)')
        expect(compiled.css?.code).toContain('a.foo')
        expect(compiled.css?.code).toContain('img.foo')
        expect(compiled.css?.code).toContain('label.foo')
    })

    it('keeps content-model-hazard chains without compile errors', async () => {
        const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>p.a p.b{color:red}</style>`
        const processed = await preprocess(source, scopedProps(), { filename })
        const compiled = compile(processed.code, {
            filename,
            generate: 'client',
            warningFilter: () => false
        })

        expect(compiled.css?.code).not.toContain('(unused)')
        expect(compiled.css?.code).toContain('p.a')
    })
})
