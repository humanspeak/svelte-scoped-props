<script lang="ts">
    import type { ClassValue } from '@humanspeak/svelte-scoped-props/runtime'
    import ChildCard from './components/ChildCard.svelte'

    let paged = $state(true)
    let rowClass: ClassValue = $derived(['page-rows', { paged }])
</script>

<article class="scoped-proof passed dk-demo-shell">
    <label class="toggle-row">
        <input type="checkbox" bind:checked={paged} />
        <span>add <code>paged</code> from state</span>
    </label>

    <div class="render-grid">
        <div class="render-example rows-frame">
            <span class="example-label">Child component</span>
            <ChildCard scoped:class={rowClass} />
        </div>
    </div>

    <div class="comparison-grid">
        <div class="comparison-head">
            <span class="example-label">Source</span>
            <span class="example-label">Current result</span>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Compound selector</span>
                <code>rowClass = ['page-rows', &#123; paged &#125;]</code>
                <code>.page-rows.paged &#123; … &#125;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Compound selector</span>
                <code>child-card page-rows{paged ? ' paged' : ''} svelte-parent svelte-child</code>
                <strong>{paged ? 'compound rule applies' : 'compound rule idle'}</strong>
            </div>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Descendant combinator</span>
                <code>&lt;div class="rows-frame"&gt;</code>
                <code>.rows-frame .page-rows &#123; … &#125;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Descendant combinator</span>
                <code>rows-frame svelte-parent &gt; child-card page-rows svelte-parent</code>
                <strong>combinator rule applies</strong>
            </div>
        </div>
    </div>
</article>

<style>
    .page-rows {
        border-color: var(--proof-parent-border, purple);
        color: var(--proof-parent-ink, purple);
        background: var(--proof-parent-bg, pink);
    }

    /* Compound: both scoped classes must land on the same element. The
       conditionally-added `paged` class gates this rule on the child root. */
    .page-rows.paged {
        border-style: solid;
        background-image: repeating-linear-gradient(
            var(--proof-parent-bg, pink),
            var(--proof-parent-bg, pink) 18px,
            transparent 18px,
            transparent 20px
        );
    }

    /* Descendant combinator: a parent-owned frame wrapping the scoped child. */
    .rows-frame .page-rows {
        box-shadow: 0 0 0 2px var(--proof-parent-border, purple);
    }
</style>
