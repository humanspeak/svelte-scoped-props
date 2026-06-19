<script lang="ts">
    import { browser } from '$app/environment'
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import { getSeoContext } from '$lib/components/contexts/Seo/Seo.context'
    import { BrutIndexV2 } from '@humanspeak/docs-kit'
    import posthog from 'posthog-js'

    $effect(() => {
        if (browser) posthog.capture('examples_index_viewed')
    })

    type ExampleCase = {
        href: string
        slug: string
        title: string
        description: string
    }

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

    const exampleCases: ExampleCase[] = [
        {
            href: '/examples/explicit-literal',
            slug: 'explicit-literal',
            title: 'Explicit literal',
            description:
                'A literal parent-owned class reaches a child component only when the call site uses scoped:class.'
        },
        {
            href: '/examples/plain-class-boundary',
            slug: 'plain-class-boundary',
            title: 'Plain class boundary',
            description:
                'Plain component class stays plain, making the current Svelte boundary visible instead of hiding it.'
        },
        {
            href: '/examples/ssr-literal',
            slug: 'ssr-literal',
            title: 'SSR literal',
            description:
                'Server-rendered output already includes the parent hash for scoped:class before hydration.'
        },
        {
            href: '/examples/dynamic-class-value',
            slug: 'dynamic-class-value',
            title: 'Dynamic ClassValue',
            description:
                'Arrays, object maps, and derived state update while keeping the parent scope hash attached.'
        },
        {
            href: '/examples/non-class-value-class-prop',
            slug: 'non-class-value-class-prop',
            title: 'Non-ClassValue class prop',
            description:
                'A prop named class can still be user data, so ordinary class props are left untouched.'
        },
        {
            href: '/examples/class-value-alias',
            slug: 'class-value-alias',
            title: 'ClassValue alias',
            description:
                'Target a class-like prop such as internalClass without making plain component class magical.'
        },
        {
            href: '/examples/spread-forwarding',
            slug: 'spread-forwarding',
            title: 'Spread forwarding',
            description:
                'Scope before spread, then forward the transformed prop through a middle child to a third child.'
        }
    ]

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
