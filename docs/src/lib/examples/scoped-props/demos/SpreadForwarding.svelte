<script lang="ts">
    import MiddleSpreadCard from './components/spread/MiddleSpreadCard.svelte'
</script>

<article class="scoped-proof passed dk-demo-shell">
    <div class="render-grid">
        <div class="render-example">
            <span class="example-label">Native element</span>
            <div class="demo-card parent-owned">This div receives the parent class directly.</div>
        </div>
        <div class="render-example">
            <span class="example-label">Middle spread to third child</span>
            <MiddleSpreadCard scoped:class="parent-owned" />
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
                <span>Forwarded scoped prop</span>
                <code>&lt;MiddleSpreadCard scoped:class="parent-owned" /&gt;</code>
                <code>&lt;SpreadGrandchildCard &#123;...forwardedProps&#125; /&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Third child</span>
                <code>grandchild-card parent-owned svelte-parent svelte-grandchild</code>
                <strong>has parent hash</strong>
            </div>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Parent spread boundary</span>
                <code>&lt;MiddleSpreadCard &#123;...propsWithClass&#125; /&gt;</code>
            </div>
            <div class="comparison-cell comparison-result comparison-boundary">
                <span>Still not magic</span>
                <code>propsWithClass.class = 'parent-owned'</code>
                <strong>does not express scoped intent at the parent call site</strong>
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
