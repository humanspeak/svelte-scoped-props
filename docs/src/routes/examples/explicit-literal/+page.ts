import type { PageLoad } from './$types'

export const load: PageLoad = () => ({
    title: 'Explicit Literal',
    description:
        'A literal scoped:class example where a parent-scoped class reaches a child component only when the call site opts in.'
})
