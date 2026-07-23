# Plan 003: Document the structural marker behavior and add a compound-selector example

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `.agents/.plans/compound-selector-pruning/README.md` — unless a reviewer
> dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: confirm you are on a branch whose history
> contains `9e266e5` (`git merge-base --is-ancestor 9e266e5 HEAD && echo ok`).
> This plan documents behavior that lands in plans 001+002; without them the
> example page will emit unused-CSS warnings and the docs would be wrong.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 002-structural-marker-synthesis.md (DONE at `9e266e5`)
- **Category**: docs
- **Planned at**: commit `9e266e5` (branch `advisor/002-structural-marker-synthesis`), 2026-07-23

> Revision 2026-07-23 (post-execution): two planning assumptions were wrong
> about reality, surfaced during execution and accepted by guard as plan
> defects, not executor drift. (1) The done criterion `pnpm --filter docs lint
> exits 0` was unachievable before any work started: the docs lint gate is
> pre-existingly red (prettier flags two untouched generated/vendored files and
> short-circuits before eslint; eslint separately reports 19 pre-existing
> `prefer-const` errors from the scoped-props processor on `let x = $derived()`
> across every sibling demo). Criterion replaced by: prettier-clean on changed
> files, `trunk check` clean, and no new problems beyond the sibling-shared
> `prefer-const` pattern on the exemplar-copied demo. (2)
> `examples-catalog:sync` no longer regenerates anything — the catalog object
> it scans for was refactored out of `examples/+page.ts`; the hardcoded
> `exampleCases` array in `+page.svelte` is the only registry. Both recorded as
> follow-up findings in the batch README.

## Why this matters

Plans 001+002 changed what the preprocessor supports: compound selectors
(`.page-rows.paged`), descendant/child/sibling combinators (`.a .b`, `.a > .b`,
`span.a + button.b`), and element-qualified selectors (`button.foo`) of scoped
classes now survive Svelte's unused-CSS pruning. The docs still describe the old
flat single-div marker and hedge that only "normal class selectors" work; the
skip list (what still falls back and can be pruned) exists only in internal plan
notes, and there is a new consumer-visible tradeoff (a `scoped:` component's
style block is effectively exempt from unused-CSS pruning for class rules) that
nobody should discover by surprise. The first field adopter burned time on
exactly this kind of undocumented edge — the docs are how the next one doesn't.

## Current state

The docs site is the `docs/` pnpm workspace package (SvelteKit + mdsvex,
deployed to scoped.svelte.page). It consumes the library as
`"@humanspeak/svelte-scoped-props": "workspace:*"`, so demo pages exercise the
locally built `dist/`. Its `svelte.config.js` registers the preprocessor with
`runtimeModule: '@humanspeak/svelte-scoped-props/runtime'` (do not change that —
see Out of scope).

Files this plan touches:

- `docs/src/routes/docs/limits/+page.svx` — the Limits page. Two sections are
  stale (quoted as they exist today):

  "## Marker snippet" (lines 53-64):

  > By default, the transform adds an uncalled snippet marker so Svelte keeps
  > the parent CSS selector alive during CSS analysis. The marker does not
  > render, but it can leave a small unused function in compiled output.

  "## CSS scanning" (lines 66-69):

  > The alpha scanner is intentionally small. It handles normal class
  > selectors, but it is not a full CSS parser. Escaped or highly unusual
  > selector forms may need more work.

- `docs/src/routes/docs/design-notes/+page.svx` — "CSS pruning is the userland
  tax" section (lines 140-180) shows the old flat marker:

  ```svelte
  {#snippet __svelte_scoped_props_marker()}
      <div class="parent-owned"></div>
  {/snippet}
  ```

- `README.md` — "Current Limits" bullet: "It preserves scoped CSS selectors by
  injecting an uncalled snippet marker…" (still true; extend, don't rewrite).

- `docs/src/routes/examples/+page.svelte` — the examples index; example cards
  come from a hardcoded `exampleCases` array of `{ href, slug, title, description }`.

- Example page pipeline (model everything on the `dynamic-class-value` example):
  - Route pair: `docs/src/routes/examples/dynamic-class-value/+page.svelte` and
    `+page.ts` (the `+page.ts` exports a `load` returning `{ title, description }`).
  - Demo component: `docs/src/lib/examples/scoped-props/demos/DynamicClassValue.svelte`
    (uses `<ChildCard scoped:class={...} />` from `./components/ChildCard.svelte`,
    a `<style>` block with the parent-owned classes, and the repo's
    `comparison-grid` markup conventions).
  - Code-sample registry: `docs/src/lib/demo-code-samples.ts` — the
    `demoCodeDependencies` map lists each demo's dependency files; the
    `DemoCodeLoaderKey` type comes from `$lib/demo-loaders` (glob-based; a new
    demo file under `scoped-props/demos/` should join the key union
    automatically — verify, and STOP if it does not).
  - Catalog sync: `pnpm --filter docs examples-catalog:sync` regenerates the
    examples catalog from the `+page.ts` files. Run it after adding the route
    and include whatever file(s) it regenerates in the change.
  - The `+page.svelte` uses `ExampleV2`/`CodeReferenceV2` from
    `@humanspeak/docs-kit`, sets breadcrumb + SEO context — copy the
    dynamic-class-value page's structure wholesale and adjust content.

