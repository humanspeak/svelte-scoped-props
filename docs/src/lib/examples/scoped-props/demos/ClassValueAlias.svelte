<script lang="ts">
    import type { ClassValue } from '@humanspeak/svelte-scoped-props/runtime'
    import InternalClassCard from './components/InternalClassCard.svelte'

    let internalClass: ClassValue = ['parent-owned', { dimmed: true }]
</script>

<article class="scoped-proof passed dk-demo-shell">
    <div class="render-grid">
        <div class="render-example">
            <span class="example-label">Native element</span>
            <div class={['demo-card', internalClass]}>This div receives the same ClassValue.</div>
        </div>
        <div class="render-example">
            <span class="example-label">Internal class prop</span>
            <InternalClassCard scoped:internalClass={internalClass} />
        </div>
    </div>

    <div class="comparison-grid">
        <div class="comparison-head">
            <span class="example-label">Source</span>
            <span class="example-label">Current result</span>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Native element</span>
                <code>internalClass = ['parent-owned', &#123; dimmed: true &#125;]</code>
                <code>&lt;div class=&#123;['demo-card', internalClass]&#125;&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Native element</span>
                <code>demo-card parent-owned dimmed svelte-parent</code>
                <strong>pink and faded</strong>
            </div>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Alias prop contract</span>
                <code>&lt;InternalClassCard scoped:internalClass=&#123;internalClass&#125; /&gt;</code>
                <code>&lt;div class=&#123;['internal-card', internalClass]&#125;&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>ClassValue prop</span>
                <code>internal-card parent-owned dimmed svelte-parent svelte-child</code>
                <strong>has parent hash</strong>
            </div>
        </div>
    </div>
</article>

<style>
    .parent-owned {
        border-color: var(--proof-parent-border, purple);
        color: var(--proof-parent-ink, purple);
        background: var(--proof-parent-bg, pink);
    }

    .dimmed {
        opacity: 0.35;
    }
</style>
