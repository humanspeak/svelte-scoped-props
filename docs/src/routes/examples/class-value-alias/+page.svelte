<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import ClassValueAlias from '$lib/examples/scoped-props/demos/ClassValueAlias.svelte'
    import {
        CodeReferenceV2,
        ExampleV2,
        formatSheetLabel,
        type ExampleSection
    } from '@humanspeak/docs-kit'

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

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'ALIAS',
            title: { prefix: 'ClassValue ', accent: 'alias', end: '.' },
            description:
                'The child still owns its prop contract. The parent says which prop carries scoped classes by using `scoped:internalClass`, so the compiler does not have to know the child type graph.',
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'scoped:internalClass' },
                { k: 'value', v: 'ClassValue' },
                { k: 'status', v: 'passing' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/ClassValueAlias.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <ClassValueAlias />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/ClassValueAlias.svelte',
                'class-value-alias',
                'ClassValueAlias.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/InternalClassCard.svelte',
                'class-value-alias-internal-class-card',
                'InternalClassCard.svelte'
            )
        ]}
        columns={2}
    />
{/snippet}

{#each sections as section, i (section.figId)}
    <ExampleV2
        figId={section.figId}
        tag={section.tag}
        title={section.title}
        description={section.description}
        mode={section.mode ?? 'live'}
        sheetLabel={formatSheetLabel(i, sections.length)}
        barCells={section.barCells}
        sourceUrl={section.sourceUrl}
        codeSnippet={section.codeSnippet}
        codeLabel="show code"
        notes={section.notes}
    >
        {@render section.snippet()}
    </ExampleV2>
{/each}
