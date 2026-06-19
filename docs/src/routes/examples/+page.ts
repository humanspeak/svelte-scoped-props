import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Examples',
    description:
        'Live examples for Svelte Scoped Props: literal scoped props, plain class boundaries, SSR, dynamic ClassValue inputs, aliases, and spread forwarding.'
})
