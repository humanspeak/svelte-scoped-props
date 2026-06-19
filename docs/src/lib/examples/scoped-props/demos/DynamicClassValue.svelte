<script lang="ts">
    import type { ClassValue } from '@humanspeak/svelte-scoped-props/runtime'
    import ChildCard from './components/ChildCard.svelte'

    let dynamicDimmed = $state(true)
    let dynamicClass: ClassValue = $derived(['parent-owned', { dimmed: dynamicDimmed }])
    let dynamicClassMap: ClassValue = $derived({
        'parent-owned': true,
        dimmed: dynamicDimmed
    })
</script>

<article class="scoped-proof passed dk-demo-shell">
    <label class="toggle-row">
        <input type="checkbox" bind:checked={dynamicDimmed} />
        <span>include <code>dimmed</code> from state</span>
    </label>

    <div class="render-grid">
        <div class="render-example">
            <span class="example-label">Native element</span>
            <div class={['demo-card', dynamicClass]}>This div receives a dynamic ClassValue.</div>
        </div>
        <div class="render-example">
            <span class="example-label">Child component</span>
            <ChildCard scoped:class={dynamicClass} />
        </div>
        <div class="render-example">
            <span class="example-label">Object class map</span>
            <ChildCard scoped:class={dynamicClassMap} />
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
                <code>dynamicClass = ['parent-owned', &#123; dimmed: dynamicDimmed &#125;]</code>
                <code>&lt;div class=&#123;['demo-card', dynamicClass]&#125;&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Native element</span>
                <code>demo-card parent-owned{dynamicDimmed ? ' dimmed' : ''} svelte-parent</code>
                <strong>{dynamicDimmed ? 'pink and faded' : 'pink'}</strong>
            </div>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Child component</span>
                <code>dynamicClass = ['parent-owned', &#123; dimmed: dynamicDimmed &#125;]</code>
                <code>&lt;ChildCard scoped:class=&#123;dynamicClass&#125; /&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Child component</span>
                <code>child-card parent-owned{dynamicDimmed ? ' dimmed' : ''} svelte-parent svelte-child</code>
                <strong>has parent hash</strong>
            </div>
        </div>

        <div class="comparison-row">
            <div class="comparison-cell comparison-source">
                <span>Object class map</span>
                <code>dynamicClassMap = &#123; 'parent-owned': true, dimmed: dynamicDimmed &#125;</code>
                <code>&lt;ChildCard scoped:class=&#123;dynamicClassMap&#125; /&gt;</code>
            </div>
            <div class="comparison-cell comparison-result">
                <span>Object class map</span>
                <code>child-card parent-owned{dynamicDimmed ? ' dimmed' : ''} svelte-parent svelte-child</code>
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
