<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import CompoundSelector from '$lib/examples/scoped-props/demos/CompoundSelector.svelte'
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

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'COMPOUND',
            title: { prefix: 'compound ', accent: 'selectors', end: '.' },
            description:
                "Toggling a conditionally-added class gates a compound rule (.page-rows.paged) on the same child element. The synthesized marker also keeps a descendant-combinator rule alive, so neither survives Svelte's unused-CSS pruning by accident.",
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'scoped:class' },
                { k: 'selector', v: 'compound' },
                { k: 'status', v: 'passing' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/CompoundSelector.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <CompoundSelector />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/CompoundSelector.svelte',
                'compound-selector',
                'CompoundSelector.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/ChildCard.svelte',
                'compound-selector-child-card',
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
