<script lang="ts">
    import ProofCase from '../components/ProofCase.svelte'
    import SsrProbe from './SsrProbe.svelte'

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

        fetch('/examples/ssr-literal/check')
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

<ProofCase
    status="passed"
    title="SSR scoped literal prop"
    description="The server-rendered child root receives the parent scope class only for scoped:class."
>
    <div class="render-grid">
        <div class="render-example">
            <span class="example-label">Rendered probe</span>
            <SsrProbe />
        </div>
        <div class="render-example">
            <span class="example-label">Expected boundary</span>
            <div class="example-block">
                <code>&lt;ChildCard scoped:class="parent-owned" /&gt;</code>
                <code>&lt;ChildCard class="dimmed" /&gt;</code>
                <span>Only the explicit scoped prop should carry the parent hash.</span>
            </div>
        </div>
    </div>

    {#if ssrState.status === 'loading'}
        <div class="example-block">Loading server-rendered HTML...</div>
    {:else if ssrState.status === 'error'}
        <div class="example-block">{ssrState.message}</div>
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
</ProofCase>
