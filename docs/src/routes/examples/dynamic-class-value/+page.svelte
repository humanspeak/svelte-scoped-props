<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSamples } from '$lib/demo-code-samples'
    import { exampleSourceUrl } from '$lib/docs-config'
    import DynamicClassValue from '$lib/examples/scoped-props/demos/DynamicClassValue.svelte'
    import { CodeReferenceV2, ExampleV2 } from '@humanspeak/docs-kit'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Dynamic ClassValue' }
        ]
    }
    if (seo) {
        seo.title = 'Dynamic ClassValue | Examples | Svelte Scoped Props'
        seo.description =
            'A dynamic ClassValue example using arrays, object maps, derived values, and a toggle.'
        seo.ogTitle = 'Dynamic ClassValue'
        seo.ogTagline = 'Derived arrays and object maps keep the parent hash'
        seo.ogFeatures = ['ClassValue', 'Derived State', 'Toggle', 'Object Map']
        seo.ogSlug = 'examples-dynamic-class-value'
    }
</script>

{#snippet code()}
    <CodeReferenceV2
        samples={demoCodeSamples(
            'scoped-props/demos/DynamicClassValue.svelte',
            'dynamic-class-value',
            'DynamicClassValue.svelte'
        )}
        columns={2}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="CLASSVALUE"
    title={{ prefix: 'dynamic ', accent: 'ClassValue', end: '.' }}
    description="The stateful case: arrays and object maps can change after hydration, and the runtime helper keeps the parent hash attached to the computed class string."
    sheetLabel="SHEET 01 / 01"
    barCells={[
        { k: 'syntax', v: 'scoped:class' },
        { k: 'value', v: 'ClassValue' },
        { k: 'status', v: 'passing' }
    ]}
    sourceUrl={exampleSourceUrl('scoped-props/demos/DynamicClassValue.svelte')}
    codeSnippet={code}
    codeLabel="show code"
>
    <DynamicClassValue />
</ExampleV2>
