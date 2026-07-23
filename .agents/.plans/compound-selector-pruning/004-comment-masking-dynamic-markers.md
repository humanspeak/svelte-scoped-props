# Plan 004: Mask CSS comments and render marker nodes as svelte:element

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `.agents/.plans/compound-selector-pruning/README.md` — unless a reviewer
> dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git merge-base --is-ancestor c136853 HEAD && echo ok`
> (plan 003's tip on the PR branch). Then confirm `src/index.ts` contains
> `readMarkerChains`, `renderMarkerNode`, `VOID_TYPES`, `UNSYNTHESIZABLE_TYPES`.

## Status

- **Priority**: P1 (PR #12 is open; these are do-not-ship findings from its adversarial review)
- **Effort**: M
- **Risk**: MED
- **Depends on**: 002 (DONE), 003 (DONE) — both in the branch history
- **Category**: bug
- **Planned at**: commit `c136853` (branch `feat/compound-selector-pruning`), 2026-07-23

## Why this matters

Adversarial review of PR #12 found two shipping blockers in the structural
marker, and guard's follow-up probe found a third in the same family:

1. **Leading CSS comments disable chain synthesis.** Rule preludes retain
   comment text (`mapCssPreludes` skips comments for state, not content), so
   `/* explanation */ .a .b { … }` starts parsing at `/`, the whole selector is
   skipped, and only the flat fallback defends it → Svelte prunes the rule.
   Comments before selectors are routine; this silently defeats the feature.
2. **Typed marker nodes leak a11y warnings.** `<a class="foo"></a>`,
   `<img class="foo" />`, `<label class="foo"></label>`, `<button …>` in the
   marker emit `a11y_missing_attribute`, `a11y_label_has_associated_control`,
   `a11y_consider_explicit_label`, … even though the snippet never renders.
   Consumers who fail builds on warnings break by adopting valid selectors.
   The existing typed-selector tests hide this via `warningFilter: () => false`.
3. **Content-model-violating chains are hard compile errors.** `p.a p.b`
   synthesizes `<p><p></p></p>` → `element_invalid_closing_tag_autoclosed`;
   `a.x a.y` → `node_invalid_placement`. Same hazard class as the final-void
   bug fixed at `53660ce`.

## Verified at plan time (all on the current branch's dist, Svelte 5.56)

- Repro 1: `<style>/* explanation */ .a .b { color: red; }</style>` with two
  scoped children → marker is only `<div class="a b"></div>`, compiled CSS
  contains `/* (unused) .a.a .b.b { color: red; }*/`.
- Repro 2: `a.foo` + `img.foo` + `label.foo` in one component → compile
  warnings `a11y_consider_explicit_label, a11y_missing_attribute,
  a11y_missing_attribute, a11y_label_has_associated_control`.
- Repro 3: hand-built `<p class="a"><p class="b"></p></p>` marker → compile
  ERROR `element_invalid_closing_tag_autoclosed`; nested `<a>` →
  `node_invalid_placement`.
- **The fix design, verified end-to-end**: a marker built from
  `<svelte:element this={'x'} class="…">` nodes (nested pair, classes `a`/`b`)
  compiles with ZERO warnings besides legitimate `css_unused_selector`s, no
  content-model errors, and Svelte's pruner treats the dynamic element as
  matching ANY type selector — it KEPT `p.a p.b`, `a.a a.b`, `button.a`, and
  `img.b` (each emitted with the scope hash). Attribute selectors stayed
  pruned (unchanged limitation). This single change removes the need for
  `VOID_TYPES` rendering rules, `UNSYNTHESIZABLE_TYPES` skips, and any
  `svelte-ignore` comments.

## Design

**Part A — comment masking.** Add a length-preserving comment blanker and
apply it wherever preludes are consumed:

```ts
function stripCssComments(text: string): string {
    return text.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, (match) => ' '.repeat(match.length))
}
```

Apply in `readMarkerChains`, `readCssClassNames`, and `boostSelectorPrelude`
(compose with the existing `stripQuotedSections` on the scannable copy — e.g.
`stripCssComments(stripQuotedSections(prelude))`; for `readMarkerChains`,
strip comments from the prelude before `splitTopLevelSelectors` so compounds
never contain comment text). Boost note: masking comments in `scannable` also
stops class-like tokens inside comments from being doubled or collected —
that is a correctness improvement, not a regression.

**Part B — dynamic marker nodes.** In the marker snippet, render every
synthesized node — chain nodes AND the all-classes fallback — as
`<svelte:element this={'x'} class="…">…</svelte:element>` instead of typed/div
elements. Consequences, all intentional:

- `renderMarkerNode` no longer needs the tag: emit
  `<svelte:element this={'x'}${classAttribute}>${children}</svelte:element>`.
  The void self-closing branch is deleted.
- `parseSelectorCompound` no longer needs to capture the type for rendering,
  but MUST still parse/skip it correctly for tokenization. The
  `UNSYNTHESIZABLE_TYPES` and `VOID_TYPES` skip rules are deleted (the sets and
  their checks go away) — a dynamic element has no content-model or void
  constraints, and the pruner matches it against any type selector.
- The single-compound drop rule changes meaning: since the fallback is now a
  `svelte:element` carrying every class, it alone defends ALL single-compound
  selectors (typed or not) — so drop every single-compound chain, not just
  bare-div ones. Chains are only needed for selectors with combinators.
- Because all chain nodes are type-agnostic, previously distinct chains
  (`.a .b` vs `p.a p.b`) now dedupe into one — expected, assert it.
- `MarkerNode.tag` becomes dead — remove the field.

Selectors containing attribute selectors or `:global` are still skipped
(unchanged). Pseudo stripping unchanged. Sibling `+`/`~` structure unchanged.

**Docs impact (same commit series):** `docs/src/routes/docs/limits/+page.svx`
"Selector support" — the kept-alive list gains "any element-qualified selector
(the marker element is dynamically typed)" and loses the final-void bullet as a
special case; the skip list DROPS the reserved-tag and non-final-void bullets
(both now defended) and keeps attribute selectors / `:global` / functional
pseudo matching. "Marker snippet" section: nodes are `svelte:element`.
`design-notes/+page.svx`: update the marker example to the `svelte:element`
form. README bullet: drop the `:has()`/attribute caveat only if you also drop
it in limits — keep the two consistent (attribute and `:has()` are still not
matched — keep the caveat, just make the wording match the new mechanism).

## Current state

`src/index.ts` (locate by symbol; the branch is `feat/compound-selector-pruning`):
`addCssMarkerSnippet` composes `readMarkerChains` + fallback div;
`readMarkerChains` walks preludes via `mapCssPreludes`;
`splitTopLevelSelectors` / `splitSelectorCompounds` / `parseSelectorCompound`
(returns `{ type, classes }`, rejects `[`/`:global`, strips pseudos) /
`synthesizeSelectorChain` (skip sets, tree build, single-bare-div drop) /
`renderMarkerNode` (void self-closing branch). `stripQuotedSections` and
`mapCssPreludes` are the shared helpers. Tests in `tests/transform.test.ts`:
25 passing; several assert literal marker shapes that WILL change:

- plan 001's "collects every class of a compound selector onto the marker"
  asserts `<div class="page-rows paged"></div>` — becomes the svelte:element
  fallback shape.
- 002's structural test asserts compiled CSS (unchanged); its edge tests
  assert `<div class="a"><div class="b"></div></div>`, `<my-widget class="a">`,
  no-`<input`; 004's shapes replace them (see Steps).
- final-void tests assert `<input class="a" />` self-closing — superseded
  entirely by dynamic nodes; rewrite to compile-level assertions.

Repo conventions: 4-space indent, no semicolons, single quotes, module-level
`function` declarations. Trunk for format/lint. Verification gates as in
plans 001-003 (`pnpm run test:unit`, `pnpm run check`, `trunk fmt`/`check`).

## Scope

**In scope**: `src/index.ts`, `tests/transform.test.ts`,
`docs/src/routes/docs/limits/+page.svx`,
`docs/src/routes/docs/design-notes/+page.svx`, `README.md` (one bullet),
`docs/src/lib/examples/scoped-props/demos/CompoundSelector.svelte` (ONLY if
its rules are affected — they should not be).

**Out of scope**: `src/runtime.ts`, `src/hash.ts`, `docs/svelte.config.js`,
the example route files, everything else.

## Steps

### Step 1 (RED — stop for reviewer checkpoint after this step)

Add to `tests/transform.test.ts` (full-pipeline pattern, but WITHOUT
`warningFilter` suppression where warnings are the assertion):

1. `keeps combinator selectors behind leading CSS comments`: source with two
   scoped children (classes `a`, `b`) and CSS
   `/* explanation */ .a .b { color: red; }` → assert compiled CSS contains
   `.a.a .b.b` and not `(unused)`. FAILS now (rule pruned).
2. `compiles typed markers without accessibility warnings`: source with CSS
   `a.foo{color:red}img.foo{width:1px}label.foo{color:blue}` and a scoped
   child with class `foo` → compile WITHOUT warningFilter; assert
   `warnings.filter(w => w.code.startsWith('a11y'))` is empty AND all three
   rules are kept. FAILS now (4 a11y warnings).
3. `keeps content-model-hazard chains without compile errors`: CSS
   `p.a p.b{color:red}` (scoped classes a, b) → assert compile does NOT throw
   and the rule is kept. FAILS now (`element_invalid_closing_tag_autoclosed`).

Run `pnpm run test:unit`: exactly these 3 fail for exactly these reasons; all
25 existing tests pass. STOP and report with verbatim output.

### Step 2: Comment masking (Part A)

Implement `stripCssComments`; wire into the three consumers. Test 1 goes
green. Tests 2-3 still red. Verify with `pnpm run test:unit`.

### Step 3: Dynamic marker nodes (Part B)

Implement the svelte:element rendering and deletions per Design. Update the
existing shape-asserting tests to the new expected shapes — compile-level
(kept CSS / no throw) where possible, exact new marker strings where shape is
the point (fallback: `<svelte:element this={'x'} class="page-rows paged">`
etc.). Do not weaken what any test proves: every rule previously asserted as
kept must still be asserted kept. Tests 2-3 go green.

**Verify**: `pnpm run test:unit` → all pass (28 total expected).
`grep -c "VOID_TYPES\|UNSYNTHESIZABLE_TYPES" src/index.ts` → 0.

### Step 4: Docs alignment

Apply the Docs impact items. Verify `pnpm --filter docs check` → no new
problems vs its current baseline (13 errors / 23 warnings as of plan 003; run
a before/after diff of the problem list), zero `Unused CSS selector` warnings.

### Step 5: Full gate

`pnpm run check` → exit 0. `trunk fmt` + `trunk check` on changed files → no
new issues. `git status --short` → only in-scope files.

## Test plan

Red-first anchors: the three Step 1 tests, each reproducing one verified
finding. Step 3's rewrites keep all previously-pinned behavior pinned at the
compile level. The a11y test permanently removes the `warningFilter`
blind spot Codex flagged for the typed-selector path.

## Done criteria

- [ ] 3 Step-1 tests exist and pass (each failed at plan time)
- [ ] `pnpm run test:unit` → all pass; `pnpm run check` → exit 0
- [ ] `grep -c "VOID_TYPES\|UNSYNTHESIZABLE_TYPES" src/index.ts` → 0
- [ ] No `warningFilter: () => false` in the typed-selector/a11y test
- [ ] Docs check: no new problems vs baseline; limits/design-notes/README
      updated consistently
- [ ] `trunk check` clean on changed files; `git status` scope-clean
- [ ] Batch README status row updated

## STOP conditions

- The svelte:element marker fails to defend any selector the Step 1/legacy
  tests require kept (the pruner-conservatism assumption would be wrong —
  report the exact selector and compiled output; do not fall back to typed
  rendering on your own).
- Any legacy test can only pass by weakening what it asserts (dropping a
  kept-rule assertion) — report instead.
- `pnpm --filter docs check` shows any NEW problem referencing the example or
  docs pages.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The design leans on Svelte treating `svelte:element` as matching any type
  selector during pruning. The compile-level tests are the tripwire if a
  future Svelte narrows literal `this={'x'}` — if that happens, switch `this`
  to a non-foldable expression or revisit typed rendering.
- `css_unused_selector` warnings for attribute-selector rules remain correct
  behavior (still unmatched) — don't suppress them.
- PR #12 must be updated (push) after guard PASS; the PR description's
  "Changes" list should gain a line for this commit series.
