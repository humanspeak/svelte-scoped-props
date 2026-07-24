<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import SsrLiteral from '$lib/examples/scoped-props/demos/SsrLiteral.svelte'
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
            { title: 'SSR Literal' }
        ]
    }
    if (seo) {
        seo.title = 'SSR Literal | Examples | Svelte Scoped Props'
        seo.description =
            'A server-rendered proof that scoped component classes need the parent hash before hydration.'
        seo.ogTitle = 'SSR Literal'
        seo.ogTagline = 'Server-rendered parent hashes'
        seo.ogFeatures = ['SSR', 'Hydration', 'Parent Hash', 'Literal Class']
        seo.ogSlug = 'examples-ssr-literal'
    }

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'SSR',
            title: { prefix: 'server ', accent: 'literal', end: '.' },
            description:
                'The no-blink proof: the server-rendered child root already contains the parent hash for `scoped:class`, so the visual state is correct before client hydration runs.',
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'scoped:class' },
                { k: 'phase', v: 'SSR' },
                { k: 'status', v: 'passing' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/SsrLiteral.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <SsrLiteral />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/SsrLiteral.svelte',
                'ssr-literal',
                'SsrLiteral.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/SsrProbe.svelte',
                'ssr-literal-ssr-probe',
                'SsrProbe.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/ChildCard.svelte',
                'ssr-literal-child-card',
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
