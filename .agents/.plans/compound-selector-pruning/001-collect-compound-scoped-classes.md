# Plan 001: Keep compound selectors of scoped classes from being pruned

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in the `README.md` that sits alongside this plan file
> (`.agents/.plans/compound-selector-pruning/README.md`) — unless a reviewer
> dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 570668f..HEAD -- src/index.ts tests/transform.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.
>
> Revision 2026-07-23: the field report `HANDOFF-compound-selector-pruning.md`
> has been removed from the repo at the operator's direction — its relevant
> content (repro, environment, observed output) is inlined below; nothing else
> changed.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `570668f`, 2026-07-23

## Why this matters

A field report from the first real-world adopter (wiring
`@humanspeak/svelte-scoped-props@0.1.3` into a Tauri/Vite Svelte 5 app, 2026-07-23;
report content inlined here) shows that a CSS rule requiring two scoped classes on the same
element — `.page-rows.paged { … }` — is stripped by Svelte's unused-CSS pruning,
even though both classes are delivered through one `scoped:class` directive and
both land on the element at runtime. The consumer had to un-compound the rule and
lose the guard that compound selectors exist for. The diagnostic the consumer sees
(`Unused CSS selector ".page-rows.page-rows.paged"`) is cryptic because only the
first class in the compound gets the specificity doubling. Fixing this removes the
library's first reported real-world limitation.

## Root cause (verified empirically at plan time)

The bug is NOT in the marker snippet's structure — `addCssMarkerSnippet`
(src/index.ts:587-596) already renders **all** collected class names on a single
`<div>`, so a compound selector would match the marker if both classes were
collected. The bug is the class-name regex used in two places:

```
/(?<![\w-])\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g
```

The negative lookbehind `(?<![\w-])` rejects any `.class` token whose `.` is
immediately preceded by a word character. In a compound selector `.page-rows.paged`,
the `.` before `paged` is preceded by `s` (a word character), so `paged` is never
matched. Two consequences:

1. `readCssClassNames` (src/index.ts:698-711) never collects `paged`, so the
   anti-pruning marker div renders as `<div class="page-rows"></div>` — it does
   not match `.page-rows.paged`, and Svelte prunes the rule.
2. `boostSelectorPrelude` (src/index.ts:660-676) doubles only `.page-rows`,
   producing the confusing `.page-rows.page-rows.paged` seen in the warning.

Verified at plan time by running `transformScopedProps` (built dist) on the repro:

```
Input:   <motion.div scoped:class={['page-rows', { paged }]} />
         <style>.page-rows { display: flex; } .page-rows.paged { min-height: 61px; }</style>

Output:  .page-rows.page-rows { display: flex; }
         .page-rows.page-rows.paged { min-height: 61px; }        ← .paged not doubled
         {#snippet __svelte_scoped_props_marker()}<div class="page-rows"></div>{/snippet}
                                                              ↑ paged missing
```

And verified that the **fixed** shape survives Svelte's pruning: compiling a
component whose marker div carries `class="page-rows paged"` and whose selector is
`.page-rows.page-rows.paged.paged` produces
`.page-rows.page-rows.paged.paged.svelte-n50uah { min-height: 61px; }` (kept, hash
appended), while the current shape produces
`/* (unused) .page-rows.page-rows.paged { min-height: 61px; }*/`. Repeated class
selectors (`.paged.paged`) match an element carrying the class once — this is
standard CSS and is already how the library boosts single classes.

Why the lookbehind exists at all: `readCssClassNames` scans the **entire** style
content, including declaration values, and the lookbehind prevents matching things
like `.png` inside `url(foo.png)`. The fix below therefore restricts class
collection to selector preludes (the text before each `{`) instead of merely
deleting the lookbehind.

## Current state

