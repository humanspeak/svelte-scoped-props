# Plan 002: Restructure example pages to the sections pattern and wire exampleMirrorsPlugin

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If any
> STOP condition occurs, stop and report — do not improvise. Your reviewer
> maintains the batch README index and makes all commits.
>
> **Drift check (run first)**: `git merge-base --is-ancestor 98e3ee7 HEAD && echo ok`
> and confirm `docs/vite.config.ts` registers `indexNowPlugin` but NOT
> `exampleMirrorsPlugin`.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED (touches all 8 example routes; rendered output must not regress)
- **Depends on**: 001 (DONE at 42abd88)
- **Category**: docs / dx
- **Planned at**: commit `98e3ee7` (branch `chore/package-updates`), 2026-07-23

> Revision 2026-07-23 (post-investigation, PLAN AMENDED — Path A): the plan's
> premise that exampleMirrorsPlugin requires per-slug demo folders is FALSE.
> Executor evidence (dist/vite/example-mirrors.js resolveSampleFiles, line
> 299): the demo-source import walk is constrained to the KEY's first path
> segment (`exampleRoot`), not the route slug. With our shared
> `scoped-props/demos/` folder every key shares that root, so shared
> components (ChildCard, used by 5 routes) mirror correctly with NO moves.
> Per-slug moves would silently drop ChildCard's source from 4 of 5 mirrors
> or force duplicating it ×5 (drift risk). AMENDED DESIGN: restructure the 8
> pages in place to `const sections` + `{#each}` (empirically proven to
> produce complete mirrors); demos and keys DO NOT move. Superseded items:
> the file-move steps, the shared-components placement question, and the done
> criteria `grep -rn "scoped-props/demos" docs/src → 0` (now inverted: keys
> must remain unchanged). Also confirmed: the plugin aborts entirely on the
> first sections-less page, so mirrors can only be wired after ALL 8 pages
> are restructured; `ExampleSection`/`formatSheetLabel` import from
> `@humanspeak/docs-kit`; `formatSheetLabel(0,1)` === the current hardcoded
> "SHEET 01 / 01"; `mode ?? 'live'` matches ExampleV2's default. New done
> criteria: all 8 pages use `const sections: ExampleSection[]` + `{#each}`;
> demo keys unchanged; plugin wired + gitignore entries; 8 complete mirrors
> including shared-component source where imported; docs-check problem set
> identical to the 10/6 baseline (the SsrLiteral demo error keeps its path
> since nothing moves); root gate, trunk, scope-clean as before.

## Why this matters

Plan 001 deferred `exampleMirrorsPlugin` because our example pages are
structurally incompatible with it: the plugin parses each
`examples/<slug>/+page.svelte` for a `const sections: ExampleSection[]` array
(it throws `Could not find const sections array` on our inline
`<ExampleV2 …/>` pages) and mirrors demo source from per-slug folders
(`src/lib/examples/<slug>/demos/`), while our demos share one
`scoped-props/demos/` folder. Restructuring to the sibling-repo pattern
(svelte-markdown, svelte-motion) completes docs-kit 2026.7.6 parity: every
example page gains an LLM-readable markdown mirror including its demo source,
and future docs-kit upgrades stay mechanical because our pages look like every
other repo's.

## Target structure (fetched verbatim from svelte-motion `animated-tabs/+page.svelte`)

Script block builds the array; snippets are declared at top level and
referenced by the array; one `{#each}` renders them:

```svelte
const SOURCE_URL = 'https://github.com/humanspeak/svelte-motion/blob/main/docs/src/lib/examples/'

const sections: ExampleSection[] = [
    {
        figId: 'FIG-001',
        tag: 'LAYOUTID',
        title: { prefix: 'animated ', accent: 'tabs', end: '.' },
        description: '…',
        snippet: defaultSection,
        codeSnippet: defaultCode,
        notes: defaultNotes,
        barCells: [{ k: 'pattern', v: 'tabs-sliding-indicator' }],
        sourceUrl: `${SOURCE_URL}animated-tabs/demos/Default.svelte`
    }
]
```

