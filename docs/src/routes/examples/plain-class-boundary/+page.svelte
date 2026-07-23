<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import PlainClassBoundary from '$lib/examples/scoped-props/demos/PlainClassBoundary.svelte'
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

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'BOUNDARY',
            title: { prefix: 'plain class ', accent: 'boundary', end: '.' },
            description:
                'Plain `class` on a component is still just a prop. This example keeps the failure visible so the package does not pretend Svelte can infer intent from a normal prop name.',
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'class' },
                { k: 'value', v: 'string literal' },
                { k: 'status', v: 'blocked' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/PlainClassBoundary.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <PlainClassBoundary />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/PlainClassBoundary.svelte',
                'plain-class-boundary',
                'PlainClassBoundary.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/ChildCard.svelte',
                'plain-class-boundary-child-card',
                'ChildCard.svelte'
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
