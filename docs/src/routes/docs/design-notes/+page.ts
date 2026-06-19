import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Design Notes',
    description:
        'Why Svelte Scoped Props exists as an ecosystem proof before proposing compiler support.'
})
