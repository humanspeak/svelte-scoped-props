<script lang="ts">
    import { AnimatePresence, MotionButton, MotionSpan } from '@humanspeak/svelte-motion'
    import { HeaderV2, FooterV2, getBreadcrumbContext, getSeoContext } from '@humanspeak/docs-kit'
    import { docsConfig } from '$lib/docs-config'
    import favicon from '$lib/assets/logo.svg'
    import githubStats from '$lib/github-stats.json'
    import MiddleSpreadCard from '$lib/examples/scoped-props/demos/components/spread/MiddleSpreadCard.svelte'
    import { describeClass } from '$lib/examples/scoped-props/demos/components/classValue'
    import '@fontsource-variable/inter/index.css'
    import '@fontsource-variable/jetbrains-mono/index.css'
    import posthog from 'posthog-js'
    import type { PageData } from './$types'
    import type { ClassValue } from '@humanspeak/svelte-scoped-props/runtime'

    const { data }: { data: PageData } = $props()
    const packageStats = $derived(data.packageStats)

    // ── Breadcrumb + SEO contexts ────────────────────────────────────
    const breadcrumbContext = getBreadcrumbContext()
    if (breadcrumbContext) breadcrumbContext.breadcrumbs = []

    const seo = getSeoContext()
    if (seo) {
        seo.title = 'Svelte Scoped Props · Explicit scoped class props for Svelte'
        seo.description =
            'Svelte Scoped Props is an experimental Svelte preprocessor for forwarding parent-scoped classes through explicit component props.'
        seo.ogTitle = 'Svelte Scoped Props'
        seo.ogTagline = 'Parent-owned scoped classes for component props, without reaching for :global.'
        seo.ogFeatures = [
            'Explicit scoped props',
            'SSR-safe classes',
            'ClassValue support',
            'Svelte 5'
        ]
        seo.ogSlug = 'home'
    }

    // ── Package + library stats ──────────────────────────────────────
    // Package stats are fetched from the npm registry at request time by
    // `+page.server.ts` (cached for ~1 hour at the edge and in memory).
    // Renderer / hook / tag counts come from library exports directly,
    // so those stay live automatically.
    const PKG_NAME = $derived(packageStats.name)
    const PKG_VERSION = $derived(packageStats.version)
    const TARBALL_KB = $derived(
        packageStats.tarballBytes !== null
            ? Math.round(packageStats.tarballBytes / 102.4) / 10
            : null
    )

    // Counts are static facts about the library surface area. They change
    // rarely; cheap to keep them inline rather than re-deriving at runtime.
    const CASE_COUNT = 6 // literal, dynamic, alias, spread, SSR, boundary
    const PROP_COUNT = 2 // scoped:class and scoped:<alias>
    const RUNTIME_HELPERS = 1 // scopedClass for dynamic ClassValue values

    interface StatItem {
        k: string
        v: string
        sup?: string
        n: string
        ac?: boolean
    }
    const stats: StatItem[] = $derived([
        { k: 'proof cases', v: String(CASE_COUNT), n: 'literal · dynamic · alias · spread', ac: true },
        { k: 'directives', v: String(PROP_COUNT), n: 'scoped:class · scoped:<prop>' },
        {
            k: 'runtime helpers',
            v: String(RUNTIME_HELPERS),
            n: 'dynamic ClassValue support',
            ac: true
        },
        {
            k: 'tarball',
            v: TARBALL_KB !== null ? String(TARBALL_KB) : '—',
            sup: TARBALL_KB !== null ? 'kB' : undefined,
            n: 'packed (npm gz)'
        },
        { k: 'runtime deps', v: '0', n: 'helper ships with package' },
        { k: 'licence', v: 'MIT', n: 'on GitHub' }
    ])

    const features = [
        {
            title: 'Explicit opt-in',
            body: 'Use scoped:class or scoped:<prop> at the call site to say the parent owns this class.'
        },
        {
            title: 'Parent CSS stays scoped',
            body: 'Parent selectors keep their Svelte hash and still reach the component prop that opts in.'
        },
        {
            title: 'ClassValue support',
            body: 'String literals, arrays, and object maps keep the same shape while the parent hash is appended.'
        },
        {
            title: 'SSR paint coverage',
            body: 'Server-rendered children receive the same parent-scoped styling before hydration.'
        },
        {
            title: 'Prop aliases',
            body: 'Forward scoped classes through internalClass, contentClass, or any other explicit class-like prop.'
        },
        {
            title: 'No child type graph',
            body: 'The experiment avoids guessing child prop types by making scoped intent part of the parent syntax.'
        }
    ]

    // ── Spread forwarding demo (FIG-002) ─────────────────────────────
    type SpreadTone = 'purple' | 'pink' | 'split'

    const spreadToneOptions: Array<{ id: SpreadTone; label: string; note: string }> = [
        { id: 'split', label: 'pink + purple', note: 'combined surface' },
        { id: 'purple', label: 'purple', note: 'parent tone' },
        { id: 'pink', label: 'pink', note: 'parent tone' }
    ]

    let spreadTone = $state<SpreadTone>('split')
    let spreadRaised = $state(true)
    let spreadFaded = $state(false)
    let spreadClassValue: ClassValue = $derived([
        'parent-owned',
        `tone-${spreadTone}`,
        {
            raised: spreadRaised,
            faded: spreadFaded
        }
    ])
    let spreadPreview = $derived(describeClass(spreadClassValue))

    // ── Featured examples (homepage tiles → /examples/<slug>) ────────
    const featuredExamples = [
        {
            slug: 'explicit-literal',
            title: 'Literal scoped class',
            body: 'A parent-owned class is passed to a child component and keeps the parent scope hash.'
        },
        {
            slug: 'dynamic-class-value',
            title: 'Dynamic ClassValue',
            body: 'Arrays and object maps stay dynamic while the parent hash is appended at the boundary.'
        },
        {
            slug: 'class-value-alias',
            title: 'Prop aliases',
            body: 'Use scoped:internalClass, scoped:contentClass, or another explicit prop name.'
        },
        {
            slug: 'spread-forwarding',
            title: 'Spread forwarding',
            body: 'After the parent transform, scoped props can move through a wrapper as normal props.'
        },
        {
            slug: 'plain-class-boundary',
            title: 'Plain class boundary',
            body: 'A normal component class is left alone unless the call site opts into scoped:<prop>.'
        },
        {
            slug: 'ssr-literal',
            title: 'SSR scoped literal',
            body: 'Server-rendered component props carry the parent class hash before hydration paints.'
        }
    ]

    // ── PostHog event handlers ───────────────────────────────────────
    const captureGetStarted = () => posthog.capture('get_started_clicked', { location: 'hero' })
    const captureExampleTile = (slug: string, title: string, index: number) =>
        posthog.capture('example_tile_clicked', { slug, title, index })
    const captureAILink = (type: string, path: string) =>
        posthog.capture('llms_txt_opened', { type, path })

    // ── Copy install command ─────────────────────────────────────────
    const installCmd = $derived(`npm i ${PKG_NAME}`)
    let copied = $state(false)
    const copyInstall = async () => {
        if (typeof navigator === 'undefined') return
        try {
            await navigator.clipboard.writeText(installCmd)
            copied = true
            setTimeout(() => (copied = false), 1500)
            posthog.capture('install_command_copied', { package: PKG_NAME, version: PKG_VERSION })
        } catch {
            /* clipboard blocked — fail quiet */
        }
    }

    // ── Schema.org SoftwareApplication ────────────────────────────────
    // Note: aggregateRating was removed per SEO.md P0 — GitHub stars
    // aren't ratings, and Google can apply a structured-data manual
    // action when ratingCount isn't backed by visible reviews.
    const softwareJsonLd = `<${'script'} type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Svelte Scoped Props',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        url: 'https://scoped.svelte.page',
        description:
            'Experimental Svelte preprocessor for forwarding parent-scoped classes through explicit component props.',
        codeRepository: 'https://github.com/humanspeak/svelte-scoped-props',
        programmingLanguage: ['TypeScript', 'Svelte'],
        keywords: [
            'Svelte scoped CSS',
            'component classes',
            'scoped props',
            'class props',
            'preprocessor',
            'Svelte 5',
            'TypeScript'
        ],
        author: {
            '@type': 'Organization',
            name: 'Humanspeak',
            url: 'https://humanspeak.com',
            sameAs: [
                'https://github.com/humanspeak',
                'https://github.com/humanspeak/svelte-scoped-props',
                'https://www.npmjs.com/package/@humanspeak/svelte-scoped-props'
            ]
        },
        downloadUrl: 'https://www.npmjs.com/package/@humanspeak/svelte-scoped-props',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        license: 'https://opensource.org/licenses/MIT',
        interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: githubStats.stars,
            name: 'GitHub stars'
        }
    })}</${'script'}>`
