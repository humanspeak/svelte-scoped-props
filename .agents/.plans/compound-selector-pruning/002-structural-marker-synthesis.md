# Plan 002: Synthesize marker structure per selector so typed and combinator selectors survive pruning

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in the `README.md` that sits alongside this plan file
> (`.agents/.plans/compound-selector-pruning/README.md`) — unless a reviewer
> dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 570668f..HEAD -- src/index.ts tests/transform.test.ts`
> Plan 001 in this batch intentionally modifies both files — that diff is
> expected. Verify plan 001's status is DONE in this batch's README, then
> compare the "Current state" excerpts below against the live code; on any
> other mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: 001-collect-compound-scoped-classes.md
- **Category**: bug
- **Planned at**: commit `570668f`, 2026-07-23

> Revision 2026-07-23 (post-review): an adversarial review (Codex) found a plan
> defect, reproduced by guard: the Design section skipped void-element types
> only in NON-final compounds, so a final void compound like `input.a` was
> synthesized — and rendered with a closing tag (`<input class="a"></input>`),
> which Svelte rejects with a hard `void_element_invalid_content` compile
> error. Amended rule: void types in a FINAL compound are rendered as
> self-closing marker nodes (`<input class="a" />`) — verified to compile and
> to defend the rule from pruning; non-final voids remain skipped. Step 3 test
> 5 is superseded by the regression tests in the revision dispatch (full
> preprocess→compile for `input.a` and `img.b`, plus the non-final skip).

## Why this matters

The library defends parent-scoped CSS against Svelte's unused-CSS pruning with a
never-rendered `{#snippet}` containing one flat `<div>` that carries every class
name found in the component's `<style>`. Svelte's pruner matches selectors
*structurally* against template elements — tag names, ancestor/descendant
relations, sibling order — so any selector that demands structure the flat div
doesn't have gets pruned even though the real elements match at runtime:

- `button.foo` — needs a `<button>`; the marker is a `<div>`.
- `.a .b`, `.a > .b` — need two elements in ancestor relation; the marker is one
  flat element.
- `span.a + button.b` — needs a span immediately followed by a button.

Because scoped classes are applied to arbitrary elements (e.g. `motion.div`,
`motion.button`, plain spans/lis), no hardcoded tag list can cover this. The fix:
generate the marker's DOM shape **from the component's own selectors** — for each
selector, synthesize a chain of elements that matches it exactly. This removes
the remaining structural pruning limitations left after plan 001.

## Verified at plan time (Svelte 5.56, `compile` with a hand-built marker)

- Nested marker divs → `.a .b`, `.a > .b`, and (depth 3) `.a .b .a` are KEPT.
- A `<button class="a b">` marker sibling → `button.a` KEPT; `span.a` stays
  pruned until a span marker exists — pruning is tag-sensitive.
- Sibling order matters for `+`: with marker order button-then-span,
  `button.a + span.b` KEPT but `span.a + button.b` PRUNED. Per-selector
  synthesis (emit the exact chain each selector needs) sidesteps this.
- Pseudo-classes are ignored by the pruner's structural match: `.a:hover .b`
  KEPT with plain nested divs — stripping pseudos during synthesis is safe.
- Kept selectors come out with Svelte's hash placement, e.g.
  `.a.svelte-h .b:where(.svelte-h)` — both real elements receive the hash via
  `scoped:class`, so runtime matching works; no extra work needed there.

## Current state

All code is in `src/index.ts` (line numbers from commit `570668f`; plan 001
shifts them somewhat — locate by symbol name):

- `addCssMarkerSnippet` (line 587) — the function this plan replaces the guts of:

  ```ts
  function addCssMarkerSnippet(source: string): string {
      const classes = Array.from(readCssClassNames(source))

      if (classes.length === 0) return source

      const snippetName = uniqueSnippetName(source)
      const marker = `\n{#snippet ${snippetName}()}<div class="${classes.join(' ')}"></div>{/snippet}\n`

      return `${source}${marker}`
  }
  ```

- After plan 001, `src/index.ts` also contains (added by that plan):
  - `mapCssPreludes(css, map)` — comment/quote/brace-aware walk that visits each
    rule prelude (text before `{`); nested rules inside at-rules surface as
    their own preludes.
  - `stripQuotedSections(text)` — blanks quoted spans with spaces, preserving
    offsets.
  - `readCssClassNames(source)` — collects class names from selector preludes.
  - `readStyleContents(source)` — returns the raw contents of each `<style>`
    block.
- `transformScopedProps` calls `addCssMarkerSnippet(code)` when
  `marker === 'snippet'` and there is at least one `scoped:` attribute.
- `tests/transform.test.ts` — vitest; the full-pipeline pattern
  (`preprocess` → `compile` → assert on `compiled.css.code`) is the test at
  `preserves parent selectors during Svelte CSS analysis`, plus the two
  compound-selector tests added by plan 001.
- Conventions: 4-space indent, no semicolons, single quotes, module-level
  `function` declarations, `type` aliases. Trunk is the format/lint authority.

## Commands you will need

| Purpose    | Command                                            | Expected on success                 |
| ---------- | -------------------------------------------------- | ----------------------------------- |
| Install    | `pnpm install`                                     | exit 0                              |
| Unit tests | `pnpm run test:unit`                               | builds (tsc), then all vitest pass  |
| Full gate  | `pnpm run check`                                   | build + unit + docs-site build pass |
| Lint       | `trunk check src/index.ts tests/transform.test.ts` | no new issues                       |
| Format     | `trunk fmt src/index.ts tests/transform.test.ts`   | files formatted                     |

## Scope

**In scope** (the only files you should modify):

- `src/index.ts`
- `tests/transform.test.ts`

**Out of scope** (do NOT touch):

- `src/runtime.ts`, `src/hash.ts` — runtime and hashing are unaffected. (Marker
  content does not feed the scope hash: the hash is computed from the boosted
  CSS before the marker is appended.)
- `dist/`, `docs/`, `src/routes/` — build output, docs site, e2e fixture app.
- The `ScopedPropsOptions.marker` public option shape — `false | 'snippet'`
  stays as is.

## Design

Replace the single flat div with **per-selector synthesized chains**, keeping the
flat all-classes div as a fallback for anything synthesis skips.

For every `<style>` block, walk rule preludes (via `mapCssPreludes`), split each
prelude into selectors at top-level commas, and for each selector:

1. **Tokenize** into compounds separated by combinators. Split on top-level
   whitespace (descendant), `>`, `+`, `~` — "top-level" meaning not inside
   `(...)`, `[...]`, or quotes (use `stripQuotedSections` for scanning, original
   text for content).
2. **Parse each compound**: optional leading type selector (ident, may contain
   `-` for custom elements; `*` means no type constraint), any number of
   `.class` parts, pseudo-classes/pseudo-elements (`:name`, `:name(...)`,
   `::name`), attribute selectors (`[...]`).
3. **Skip the whole selector** (no chain emitted; fallback div still appended)
   when any compound contains: `:global`, an attribute selector, a type selector
   in the unsynthesizable set (`html`, `body`, `head`, `title`, `meta`, `link`,
   `script`, `style`, `slot`), or a void-element type (`area`, `base`, `br`,
   `col`, `embed`, `hr`, `img`, `input`, `source`, `track`, `wbr`) in a
   non-final compound (a void element cannot have descendants — such a selector
   can never match real DOM either). A void type in the FINAL compound is NOT
   a skip: render that node self-closing (`<input class="a" />`) — a closing
   tag on a void element is a hard Svelte compile error
   (`void_element_invalid_content`). Pseudo-classes/elements are simply
   **stripped**, not a reason to skip.
4. **Synthesize** a marker chain matching the selector, left to right:
   - element tag = the compound's type selector, or `div` when absent/`*`
   - class attribute = the compound's classes joined by spaces (empty class
     attribute omitted)
   - descendant or child combinator → the next element nests inside the current
     one
   - `+` or `~` → the next element is emitted as the immediately-following
     sibling of the current one, inside the same parent

   Examples of the exact output shape:
   - `.a .b .a` → `<div class="a"><div class="b"><div class="a"></div></div></div>`
   - `button.foo` → `<button class="foo"></button>`
   - `span.a + button.b` → `<span class="a"></span><button class="b"></button>`
   - `.a > span.b ~ .c` → `<div class="a"><span class="b"></span><div class="c"></div></div>`
   - `.a:hover .b::before` → `<div class="a"><div class="b"></div></div>`

5. **Deduplicate** chains (a `Set` of emitted strings) and **drop chains that
   are single bare divs with only classes** — the all-classes fallback div
   already covers every single-compound classes-only selector.

The snippet then contains all unique chains plus the fallback div:

```
{#snippet __svelte_scoped_props_marker()}<chain1><chain2><div class="all collected classes"></div>{/snippet}
```

Implementation shape (names are suggestions; keep them in this spirit):

```ts
type SelectorCompound = {
    type: string | null
    classes: string[]
    skip: boolean
}

function readMarkerChains(source: string): string[]
function parseSelectorChains(prelude: string): SelectorCompound[][] // [] entries for skipped selectors
function renderMarkerChain(compounds: SelectorCompound[], combinators: string[]): string
```

Keep `addCssMarkerSnippet` as the single entry point; it composes
`readMarkerChains` + the existing all-classes div.

## Git workflow

- Branch: `advisor/002-structural-marker-synthesis` off the branch where plan
  001 landed.
- Conventional commits, e.g. `fix: synthesize marker chains for typed and combinator selectors`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write failing tests that reproduce the structural pruning

Add to `tests/transform.test.ts`, modeled on the existing full-pipeline test
(`preprocess` → `compile`, `warningFilter: () => false`). One test, four
selector shapes (or four tests — executor's choice; keep the assertions exactly
these):

```ts
it('keeps element-qualified and combinator selectors of scoped classes', async () => {
    const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="a b" />
<style>
button.a{color:red}
.a .b{color:blue}
.a > .b{color:green}
span.a + button.b{color:purple}
</style>`
    const processed = await preprocess(source, scopedProps(), { filename })
    const compiled = compile(processed.code, {
        filename,
        generate: 'client',
        warningFilter: () => false
    })

    expect(compiled.css?.code).not.toContain('(unused)')
    expect(compiled.css?.code).toContain('button.a')
    expect(compiled.css?.code).toContain('.a')
})
```

Run and confirm it FAILS: with only the flat div marker, all four rules are
emitted as `/* (unused) … */`, so `not.toContain('(unused)')` fails. If it
passes, STOP and report (the premise about current behavior would be wrong).

**Verify**: `pnpm run test:unit` → exactly this new test fails, with `(unused)`
present in the compiled CSS for `button.a`, `.a .b`, `.a > .b`, and
`span.a + button.b`.

### Step 2: Implement selector parsing and chain synthesis

Implement the Design section in `src/index.ts`: `parseSelectorChains`,
`renderMarkerChain`, `readMarkerChains`, and rewire `addCssMarkerSnippet` to
emit chains + fallback div. Reuse `mapCssPreludes` and `stripQuotedSections`
from plan 001 — do not write a second CSS walker.

**Verify**: `pnpm run test:unit` → the Step 1 test PASSES; all pre-existing
tests (including plan 001's two compound tests) still pass. The plan-001 marker
assertion `<div class="page-rows paged"></div>` must still hold — the fallback
div keeps its exact current form.

### Step 3: Add edge-case tests (these pin the skip rules)

Add unit tests (on `transformScopedProps` output — no compile needed) asserting:

1. `:hover`/`::before` are stripped: CSS `.a:hover .b::before{color:red}` →
   marker contains `<div class="a"><div class="b"></div></div>`.
2. Attribute selectors are skipped, fallback still present: CSS
   `.a[data-x="1"]{color:red}` → marker contains no `data-x`, and contains the
   all-classes fallback div.
3. `:global` selectors are skipped: CSS `:global(.a) .b{color:red}` → no chain
   containing two nested divs for this rule beyond what other rules produce
   (assert the marker snippet does not duplicate; simplest: marker contains
   exactly one occurrence of `{#snippet`).
4. Duplicate selectors dedupe: two rules `.a .b{...}` and `.a .b{...}` (or
   `.a .b:hover{...}`) → the chain string
   `<div class="a"><div class="b"></div></div>` appears exactly once.
5. Void non-final compound is skipped: CSS `input.a .b{color:red}` → marker
   contains no `<input`.
6. Custom-element types are synthesized: CSS `my-widget.a{color:red}` → marker
   contains `<my-widget class="a">`.

**Verify**: `pnpm run test:unit` → all pass.

### Step 4: Full gate

**Verify**:

- `pnpm run check` → exit 0
- `trunk fmt src/index.ts tests/transform.test.ts` then
  `trunk check src/index.ts tests/transform.test.ts` → no new issues
- `git status` → only `src/index.ts` and `tests/transform.test.ts` modified
  (plus this batch's README status row)

## Test plan

- Anchor: the Step 1 test demonstrates against current (post-001) code that all
  four structural selector shapes are pruned; after Step 2 they survive with
  Svelte's hash applied.
- Step 3 pins the skip/strip rules so future refactors don't silently regress
  them.
- Structural pattern: the existing full-pipeline test in
  `tests/transform.test.ts`; unit-shape pattern: the existing
  `transformScopedProps` string-assertion tests.
- All pre-existing tests must pass unchanged.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm run check` exits 0
- [ ] The Step 1 test exists and passes (it failed at plan time against
      post-001 code)
- [ ] The 6 Step 3 edge-case tests exist and pass
- [ ] Plan 001's tests still pass unmodified (`git diff` shows no edits to them)
- [ ] `trunk check src/index.ts tests/transform.test.ts` reports no new issues
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] Status row updated in `.agents/.plans/compound-selector-pruning/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 001 is not DONE (its helpers `mapCssPreludes` / `stripQuotedSections`
  are missing from `src/index.ts`).
- The Step 1 test passes against unmodified post-001 code.
- The Svelte compiler ERRORS (not warns) on any synthesized marker element —
  e.g. it rejects a tag in snippet position. Report which tag; do not add
  ad-hoc tag exclusions beyond the sets in the Design section without recording
  them.
- Any pre-existing test fails after Step 2 and the fix would mean editing that
  test rather than the implementation.
- Selector parsing turns out to need more than compounds + the four combinators
  + strip/skip rules (e.g. real-world CSS in the fixture app uses `:has()` or
  nested `&` rules that break the tokenizer) — report the selector shape found.

## Maintenance notes

- **Still unfixable with markers** (document rather than chase): selectors whose
  match depends on state or position the pruner checks structurally —
  `:has(...)` chains, `:nth-child()` beyond what a synthesized sibling list
  happens to satisfy, attribute selectors (skipped by design here). If these
  keep arriving from the field, the endgame is the handoff's "heavier" option:
  rewrite qualifying rules to `:global(...)` with the scope hash inlined by the
  preprocessor (it already computes a Svelte-compatible hash), opting them out
  of pruning entirely. That is a different architecture — new plan, not a patch
  to this one.
- Marker size now scales with selector count; chains are deduped and the
  snippet is never rendered, so cost is compile-output bytes only. If a
  consumer reports bloat, consider emitting chains only for selectors the flat
  div cannot satisfy (currently: also emitted for none — single-compound
  class-only chains are already dropped).
- Reviewer focus: the top-level tokenizer (comma/combinator splitting outside
  parens/brackets/quotes) and the void/unsynthesizable skip sets.
