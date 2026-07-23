<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { demoCodeSample } from '$lib/demo-loaders'
    import { exampleSourceUrl } from '$lib/docs-config'
    import ExplicitLiteral from '$lib/examples/scoped-props/demos/ExplicitLiteral.svelte'
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
            { title: 'Explicit Literal' }
        ]
    }
    if (seo) {
        seo.title = 'Explicit Literal | Examples | Svelte Scoped Props'
        seo.description =
            'A literal scoped:class example where a parent-scoped class reaches a child component only when the call site opts in.'
        seo.ogTitle = 'Explicit Literal'
        seo.ogTagline = 'Parent-scoped classes through explicit component props'
        seo.ogFeatures = ['scoped:class', 'Literal Class', 'Parent Hash', 'Opt In']
        seo.ogSlug = 'examples-explicit-literal'
    }

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'SCOPED CLASS',
            title: { prefix: 'explicit ', accent: 'literal', end: '.' },
            description:
                'The smallest useful proof: a native element and a child component both use the same parent-owned class, but the child only gets the parent hash through `scoped:class`.',
            snippet: defaultSection,
            codeSnippet: defaultCode,
            barCells: [
                { k: 'syntax', v: 'scoped:class' },
                { k: 'value', v: 'string literal' },
                { k: 'status', v: 'passing' }
            ],
            sourceUrl: exampleSourceUrl('scoped-props/demos/ExplicitLiteral.svelte')
        }
    ]
</script>

{#snippet defaultSection()}
    <ExplicitLiteral />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'scoped-props/demos/ExplicitLiteral.svelte',
                'explicit-literal',
                'ExplicitLiteral.svelte'
            ),
            demoCodeSample(
                'scoped-props/demos/components/ChildCard.svelte',
                'explicit-literal-child-card',
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
