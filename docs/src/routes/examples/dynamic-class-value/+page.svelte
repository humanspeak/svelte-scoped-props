<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import DynamicClassValue from '$lib/examples/scoped-props/demos/DynamicClassValue.svelte'
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

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'CLASSVALUE',
            title: { prefix: 'dynamic ', accent: 'ClassValue', end: '.' },
            description:
                'The stateful case: arrays and object maps can change after hydration, and the runtime helper keeps the parent hash attached to the computed class string.',
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'scoped:class' },
                { k: 'value', v: 'ClassValue' },
                { k: 'status', v: 'passing' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/DynamicClassValue.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <DynamicClassValue />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/DynamicClassValue.svelte',
                'dynamic-class-value',
                'DynamicClassValue.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/ChildCard.svelte',
                'dynamic-class-value-child-card',
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
