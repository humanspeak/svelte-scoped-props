<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import InternalClassCard from '../components/InternalClassCard.svelte'
  import CaseCard from './CaseCard.svelte'

  let internalClass: ClassValue = ['parent-owned', { dimmed: true }]
</script>

<CaseCard
  status="passed"
  title="Explicit scoped prop alias"
  description="The call site can name a class-like prop without needing child prop type information."
>
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

  <div class="example-grid">
    <div class="example-block">
      <span class="example-label">Source</span>
      <code>let internalClass: ClassValue = ['parent-owned', &#123; dimmed: true &#125;]</code>
      <code>&lt;InternalClassCard scoped:internalClass=&#123;internalClass&#125; /&gt;</code>
      <code>&lt;div class=&#123;['internal-card', internalClass]&#125;&gt;</code>
    </div>
    <div class="example-block">
      <span class="example-label">Current result</span>
      <ul class="result-list">
        <li>
          <span>Native element</span>
          <code>demo-card parent-owned dimmed svelte-parent</code>
          <strong>pink and faded</strong>
        </li>
        <li>
          <span>ClassValue prop</span>
          <code>internal-card parent-owned dimmed svelte-parent svelte-child</code>
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

  .dimmed {
    opacity: 0.35;
  }
</style>
