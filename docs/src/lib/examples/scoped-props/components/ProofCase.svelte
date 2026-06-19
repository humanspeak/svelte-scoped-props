<script lang="ts">
    import type { Snippet } from 'svelte'
    import { Check, X } from '@lucide/svelte'

    type Status = 'passed' | 'blocked'

    type Props = {
        status: Status
        title: string
        description: string
        children: Snippet
    }

    let { status, title, description, children }: Props = $props()
    let isPassing = $derived(status === 'passed')
</script>

<article class={['scoped-proof', status]}>
    <div class="proof-heading">
        <span class={['status-icon', isPassing ? 'pass' : 'fail']} aria-label={isPassing ? 'passing' : 'failing'}>
            {#if isPassing}
                <Check size={20} strokeWidth={3} />
            {:else}
                <X size={20} strokeWidth={3} />
            {/if}
        </span>
        <div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    </div>

    {@render children()}
</article>

<style>
    .scoped-proof {
        --proof-surface: color-mix(in oklab, var(--brut-bg-2) 88%, var(--brut-bg));
        --proof-card-bg: color-mix(in oklab, var(--brut-bg) 86%, var(--brut-bg-2));
        --proof-card-soft: color-mix(in oklab, var(--brut-bg-2) 78%, var(--brut-bg));
        --proof-card-border: var(--brut-rule-2);
        --proof-card-ink: var(--brut-ink);
        --proof-card-muted: var(--brut-ink-2);
        --proof-code-bg: color-mix(in oklab, var(--brut-bg-2) 82%, var(--brut-rule));
        --proof-code-ink: var(--brut-ink);
        --proof-source-code-bg: color-mix(in oklab, var(--brut-bg) 72%, var(--brut-bg-2));
        --proof-source-code-border: color-mix(in oklab, var(--brut-rule-2) 62%, transparent);
        --proof-success: var(--color-success, #22c55e);
        --proof-danger: #f43f5e;
        --proof-pass-bg: color-mix(in oklab, var(--proof-success) 22%, var(--brut-bg));
        --proof-fail-bg: color-mix(in oklab, var(--proof-danger) 24%, var(--brut-bg));
        --proof-parent-bg: color-mix(in oklab, pink 82%, white);
        --proof-parent-ink: color-mix(in oklab, purple 84%, black);
        --proof-parent-border: color-mix(in oklab, purple 82%, hotpink);
        --proof-parent-code-bg: color-mix(in oklab, white 82%, pink);
        --proof-parent-code-ink: var(--proof-parent-ink);
        --proof-source-row-height: 92px;

        display: grid;
        gap: 18px;
        padding: clamp(16px, 3vw, 24px);
        border: 1px solid var(--brut-rule, #111);
        border-radius: 6px;
        background: var(--proof-surface);
        box-shadow: 4px 4px 0 var(--brut-rule, #111);
    }

    :global(html.dark) .scoped-proof {
        --proof-source-code-bg: color-mix(in oklab, var(--brut-bg-2) 58%, black);
        --proof-source-code-border: color-mix(in oklab, var(--brut-rule-2) 82%, var(--brut-accent) 18%);
        --proof-parent-bg: color-mix(in oklab, purple 28%, var(--brut-bg));
        --proof-parent-ink: color-mix(in oklab, pink 86%, white);
        --proof-parent-border: color-mix(in oklab, hotpink 68%, purple);
        --proof-parent-code-bg: color-mix(in oklab, purple 36%, var(--brut-bg));
        --proof-parent-code-ink: color-mix(in oklab, pink 92%, white);
    }

    .proof-heading {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
    }

    .status-icon {
        display: inline-grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border: 1px solid var(--brut-rule, #111);
        border-radius: 999px;
        background: var(--proof-card-bg);
        color: var(--proof-card-ink);
    }

    .status-icon.pass {
        background: var(--proof-pass-bg);
    }

    .status-icon.fail {
        background: var(--proof-fail-bg);
    }

    h3 {
        margin: 0;
        color: var(--brut-ink, #111);
        font-size: clamp(1.05rem, 2vw, 1.35rem);
        line-height: 1.15;
    }

    p {
        margin: 6px 0 0;
        color: var(--proof-card-muted);
        line-height: 1.5;
    }

    :global(.scoped-proof .render-grid) {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
        gap: 12px;
        align-items: stretch;
    }

    :global(.scoped-proof .render-example) {
        display: grid;
        gap: 8px;
        min-width: 0;
    }

    :global(.scoped-proof .example-label) {
        color: var(--proof-card-muted);
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
    }

    :global(.scoped-proof .demo-card) {
        min-height: 116px;
        display: grid;
        place-items: center;
        padding: 18px;
        border: 2px dashed var(--proof-card-border);
        border-radius: 6px;
        color: var(--proof-card-ink);
        text-align: center;
        background: var(--proof-card-bg);
    }

    :global(.scoped-proof .example-grid) {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
        gap: 12px;
    }

    :global(.scoped-proof .example-block) {
        display: grid;
        gap: 8px;
        align-content: start;
        min-width: 0;
        padding: 12px;
        border: 1px solid color-mix(in oklab, var(--brut-rule, #111) 22%, transparent);
        border-radius: 6px;
        background: var(--proof-card-soft);
    }

    :global(.scoped-proof code) {
        min-width: 0;
        width: fit-content;
        max-width: 100%;
        padding: 2px 5px;
        border-radius: 4px;
        overflow-wrap: anywhere;
        background: var(--proof-code-bg);
        color: var(--proof-code-ink);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.9em;
    }

    :global(.scoped-proof .example-block > code) {
        display: grid;
        width: 100%;
        min-height: var(--proof-source-row-height);
        align-items: center;
        box-sizing: border-box;
        padding: 8px 12px;
        border: 1px solid color-mix(in oklab, var(--proof-source-code-border) 76%, transparent);
        border-left: 4px solid var(--proof-source-code-border);
        border-radius: 2px;
        background: var(--proof-source-code-bg);
        box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--brut-bg) 52%, transparent);
        line-height: 1.4;
    }

    :global(.scoped-proof .parent-owned code) {
        border: 1px solid color-mix(in oklab, var(--proof-parent-border) 42%, transparent);
        background: var(--proof-parent-code-bg);
        color: var(--proof-parent-code-ink);
    }

    :global(.scoped-proof .result-list) {
        display: grid;
        gap: 8px;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    :global(.scoped-proof .result-list li) {
        display: grid;
        gap: 4px;
        min-width: 0;
        min-height: var(--proof-source-row-height);
        padding: 8px;
        border-left: 4px solid var(--proof-success);
        background: var(--proof-card-bg);
    }

    :global(.scoped-proof .result-list li.missing) {
        border-left-color: var(--proof-danger);
    }

    :global(.scoped-proof .result-list strong) {
        color: var(--proof-card-ink);
        font-size: 0.82rem;
    }

    :global(.scoped-proof .toggle-row) {
        display: inline-flex;
        width: fit-content;
        max-width: 100%;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid var(--brut-rule, #111);
        border-radius: 6px;
        background: var(--proof-card-bg);
        color: var(--proof-card-ink);
        font-size: 0.95rem;
    }

    :global(.scoped-proof .toggle-row input) {
        width: 16px;
        height: 16px;
    }

    :global(.scoped-proof pre) {
        max-height: 280px;
        margin: 0;
        padding: 12px;
        overflow: auto;
        border: 1px solid color-mix(in oklab, var(--brut-rule, #111) 22%, transparent);
        border-radius: 6px;
        background: color-mix(in oklab, var(--brut-bg) 62%, black);
        color: var(--brut-ink);
        font-size: 0.82rem;
        line-height: 1.5;
    }
</style>
