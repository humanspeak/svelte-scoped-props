<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSamples } from '$lib/demo-code-samples'
    import { exampleSourceUrl } from '$lib/docs-config'
    import SpreadForwarding from '$lib/examples/scoped-props/demos/SpreadForwarding.svelte'
    import { CodeReferenceV2, ExampleV2 } from '@humanspeak/docs-kit'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Spread Forwarding' }
        ]
    }
    if (seo) {
        seo.title = 'Spread Forwarding | Examples | Svelte Scoped Props'
        seo.description =
            'A third-level child example where a middle component forwards an already-scoped prop through a spread.'
        seo.ogTitle = 'Spread Forwarding'
        seo.ogTagline = 'Scope first, then forward like a normal prop'
        seo.ogFeatures = ['Spread Props', 'Middle Child', 'Grandchild', 'Parent Hash']
        seo.ogSlug = 'examples-spread-forwarding'
    }
</script>

{#snippet code()}
    <CodeReferenceV2
        samples={demoCodeSamples(
            'scoped-props/demos/SpreadForwarding.svelte',
            'spread-forwarding',
            'SpreadForwarding.svelte'
        )}
        columns={2}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="SPREAD"
    title={{ prefix: 'spread ', accent: 'forwarding', end: '.' }}
    description="The parent scopes the value at the boundary. After that, a middle component can spread the prop to a third child because the scoped class string is already just normal prop data."
    sheetLabel="SHEET 01 / 01"
    barCells={[
        { k: 'syntax', v: 'scoped:class' },
        { k: 'path', v: 'parent → middle → child' },
        { k: 'status', v: 'passing' }
    ]}
    sourceUrl={exampleSourceUrl('scoped-props/demos/SpreadForwarding.svelte')}
    codeSnippet={code}
    codeLabel="show code"
>
    <SpreadForwarding />
</ExampleV2>
