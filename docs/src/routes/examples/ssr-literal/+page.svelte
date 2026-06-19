<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSamples } from '$lib/demo-code-samples'
    import { exampleSourceUrl } from '$lib/docs-config'
    import SsrLiteral from '$lib/examples/scoped-props/demos/SsrLiteral.svelte'
    import { CodeReferenceV2, ExampleV2 } from '@humanspeak/docs-kit'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'SSR Literal' }
        ]
    }
    if (seo) {
        seo.title = 'SSR Literal | Examples | Svelte Scoped Props'
        seo.description =
            'A server-rendered proof that scoped component classes need the parent hash before hydration.'
        seo.ogTitle = 'SSR Literal'
        seo.ogTagline = 'Server-rendered parent hashes'
        seo.ogFeatures = ['SSR', 'Hydration', 'Parent Hash', 'Literal Class']
        seo.ogSlug = 'examples-ssr-literal'
    }
</script>

{#snippet code()}
    <CodeReferenceV2
        samples={demoCodeSamples('scoped-props/demos/SsrLiteral.svelte', 'ssr-literal', 'SsrLiteral.svelte')}
        columns={2}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="SSR"
    title={{ prefix: 'server ', accent: 'literal', end: '.' }}
    description="The no-blink proof: the server-rendered child root already contains the parent hash for `scoped:class`, so the visual state is correct before client hydration runs."
    sheetLabel="SHEET 01 / 01"
    barCells={[
        { k: 'syntax', v: 'scoped:class' },
        { k: 'phase', v: 'SSR' },
        { k: 'status', v: 'passing' }
    ]}
    sourceUrl={exampleSourceUrl('scoped-props/demos/SsrLiteral.svelte')}
    codeSnippet={code}
    codeLabel="show code"
>
    <SsrLiteral />
</ExampleV2>
