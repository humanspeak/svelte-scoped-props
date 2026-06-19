<script lang="ts">
    type Props = {
        class?: unknown
    }

    let { class: classPayload }: Props = $props()

    function describe(value: unknown): string {
        if (typeof value === 'string') return `"${value}"`

        try {
            return JSON.stringify(value) ?? String(value)
        } catch {
            return String(value)
        }
    }

    let payloadType = $derived(Array.isArray(classPayload) ? 'array' : typeof classPayload)
    let payloadText = $derived(describe(classPayload))
</script>

<div class="payload-card">
    Non-ClassValue prop receives
    <code>typeof class = {payloadType}</code>
    <code>{payloadText}</code>.
</div>

<style>
    .payload-card {
        min-height: 116px;
        display: grid;
        place-items: center;
        gap: 8px;
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
