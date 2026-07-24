# Plan 001: Adopt docs-kit 2026.7.6 features for parity with sibling repos

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row in
> `.agents/.plans/docs-kit-parity/README.md` — unless a reviewer dispatched
> you and told you they maintain the index.
>
> **Drift check (run first)**: confirm `docs/package.json` pins
> `"@humanspeak/docs-kit": "github:humanspeak/docs-kit#2026.7.6"` and
> `git merge-base --is-ancestor daeb304 HEAD` succeeds.

## Status

- **Priority**: P2
- **Effort**: S/M
- **Risk**: LOW
- **Depends on**: none (docs-kit already bumped to 2026.7.6 at commit `6c77914`)
- **Category**: dx / docs
- **Planned at**: commit `daeb304` (branch `chore/package-updates`), 2026-07-23

> Revision 2026-07-23 (post-execution): Step 1 (exampleMirrorsPlugin) hit its
> STOP condition and is DEFERRED, not done. The plugin hard-requires the
> `const sections: ExampleSection[]` + `{#each}` page structure and per-slug
> demo folders (`src/lib/examples/<slug>/demos/`) that svelte-markdown and
> svelte-motion use; our example pages use inline `<ExampleV2 …/>` props and a
> shared `scoped-props/demos/` folder, so the plugin's parser throws
> (`Could not find const sections array`). Adopting it means restructuring
> all 8 example routes to the sections pattern — a real migration, written up
> as plan 002 in this batch. The plan's docs-check baseline (7/6) also
> undercounted pre-existing errors: true pre-change baseline is 10 errors /
> 6 warnings (paraglide's absence cascades 4 errors, not 2, plus an
> independent posthog env-typing error). Steps 2-5 completed and verified.

## Why this matters

The docs-kit `2026.6.9 → 2026.7.6` bump (18 commits) landed passively — the
package is updated but none of its new opt-in features are wired. Sibling
repos (svelte-markdown is the flagship) already adopted them, so this docs
site is behind the org baseline on: LLM-readable example mirrors, IndexNow
search pings, and the PagerV2 navigation component. Parity keeps every
`*.svelte.page` docs site behaving identically and keeps org-wide docs-kit
upgrades mechanical.

## The delta, triaged (verified via `gh api repos/humanspeak/docs-kit/compare/2026.6.9...2026.7.6`)

**Adopt (explicit wiring needed):**

1. `exampleMirrorsPlugin` — scans `src/routes/examples/**`, emits LLM-readable
   markdown mirrors of example pages including demo source (follow-up fixes in
   the delta made it discover routes without an index array and mirror demo
   code through wrapper calls/imports). svelte-markdown wires it as:

   ```ts
   exampleMirrorsPlugin({
       siteUrl: 'https://markdown.svelte.page',
       sourceBaseUrl: 'https://github.com/humanspeak/svelte-markdown/blob/main/docs'
   })
   ```

2. `indexNowPlugin` — pings search engines with changed URLs at production
   build. svelte-markdown wires it with a site-specific key (IndexNow keys are
   public by design — the protocol serves the key at `/<key>.txt`):

   ```ts
   indexNowPlugin({
       siteUrl: docsConfig.url,
       key: indexNowKey,
       productionMode: 'indexnow',
       // best-effort ping; a rejected submission must not fail the deploy
       failOnError: false
   })
   ```

   Generated key for THIS site (fresh UUID, not copied from a sibling):
   `34c0a202-56db-44a1-8776-146bc8ff8e99`.

3. `PagerV2` — brutalist prev/next pager component (`@humanspeak/docs-kit`
   export). svelte-motion wraps it as
   `docs/src/lib/components/general/ExamplePager.svelte`; read that wrapper via
   `gh api repos/humanspeak/svelte-motion/contents/docs/src/lib/components/general/ExamplePager.svelte --jq .content | base64 -d`
   and mirror its approach for our docs and examples navigation.

**Verify-only (behavior arrives automatically with the bump):**

