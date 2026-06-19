import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Spread Forwarding',
    description:
        'A third-level child example where a middle component forwards an already-scoped prop through a spread.'
})
