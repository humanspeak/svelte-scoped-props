import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'ClassValue Alias',
    description:
        'A prop alias example where scoped:internalClass sends parent-scoped classes to a class-like child prop.'
})