Behavior facts to document (verified in plans 001/002 — restate these, do not
re-derive):

- The marker is now generated from the component's own selectors: per-selector
  element chains (real tags, nesting for descendant/child, adjacent siblings
  for `+`/`~`, pseudos stripped, final void elements self-closing) plus a
  flat all-classes fallback div.
- Supported and kept alive: compound classes on one element, descendant/child/
  sibling combinators, element-qualified compounds including custom elements.
- Still skipped (chain not synthesized; only the fallback div defends them, so
  structural forms of these can still be pruned): selectors containing
  attribute selectors, `:global` compounds mixed into a chain, `:has()` and
  other functional/positional pseudo-class *matching* (pseudos are stripped,
  not matched), type selectors in {html, body, head, title, meta, link,
  script, style, slot}, and void elements in non-final position.
- New tradeoff: a component using `scoped:` effectively opts its `<style>`
  block out of unused-CSS pruning for class-based rules — genuinely dead CSS
  there will no longer be flagged by svelte-check.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Install | `pnpm install --frozen-lockfile` (repo root) | exit 0 |
| Build library dist (docs consume it) | `pnpm run build` (repo root) | exit 0 |
| Docs typecheck + unused-CSS warnings | `pnpm --filter docs check` | see Step 4 — compare against baseline |
| Docs lint (includes the scoped-props ESLint processor) | `pnpm --filter docs lint` | exit 0 |
| Catalog sync | `pnpm --filter docs examples-catalog:sync` | exit 0; regenerated file(s) staged |
| Library gate untouched | `pnpm run check` (repo root) | exit 0 |
| Format/lint changed files | `trunk fmt <files>` then `trunk check <files>` | no new issues |

Do NOT run `pnpm --filter docs build` — it fetches GitHub stats over the
network and is not needed for verification.

## Scope

**In scope** (the only files you should create/modify):

