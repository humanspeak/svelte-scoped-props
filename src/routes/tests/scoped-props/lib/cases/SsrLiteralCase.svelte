<script lang="ts">
  import CaseCard from './CaseCard.svelte'

  type SsrResponse = {
    head?: string
    body?: string
    message?: string
  }

  type SsrCard = {
    label: string
    className: string
    expectsParentHash: boolean
    hasParentHash: boolean
  }

  type SsrState =
    | { status: 'loading' }
    | { status: 'loaded'; body: string; cards: SsrCard[]; parentHash: string | null }
    | { status: 'error'; message: string }

  let ssrState = $state<SsrState>({ status: 'loading' })

  function getCardLabel(element: Element) {
    if (element.classList.contains('demo-card')) return 'Native element'
    if (element.classList.contains('dimmed')) return 'Child-only class'
    return 'Child component'
  }

  function readSsrCards(body: string) {
    const document = new DOMParser().parseFromString(body, 'text/html')
    const native = document.querySelector('.demo-card')
    const parentHash =
      Array.from(native?.classList ?? []).find((className) => className.startsWith('svelte-')) ??
      null

    const cards = Array.from(document.querySelectorAll('.demo-card, .child-card')).map((element) => {
      const className = element.getAttribute('class') ?? ''
      const expectsParentHash = element.classList.contains('parent-owned')

      return {
        label: getCardLabel(element),
        className,
        expectsParentHash,
        hasParentHash: parentHash ? element.classList.contains(parentHash) : false
      }
    })

    return { cards, parentHash }
  }

  $effect(() => {
    let cancelled = false

    fetch('/tests/scoped-props/ssr-check')
      .then(async (response) => {
        const result = (await response.json()) as SsrResponse

        if (!response.ok || result.message) {
          throw new Error(result.message ?? 'Could not load SSR output')
        }

        const body = result.body ?? ''
        const { cards, parentHash } = readSsrCards(body)

        if (!cancelled) {
          ssrState = { status: 'loaded', body, cards, parentHash }
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          ssrState = {
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not load SSR output'
          }
        }
      })

    return () => {
      cancelled = true
    }
  })
</script>

<CaseCard
  status="passed"
  title="SSR scoped literal prop"
  description="The server-rendered child root receives the parent scope class only for scoped:class."
>
  {#if ssrState.status === 'loading'}
    <p>Loading server-rendered HTML...</p>
  {:else if ssrState.status === 'error'}
    <p>{ssrState.message}</p>
  {:else}
    <div class="example-block">
      <span class="example-label">Server result</span>
      <p>Parent scope hash: <code>{ssrState.parentHash ?? 'missing'}</code></p>

      <ul class="result-list">
        {#each ssrState.cards as card}
          <li class:missing={card.expectsParentHash && !card.hasParentHash}>
            <span>{card.label}</span>
            <code>{card.className}</code>
            {#if card.expectsParentHash && card.hasParentHash}
              <strong>has parent hash</strong>
            {:else if card.expectsParentHash}
              <strong>missing parent hash</strong>
            {/if}
          </li>
        {/each}
      </ul>
    </div>

    <pre>{ssrState.body}</pre>
  {/if}
</CaseCard>
