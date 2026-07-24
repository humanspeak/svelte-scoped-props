<!--
  @component
  Examples-gallery pager: docs-kit's `PagerV2` wired to the canonical
  examples order from `$lib/examplesIndex`, so its `№` numbering always
  agrees with the index grid. `PagerV2` renders nothing when the current
  route isn't in `items`, so the examples layout can mount it
  unconditionally — it appears only on example detail routes, not the index.
-->
<script lang="ts">
    import { listExamples } from '$lib/examplesIndex'
    import { PagerV2 } from '@humanspeak/docs-kit'

    const items = listExamples().map((example) => ({
        href: example.href,
        label: `${example.slug}.`
    }))
</script>

<PagerV2 {items} ariaLabel="Example pagination" />