- `docs/src/routes/docs/limits/+page.svx`
- `docs/src/routes/docs/design-notes/+page.svx`
- `README.md` (one bullet extended)
- `docs/src/routes/examples/+page.svelte` (one entry added to `exampleCases`)
- `docs/src/routes/examples/compound-selector/+page.svelte` (create)
- `docs/src/routes/examples/compound-selector/+page.ts` (create)
- `docs/src/lib/examples/scoped-props/demos/CompoundSelector.svelte` (create)
- `docs/src/lib/demo-code-samples.ts` (register the new demo's dependencies)
- Whatever `examples-catalog:sync` regenerates

**Out of scope** (do NOT touch):

- `src/`, `tests/`, `e2e/` — the library is done and gated; this plan is docs.
- `docs/svelte.config.js`, `DEFAULT_RUNTIME_MODULE`, and the
  `svelte-scoped-props` vs `@humanspeak/svelte-scoped-props` naming
  inconsistency in README's install section — that is a coupled code+docs fix
  (the code default must change with the docs) and belongs to a future plan.
  Leave the install section's package name exactly as it is, even though it
  looks wrong next to your changes.
- `docs/src/routes/docs/syntax/+page.svx`, `api-reference`, and other docs
  pages not listed.

## Git workflow

- Branch `advisor/003-docs-and-example` off `advisor/002-structural-marker-synthesis`.
- Conventional commits (`docs: …` for the doc pages, may be one commit or
  docs+example split — reviewer commits if guard-dispatched).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Capture the warning baseline

Run `pnpm run build` (root) then `pnpm --filter docs check` and save the full
output. Record the count of `Unused CSS selector` warnings and total
errors/warnings. This is the baseline Step 4 compares against.

**Verify**: command completes; baseline recorded in your notes.

### Step 2: Update the three doc surfaces

1. `limits/+page.svx` — rewrite "Marker snippet" to describe the structural
   marker (chains derived from the component's selectors + fallback div), and
   replace "CSS scanning" with an honest support matrix: what is kept alive
   (compounds, descendant/child/sibling, element-qualified incl. custom
   elements, final void elements) and what is skipped (the skip list from
   Current state). Add a new subsection for the pruning-opt-out tradeoff, in
   the page's existing plain tone.
2. `design-notes/+page.svx` — in "CSS pruning is the userland tax", keep the
   narrative and the "implementation scar" framing, but update the marker
   example to a structural one, e.g. for `.parent-owned.dimmed { … }` show:

   ```svelte
   {#snippet __svelte_scoped_props_marker()}<div class="parent-owned dimmed"></div><div
           class="parent-owned dimmed"
       ></div>{/snippet}
   ```

   or simply show a chain example (`.a .b` → nested divs) — one accurate
   example beats exhaustiveness; note the marker is derived per selector.
3. `README.md` — extend the marker bullet in "Current Limits" with one
   sentence: the marker is synthesized from the component's selectors so
   compound/combinator/element-qualified selectors survive pruning; attribute
   selectors and `:has()` still are not matched.

**Verify**: `pnpm --filter docs check` — no new errors vs baseline.

### Step 3: Add the compound-selector example

Model every file on the `dynamic-class-value` example (same structure, SEO
context shape, breadcrumbs, `ExampleV2`/`CodeReferenceV2` usage):

1. `CompoundSelector.svelte` demo: a toggle (`paged`-style boolean state), a
   `<ChildCard scoped:class={['page-rows', { paged }]} />`, and a style block
   exercising the fixed behavior — at minimum a compound rule
   (`.page-rows.paged { … }`) and one combinator rule (e.g.
   `.page-rows > .child-slot { … }` or similar that actually matches the demo
   DOM). Reuse `./components/ChildCard.svelte`. Keep visual conventions
   (`comparison-grid`, `example-label`) from the exemplar.
2. Route pair `compound-selector/+page.svelte` + `+page.ts` with title
   "Compound selectors" and a one-line description referencing the field
   pattern (a conditionally-added class gating a rule on the same element).
3. Register dependencies in `demoCodeSamples`' `demoCodeDependencies` map
   (`'scoped-props/demos/CompoundSelector.svelte': ['scoped-props/demos/components/ChildCard.svelte']`).
4. Add the `exampleCases` entry in `examples/+page.svelte`.
5. Run `pnpm --filter docs examples-catalog:sync`; include regenerated output.

**Verify**: `pnpm --filter docs check` → no NEW `Unused CSS selector` warnings
vs the Step 1 baseline (in particular, none pointing at the new demo — this is
the machine-checkable proof the example exercises the fixed pruning behavior),
and no new errors.

### Step 4: Full gate

**Verify**:

- `pnpm --filter docs check` → error/warning counts ≤ baseline; zero warnings
  referencing `CompoundSelector` or `compound-selector`
- `pnpm --filter docs lint` → exit 0 (this runs the scoped-props ESLint
  processor over the new demo — a second independent check of the directive)
- `pnpm run check` (root) → exit 0 (library untouched; proves it)
- `trunk fmt` then `trunk check` on all changed files → no new issues
- `git status --short` → only in-scope files

## Test plan

No red-first test: this plan has no library runtime surface (docs prose plus a
net-new example page). The behavior it documents is already pinned by the unit
tests from plans 001/002. The example page's correctness is machine-checked via
`pnpm --filter docs check` showing zero unused-CSS warnings for the new demo —
which would have been non-zero before plans 001/002, so the example doubles as
a living regression fixture.

## Done criteria

- [ ] `pnpm --filter docs check` — no new errors/warnings vs the recorded
      baseline; zero mention of the new example files
- [ ] `pnpm --filter docs lint` exits 0
- [ ] `pnpm run check` (root) exits 0
- [ ] `grep -n "normal class selectors" docs/src/routes/docs/limits/+page.svx`
      returns no matches (the stale hedge is gone)
- [ ] Limits page names the skip list (grep for `attribute selectors` and
      `:has` in the file — both present)
- [ ] `/examples/compound-selector` route exists with `+page.svelte` + `+page.ts`,
      is listed in `exampleCases`, and the catalog sync output is committed
- [ ] `git status` shows no files outside the in-scope list
- [ ] Status row updated in `.agents/.plans/compound-selector-pruning/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- `9e266e5` is not an ancestor of your branch (you'd be documenting behavior
  that isn't there).
- The Step 1 baseline shows `pnpm --filter docs check` failing outright before
  any change — the docs workspace has a pre-existing break this plan must not
  paper over.
- The new demo produces an `Unused CSS selector` warning for its compound or
  combinator rules — that would mean the library behavior doesn't match plans
  001/002 in the docs context; report, don't tweak the CSS to dodge it.
- `DemoCodeLoaderKey` does not automatically include the new demo file (the
  loader is not glob-based as assumed) — report what `$lib/demo-loaders`
  actually requires.
- `examples-catalog:sync` regenerates files outside `docs/` or produces a diff
  touching unrelated examples.

## Maintenance notes

- When the `runtimeModule`/package-naming fix lands (future plan), README's
  install section and the Limits page may both need a touch — coordinate.
- If a future plan adds `:has()` or attribute-selector support, the Limits
  support matrix and this example page are the two places to update.
- The example intentionally mirrors the first field report; if the demo CSS is
  ever refactored, keep at least one compound rule on a conditionally-toggled
  class — that is the regression the page exists to demonstrate.
