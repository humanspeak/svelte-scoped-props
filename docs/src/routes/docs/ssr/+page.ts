import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'SSR',
    description: 'Scoped props are rewritten before Svelte compiles server and client output.'
})
