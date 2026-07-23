/**
 * A single example proof page: its route, directory slug, and display copy,
 * in the site's canonical (curated) order.
 */
export type ExampleListing = {
    /** Route path, e.g. `/examples/explicit-literal`. */
    href: string
    /** Directory slug, e.g. `explicit-literal`. */
    slug: string
    /** Card/page title shown on the examples index. */
    title: string
    /** One-line description shown on the index card. */
    description: string
}

/**
 * Canonical, curated order of the example proof pages. This is the single
 * ordering shared by the examples index grid ({@link listExamples} feeds the
 * `BrutIndexV2` cards) and the per-page prev/next `PagerV2`, so the `№`
 * numbering always agrees between the two surfaces. Keep new examples in the
 * intended reading order (literal → boundary → SSR → dynamic → …) rather than
 * alphabetically.
 */
const EXAMPLES: ExampleListing[] = [
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
    },
    {
        href: '/examples/compound-selector',
        slug: 'compound-selector',
        title: 'Compound selectors',
        description:
            'A conditionally-added class gates a compound rule on the same child element, and combinator rules survive pruning too.'
    }
]

/**
 * List every example proof page in canonical order.
 *
 * @returns Ordered example listings.
 * @example
 * ```ts
 * const examples = listExamples()
 * examples[0].href // '/examples/explicit-literal'
 * ```
 */
export const listExamples = (): ExampleListing[] => EXAMPLES

export { EXAMPLES }
