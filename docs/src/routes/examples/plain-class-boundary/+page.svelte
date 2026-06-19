<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSamples } from '$lib/demo-code-samples'
    import { exampleSourceUrl } from '$lib/docs-config'
    import PlainClassBoundary from '$lib/examples/scoped-props/demos/PlainClassBoundary.svelte'
    import { CodeReferenceV2, ExampleV2 } from '@humanspeak/docs-kit'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Plain Class Boundary' }
        ]
    }
    if (seo) {
        seo.title = 'Plain Class Boundary | Examples | Svelte Scoped Props'
        seo.description =
            'A boundary example showing why plain component class cannot become magical without changing Svelte semantics.'
        seo.ogTitle = 'Plain Class Boundary'
        seo.ogTagline = 'Plain component class stays plain'
        seo.ogFeatures = ['Class Boundary', 'No Magic', 'Parent Scope', 'Limit']
        seo.ogSlug = 'examples-plain-class-boundary'
    }
</script>

{#snippet code()}
    <CodeReferenceV2
        samples={demoCodeSamples(
            'scoped-props/demos/PlainClassBoundary.svelte',
            'plain-class-boundary',
            'PlainClassBoundary.svelte'
        )}
        columns={2}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="BOUNDARY"
    title={{ prefix: 'plain class ', accent: 'boundary', end: '.' }}
    description="Plain `class` on a component is still just a prop. This example keeps the failure visible so the package does not pretend Svelte can infer intent from a normal prop name."
    sheetLabel="SHEET 01 / 01"
    barCells={[
        { k: 'syntax', v: 'class' },
        { k: 'value', v: 'string literal' },
        { k: 'status', v: 'blocked' }
    ]}
    sourceUrl={exampleSourceUrl('scoped-props/demos/PlainClassBoundary.svelte')}
    codeSnippet={code}
    codeLabel="show code"
>
    <PlainClassBoundary />
</ExampleV2>
