import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'SSR Literal',
    description:
        'A server-rendered proof that scoped component classes need the parent hash before hydration.'
})
