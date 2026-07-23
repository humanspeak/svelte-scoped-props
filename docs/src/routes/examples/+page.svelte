<script lang="ts">
    import { browser } from '$app/environment'
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { listExamples } from '$lib/examplesIndex'
    import { BrutIndexV2 } from '@humanspeak/docs-kit'
    import posthog from 'posthog-js'

    $effect(() => {
        if (browser) posthog.capture('examples_index_viewed')
    })

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [{ title: 'Examples' }]
    }
    if (seo) {
        seo.title = 'Examples | Svelte Scoped Props'
        seo.description =
            'Live examples for Svelte Scoped Props: literal scoped props, plain class boundaries, SSR, dynamic ClassValue inputs, aliases, and spread forwarding.'
        seo.ogTitle = 'Examples'
        seo.ogTagline = 'Proof cases for scoped component props'
        seo.ogFeatures = ['Literal Props', 'Plain Boundary', 'Dynamic ClassValue', 'SSR Proof']
        seo.ogSlug = 'examples'
    }

    // Canonical example order lives in `$lib/examplesIndex` so the index grid
    // below and the per-page `PagerV2` (mounted in the examples layout) share
    // one source of truth and their `№` numbering always agrees.
    const exampleCases = listExamples()

    const pad2 = (n: number) => String(n).padStart(2, '0')
</script>

<BrutIndexV2
    hero={{
        figLabel: 'FIG-001 · PROOF INDEX',
        figId: 'FIG-001',
        sheetLabel: 'SHEET 01 / 02',
        meta: [
            { k: 'cases', v: String(exampleCases.length) },
            { k: 'format', v: 'live examples' },
            { k: 'status', v: 'alpha' },
            { rule: 'dashed' },
            { k: 'package', v: '@humanspeak/svelte-scoped-props' },
            { k: 'framework', v: 'svelte 5', accent: true },
            { rule: 'dashed' }
        ],
        metaFooter: '// each example mirrors one proof case',
        kicker: '// examples / proof cases',
        title: { accent: 'examples', end: '.' },
        subHtml:
            'Live proof pages for <b>@humanspeak/svelte-scoped-props</b>. Each card opens one focused case with the rendered boxes, expected result, current result, and source.',
        ctas: [
            {
                label: 'start with literal ↗',
                href: '/examples/explicit-literal',
                primary: true
            },
            { label: 'design notes', href: '/docs/design-notes' }
        ]
    }}
    lede={{
        kicker: 'FIG-002 / PROOF CASES',
        title: { prefix: 'follow the ', accent: 'evidence', suffix: '.' },
        body: 'Each card is a standalone example page built from the proof cases we have been using to reason about the package.'
    }}
    items={exampleCases.map((exampleCase, i) => ({
        href: exampleCase.href,
        id: `№ ${pad2(i + 1)} / ${pad2(exampleCases.length)}`,
        title: `${exampleCase.slug}.`,
        line: exampleCase.description
    }))}
    footer={{
        big: {
            prefix: 'start with the ',
            accent: 'explicit literal',
            href: '/examples/explicit-literal',
            hint: 'literal · boundary · SSR · dynamic · alias · spread'
        }
    }}
/>
