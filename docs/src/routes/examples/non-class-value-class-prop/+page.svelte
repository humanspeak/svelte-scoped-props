<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSamples } from '$lib/demo-code-samples'
    import { exampleSourceUrl } from '$lib/docs-config'
    import NonClassValueClassProp from '$lib/examples/scoped-props/demos/NonClassValueClassProp.svelte'
    import { CodeReferenceV2, ExampleV2 } from '@humanspeak/docs-kit'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Non-ClassValue Class Prop' }
        ]
    }
    if (seo) {
        seo.title = 'Non-ClassValue Class Prop | Examples | Svelte Scoped Props'
        seo.description =
            'A boundary example where a component prop named class is data, not a CSS ClassValue.'
        seo.ogTitle = 'Non-ClassValue Class Prop'
        seo.ogTagline = 'A prop named class can still be user data'
        seo.ogFeatures = ['Boundary', 'Unknown Prop', 'Preserved Data', 'No Rewrite']
        seo.ogSlug = 'examples-non-class-value-class-prop'
    }
</script>

{#snippet code()}
    <CodeReferenceV2
        samples={demoCodeSamples(
            'scoped-props/demos/NonClassValueClassProp.svelte',
            'non-class-value-class-prop',
            'NonClassValueClassProp.svelte'
        )}
        columns={2}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="BOUNDARY"
    title={{ prefix: 'non-ClassValue ', accent: 'class prop', end: '.' }}
    description="The safety case: a prop named `class` can be business data. The package only treats explicit `scoped:*` attributes as scoped CSS intent."
    sheetLabel="SHEET 01 / 01"
    barCells={[
        { k: 'syntax', v: 'class' },
        { k: 'value', v: 'object data' },
        { k: 'status', v: 'preserved' }
    ]}
    sourceUrl={exampleSourceUrl('scoped-props/demos/NonClassValueClassProp.svelte')}
    codeSnippet={code}
    codeLabel="show code"
>
    <NonClassValueClassProp />
</ExampleV2>
