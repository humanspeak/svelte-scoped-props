<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSamples } from '$lib/demo-code-samples'
    import { exampleSourceUrl } from '$lib/docs-config'
    import CompoundSelector from '$lib/examples/scoped-props/demos/CompoundSelector.svelte'
    import { CodeReferenceV2, ExampleV2 } from '@humanspeak/docs-kit'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Compound selectors' }
        ]
    }
    if (seo) {
        seo.title = 'Compound selectors | Examples | Svelte Scoped Props'
        seo.description =
            'A conditionally-added class gates a compound rule on the same child element, and the marker keeps the compound and combinator selectors alive.'
        seo.ogTitle = 'Compound selectors'
        seo.ogTagline = 'Compound and combinator scoped rules survive CSS pruning'
        seo.ogFeatures = ['scoped:class', 'Compound', 'Combinator', 'Marker']
        seo.ogSlug = 'examples-compound-selector'
    }
</script>

{#snippet code()}
    <CodeReferenceV2
        samples={demoCodeSamples(
            'scoped-props/demos/CompoundSelector.svelte',
            'compound-selector',
            'CompoundSelector.svelte'
        )}
        columns={2}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="COMPOUND"
    title={{ prefix: 'compound ', accent: 'selectors', end: '.' }}
    description="Toggling a conditionally-added class gates a compound rule (.page-rows.paged) on the same child element. The synthesized marker also keeps a descendant-combinator rule alive, so neither survives Svelte's unused-CSS pruning by accident."
    sheetLabel="SHEET 01 / 01"
    barCells={[
        { k: 'syntax', v: 'scoped:class' },
        { k: 'selector', v: 'compound' },
        { k: 'status', v: 'passing' }
    ]}
    sourceUrl={exampleSourceUrl('scoped-props/demos/CompoundSelector.svelte')}
    codeSnippet={code}
    codeLabel="show code"
>
    <CompoundSelector />
</ExampleV2>
