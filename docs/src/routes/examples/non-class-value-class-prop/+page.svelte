<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import NonClassValueClassProp from '$lib/examples/scoped-props/demos/NonClassValueClassProp.svelte'
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

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'BOUNDARY',
            title: { prefix: 'non-ClassValue ', accent: 'class prop', end: '.' },
            description:
                'The safety case: a prop named `class` can be business data. The package only treats explicit `scoped:*` attributes as scoped CSS intent.',
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'class' },
                { k: 'value', v: 'object data' },
                { k: 'status', v: 'preserved' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/NonClassValueClassProp.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <NonClassValueClassProp />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/NonClassValueClassProp.svelte',
                'non-class-value-class-prop',
                'NonClassValueClassProp.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/NonClassValueClassCard.svelte',
                'non-class-value-class-prop-non-class-value-class-card',
                'NonClassValueClassCard.svelte'
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