```svelte
{#snippet defaultSection()}<AnimatedTabsDefault />{/snippet}
{#snippet defaultNotes()}<ul>…</ul>{/snippet}
{#snippet defaultCode()}
    <CodeReferenceV2 samples={[demoCodeSample('animated-tabs/demos/Default.svelte', 'animated-tabs-default', 'Default.svelte')]} columns={1} />
{/snippet}

{#each sections as section, i (section.figId)}
    <ExampleV2
        figId={section.figId} tag={section.tag} title={section.title}
        description={section.description} mode={section.mode ?? 'live'}
        sheetLabel={formatSheetLabel(i, sections.length)}
        barCells={section.barCells} sourceUrl={section.sourceUrl}
        codeSnippet={section.codeSnippet} codeLabel="show code"
        notes={section.notes}
    >
        {@render section.snippet()}
    </ExampleV2>
{/each}
```

`ExampleSection` and `formatSheetLabel` are docs-kit exports (verify the exact
import path from svelte-motion's page imports before assuming). Demo folders:
`docs/src/lib/examples/<slug>/demos/*.svelte`, one folder per example route
slug (svelte-motion tree confirmed: `animated-tabs/demos/Default.svelte` etc.).

## Current state (inventory)

8 example routes under `docs/src/routes/examples/`, each `+page.svelte` +
`+page.ts`: `explicit-literal`, `plain-class-boundary`, `ssr-literal`,
`dynamic-class-value`, `class-value-alias`, `non-class-value-class-prop`,
`spread-forwarding`, `compound-selector`. Every page renders one inline
`<ExampleV2 …/>` with props as attributes and local `{#snippet}`s — read
`dynamic-class-value/+page.svelte` as the representative before starting.

Demos in the SHARED folder `docs/src/lib/examples/scoped-props/demos/`:
`ExplicitLiteral`, `PlainClassBoundary`, `SsrLiteral` (+`SsrProbe.svelte`),
`DynamicClassValue`, `ClassValueAlias`, `NonClassValueClassProp`,
`SpreadForwarding`, `CompoundSelector`, plus shared components under
`demos/components/` (`ChildCard`, `InternalClassCard`,
`NonClassValueClassCard`, `spread/MiddleSpreadCard`,
`spread/SpreadGrandchildCard`). The page↔demo↔dependency mapping is the
`demoCodeDependencies` map in `docs/src/lib/demo-code-samples.ts` — treat it
as the authoritative inventory.

`demoManifestPlugin({ split: true })` scans `src/lib/examples/*/demos/**` and
emits keys like `'scoped-props/demos/DynamicClassValue.svelte'`; those keys
appear in `demo-code-samples.ts` and in each page's `demoCodeSamples(...)`
call. Moving files changes every key.

`docs/src/lib/examplesIndex.ts` (from plan 001) is the canonical route
registry — order and slugs come from there; do not re-derive.

## The shared-components question (Step 1 investigates BEFORE moving anything)

Shared components are referenced by demos across multiple future slugs.
Determine empirically, before any move:

1. Does `demoManifestPlugin` include nested `components/` files per slug
   folder, and can a page reference a key from a DIFFERENT slug's folder?
   (Current keys prove nested scanning works for one folder; cross-slug
   reference is the open question — probably yes since keys are global.)
2. How does `exampleMirrorsPlugin` resolve demo source: only via the page's
   `demoCodeSample(...)` keys / `sourceUrl`s, or by scanning the slug folder?
   (The delta commit "mirror demo source through wrapper calls and imports"
   suggests it follows imports — test with one migrated slug before doing all 8.)

Decide placement from the answers. Default design unless contradicted: each
demo moves to its own slug folder; shared components move to ONE home —
`docs/src/lib/examples/shared/components/` if plain imports suffice for the
manifest, or stay inside a slug folder that others cross-reference if the
manifest requires demo-folder residency. Record the decision and evidence in
the report.

## Steps

### Step 1: Pilot one slug (`dynamic-class-value`)

Investigate the shared-components question, then migrate ONLY this route:
demo file to `examples/dynamic-class-value/demos/`, page rewritten to the
sections pattern (content identical — same title, description, notes,
barCells, code samples; this is a restructure, not a rewrite), keys updated.
Regenerate the demo manifest (buildStart with `{ split: true }`), then smoke-
test `exampleMirrorsPlugin` buildStart (plugin options from plan 001's Step 1:
`siteUrl: docsConfig.url`, `sourceBaseUrl:
'https://github.com/humanspeak/svelte-scoped-props/blob/main/docs'`) —
it should now parse the pilot page and emit its mirror; other pages may still
throw — if the plugin aborts entirely on the first unparseable page (rather
than per-page), note it and complete migrations before wiring.

**Verify**: mirror file for the pilot exists and contains the demo source;
`pnpm --filter docs check` → no NEW problems vs the 10-error/6-warning
baseline (regenerate stale artifacts first as plan 001 did); pilot page
renders identically in `pnpm --filter docs dev` (spot check, note it).

### Step 2: Migrate the remaining 7 routes

Same treatment, one commit-sized unit each is unnecessary — do them as a
batch, but keep per-page content byte-faithful where possible. Update
`demo-code-samples.ts` keys and `demoCodeDependencies` entries wholesale.
Delete the now-empty `scoped-props/` folder only when nothing references it
(`grep -rn "scoped-props/demos" docs/src` → 0).

**Verify**: demo-manifest regeneration lists all demos under new keys;
`grep -rn "scoped-props/demos" docs/src` → 0; docs check no new problems.

### Step 3: Wire exampleMirrorsPlugin

Register in `docs/vite.config.ts` after `docMirrorsPlugin` (plan 001 Step 1's
spec, including a what/why comment in the file's style). Add
`static/examples/` and `static/examples.md` to `docs/.gitignore` (matching
svelte-markdown). Run the buildStart smoke test.

**Verify**: mirrors exist for ALL 8 routes; each contains its demo source;
none contain content from outside `docs/`; `git status` shows no generated
mirror files as untracked (gitignore working).

### Step 4: Full gate

`pnpm --filter docs check` → problem set identical to baseline (10/6, same
items); `pnpm run check` (root) → exit 0; `trunk fmt` + `trunk check` changed
files → no new issues; `git status` scope-clean.

## Scope

**In scope**: `docs/src/routes/examples/**` (all 8 route pairs),
`docs/src/lib/examples/**` (file moves), `docs/src/lib/demo-code-samples.ts`,
`docs/vite.config.ts` (one plugin registration), `docs/.gitignore`,
`docs/src/lib/examplesIndex.ts` ONLY if a slug string must change (it should
not).

**Out of scope**: root `src/`, `tests/`; page CONTENT changes (copy, notes,
demo behavior — this is a restructure); `ExamplePager`/`PagerV2` wiring;
`.github/workflows/`; docs-kit itself.

## Commands

Same table as plan 001 (install, root build, docs check with 10/6 baseline,
trunk, buildStart invocation pattern from `docs/` — `demoManifestPlugin`
requires `{ split: true }`). Never run `pnpm --filter docs build` (network).

## Test plan

No red-first test (docs restructure, no library runtime surface — improve-
skill exemption). The anchor verification is behavioral: `exampleMirrorsPlugin`
buildStart throws `Could not find const sections array` before this plan and
emits 8 mirrors after; docs-check problem-set equality pins no-regression.

## Done criteria

- [ ] All 8 example pages use `const sections: ExampleSection[]` + `{#each}`;
      `grep -L "const sections" docs/src/routes/examples/*/+page.svelte` → empty
- [ ] `grep -rn "scoped-props/demos" docs/src` → 0
- [ ] exampleMirrorsPlugin registered; buildStart emits 8 mirrors with demo source
- [ ] `docs/.gitignore` covers the mirror outputs; `git status` clean of them
- [ ] Docs check problem set identical to 10/6 baseline; root `pnpm run check` exit 0
- [ ] `trunk check` clean on changed files; scope-clean status
- [ ] Batch README row updated (by reviewer)

## STOP conditions

- Step 1's investigation shows cross-slug demo keys DON'T resolve and shared
  components would need duplication into multiple slug folders — report the
  evidence; duplication is a design decision for the operator.
- `ExampleSection` (or `formatSheetLabel`) is not exported where svelte-motion
  imports it from, or its type rejects a field our pages need.
- Any page's rendered output would have to change to fit the pattern (content
  loss) — report the specific page and field.
- The pilot mirror contains anything from outside `docs/`.
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- After this lands, plan 001's deferred Step 1 is complete and the batch is at
  full parity with the 2026.7.6 delta.
- New examples must follow the sections pattern from day one — the
  compound-selector example (plan 003 of the other batch) predates this; its
  maintenance note about `demoCodeDependencies` registration still applies but
  keys are now per-slug.
- `demoCodeDependencies` keys changed wholesale here — if plan 001's verdict
  ("keep the map") is ever revisited, re-run that investigation against the
  new structure.
