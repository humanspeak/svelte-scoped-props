<script lang="ts">
    import SsrProbe from './SsrProbe.svelte'

    type SsrResponse = {
        head?: string
        body?: string
        message?: string
    }

    type SsrCard = {
        label: string
        className: string
        expectedParentHash: 'present' | 'absent'
        hasParentHash: boolean
        matchesExpectation: boolean
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
            Array.from(native?.classList ?? []).find((className) =>
                className.startsWith('svelte-')
            ) ?? null

        const cards = Array.from(document.querySelectorAll('.demo-card, .child-card')).map(
            (element) => {
                const className = element.getAttribute('class') ?? ''
                const expectedParentHash = element.classList.contains('parent-owned')
                    ? 'present'
                    : 'absent'
                const hasParentHash = parentHash ? element.classList.contains(parentHash) : false

                return {
                    label: getCardLabel(element),
                    className,
                    expectedParentHash,
                    hasParentHash,
                    matchesExpectation: parentHash
                        ? expectedParentHash === 'present'
                            ? hasParentHash
                            : !hasParentHash
                        : false
                }
            }
        )

        return { cards, parentHash }
    }

    function getResultText(card: SsrCard) {
        if (card.label === 'Native element') {
            return card.hasParentHash
                ? 'baseline parent style is present'
                : 'baseline parent style is missing'
        }

        if (card.label === 'Child component') {
            return card.hasParentHash
                ? 'scoped prop carries the parent style'
                : 'scoped prop lost the parent style'
        }

        return card.hasParentHash
            ? 'plain class leaked parent style'
            : 'plain class stays child-owned'
    }

    function formatServerHtml(html: string) {
        return html.replace(/></g, '>\n<').trim()
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
                        message:
                            error instanceof Error ? error.message : 'Could not load SSR output'
                    }
                }
            })

        return () => {
            cancelled = true
        }
    })
</script>

<article class="scoped-proof passed dk-demo-shell">
    <div class="ssr-grid">
        <div class="render-example">
            <span class="example-label">Server-rendered output</span>
            <SsrProbe />
        </div>
        <div class="render-example">
            <span class="example-label">Call-site intent</span>
            <div class="boundary-list">
                <div class="boundary-row">
                    <code>&lt;div class="demo-card parent-owned"&gt;</code>
                    <span
                        >Native markup establishes the parent-owned style the children are compared
                        against.</span
                    >
                </div>
                <div class="boundary-row">
                    <code>&lt;ChildCard scoped:class="parent-owned" /&gt;</code>
                    <span
                        >The child root should match that parent-owned style before hydration.</span
                    >
                </div>
                <div class="boundary-row">
                    <code>&lt;ChildCard class="dimmed" /&gt;</code>
                    <span>The plain class prop should stay child-owned with no parent style.</span>
                </div>
            </div>
        </div>
    </div>

    {#if ssrState.status === 'loading'}
        <div class="server-panel">Loading server-rendered HTML...</div>
    {:else if ssrState.status === 'error'}
        <div class="server-panel">{ssrState.message}</div>
    {:else}
        <div class="server-panel">
            <span class="example-label">Server check</span>
            <p class="server-note">
                Svelte generated <code>{ssrState.parentHash ?? 'missing'}</code> for the parent style
                block. The SSR HTML should include that class only where the call site opted in.
            </p>

            <ul class="result-list ssr-results">
                {#each ssrState.cards as card}
                    <li
                        class:missing={!card.matchesExpectation}
                        class:expected-absent={card.expectedParentHash === 'absent'}
                    >
                        <span>{card.label}</span>
                        <code>{card.className}</code>
                        <strong>{getResultText(card)}</strong>
                    </li>
                {/each}
            </ul>

            <details class="raw-html">
                <summary>Raw server-rendered HTML</summary>
                <pre>{formatServerHtml(ssrState.body)}</pre>
            </details>
        </div>
    {/if}
</article>

<style>
    .ssr-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(min(100%, 320px), 0.95fr);
        gap: 12px;
        align-items: stretch;
    }

    .boundary-list {
        display: grid;
        gap: 10px;
        min-width: 0;
    }

    .boundary-row {
        display: grid;
        gap: 8px;
        align-content: center;
        min-height: 116px;
        box-sizing: border-box;
        padding: 12px;
        border: 1px solid color-mix(in oklab, var(--proof-source-code-border) 76%, transparent);
        border-left: 4px solid var(--proof-source-code-border);
        border-radius: 2px;
        background: var(--proof-source-code-bg);
    }

    .boundary-row code {
        width: fit-content;
    }

    .boundary-row span {
        color: var(--proof-card-muted);
        line-height: 1.45;
    }

    .server-panel {
        display: grid;
        gap: 12px;
        min-width: 0;
        padding: 12px;
        border: 1px solid color-mix(in oklab, var(--brut-rule, #111) 18%, transparent);
        border-radius: 6px;
        background: var(--proof-card-soft);
    }

    .server-note {
        max-width: 74ch;
        margin: 0;
        color: var(--proof-card-ink);
        line-height: 1.45;
    }

    .ssr-results {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    }

    .ssr-results li.expected-absent:not(.missing) {
        border-left-color: color-mix(in oklab, var(--proof-card-muted) 62%, var(--proof-success));
    }

    .raw-html {
        display: grid;
        gap: 8px;
        min-width: 0;
        padding-top: 4px;
        color: var(--proof-card-muted);
    }

    .raw-html summary {
        width: fit-content;
        cursor: pointer;
        color: var(--proof-card-muted);
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
    }

    .raw-html pre {
        max-height: 180px;
        font-size: 0.76rem;
    }

    @media (max-width: 760px) {
        .ssr-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
