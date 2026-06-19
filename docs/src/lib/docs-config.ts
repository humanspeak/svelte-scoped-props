import type { DocsKitConfig } from '@humanspeak/docs-kit'

export const docsConfig: DocsKitConfig = {
    name: 'Svelte Scoped Props',
    slug: 'scoped-props',
    npmPackage: '@humanspeak/svelte-scoped-props',
    repo: 'humanspeak/svelte-scoped-props',
    url: 'https://scoped.svelte.page',
    description:
        'Svelte Scoped Props is an experimental Svelte preprocessor for forwarding parent-scoped classes through explicit component props.',
    keywords: [
        'svelte',
        'svelte-scoped-props',
        'scoped css',
        'component styling',
        'class props',
        'preprocessor',
        'css scoping',
        'svelte components',
        'svelte-5',
        'typescript'
    ],
    defaultFeatures: ['Explicit scoped props', 'SSR-safe classes', 'ClassValue support', 'Svelte 5'],
    fallbackStars: 0
}

const REPO_BLOB = `https://github.com/${docsConfig.repo}/blob/main`
const EXAMPLES_DIR = 'docs/src/lib/examples'

/**
 * Build the GitHub URL for an example component shipped with the docs site.
 *
 * @param file Filename inside `docs/src/lib/examples/` (e.g. `HoverAndTap.svelte`).
 * @returns Absolute URL to the file on the `main` branch.
 */
export const exampleSourceUrl = (file: string): string => `${REPO_BLOB}/${EXAMPLES_DIR}/${file}`
