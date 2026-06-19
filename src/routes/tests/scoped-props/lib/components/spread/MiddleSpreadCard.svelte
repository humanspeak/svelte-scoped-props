<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import SpreadGrandchildCard from './SpreadGrandchildCard.svelte'

  type Props = {
    class?: ClassValue
  }

  let forwardedProps: Props = $props()
</script>

<div class="middle-card">
  <span class="middle-label">Middle child forwards props with spread</span>
  <SpreadGrandchildCard {...forwardedProps} />
</div>

<style>
  .middle-card {
    display: grid;
    gap: 8px;
    padding: 10px;
    border: 1px solid #d7dee7;
    border-radius: 6px;
    background: #f7fafc;
  }

  .middle-label {
    color: #5d6875;
    font-size: 0.8rem;
    font-weight: 700;
  }
</style>