4. Context-driven page h1 (`SeoH1` rendered by docs-kit's `RootLayout` from
   the seo context) — our pages already set the seo context. VERIFY no page
   now renders a double h1 (docs-kit's + a hand-written one); dedupe if so.
5. `feat(examples): include local demo component code` — CodeReference may now
   auto-include locally imported demo components. INVESTIGATE whether our
   hand-maintained `demoCodeDependencies` map in
   `docs/src/lib/demo-code-samples.ts` is now redundant; if the generated
   panels show dependency code without the map, simplify (separate small
   commit) — if unsure, leave and report.
6. llms.txt `:` separator, header compact-brand fixes, pager hover-scale fix —
   automatic; no action.

**Not applicable (record, don't adopt):**

7. `hideNpm` / `hideLogo` header config — for sites without an npm package or
   brand logo (used by redactsensitiveinfo-com). This repo publishes an npm
   package and shows its logo. No action.
8. Ecosystem README updater — ALREADY adopted org-wide:
   `.github/workflows/npm-publish.yml:487-499` fetches
   `update-ecosystem-readme.mjs` from docs-kit main at publish time. Verify the
   fetch URL still matches docs-kit main; no other action.

## Current state

- `docs/vite.config.ts` — imports from `@humanspeak/docs-kit/vite`:
  `demoManifestPlugin, docMirrorsPlugin, llmsFullPlugin, llmsPlugin,
  sitemapManifestPlugin, socialCardsPlugin` (lines 2-8). NOT imported:
  `exampleMirrorsPlugin`, `indexNowPlugin` (both exported by the installed
  version — verified). Plugin registration order is commented and deliberate;
  register `exampleMirrorsPlugin` after `docMirrorsPlugin` (mirror writers
  before llms readers) and `indexNowPlugin` last, matching svelte-markdown.
- `docs/src/lib/docs-config.ts` — site config incl. `docsConfig.url`.
- Examples routes: `docs/src/routes/examples/<slug>/{+page.svelte,+page.ts}`
  ×8 including `compound-selector`; index cards hardcoded in
  `examples/+page.svelte` (`exampleCases` array — the delta's "discover from
  route folder when index array is absent" fix matters here since we have no
  `examples/+page.ts` catalog object).
- No pager component anywhere in `docs/src` today.
- Conventions: heavily-commented vite config (match the existing comment
  style when adding plugins — each plugin gets a "what/why" comment), 4-space
  indent, no semicolons, single quotes.

## Commands you will need

| Purpose | Command | Expected |
| --- | --- | --- |
| Install | `pnpm install` (root) | exit 0 |
| Build library dist | `pnpm run build` (root) | exit 0 |
| Docs typecheck | `pnpm --filter docs check` | baseline as of `daeb304`: 7 errors / 6 warnings, all pre-existing (paraglide ×2, vite.config overload, motion tabs ×3, SsrLiteral); no NEW problems |
| Docs lint | `trunk check <changed files>` | no new issues |
| Mirror plugins smoke test | invoke each plugin's `buildStart` from `docs/` (pattern below) | mirror files appear under `docs/static/` |
| Root gate untouched | `pnpm run check` | exit 0 |

buildStart invocation pattern (run from `docs/`; this is how the site's other
generated artifacts are refreshed outside `vite build`, which is avoided
because it fetches GitHub stats over the network):

```sh
node --input-type=module -e "
import { exampleMirrorsPlugin } from '@humanspeak/docs-kit/vite'
const p = exampleMirrorsPlugin({ siteUrl: '<url>', sourceBaseUrl: '<gh-base>' })
const hook = typeof p.buildStart === 'function' ? p.buildStart : p.buildStart?.handler
await hook.call({ warn: console.warn }, {})
"
```

## Scope

**In scope**: `docs/vite.config.ts`; `docs/src/lib/docs-config.ts` (only if
the IndexNow key belongs there per svelte-markdown's pattern — it inlines the
key in vite.config.ts; match that); new pager wrapper component under
`docs/src/lib/components/`; the docs/examples layout or pages that mount the
pager; `docs/src/lib/demo-code-samples.ts` (only under item 5's conditions);
generated mirror files under `docs/static/` if the repo tracks them (check
`.gitignore` first — commit only what siblings commit).

**Out of scope**: root `src/`, `tests/`; `.github/workflows/` (updater already
wired); `hideNpm`/`hideLogo`; any docs-kit source changes; sitemap
`extraPages` (svelte-markdown-specific, not part of this delta).

## Git workflow

- Branch off `chore/package-updates` (or wherever the operator directs):
  `advisor/docs-kit-parity-001`.
- Conventional commits, one per feature cluster: `feat(docs): add example
  markdown mirrors`, `feat(docs): add IndexNow build plugin`, `feat(docs): add
  PagerV2 navigation`, plus `chore(docs): …` for verify-only follow-ups.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

(No red-first test: this is opt-in feature wiring in the docs site with no
library runtime surface; each step's verification is the feature's observable
output. Justification per the improve-skill exemption.)

### Step 1: exampleMirrorsPlugin

Import and register after `docMirrorsPlugin` with `siteUrl: docsConfig.url`
and `sourceBaseUrl: 'https://github.com/humanspeak/svelte-scoped-props/blob/main/docs'`.
Add a what/why comment matching the file's style.

**Verify**: buildStart smoke test → markdown mirrors for the example routes
(including `compound-selector`) appear (inspect the plugin's output directory
— check where svelte-markdown's mirrors land, likely `docs/static/examples/`);
each mirror contains the demo source. `pnpm --filter docs check` → no new
problems.

### Step 2: indexNowPlugin

Register last with the key above, `productionMode: 'indexnow'`,
`failOnError: false`, and svelte-markdown's cautionary comment. Confirm the
plugin emits/serves the key file (svelte-markdown pattern: key served at
`/<key>.txt` — verify how the plugin handles this; if it requires a static
key file, create it where the plugin expects).

**Verify**: dev-mode buildStart is a no-op or logs skip (productionMode
gating); `pnpm --filter docs check` → no new problems.

### Step 3: PagerV2

Read svelte-motion's `ExamplePager.svelte` wrapper (command in the delta
section). Create the equivalent wrapper and mount it where svelte-motion does
(their examples pages/layout — check with
`gh api "search/code?q=repo:humanspeak/svelte-motion+ExamplePager" --jq '[.items[].path]'`).
Wire prev/next ordering from the `exampleCases` array (our only example
registry).

**Verify**: `pnpm --filter docs check` → no new problems; pager renders in
`pnpm --filter docs dev` (manual spot check acceptable; note it in the
report).

### Step 4: Verify-only items

1. Grep docs pages for hand-rendered `<h1`/page titles that would now double
   with the context-driven h1; list findings, dedupe only obvious cases.
2. Item 5 investigation (`demoCodeDependencies` redundancy) — evidence-based
   conclusion in the report; simplify only if the generated output proves it.
3. Confirm `.github/workflows/npm-publish.yml` updater URL still resolves
   (`curl -sI` the raw URL → 200).

### Step 5: Full gate

`pnpm --filter docs check` → counts ≤ 7/6 with no new items; `pnpm run check`
(root) → exit 0; `trunk fmt` + `trunk check` changed files; `git status`
scope-clean.

## Done criteria

- [ ] `exampleMirrorsPlugin` and `indexNowPlugin` registered and smoke-tested;
      mirrors exist for all 8 example routes
- [ ] IndexNow key file/route in place; key recorded in this plan's batch README row
- [ ] PagerV2 mounted on example pages via wrapper matching svelte-motion's
- [ ] Verify-only findings reported (double-h1 audit, demoCodeDependencies
      verdict, updater URL check)
- [ ] `pnpm --filter docs check` no new problems vs 7 errors / 6 warnings
- [ ] `pnpm run check` (root) exit 0; trunk clean; scope clean
- [ ] Batch README status row updated

## STOP conditions

- `exampleMirrorsPlugin` cannot discover our examples (no catalog object AND
  the route-folder fallback doesn't fire) — report the plugin's actual
  discovery behavior; do not restructure the examples routes to force it.
- The IndexNow plugin requires configuration docs-kit doesn't document and
  svelte-markdown's usage doesn't reveal — report rather than guess.
- PagerV2's expected props don't match what our example registry can supply.
- Any generated mirror includes content from outside `docs/` or leaks
  something that looks secret (report immediately; nothing here should).
- Docs check shows any NEW error/warning.

## Maintenance notes

- IndexNow keys are public by protocol design, but this key is THIS site's —
  don't copy it to other repos; generate fresh ones there.
- When the next docs-kit tag lands, repeat this triage: compare tags, split
  adopt/verify/N-A, check svelte-markdown first as the reference consumer.
- If `demoCodeDependencies` is retired (item 5), plan 003 of the
  compound-selector-pruning batch documented its registration step — the
  batch README there should get a note.
