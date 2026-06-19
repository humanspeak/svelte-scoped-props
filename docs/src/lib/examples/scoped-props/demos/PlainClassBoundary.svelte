<script lang="ts">
    import ChildCard from './components/ChildCard.svelte'
    import ProofCase from '../components/ProofCase.svelte'
</script>

<ProofCase
    status="blocked"
    title="Plain component class is not scoped"
    description="A parent-local class passed with plain class remains plain and does not reach the forwarded child root."
>
    <span class="selector-anchor dimmed" hidden aria-hidden="true"></span>

    <div class="render-grid">
        <div class="render-example">
            <span class="example-label">Native element</span>
            <div class="demo-card">This div does not use the child-only class.</div>
        </div>
        <div class="render-example">
            <span class="example-label">Child-only class</span>
            <ChildCard class="dimmed" />
        </div>
    </div>

    <div class="example-grid">
        <div class="example-block">
            <span class="example-label">Source</span>
            <code>.dimmed &#123; opacity: 0.35; &#125;</code>
            <code>&lt;ChildCard class="dimmed" /&gt;</code>
        </div>
        <div class="example-block">
            <span class="example-label">Current result</span>
            <ul class="result-list">
                <li>
                    <span>Native element</span>
                    <code>no dimmed class</code>
                    <strong>baseline</strong>
                </li>
                <li class="missing">
                    <span>Child-only class</span>
                    <code>child-card dimmed svelte-child</code>
                    <strong>missing parent hash</strong>
                </li>
            </ul>
        </div>
    </div>
</ProofCase>

<style>
    .dimmed {
        opacity: 0.35;
    }
</style>
