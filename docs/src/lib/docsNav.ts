import type { NavSection } from '@humanspeak/docs-kit'
import {
    BookText,
    Box,
    Code,
    Compass,
    Layers,
    Play,
    RefreshCw,
    Settings,
    ShieldCheck,
    Zap
} from '@lucide/svelte'

export const docsSections: NavSection[] = [
    {
        title: 'Get started',
        icon: Play,
        items: [{ title: 'Get started', href: '/docs', icon: Play, exact: true }]
    },
    {
        title: 'Core concepts',
        icon: Code,
        items: [
            { title: 'Syntax', href: '/docs/syntax', icon: Code },
            { title: 'ClassValue', href: '/docs/class-value', icon: Layers },
            { title: 'Prop aliases', href: '/docs/prop-aliases', icon: Settings },
            { title: 'Spread forwarding', href: '/docs/spread-forwarding', icon: RefreshCw },
            { title: 'SSR', href: '/docs/ssr', icon: ShieldCheck }
        ]
    },
    {
        title: 'Reference',
        icon: BookText,
        items: [
            { title: 'ESLint', href: '/docs/eslint', icon: ShieldCheck },
            { title: 'API Reference', href: '/docs/api-reference', icon: BookText },
            { title: 'Design notes', href: '/docs/design-notes', icon: Compass },
            { title: 'Limits', href: '/docs/limits', icon: Zap }
        ]
    }
]

export const scopedPropsLoveAndRespect = [
    { title: 'Beye.ai', href: 'https://beye.ai', external: true },
    { title: 'Svelte', href: 'https://svelte.dev', icon: Compass, external: true },
    {
        title: 'SvelteKit',
        href: 'https://svelte.dev/docs/kit/introduction',
        icon: Box,
        external: true
    }
]
