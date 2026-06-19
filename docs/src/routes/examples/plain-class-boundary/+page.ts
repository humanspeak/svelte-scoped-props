import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Plain Class Boundary',
    description:
        'A boundary example showing why plain component class cannot become magical without changing Svelte semantics.'
})
