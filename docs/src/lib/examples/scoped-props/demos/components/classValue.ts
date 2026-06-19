import type { ClassValue } from '@humanspeak/svelte-scoped-props/runtime'

export function describeClass(value: ClassValue | undefined): string {
    if (value === undefined || value === null || value === false) return ''
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.map((item) => describeClass(item)).filter(Boolean).join(' ')

    if (typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([name]) => name)
            .join(' ')
    }

    return String(value)
}
