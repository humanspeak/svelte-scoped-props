<script lang="ts">
    import NonClassValueClassCard from './components/NonClassValueClassCard.svelte'

    let metadata = {
        label: 'not css',
        priority: 2
    }
</script>

<article class="scoped-proof passed dk-demo-shell">
    <div class="render-grid">
        <div class="render-example">
            <span class="example-label">Native element</span>
            <div class="demo-card parent-owned">This scoped element creates the parent hash.</div>
        </div>
        <div class="render-example">
            <span class="example-label">Non-ClassValue prop</span>
            <NonClassValueClassCard class={metadata} />
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
                <code>&lt;div class="demo-card parent-owned"&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Native element</span>
                <code>demo-card parent-owned svelte-parent</code>
                <strong>baseline</strong>
            </div>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Non-ClassValue class prop</span>
                <code>type Props = &#123; class?: unknown &#125;</code>
                <code>let metadata = &#123; label: 'not css', priority: 2 &#125;</code>
                <code>&lt;NonClassValueClassCard class=&#123;metadata&#125; /&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>class prop</span>
                <code>&#123; label: 'not css', priority: 2 &#125;</code>
                <strong>preserved</strong>
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
</style>