- `src/index.ts` — the whole preprocessor; the only source file that changes.
  Relevant functions:
  - `transformScopedProps` (line 78) — orchestrates; calls `readCssClassNames`
    at line 86 (dynamic path) and `boostScopedStyleSpecificity` at line 93.
  - `boostCssSpecificity` (line 608) — a comment/quote-aware state machine that
    walks CSS and calls `boostSelectorPrelude` on the text before each `{`.
    Nested rules (e.g. inside `@media`) fall out of the naive brace walk as their
    own preludes; `boostSelectorPrelude` skips preludes starting with `@`.
  - `boostSelectorPrelude` (line 660) — doubles `.class` tokens found in
    `classNames`, with a guard against re-doubling user-doubled selectors:

    ```ts
    return prelude.replace(
        /(?<![\w-])\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g,
        (match, className, offset) => {
            if (!classNames.has(className)) return match
            const previous = prelude.slice(Math.max(0, offset - match.length), offset)
            const next = prelude.slice(offset + match.length, offset + match.length * 2)
            if (previous === match || next === match) return match
            return `${match}${match}`
        }
    )
    ```

  - `readCssClassNames` (line 698) — runs the same lookbehind regex over each
    whole `<style>` content (`readStyleContents`, line 717) and returns the set
    used both for the marker snippet's class list and (when any `scoped:`
    attribute is dynamic) for the boosted-class set.
  - `addCssMarkerSnippet` (line 587) — one marker div with all collected classes:

    ```ts
    const marker = `\n{#snippet ${snippetName}()}<div class="${classes.join(' ')}"></div>{/snippet}\n`
    ```

- `tests/transform.test.ts` — vitest suite; imports from `../src/index.js`
  (extensionless-`.js` ESM style — the build resolves it). Contains the exact
  structural exemplar for the red test: the full-pipeline test at lines 54-67
  (`preprocess` → `compile` → assert on `compiled.css.code`).

- Conventions: 4-space indent, no semicolons, single quotes, `function`
  declarations (not arrow consts) for module-level helpers, types via `type`
  aliases. Match `src/index.ts` as it stands. Formatting authority is Trunk
  (`.trunk/trunk.yaml`), not a package.json script.

## Commands you will need

| Purpose        | Command                                       | Expected on success               |
| -------------- | --------------------------------------------- | --------------------------------- |
| Install        | `pnpm install`                                | exit 0                            |
| Unit tests     | `pnpm run test:unit`                          | builds, then all vitest tests pass |
| Full gate      | `pnpm run check`                              | build + unit + docs-site build pass |
| Lint           | `trunk check src/index.ts tests/transform.test.ts` | no new issues                |
| Format         | `trunk fmt src/index.ts tests/transform.test.ts`   | files formatted              |

Note: `pnpm run test:unit` runs `tsc -p tsconfig.build.json` first, so it doubles
as the typecheck gate.

## Scope

**In scope** (the only files you should modify):

- `src/index.ts`
- `tests/transform.test.ts`

**Out of scope** (do NOT touch, even though they look related):

- `src/runtime.ts` — the field report confirms the runtime side works; the bug is
  compile-time only.
- `src/hash.ts` — hashes will naturally change for components with compound
  selectors because the boosted CSS text changes; that is expected and needs no
  code change.
- `dist/` — build output; regenerated by `pnpm run test:unit`.
- `docs/` and `src/routes/` — the docs site and e2e fixture app. Adding an e2e
  case is deferred (see Maintenance notes).
- `DEFAULT_RUNTIME_MODULE` (src/index.ts:59) — a separate known issue (default
  doesn't match the published `@humanspeak/` package name); not this plan.

## Git workflow

- Branch off the current branch (`codex/fix-npm-provenance-repository`) or as the
  operator directs: `advisor/001-compound-scoped-classes`.
- Commit style: conventional commits, lower-case type prefix, e.g.
  `fix: collect compound scoped classes for marker and specificity boost`
  (matches `git log`: `style: satisfy yamllint workspace config`,
  `docs: document eslint processor setup`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write failing tests that reproduce the pruning

Add to `tests/transform.test.ts`, modeled on the existing full-pipeline test at
lines 54-67 (`preserves parent selectors during Svelte CSS analysis`). Use a
separate `describe` block or append to the existing one — either is fine.

Test A — full pipeline, dynamic value (mirrors the field report):

```ts
it('keeps compound selectors of scoped classes during Svelte CSS analysis', async () => {
    const source = `<script>import Child from './Child.svelte'; let paged = true;</script>
<Child scoped:class={['page-rows', { paged }]} />
<style>.page-rows{display:flex}.page-rows.paged{min-height:61px}</style>`
    const processed = await preprocess(source, scopedProps(), { filename })
    const compiled = compile(processed.code, {
        filename,
        generate: 'client',
        warningFilter: () => false
    })

    expect(compiled.css?.code).toContain('.page-rows.page-rows.paged.paged')
    expect(compiled.css?.code).not.toContain('(unused)')
})
```

Test B — transform output shape, literal value (covers the non-dynamic path,
where boosted classes come from the directive value rather than the CSS):

```ts
it('collects every class of a compound selector onto the marker', () => {
    const result = transformScopedProps(
        `<script>import Child from './Child.svelte';</script>
<Child scoped:class="page-rows paged" />
<style>.page-rows{display:flex}.page-rows.paged{min-height:61px}</style>`,
        { filename }
    )

    expect(result.code).toContain('<div class="page-rows paged"></div>')
    expect(result.code).toContain('.page-rows.page-rows.paged.paged{min-height:61px}')
})
```

Run and confirm both FAIL for the expected reasons — if either passes, the
reproduction is wrong: STOP and report.

**Verify**: `pnpm run test:unit` → exactly these 2 new tests fail; Test A fails
because `compiled.css.code` contains `/* (unused) .page-rows.page-rows.paged`
(so the `not.toContain('(unused)')` assertion fails), Test B fails because the
marker div renders as `<div class="page-rows"></div>` without `paged`.

### Step 2: Restrict class collection to selector preludes and drop the lookbehind

In `src/index.ts`:

1. Refactor `boostCssSpecificity` (line 608) so its comment/quote/brace state
   machine is reusable: extract a `mapCssPreludes(css: string, map: (prelude: string) => string): string`
   helper containing the existing walk, with the call to
   `boostSelectorPrelude(prelude, classNames)` replaced by `map(prelude)`.
   Reimplement `boostCssSpecificity` as a thin wrapper:

   ```ts
   function boostCssSpecificity(css: string, classNames: Set<string>): string {
       return mapCssPreludes(css, (prelude) => boostSelectorPrelude(prelude, classNames))
   }
   ```

2. Add a quote-blanking helper (blank with spaces so offsets are preserved):

   ```ts
   function stripQuotedSections(text: string): string {
       return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (match) =>
           ' '.repeat(match.length)
       )
   }
   ```

3. Rewrite `readCssClassNames` (line 698) to collect classes only from selector
   preludes, using the class pattern **without** the lookbehind
   (`/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g`). For each style content, walk preludes
   via `mapCssPreludes` (returning the prelude unchanged — it is used as a
   visitor here), skip preludes whose `trimStart()` starts with `@`, and match
   against `stripQuotedSections(prelude)` so attribute-selector strings like
   `[href="a.b"]` contribute nothing. Declaration values (e.g. `url(foo.png)`)
   are no longer scanned at all, which is why dropping the lookbehind is safe.

4. Rewrite `boostSelectorPrelude` (line 660) to drop the lookbehind while staying
   quote-safe: run the no-lookbehind pattern against
   `stripQuotedSections(prelude)` to find match offsets, but build the output
   from the **original** prelude by offset (the blanked copy has identical
   length). Keep the existing semantics otherwise: skip preludes starting with
   `@`; skip classes not in `classNames`; keep the re-doubling guard (skip when
   the identical `.class` token immediately precedes or follows the match — the
   `previous === match || next === match` check, now evaluated against the
   blanked copy). Shape:

   ```ts
   function boostSelectorPrelude(prelude: string, classNames: Set<string>): string {
       if (prelude.trimStart().startsWith('@')) return prelude

       const scannable = stripQuotedSections(prelude)
       const pattern = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g
       let output = ''
       let cursor = 0
       let match: RegExpExecArray | null

       while ((match = pattern.exec(scannable)) !== null) {
           const token = match[0]
           const className = match[1] as string
           if (!classNames.has(className)) continue

           const previous = scannable.slice(Math.max(0, match.index - token.length), match.index)
           const next = scannable.slice(match.index + token.length, match.index + token.length * 2)
           if (previous === token || next === token) continue

           const end = match.index + token.length
           output += prelude.slice(cursor, end) + token
           cursor = end
       }

       return output + prelude.slice(cursor)
   }
   ```

Do not change `addCssMarkerSnippet` — its single-div structure is already
correct; it just needs the complete class set it now receives.

**Verify**: `pnpm run test:unit` → the 2 Step 1 tests now PASS, and every
pre-existing test still passes (the existing tests at lines 14-73 pin the
single-class doubling, marker snippet, dynamic runtime call, and hash behavior —
none of them should change).

### Step 3: Full gate

Run the repo's full verification and formatting.

**Verify**:

- `pnpm run check` → exit 0 (build + unit tests + docs-site vite build)
- `trunk fmt src/index.ts tests/transform.test.ts` then
  `trunk check src/index.ts tests/transform.test.ts` → no new issues
- `git status` → only `src/index.ts` and `tests/transform.test.ts` modified

## Test plan

- Anchor: Step 1 Test A demonstrates against current code that the compound rule
  is emitted as `/* (unused) … */` by Svelte (the exact field-reported failure);
  after Step 2 it asserts the rule survives as
  `.page-rows.page-rows.paged.paged.<hash>`.
- Test B covers the literal-value path and the marker's class list directly.
- Both live in `tests/transform.test.ts`, modeled structurally on the existing
  `preserves parent selectors during Svelte CSS analysis` test (lines 54-67).
- All pre-existing tests must pass unchanged — they encode behavior this fix
  must not alter (single-class doubling, `@`-prelude skip, user-doubled-selector
  guard via the `previous/next` check, marker snippet presence).
- Verification: `pnpm run test:unit` → all pass, including the 2 new tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm run check` exits 0
- [ ] The 2 Step 1 tests exist in `tests/transform.test.ts` and pass (both
      failed at plan time)
- [ ] `grep -c "(?<!" src/index.ts` returns 0 — no lookbehind-based class
      matching remains
- [ ] `trunk check src/index.ts tests/transform.test.ts` reports no new issues
- [ ] `git status` shows no modified files outside `src/index.ts` and
      `tests/transform.test.ts` (plus this batch's README status row)
- [ ] Status row updated in `.agents/.plans/compound-selector-pruning/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- The code at src/index.ts:587-711 doesn't match the "Current state" excerpts
  (drift since commit `570668f`).
- Either Step 1 test PASSES against unmodified code — the reproduction premise
  would be wrong.
- After Step 2, any pre-existing test in `tests/transform.test.ts` fails — the
  refactor changed behavior it must preserve; do not "fix" the old tests.
- `pnpm run check` fails in the docs-site build (`vite build`) in a way that
  mentions CSS or scoped classes — the fixture app may contain a selector shape
  this plan didn't anticipate.
- You find yourself wanting to modify `addCssMarkerSnippet`, `src/runtime.ts`,
  or `src/hash.ts` — out of scope.

## Maintenance notes

- **Remaining known limitations (unchanged by this fix, worth documenting
  later)**: (1) element-qualified compounds like `button.foo` still get pruned —
  the marker is a bare `div`, so only `div`-qualified selectors can match it;
  (2) descendant/child combinators between scoped classes (`.a .b`) still get
  pruned — the single flat marker div has no marked ancestor. A follow-up could
  nest two marker divs (`<div class="…"><div class="…"></div></div>`) to cover
  descendant selectors.
- Scope hashes change for any component whose CSS contains compound selectors of
  known classes (the boosted CSS text feeds the hash). Purely cosmetic; no
  consumer action needed.
- Reviewer focus: `boostSelectorPrelude`'s rewrite from `String.replace` to an
  offset-based loop — check the re-doubling guard still skips user-doubled
  selectors (`.a.a` stays `.a.a`), and that quoted attribute-selector content is
  never rewritten.
- Deferred: an e2e case component in `src/routes/tests/scoped-props/lib/cases/`
  exercising a compound selector end-to-end (kept out to keep this plan small);
  and correcting `DEFAULT_RUNTIME_MODULE` (src/index.ts:59) which still says
  `svelte-scoped-props/runtime` while the published package is
  `@humanspeak/svelte-scoped-props` — separate finding, separate plan if wanted.
