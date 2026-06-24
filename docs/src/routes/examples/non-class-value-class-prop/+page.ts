import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Non-ClassValue Class Prop',
    description:
        'A boundary example where a component prop named class is data, not a CSS ClassValue.'
})