</script>

<svelte:head>
    <title>Svelte Scoped Props · Explicit scoped class props for Svelte</title>
    <meta
        name="description"
        content="Svelte Scoped Props is an experimental Svelte preprocessor for forwarding parent-scoped classes through explicit component props."
    />
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD, no user input -->
    {@html softwareJsonLd}
</svelte:head>

<div id="top" class="brut-wrap flex min-h-svh flex-col">
    <HeaderV2
        config={docsConfig}
        {favicon}
        version={PKG_VERSION}
        nav={[
            { label: 'docs', href: '/docs' },
            { label: 'examples', href: '/examples' }
        ]}
    />

    <main class="brut">
        <!-- ── Coordinate strip ───────────────────────────────────────── -->
        <div class="brut-coord" aria-hidden="true">
            {#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
                <div>{String(i + 1).padStart(2, '0')}</div>
            {/each}
        </div>

        <!-- ── FIG-001 · MASTHEAD ─────────────────────────────────── -->
        <section class="brut-hero">
            <div class="corner tr">FIG-001 · MASTHEAD</div>
            <aside class="meta">
                <div><span class="k">pkg</span> · <span class="v">{PKG_NAME}</span></div>
                <div><span class="k">version</span> · <span class="v">{PKG_VERSION}</span></div>
                <div>
                    <span class="k">tarball</span> ·
                    <span class="v">{TARBALL_KB !== null ? `${TARBALL_KB} kB gz` : '—'}</span>
                </div>
                <div><span class="k">deps</span> · <span class="v">0</span></div>
                <div><span class="k">licence</span> · <span class="v">MIT</span></div>
                <hr />
                <div><span class="k">cases</span> · <span class="v">{CASE_COUNT}</span></div>
                <div><span class="k">directives</span> · <span class="v">{PROP_COUNT}</span></div>
                <div>
                    <span class="k">syntax</span> ·
                    <span class="v accent">scoped:&lt;prop&gt;</span>
                </div>
                <hr />
                <div class="k">// scroll for full spec</div>
            </aside>
            <div class="hero-body">
                <h1>
                    <span class="mark" aria-hidden="true">
                        <span>svelte</span><span class="slash">/</span><span>scoped-props</span
                        ><span class="end">.</span>
                    </span>
                    <span class="sr-only"
                        >Svelte Scoped Props — explicit scoped class props for Svelte components</span
                    >
                </h1>
                <p class="sub">
                    <b>Explicit scoped class props for Svelte.</b> Write parent-owned CSS once,
                    pass it through <code>scoped:class</code> or <code>scoped:&lt;prop&gt;</code>,
                    and let the preprocessor add the parent scope hash for client and SSR output.
                </p>
                <div class="cta-row">
                    <a class="pri" href="/docs" onclick={captureGetStarted}>get started ↗</a>
                    <a href="/docs/api-reference">api reference</a>
                    <a href="https://www.npmjs.com/package/@humanspeak/svelte-scoped-props"
                        >npm package</a
                    >
                    <MotionButton
                        class="inst"
                        type="button"
                        onclick={copyInstall}
                        aria-label="Copy install command"
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                    >
                        <span class="inst-prompt">$</span>
                        <span class="inst-cmd">npm i <span class="pkg">{PKG_NAME}</span></span>
                        <span class="inst-copy {copied ? 'is-copied' : ''}">
                            <AnimatePresence initial={false}>
                                <MotionSpan
                                    key={copied ? 'copied' : 'idle'}
                                    class="inst-copy-label"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                >
                                    {copied ? '✓ copied' : 'copy'}
                                </MotionSpan>
                            </AnimatePresence>
                        </span>
                    </MotionButton>
                </div>
            </div>
            <div class="corner bl">FIG-001</div>
            <div class="corner br">SHEET 01 / 05</div>
        </section>

        <!-- ── Stats row ───────────────────────────────────────────── -->
        <section class="brut-stats">
            {#each stats as s, i (s.k)}
                <div class="s {s.ac ? 'ac' : ''}" data-idx="/0{i + 1}">
                    <div class="k">{s.k}</div>
                    <div class="v">
                        <span class="v-num">{s.v}</span>{#if s.sup}<span class="v-unit"
                                >{s.sup}</span
                            >{/if}
                    </div>
                    <div class="note">{s.n}</div>
                </div>
            {/each}
        </section>

        <!-- ── FIG-002 · SPREAD DEMO ───────────────────────────────── -->
        <section class="brut-demo spread-demo">
            <div class="lede">
                <div class="k">FIG-002 / SPREAD</div>
                <h2>scope before <span>spread</span>.</h2>
                <p>
                    The parent opts in with <code>scoped:class</code>. The middle child only spreads
                    props, and the third child still receives the parent-owned class.
                </p>
            </div>
            <div class="panel">
                <div class="bar">
                    <span
                        ><span class="lbl">file</span> ·
                        <span class="v">spread-forwarding.svelte</span></span
                    >
                    <span
                        ><span class="lbl">prop</span> <span class="v">scoped:class</span></span
                    >
                    <span><span class="lbl">value</span> <span class="v">{spreadPreview}</span></span>
                    <span><span class="lbl">path</span> <span class="v">parent → middle → third</span></span>
                    <span class="live">● FORWARDED</span>
                </div>
                <div class="spread-stage">
                    <div class="spread-controls">
                        <div class="control-head">
                            <span>parent call site</span>
                            <code>&lt;MiddleSpreadCard scoped:class=&#123;classValue&#125; /&gt;</code>
                        </div>
                        <div class="tone-grid" aria-label="Choose parent-owned color">
                            {#each spreadToneOptions as option (option.id)}
                                <MotionButton
                                    type="button"
                                    class="tone-button {spreadTone === option.id ? 'is-active' : ''}"
                                    aria-pressed={spreadTone === option.id}
                                    onclick={() => (spreadTone = option.id)}
                                    whileTap={{ scale: 0.97 }}
                                    whileHover={{ y: -2 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                >
                                    <span>{option.label}</span>
                                    <small>{option.note}</small>
                                </MotionButton>
                            {/each}
                        </div>
                        <div class="switch-row">
                            <MotionButton
                                type="button"
                                class="switch-button {spreadRaised ? 'is-active' : ''}"
                                aria-pressed={spreadRaised}
                                onclick={() => (spreadRaised = !spreadRaised)}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                            >
                                raised shadow
                            </MotionButton>
                            <MotionButton
                                type="button"
                                class="switch-button {spreadFaded ? 'is-active' : ''}"
                                aria-pressed={spreadFaded}
                                onclick={() => (spreadFaded = !spreadFaded)}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                            >
                                faded state
                            </MotionButton>
                        </div>
                        <div class="class-readout">
                            <span>ClassValue</span>
                            <code>{spreadPreview}</code>
                        </div>
                    </div>

                    <div class="spread-flow" aria-label="Spread forwarding path">
                        <div
                            class="flow-card parent-node parent-owned"
                            class:tone-purple={spreadTone === 'purple'}
                            class:tone-pink={spreadTone === 'pink'}
                            class:tone-split={spreadTone === 'split'}
                            class:raised={spreadRaised}
                            class:faded={spreadFaded}
                        >
                            <span class="node-k">01 · native element</span>
                            <strong>Parent CSS owns this class.</strong>
                            <code>class="{spreadPreview}"</code>
                        </div>

                        <div class="flow-hop">
                            <span>scope hash is already prop data</span>
                            <b>→</b>
                        </div>

                        <div class="middle-preview">
                            <span class="node-k">02 · spread through middle</span>
                            <MiddleSpreadCard scoped:class={spreadClassValue} />
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <div>syntax · <span class="v accent">scoped:class</span></div>
                    <div>input · <span class="v">ClassValue</span></div>
                    <div>middle · <span class="v">spread only</span></div>
                    <div>third child · <span class="v">gets hash</span></div>
                    <div>plain spread · <span class="v">not magic</span></div>
                </div>
            </div>
        </section>

        <!-- ── FIG-003 · CAPABILITIES ──────────────────────────────── -->
        <section class="brut-feat">
            <div class="lede">
                <div class="k">FIG-003 / CAPABILITIES</div>
                <h2>why <span>scoped props</span>.</h2>
                <p>Parent-scoped CSS can opt into component boundaries without becoming global.</p>
            </div>
            <div class="grid">
                {#each features as f, i (f.title)}
                    <div class="cell">
                        <div class="id">
                            № {String(i + 1).padStart(2, '0')} / {String(features.length).padStart(
                                2,
                                '0'
                            )}
                        </div>
                        <div class="corner">▢</div>
                        <h3>{f.title}</h3>
                        <p>{f.body}</p>
                        <div class="marker"></div>
                    </div>
                {/each}
            </div>
        </section>

        <!-- ── FIG-004 · AI-READY DOCS ─────────────────────────────── -->
        <section class="brut-ai" id="ai-ready">
            <div class="lede">
                <div class="k">FIG-004 / AI-READY</div>
                <h2>built for <span>ai-assisted</span> code.</h2>
                <p>
                    Point Cursor, Claude Code, or any LLM at the manifests below and they know the
                    scoped prop syntax — literals, ClassValue expressions, prop aliases, and SSR
                    behavior.
                </p>
            </div>
            <div class="ai-panel">
                <div class="ai-head">
                    <span class="ai-tab on">llms.txt</span>
                    <span class="ai-tab">llms-full.txt</span>
                    <span class="grow"></span>
                    <span class="ai-meta">/llmstxt.org</span>
                </div>
                <div class="ai-grid">
                    <a
                        class="ai-cell"
                        href="/llms.txt"
                        target="_blank"
                        rel="noopener"
                        onclick={() => captureAILink('index', '/llms.txt')}
                    >
                        <div class="ai-cell-k">01 · index</div>
                        <h3>
                            <code>/llms.txt</code>
                        </h3>
                        <p>
                            Compact map. Project blurb, feature list, type catalogue, doc URLs. Drop
                            into any agent for ground-truth lookup.
                        </p>
                        <div class="ai-cell-foot">~3 kB · open ↗</div>
                    </a>
                    <a
                        class="ai-cell"
                        href="/llms-full.txt"
                        target="_blank"
                        rel="noopener"
                        onclick={() => captureAILink('full', '/llms-full.txt')}
                    >
                        <div class="ai-cell-k">02 · full</div>
                        <h3>
                            <code>/llms-full.txt</code>
                        </h3>
                        <p>
                            Full reference. Syntax, options, edge cases, and examples with code
                            snippets. Optimised for LLM context windows.
                        </p>
                        <div class="ai-cell-foot">~16 kB · open ↗</div>
                    </a>
                    <a
                        class="ai-cell"
                        href="/docs"
                        target="_blank"
                        rel="noopener"
                        onclick={() => captureAILink('per-page', '/docs')}
                    >
                        <div class="ai-cell-k">03 · per-page mirrors</div>
                        <h3>
                            <code>/docs/&lt;slug&gt;.md</code>
                        </h3>
                        <p>
                            Every doc page mirrored as raw markdown. Append <code>.md</code> to any doc
                            URL to fetch the source the chatbot can quote verbatim.
                        </p>
                        <div class="ai-cell-foot">36 docs · open ↗</div>
                    </a>
                </div>
                <div class="ai-prompt">
                    <span class="ai-prompt-k">// example prompt</span>
                    <code
                        >Use https://scoped.svelte.page/llms.txt as the source for Svelte Scoped
                        Props. Show how to pass a parent-scoped class into a child component with
                        <em>scoped:class</em>.</code
                    >
                </div>
            </div>
        </section>

        <!-- ── FIG-005 · EXAMPLES ──────────────────────────────────── -->
        <section class="brut-ex">
            <div class="lede">
                <div class="k">FIG-005 / EXAMPLES</div>
                <h2>explore <span>interactive examples</span>.</h2>
                <p>
                    Literal classes, dynamic ClassValue objects, prop aliases, and SSR paint all have
                    visible cases in the test surface.
                </p>
            </div>
            <div>
                <div class="grid">
                    {#each featuredExamples as ex, i (ex.slug)}
                        <a
                            class="cell"
                            href="/examples/{ex.slug}"
                            onclick={() => captureExampleTile(ex.slug, ex.title, i)}
                        >
                            <div class="id">
                                № {String(i + 1).padStart(2, '0')} / {String(
                                    featuredExamples.length
                                ).padStart(2, '0')}
                            </div>
                            <div class="corner">↗</div>
                            <h3>{ex.title}</h3>
                            <p>{ex.body}</p>
                            <div class="marker"></div>
                        </a>
                    {/each}
                </div>
                <a class="ex-all" href="/examples">view all examples →</a>
            </div>
        </section>

        <!-- ── Big-type footer ─────────────────────────────────────── -->
        <section class="brut-foot">
            <div class="info">
                <div>SET / JETBRAINS MONO + INTER</div>
                <div>HUMANSPEAK · 2026</div>
                <div>MIT LICENCE</div>
                <div class="v">● {PKG_VERSION}</div>
            </div>
            <MotionButton
                class="big"
                type="button"
                onclick={copyInstall}
                aria-label="Copy install command"
                whileTap={{ scale: 0.985 }}
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
                npm&nbsp;i&nbsp;<span>@humanspeak/</span><br />svelte-scoped-props
                <span class="copy-hint">
                    <AnimatePresence initial={false}>
                        <MotionSpan
                            key={copied ? 'copied' : 'idle'}
                            class="copy-hint-label"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                        >
                            {copied ? '✓ copied to clipboard' : 'click to copy'}
                        </MotionSpan>
                    </AnimatePresence>
                </span>
            </MotionButton>
            <div class="info right">
                <div>SHEET 05 / 05</div>
                <div>END OF DOCUMENT</div>
                <a class="v" href="#top">↩ TO TOP</a>
            </div>
        </section>
    </main>

    <FooterV2 version={PKG_VERSION} />
</div>

<style>
    /* Brutalist tokens + .brut / .brut-wrap base styles live in
       @humanspeak/docs-kit/styles/brutalist.css (imported via app.css). */

    /* ── Coordinate strip ─────────────────────────────────────────── */
    .brut-coord {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        border-bottom: 1px solid var(--brut-rule);
        font-size: 10px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
    }
    .brut-coord div {
        padding: 6px 8px;
        border-right: 1px solid var(--brut-rule);
    }
    .brut-coord div:last-child {
        border-right: 0;
    }

    /* ── Hero ─────────────────────────────────────────────────────── */
    .brut-hero {
        padding: 80px 24px 32px;
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        border-bottom: 1px solid var(--brut-rule);
        position: relative;
    }
    .brut-hero .meta {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 11px;
        color: var(--brut-ink-3);
        margin: 0;
    }
    .brut-hero .meta .k {
        color: var(--brut-ink-3);
    }
    .brut-hero .meta .v {
        color: var(--brut-ink);
    }
    .brut-hero .meta .v.accent {
        color: var(--brut-accent);
    }
    .brut-hero .meta hr {
        border: 0;
        border-top: 1px dashed var(--brut-rule);
        margin: 8px 0;
    }
    .brut-hero h1 {
        margin: 0;
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: clamp(56px, 11vw, 152px);
        line-height: 0.88;
        font-weight: 500;
        letter-spacing: -0.06em;
        text-transform: lowercase;
    }
    .brut-hero h1 .slash {
        color: var(--brut-accent);
    }
    .brut-hero h1 .end {
        color: var(--brut-ink-3);
    }
    .brut-hero .sub {
        margin: 28px 0 0;
        max-width: 720px;
        font-size: 17px;
        line-height: 1.5;
        color: var(--brut-ink-2);
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        letter-spacing: -0.01em;
    }
    .brut-hero .sub b {
        color: var(--brut-ink);
        font-weight: 600;
    }
    .brut-hero .sub code {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        background: var(--brut-bg-2);
        border: 1px solid var(--brut-rule);
        padding: 0 5px;
        font-size: 14.5px;
        color: var(--brut-ink);
    }
    .brut-hero .cta-row {
        margin-top: 28px;
        display: flex;
        flex-wrap: wrap;
        gap: 0;
        align-items: stretch;
        width: fit-content;
        max-width: 100%;
    }
    .brut-hero .cta-row > * {
        padding: 10px 14px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--brut-ink);
        cursor: pointer;
        font-family: inherit;
        text-decoration: none;
        position: relative;
        z-index: 1;
        transition:
            background 0.15s,
            border-color 0.15s;
    }
    .brut-hero .cta-row > * + * {
        margin-left: -1px;
    }
    .brut-hero .cta-row > *:hover {
        z-index: 2;
    }
    .brut-hero .cta-row .pri {
        background: var(--brut-accent);
        color: var(--brut-accent-ink);
        font-weight: 600;
        border-color: var(--brut-accent);
    }
    .brut-hero .cta-row .pri:hover {
        background: var(--brut-accent-hover);
        border-color: var(--brut-accent-hover);
    }
    /* Scope the muted hover to non-primary anchors only — without :not(.pri)
       the rule clobbered the primary CTA's accent background and left dark
       ink on a dark surface (unreadable in both themes). */
    .brut-hero .cta-row a:not(.pri):hover,
    .brut-hero .cta-row :global(.inst:hover) {
        background: var(--brut-bg-2);
        border-color: var(--brut-rule-2);
    }
    .brut-hero .cta-row :global(.inst) {
        padding: 10px 18px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        color: var(--brut-ink-2);
        font-family: inherit;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        position: relative;
        z-index: 1;
        margin-left: -1px;
        transition:
            background 0.15s,
            border-color 0.15s;
    }
    .brut-hero .cta-row :global(.inst:hover) {
        z-index: 2;
    }
    .brut-hero .cta-row :global(.inst .inst-prompt) {
        color: var(--brut-ink-3);
    }
    .brut-hero .cta-row :global(.inst .inst-cmd) {
        color: var(--brut-ink-2);
    }
    .brut-hero .cta-row :global(.inst .inst-cmd .pkg) {
        color: var(--brut-ink);
    }
    .brut-hero .cta-row :global(.inst .inst-copy) {
        margin-left: 4px;
        padding: 2px 8px;
        font-size: 10.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--brut-accent);
        border: 1px solid var(--brut-rule);
        display: inline-grid;
        align-items: center;
        justify-items: center;
        min-width: 84px;
        height: 20px;
        overflow: hidden;
        transition:
            border-color 0.2s,
            background 0.2s;
    }
    .brut-hero .cta-row :global(.inst .inst-copy.is-copied) {
        border-color: var(--brut-accent);
        background: var(--brut-accent-soft);
    }
    .brut-hero .cta-row :global(.inst .inst-copy-label) {
        grid-area: 1 / 1;
        display: inline-block;
        white-space: nowrap;
        will-change: transform, opacity;
    }
    .brut-hero .corner {
        position: absolute;
        font-size: 10px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
    }
    .brut-hero .corner.tr {
        top: 12px;
        right: 24px;
    }
    .brut-hero .corner.bl {
        bottom: 12px;
        left: 24px;
    }
    .brut-hero .corner.br {
        bottom: 12px;
        right: 24px;
    }

    /* ── Stats row ────────────────────────────────────────────────── */
    .brut-stats {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        border-bottom: 1px solid var(--brut-rule);
    }
    .brut-stats .s {
        padding: 28px 24px;
        border-right: 1px solid var(--brut-rule);
        position: relative;
        min-height: 160px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .brut-stats .s:last-child {
        border-right: 0;
    }
    .brut-stats .s .k {
        font-size: 10.5px;
        letter-spacing: 0.14em;
        color: var(--brut-ink-3);
    }
    .brut-stats .s .v {
        font-size: 64px;
        line-height: 1;
        font-weight: 500;
        letter-spacing: -0.04em;
        display: inline-flex;
        align-items: baseline;
        gap: 4px;
        white-space: nowrap;
    }
    .brut-stats .s .v-num {
        line-height: 1;
    }
    .brut-stats .s .v-unit {
        font-size: 22px;
        letter-spacing: 0;
        font-weight: 500;
        color: inherit;
        line-height: 1;
    }
    .brut-stats .s .note {
        font-size: 11px;
        color: var(--brut-ink-2);
    }
    .brut-stats .s.ac .v {
        color: var(--brut-accent);
    }
    .brut-stats .s::after {
        content: attr(data-idx);
        position: absolute;
        top: 12px;
        right: 14px;
        font-size: 10px;
        color: var(--brut-ink-3);
    }

    /* ── Section lede (shared by demo / feat / ai) ────────────────── */
    .brut-demo .lede,
    .brut-feat .lede,
    .brut-ai .lede {
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
    }
    .brut-demo .lede h2,
    .brut-feat .lede h2,
    .brut-ai .lede h2 {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 28px;
        color: var(--brut-ink);
        margin: 12px 0 0;
        letter-spacing: -0.02em;
        text-transform: lowercase;
        font-weight: 500;
    }
    .brut-demo .lede h2 span,
    .brut-feat .lede h2 span,
    .brut-ai .lede h2 span {
        color: var(--brut-accent);
    }
    .brut-demo .lede p,
    .brut-ai .lede p {
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        color: var(--brut-ink-2);
        margin: 12px 0 0;
        font-size: 13px;
        line-height: 1.55;
        letter-spacing: 0;
    }

    /* ── Spread demo (FIG-002) ────────────────────────────────────── */
    .brut-demo {
        padding: 28px 24px;
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        border-bottom: 1px solid var(--brut-rule);
    }
    .brut-demo .panel {
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        min-width: 0;
        overflow: hidden;
    }
    .brut-demo .panel .bar {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 8px 14px;
        border-bottom: 1px solid var(--brut-rule);
        font-size: 11px;
        color: var(--brut-ink-2);
        background: var(--brut-bg-2);
        flex-wrap: wrap;
    }
    .brut-demo .panel .bar > span {
        min-width: 0;
        overflow-wrap: anywhere;
    }
    .brut-demo .panel .bar .lbl {
        color: var(--brut-ink-3);
    }
    .brut-demo .panel .bar .v {
        color: var(--brut-ink);
    }
    .brut-demo .panel .bar .live {
        margin-left: auto;
        color: var(--brut-accent);
    }
    .brut-demo .lede p code,
    .brut-demo .panel code {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
    }
    .brut-demo .lede p code {
        padding: 0 4px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        color: var(--brut-ink);
        font-size: 0.92em;
    }
    .spread-stage {
        display: grid;
        grid-template-columns: minmax(240px, 330px) 1fr;
        min-height: 420px;
        background-image:
            linear-gradient(var(--brut-rule) 1px, transparent 1px),
            linear-gradient(90deg, var(--brut-rule) 1px, transparent 1px);
        background-size: 32px 32px;
        background-position: center center;
    }
    .spread-controls {
        display: grid;
        grid-template-rows: auto auto auto 1fr;
        gap: 14px;
        padding: 18px;
        border-right: 1px solid var(--brut-rule);
        background: color-mix(in oklab, var(--brut-bg-2) 78%, transparent);
    }
    .control-head {
        display: grid;
        gap: 8px;
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }
    .control-head code,
    .class-readout code {
        display: block;
        padding: 10px 12px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        color: var(--brut-ink);
        font-size: 11px;
        line-height: 1.45;
        letter-spacing: 0;
        text-transform: none;
        overflow-wrap: anywhere;
        white-space: normal;
    }
    .tone-grid,
    .switch-row {
        display: grid;
        gap: 8px;
    }
    .tone-grid {
        grid-template-columns: 1fr;
    }
    .switch-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .spread-controls :global(.tone-button),
    .spread-controls :global(.switch-button) {
        appearance: none;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        color: var(--brut-ink-2);
        font-family: inherit;
        cursor: pointer;
        text-align: left;
    }
    .spread-controls :global(.tone-button) {
        display: grid;
        gap: 4px;
        padding: 11px 12px;
    }
    .spread-controls :global(.tone-button span) {
        color: var(--brut-ink);
        font-size: 12px;
    }
    .spread-controls :global(.tone-button small) {
        color: var(--brut-ink-3);
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }
    .spread-controls :global(.switch-button) {
        padding: 9px 10px;
        text-align: center;
        font-size: 11px;
    }
    .spread-controls :global(.tone-button.is-active),
    .spread-controls :global(.switch-button.is-active) {
        border-color: var(--brut-accent);
        background: var(--brut-accent-soft);
        color: var(--brut-ink);
    }
    .spread-controls :global(.tone-button:focus-visible),
    .spread-controls :global(.switch-button:focus-visible) {
        outline: 2px solid var(--brut-accent);
        outline-offset: 2px;
    }
    .class-readout {
        align-self: end;
        display: grid;
        gap: 8px;
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }
    .spread-flow {
        display: grid;
        grid-template-columns: minmax(190px, 0.72fr) 110px minmax(260px, 1fr);
        gap: 16px;
        align-items: stretch;
        padding: 22px;
        min-width: 0;
    }
    .flow-card,
    .middle-preview {
        min-height: 220px;
        min-width: 0;
        display: grid;
        align-content: center;
        gap: 12px;
        padding: 18px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        box-sizing: border-box;
    }
    .flow-card {
        transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            opacity 0.22s ease,
            filter 0.22s ease;
    }
    .flow-card.raised {
        transform: translate(-2px, -2px);
    }
    .flow-card strong {
        max-width: 280px;
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 24px;
        line-height: 1.05;
        font-weight: 600;
        letter-spacing: -0.03em;
        color: var(--brut-ink);
    }
    .flow-card code {
        display: inline-block;
        width: fit-content;
        max-width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--proof-code-border, var(--brut-rule));
        background: var(--proof-code-bg, var(--brut-bg-2));
        color: var(--proof-code-ink, var(--brut-ink));
        font-size: 11px;
        overflow-wrap: anywhere;
        white-space: normal;
    }
    .node-k {
        font-size: 10.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--brut-ink-3);
    }
    .parent-node .node-k {
        color: var(--proof-card-ink);
        font-weight: 800;
        opacity: 0.86;
    }
    .flow-hop {
        display: grid;
        align-content: center;
        justify-items: center;
        gap: 12px;
        color: var(--brut-ink-3);
        text-align: center;
        font-size: 10.5px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }
    .flow-hop b {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border: 1px solid var(--brut-accent);
        background: var(--brut-accent-soft);
        color: var(--brut-accent);
        font-size: 18px;
        line-height: 1;
    }
    .middle-preview {
        align-content: stretch;
    }
    .middle-preview :global(.middle-card) {
        height: 100%;
        border-color: var(--brut-rule);
        background: color-mix(in oklab, var(--brut-bg-2) 72%, transparent);
    }
    .middle-preview :global(.middle-label) {
        color: var(--brut-ink-3);
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .middle-preview :global(.grandchild-card) {
        min-height: 146px;
    }
    .parent-owned {
        --proof-card-bg: color-mix(in oklab, #f9a8d4 54%, var(--brut-bg));
        --proof-card-border: #db2777;
        --proof-card-ink: #831843;
        --proof-card-soft: color-mix(in oklab, #f9a8d4 20%, var(--brut-bg-2));
        --proof-code-bg: color-mix(in oklab, #831843 88%, black);
        --proof-code-ink: #fff7fb;
        --proof-code-border: #f472b6;
        border-color: #db2777;
        color: var(--proof-card-ink);
        background: var(--proof-card-bg);
    }
    .tone-purple {
        --proof-card-bg: color-mix(in oklab, #c084fc 56%, var(--brut-bg));
        --proof-card-border: #9333ea;
        --proof-card-ink: #4c1d95;
        --proof-card-soft: color-mix(in oklab, #c084fc 20%, var(--brut-bg-2));
        --proof-code-bg: color-mix(in oklab, #4c1d95 90%, black);
        --proof-code-border: #a855f7;
        border-color: #9333ea;
    }
    .tone-pink {
        --proof-card-bg: color-mix(in oklab, #f9a8d4 58%, var(--brut-bg));
        --proof-card-border: #db2777;
        --proof-card-ink: #831843;
        --proof-card-soft: color-mix(in oklab, #f9a8d4 20%, var(--brut-bg-2));
        --proof-code-bg: color-mix(in oklab, #831843 88%, black);
        --proof-code-border: #f472b6;
        border-color: #db2777;
    }
    .tone-split {
        --proof-card-bg: linear-gradient(135deg, #f9a8d4 0%, #f0abfc 45%, #c084fc 100%);
        --proof-card-border: #c026d3;
        --proof-card-ink: #581c87;
        --proof-card-soft: color-mix(in oklab, #d946ef 18%, var(--brut-bg-2));
        --proof-code-bg: color-mix(in oklab, #581c87 90%, black);
        --proof-code-border: #e879f9;
        border-color: #c026d3;
    }
    .raised {
        box-shadow:
            8px 8px 0 color-mix(in oklab, var(--proof-card-border) 56%, transparent),
            0 16px 30px rgba(0, 0, 0, 0.12);
    }
    .faded {
        opacity: 0.7;
        filter: saturate(0.76);
    }
    :global(html.dark) .parent-owned {
        --proof-card-ink: #ffe4f1;
        --proof-code-bg: rgba(0, 0, 0, 0.68);
        --proof-code-ink: #fff7fb;
    }
    :global(html.dark) .raised {
        box-shadow:
            8px 8px 0 color-mix(in oklab, var(--proof-card-border) 42%, transparent),
            0 18px 34px rgba(0, 0, 0, 0.42);
    }
    .brut-demo .panel .footer {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        border-top: 1px solid var(--brut-rule);
        font-size: 11px;
        color: var(--brut-ink-2);
    }
    .brut-demo .panel .footer > div {
        padding: 8px 14px;
        border-right: 1px solid var(--brut-rule);
    }
    .brut-demo .panel .footer > div:last-child {
        border-right: 0;
    }
    .brut-demo .panel .footer .v {
        color: var(--brut-ink);
    }
    .brut-demo .panel .footer .v.accent {
        color: var(--brut-accent);
    }

    /* ── Features grid ────────────────────────────────────────────── */
    .brut-feat {
        padding: 28px 24px;
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        border-bottom: 1px solid var(--brut-rule);
    }
    .brut-feat .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0;
        border-left: 1px solid var(--brut-rule);
        border-top: 1px solid var(--brut-rule);
    }
    .brut-feat .cell {
        border-right: 1px solid var(--brut-rule);
        border-bottom: 1px solid var(--brut-rule);
        padding: 20px 22px;
        min-height: 200px;
        position: relative;
    }
    .brut-feat .cell::after {
        content: '';
        position: absolute;
        inset: 8px;
        border: 1px solid transparent;
        pointer-events: none;
        transition: border-color 0.2s;
    }
    .brut-feat .cell:hover::after {
        border-color: var(--brut-accent);
    }
    .brut-feat .cell .id {
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
    }
    .brut-feat .cell h3 {
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 22px;
        font-weight: 500;
        letter-spacing: -0.02em;
        margin: 30px 0 8px;
        color: var(--brut-ink);
    }
    .brut-feat .cell p {
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 13.5px;
        color: var(--brut-ink-2);
        line-height: 1.55;
        margin: 0;
        max-width: 320px;
    }
    .brut-feat .cell .corner {
        position: absolute;
        top: 14px;
        right: 16px;
        font-size: 10.5px;
        color: var(--brut-ink-3);
    }
    .brut-feat .cell .marker {
        width: 14px;
        height: 14px;
        border: 1px solid var(--brut-ink-3);
        position: absolute;
        bottom: 16px;
        right: 16px;
    }
    .brut-feat .cell:nth-child(3n + 1) .marker {
        background: var(--brut-accent);
        border-color: var(--brut-accent);
    }

    /* ── AI-ready docs section ────────────────────────────────────── */
    .brut-ai {
        padding: 28px 24px;
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        border-bottom: 1px solid var(--brut-rule);
    }
    .brut-ai .ai-panel {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
    }
    .brut-ai .ai-head {
        display: flex;
        align-items: center;
        gap: 0;
        border-bottom: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.14em;
        color: var(--brut-ink-3);
        text-transform: uppercase;
    }
    .brut-ai .ai-tab {
        padding: 9px 14px;
        border-right: 1px solid var(--brut-rule);
    }
    .brut-ai .ai-tab.on {
        background: var(--brut-bg);
        color: var(--brut-ink);
    }
    .brut-ai .grow {
        flex: 1;
    }
    .brut-ai .ai-meta {
        padding: 9px 14px;
        border-left: 1px solid var(--brut-rule);
    }
    .brut-ai .ai-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }
    .brut-ai .ai-cell {
        position: relative;
        padding: 20px 22px 56px;
        min-height: 200px;
        border-right: 1px solid var(--brut-rule);
        color: var(--brut-ink);
        text-decoration: none;
        transition: background-color 0.15s;
    }
    .brut-ai .ai-cell:last-child {
        border-right: 0;
    }
    .brut-ai .ai-cell:hover {
        background: color-mix(in oklab, var(--brut-accent) 6%, transparent);
    }
    .brut-ai .ai-cell-k {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }
    .brut-ai .ai-cell h3 {
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 22px;
        font-weight: 500;
        letter-spacing: -0.02em;
        margin: 22px 0 10px;
        color: var(--brut-ink);
    }
    .brut-ai .ai-cell h3 code {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        background: transparent;
        padding: 0;
        font-size: 0.85em;
        color: var(--brut-accent);
    }
    .brut-ai .ai-cell p {
        font-size: 13.5px;
        line-height: 1.55;
        color: var(--brut-ink-2);
        margin: 0;
    }
    .brut-ai .ai-cell p code {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        background: var(--brut-bg-2);
        padding: 1px 4px;
        border-radius: 2px;
        font-size: 0.92em;
    }
    .brut-ai .ai-cell-foot {
        position: absolute;
        left: 22px;
        bottom: 18px;
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        color: var(--brut-ink-3);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .brut-ai .ai-prompt {
        padding: 16px 22px;
        border-top: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 13px;
        line-height: 1.6;
        color: var(--brut-ink-2);
    }
    .brut-ai .ai-prompt-k {
        display: block;
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin-bottom: 6px;
    }
    .brut-ai .ai-prompt code {
        background: transparent;
        padding: 0;
        color: var(--brut-ink);
    }
    .brut-ai .ai-prompt em {
        color: var(--brut-accent);
        font-style: normal;
    }

    /* ── Examples grid ────────────────────────────────────────────── */
    .brut-ex {
        padding: 28px 24px;
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        border-bottom: 1px solid var(--brut-rule);
    }
    .brut-ex .lede .k {
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
    }
    .brut-ex .lede h2 {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 28px;
        color: var(--brut-ink);
        margin: 12px 0 0;
        letter-spacing: -0.02em;
        text-transform: lowercase;
        font-weight: 500;
    }
    .brut-ex .lede h2 span {
        color: var(--brut-accent);
    }
    .brut-ex .lede p {
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        color: var(--brut-ink-2);
        margin: 12px 0 0;
        font-size: 13px;
        line-height: 1.55;
        max-width: 640px;
    }
    .brut-ex .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-left: 1px solid var(--brut-rule);
        border-top: 1px solid var(--brut-rule);
    }
    .brut-ex .cell {
        display: block;
        border-right: 1px solid var(--brut-rule);
        border-bottom: 1px solid var(--brut-rule);
        padding: 20px 22px;
        min-height: 200px;
        position: relative;
        color: var(--brut-ink);
        text-decoration: none;
    }
    .brut-ex .cell::after {
        content: '';
        position: absolute;
        inset: 8px;
        border: 1px solid transparent;
        pointer-events: none;
        transition: border-color 0.2s;
    }
    .brut-ex .cell:hover::after {
        border-color: var(--brut-accent);
    }
    .brut-ex .cell .id {
        font-size: 10.5px;
        color: var(--brut-ink-3);
        letter-spacing: 0.14em;
    }
    .brut-ex .cell h3 {
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 22px;
        font-weight: 500;
        letter-spacing: -0.02em;
        margin: 30px 0 8px;
        color: var(--brut-ink);
    }
    .brut-ex .cell p {
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 13.5px;
        color: var(--brut-ink-2);
        line-height: 1.55;
        margin: 0;
        max-width: 320px;
    }
    .brut-ex .cell .corner {
        position: absolute;
        top: 14px;
        right: 16px;
        font-size: 14px;
        color: var(--brut-ink-3);
        transition: color 0.2s;
    }
    .brut-ex .cell:hover .corner {
        color: var(--brut-accent);
    }
    .brut-ex .cell .marker {
        width: 14px;
        height: 14px;
        border: 1px solid var(--brut-ink-3);
        position: absolute;
        bottom: 16px;
        right: 16px;
    }
    .brut-ex .cell:nth-child(3n + 1) .marker {
        background: var(--brut-accent);
        border-color: var(--brut-accent);
    }
    .brut-ex .ex-all {
        display: inline-block;
        margin-top: 18px;
        color: var(--brut-accent);
        text-decoration: none;
        font-size: 12px;
        letter-spacing: 0.08em;
    }
    .brut-ex .ex-all:hover {
        text-decoration: underline;
    }

    /* ── Footer big-type ──────────────────────────────────────────── */
    .brut-foot {
        padding: 60px 24px 36px;
        display: grid;
        grid-template-columns: 200px 1fr 200px;
        gap: 24px;
        border-top: 1px solid var(--brut-rule);
        align-items: end;
    }
    .brut-foot :global(.big) {
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: clamp(40px, 7vw, 96px);
        line-height: 0.9;
        letter-spacing: -0.06em;
        text-transform: lowercase;
        background: transparent;
        border: 0;
        color: var(--brut-ink);
        text-align: left;
        cursor: pointer;
        padding: 0;
        position: relative;
    }
    .brut-foot :global(.big span) {
        color: var(--brut-accent);
    }
    .brut-foot :global(.big .copy-hint) {
        display: inline-grid;
        align-items: center;
        justify-items: start;
        margin-top: 16px;
        height: 16px;
        font-size: 11px;
        letter-spacing: 0.14em;
        color: var(--brut-ink-3);
        text-transform: uppercase;
        overflow: hidden;
        min-width: 200px;
    }
    .brut-foot :global(.big .copy-hint-label) {
        grid-area: 1 / 1;
        display: inline-block;
        white-space: nowrap;
        will-change: transform, opacity;
    }
    .brut-foot :global(.big:hover .copy-hint) {
        color: var(--brut-accent);
    }
    .brut-foot .info {
        font-size: 11px;
        color: var(--brut-ink-3);
        letter-spacing: 0.12em;
        line-height: 1.8;
    }
    .brut-foot .info.right {
        text-align: right;
    }
    .brut-foot .info .v,
    .brut-foot .info a.v {
        color: var(--brut-ink);
        text-decoration: none;
        display: block;
        margin-top: 12px;
    }
    .brut-foot .info a.v:hover {
        color: var(--brut-accent);
    }

    /* ── Responsive collapse ─────────────────────────────────────── */
    @media (max-width: 1024px) {
        .brut-stats {
            grid-template-columns: repeat(3, 1fr);
        }
        .brut-stats .s:nth-child(3n) {
            border-right: 0;
        }
        .brut-stats .s:nth-child(-n + 3) {
            border-bottom: 1px solid var(--brut-rule);
        }
        .brut-feat .grid,
        .brut-ex .grid {
            grid-template-columns: repeat(2, 1fr);
        }
        .brut-ai .ai-grid {
            grid-template-columns: 1fr;
        }
        .spread-stage {
            grid-template-columns: 1fr;
        }
        .spread-controls {
            border-right: 0;
            border-bottom: 1px solid var(--brut-rule);
        }
        .spread-flow {
            grid-template-columns: 1fr;
        }
        .flow-hop {
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            justify-items: center;
        }
        .flow-hop b {
            transform: rotate(90deg);
        }
        .brut-ai .ai-cell {
            border-right: 0;
            border-bottom: 1px solid var(--brut-rule);
        }
        .brut-ai .ai-cell:last-child {
            border-bottom: 0;
        }
        .brut-ex,
        .brut-ai {
            grid-template-columns: 1fr;
        }
    }
    @media (max-width: 720px) {
        .brut-coord {
            display: none;
        }
        .brut-hero,
        .brut-demo,
        .brut-feat,
        .brut-ai,
        .brut-ex {
            grid-template-columns: 1fr;
            padding-left: 16px;
            padding-right: 16px;
        }
        .brut-hero {
            padding-top: 56px;
        }
        .brut-stats {
            grid-template-columns: repeat(2, 1fr);
        }
        .brut-stats .s {
            min-height: 130px;
            padding: 20px 16px;
        }
        .brut-stats .s .v {
            font-size: 44px;
        }
        .brut-stats .s:nth-child(2n) {
            border-right: 0;
        }
        .brut-stats .s:not(:nth-last-child(-n + 2)) {
            border-bottom: 1px solid var(--brut-rule);
        }
        .brut-demo .panel .bar {
            gap: 10px;
        }
        .spread-stage {
            min-height: auto;
        }
        .spread-controls,
        .spread-flow {
            padding: 14px;
        }
        .switch-row {
            grid-template-columns: 1fr;
        }
        .flow-card,
        .middle-preview {
            min-height: 180px;
        }
        .brut-feat .grid,
        .brut-ex .grid {
            grid-template-columns: 1fr;
        }
        .brut-foot {
            grid-template-columns: 1fr;
            padding: 40px 16px 28px;
        }
        .brut-foot .info.right {
            text-align: left;
        }
    }
</style>
