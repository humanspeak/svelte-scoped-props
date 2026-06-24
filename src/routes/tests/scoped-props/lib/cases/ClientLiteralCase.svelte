<script lang="ts">
    import ChildCard from '../components/ChildCard.svelte'
    import CaseCard from './CaseCard.svelte'
</script>

<CaseCard
    status="passed"
    title="Explicit scoped literal prop"
    description="The browser receives the parent scope class only when the call site opts in."
>
    <div class="render-grid">
        <div class="render-example">
            <span class="example-label">Native element</span>
            <div class="demo-card parent-owned">This div receives the scoped parent class.</div>
        </div>
        <div class="render-example">
            <span class="example-label">Child component</span>
            <ChildCard scoped:class="parent-owned" />
        </div>
    </div>

    <div class="example-grid">
        <div class="example-block">
            <span class="example-label">Source</span>
            <code>&lt;div class="demo-card parent-owned"&gt;</code>
            <code>&lt;ChildCard scoped:class="parent-owned" /&gt;</code>
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
                    <span>Child component</span>
                    <code>child-card parent-owned svelte-parent svelte-child</code>
                    <strong>has parent hash</strong>
                </li>
            </ul>
        </div>
    </div>
</CaseCard>

<style>
    .parent-owned {
        border-color: purple;
        color: purple;
        background: pink;
    }
</style>
