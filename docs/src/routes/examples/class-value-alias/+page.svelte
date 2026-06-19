<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSamples } from '$lib/demo-code-samples'
    import { exampleSourceUrl } from '$lib/docs-config'
    import ClassValueAlias from '$lib/examples/scoped-props/demos/ClassValueAlias.svelte'
    import { CodeReferenceV2, ExampleV2 } from '@humanspeak/docs-kit'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'ClassValue Alias' }
        ]
    }
    if (seo) {
        seo.title = 'ClassValue Alias | Examples | Svelte Scoped Props'
        seo.description =
            'A prop alias example where scoped:internalClass sends parent-scoped classes to a class-like child prop.'
        seo.ogTitle = 'ClassValue Alias'
        seo.ogTagline = 'Class-like props without child type introspection'
        seo.ogFeatures = ['scoped:internalClass', 'Alias', 'ClassValue', 'Parent Hash']
        seo.ogSlug = 'examples-class-value-alias'
    }
</script>

{#snippet code()}
    <CodeReferenceV2
        samples={demoCodeSamples(
            'scoped-props/demos/ClassValueAlias.svelte',
            'class-value-alias',
            'ClassValueAlias.svelte'
        )}
        columns={2}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="ALIAS"
    title={{ prefix: 'ClassValue ', accent: 'alias', end: '.' }}
    description="The child still owns its prop contract. The parent says which prop carries scoped classes by using `scoped:internalClass`, so the compiler does not have to know the child type graph."
    sheetLabel="SHEET 01 / 01"
    barCells={[
        { k: 'syntax', v: 'scoped:internalClass' },
        { k: 'value', v: 'ClassValue' },
        { k: 'status', v: 'passing' }
    ]}
    sourceUrl={exampleSourceUrl('scoped-props/demos/ClassValueAlias.svelte')}
    codeSnippet={code}
    codeLabel="show code"
>
    <ClassValueAlias />
</ExampleV2>
