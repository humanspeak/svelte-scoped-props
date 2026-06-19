<script lang="ts">
    import NonClassValueClassCard from './components/NonClassValueClassCard.svelte'
    import ProofCase from '../components/ProofCase.svelte'

    let metadata = {
        label: 'not css',
        priority: 2
    }
</script>

<ProofCase
    status="passed"
    title="Non-ClassValue class prop"
    description="A prop named class can still be user data, so non-class objects should be preserved."
>
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

    <div class="example-grid">
        <div class="example-block">
            <span class="example-label">Source</span>
            <code>type Props = &#123; class?: unknown &#125;</code>
            <code>let metadata = &#123; label: 'not css', priority: 2 &#125;</code>
            <code>&lt;NonClassValueClassCard class=&#123;metadata&#125; /&gt;</code>
        </div>
        <div class="example-block">
            <span class="example-label">Current result</span>
            <ul class="result-list">
                <li>
                    <span>Native element</span>
                    <code>demo-card parent-owned svelte-parent</code>
                    <strong>baseline</strong>
                </li>
                <li>
                    <span>class prop</span>
                    <code>&#123; label: 'not css', priority: 2 &#125;</code>
                    <strong>preserved</strong>
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
</style>
