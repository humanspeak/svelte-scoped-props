<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import SpreadForwarding from '$lib/examples/scoped-props/demos/SpreadForwarding.svelte'
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

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'SPREAD',
            title: { prefix: 'spread ', accent: 'forwarding', end: '.' },
            description:
                'The parent scopes the value at the boundary. After that, a middle component can spread the prop to a third child because the scoped class string is already just normal prop data.',
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'scoped:class' },
                { k: 'path', v: 'parent → middle → child' },
                { k: 'status', v: 'passing' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/SpreadForwarding.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <SpreadForwarding />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/SpreadForwarding.svelte',
                'spread-forwarding',
                'SpreadForwarding.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/spread/MiddleSpreadCard.svelte',
                'spread-forwarding-middle-spread-card',
                'MiddleSpreadCard.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/spread/SpreadGrandchildCard.svelte',
                'spread-forwarding-spread-grandchild-card',
                'SpreadGrandchildCard.svelte'
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
