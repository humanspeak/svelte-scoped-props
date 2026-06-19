<script lang="ts">
    import type { ClassValue } from '@humanspeak/svelte-scoped-props/runtime'
    import ChildCard from './components/ChildCard.svelte'
    import ProofCase from '../components/ProofCase.svelte'

    let dynamicDimmed = $state(true)
    let dynamicClass: ClassValue = $derived(['parent-owned', { dimmed: dynamicDimmed }])
    let dynamicClassMap: ClassValue = $derived({
        'parent-owned': true,
        dimmed: dynamicDimmed
    })
</script>

<ProofCase
    status="passed"
    title="Explicit scoped dynamic ClassValue"
    description="A derived ClassValue updates and the child keeps the parent scope class when scoped:class is used."
>
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

    <div class="example-grid">
        <div class="example-block">
            <span class="example-label">Source</span>
            <code>let dynamicDimmed = $state(true)</code>
            <code>$derived(['parent-owned', &#123; dimmed: dynamicDimmed &#125;])</code>
            <code>$derived(&#123; 'parent-owned': true, dimmed: dynamicDimmed &#125;)</code>
            <code>&lt;ChildCard scoped:class=&#123;dynamicClass&#125; /&gt;</code>
        </div>
        <div class="example-block">
            <span class="example-label">Current result</span>
            <ul class="result-list">
                <li>
                    <span>Native element</span>
                    <code>demo-card parent-owned{dynamicDimmed ? ' dimmed' : ''} svelte-parent</code>
                    <strong>{dynamicDimmed ? 'pink and faded' : 'pink'}</strong>
                </li>
                <li>
                    <span>Child component</span>
                    <code>child-card parent-owned{dynamicDimmed ? ' dimmed' : ''} svelte-parent svelte-child</code>
                    <strong>has parent hash</strong>
                </li>
                <li>
                    <span>Object class map</span>
                    <code>child-card parent-owned{dynamicDimmed ? ' dimmed' : ''} svelte-parent svelte-child</code>
                    <strong>has parent hash</strong>
                </li>
            </ul>
        </div>
    </div>
</ProofCase>

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
