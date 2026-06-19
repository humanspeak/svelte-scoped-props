<script lang="ts">
  import MiddleSpreadCard from '../components/spread/MiddleSpreadCard.svelte'
  import CaseCard from './CaseCard.svelte'
</script>

<CaseCard
  status="passed"
  title="Scoped prop through spread forwarding"
  description="The parent scopes the class before it becomes a normal prop, so a middle component can forward it with a spread."
>
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

  <div class="example-grid">
    <div class="example-block">
      <span class="example-label">Source</span>
      <code>&lt;MiddleSpreadCard scoped:class="parent-owned" /&gt;</code>
      <code>&lt;SpreadGrandchildCard &#123;...forwardedProps&#125; /&gt;</code>
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
          <span>Third child</span>
          <code>grandchild-card parent-owned svelte-parent svelte-grandchild</code>
          <strong>has parent hash</strong>
        </li>
      </ul>
    </div>
  </div>

  <div class="example-block">
    <span class="example-label">Still not magic</span>
    <code>&lt;MiddleSpreadCard &#123;...propsWithClass&#125; /&gt;</code>
    <span>does not express scoped intent at the parent call site.</span>
  </div>
</CaseCard>

<style>
  .parent-owned {
    border-color: purple;
    color: purple;
    background: pink;
  }
</style>
