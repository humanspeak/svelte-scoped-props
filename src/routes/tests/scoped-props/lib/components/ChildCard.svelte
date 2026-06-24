<script lang="ts">
    import type { ClassValue } from 'svelte/elements'

    type Props = {
        class?: ClassValue
    }

    let { class: className }: Props = $props()

    function describeClass(value: ClassValue | undefined): string {
        if (value === undefined || value === null || value === false) return ''
        if (typeof value === 'string') return value
        if (Array.isArray(value)) return value.map(describeClass).filter(Boolean).join(' ')

        if (typeof value === 'object') {
            return Object.entries(value as Record<string, unknown>)
                .filter(([, enabled]) => Boolean(enabled))
                .map(([name]) => name)
                .join(' ')
        }

        return String(value)
    }

    let classText = $derived(describeClass(className))
</script>

<div class={['child-card', className]}>
    Child receives <code>class="{classText}"</code>.
</div>

<style>
    .child-card {
        min-height: 116px;
        display: grid;
        place-items: center;
        padding: 18px;
        border: 2px dashed gray;
        border-radius: 6px;
        color: black;
        text-align: center;
        background: white;
    }

    code {
        padding: 2px 5px;
        border-radius: 4px;
        background: #eef2f7;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.95em;
    }
</style>
