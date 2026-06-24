import { describe, expect, it } from 'vitest'
import { scopedClass } from '../src/runtime.js'

describe('scopedClass', () => {
    it('appends the hash to string classes', () => {
        expect(scopedClass('parent-owned', 'svelte-test')).toBe('parent-owned svelte-test')
    })

    it('handles ClassValue arrays and object maps', () => {
        expect(scopedClass(['parent-owned', { dimmed: true, hidden: false }], 'svelte-test')).toBe(
            'parent-owned dimmed svelte-test'
        )
    })

    it('does not emit a hash for empty values', () => {
        expect(scopedClass('', 'svelte-test')).toBe('')
        expect(scopedClass(false, 'svelte-test')).toBe('')
        expect(scopedClass(null, 'svelte-test')).toBe('')
    })
})
