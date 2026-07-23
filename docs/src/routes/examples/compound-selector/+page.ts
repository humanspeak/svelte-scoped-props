import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Compound selectors',
    description:
        'A conditionally-added class gates a compound rule on the same child element, and the marker keeps the compound and combinator selectors alive.'
})
