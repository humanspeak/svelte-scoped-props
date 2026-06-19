import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Spread forwarding',
    description: 'Scope a prop before spreading it through intermediate components.'
})
