const regex_return_characters = /\r/g

export type SvelteHash = typeof hash

export type CssHashGetter = (options: {
    css: string
    filename?: string
    name?: string
    hash: SvelteHash
}) => string

export function hash(str: string): string {
    str = str.replace(regex_return_characters, '')

    let value = 5381
    let index = str.length

    while (index--) {
        value = ((value << 5) - value) ^ str.charCodeAt(index)
    }

    return (value >>> 0).toString(36)
}

export const defaultCssHash: CssHashGetter = ({ css, filename }) =>
    `svelte-${hash(filename === '(unknown)' ? css : (filename ?? css))}`
