<script lang="ts">
    import type { ClassValue } from '@humanspeak/svelte-scoped-props/runtime'
    import { describeClass } from './classValue'

    type Props = {
        class?: ClassValue
        'scoped:class'?: ClassValue
    }

    let { class: className }: Props = $props()
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
        border: 2px dashed var(--proof-card-border, gray);
        border-radius: 6px;
        color: var(--proof-card-ink, black);
        text-align: center;
        background: var(--proof-card-bg, white);
    }

    code {
        padding: 2px 5px;
        border-radius: 4px;
        overflow-wrap: anywhere;
        background: var(--proof-code-bg, #eef2f7);
        color: var(--proof-code-ink, #111111);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.95em;
    }
</style>
