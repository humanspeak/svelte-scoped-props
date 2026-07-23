# Guard log — 002 example-sections-restructure

## Checkpoint 1 — 2026-07-23 19:27 — PLAN AMENDED

(no snapshot — executor's tree deliberately clean: STOP fired before any migration; the pilot restructure was a throwaway experiment, reverted)

- Executor honored STOP #1 exactly as designed: the shared-components investigation ran BEFORE any file moves and surfaced that the plan's per-slug design forces either silent mirror content loss (ChildCard source dropped from 4 of 5 mirrors — the walk in dist/vite/example-mirrors.js:299 is bounded by the key's first segment) or ×5 duplication of shared source. It also disproved the plan's premise: the plugin does NOT require per-slug demo folders, and empirically proved the in-place alternative (pilot page restructured, complete mirror emitted incl. shared ChildCard source, then reverted; tree left clean).
- Classification: PLAN DEFECT (advisor premise wrong — the sibling repos never had cross-slug shared components, so their pattern didn't transfer). Not executor drift; conduct was exemplary, including capturing fidelity evidence (formatSheetLabel(0,1) === "SHEET 01 / 01"; ExampleSection field coverage; mode default).
- Plan amended (dated revision, committed at `46884fd`): Path A — restructure all 8 pages in place, demos and keys unchanged, wire the plugin only after all pages parse, gitignore the mirror outputs. Done criteria inverted accordingly (keys must NOT change). Decision rationale: zero duplication, zero content loss, full parity intent, empirically proven — Path B's ×5 duplication is strictly worse and was the only literal-plan alternative.
- Action: executor worktree fast-forwarded to the amended plan; executor redispatched to complete under the revision.

## Checkpoint 2 — 2026-07-23 19:47 — ON TRACK (final)

e7efd2c · final close-out; branch `advisor/docs-kit-parity-002` (46884fd → 2be5a73 restructure → e7efd2c plugin)

- Snapshots committed before verdict: `2be5a73` (8 pages + wrapper deletion, +482/−272) and `e7efd2c` (plugin + gitignore) — split per concern.
- Done criteria re-run by guard: `grep -L "const sections"` → empty across the 8 pages; `grep -rn "demo-code-samples" docs/src` → 0; 8 mirrors emitted under `docs/static/examples/`; compound-selector's mirror contains ChildCard source; docs check → problem set identical to the 10/6 baseline; root `pnpm run check` exit 0; scope-clean (11 files, all in-scope incl. rev2's addition).
- Fidelity audit: representative page (dynamic-class-value) diffed in full — SEO/breadcrumb block untouched, every ExampleV2 attribute mapped verbatim into the section object, wrapper call expanded to explicit `demoCodeSample` triples matching the old map's id/label algorithm (`dynamic-class-value-child-card` / `ChildCard.svelte`), `columns={2}` preserved. Uniform ~84-line deltas across the other pages consistent with the same mechanical treatment; executor's mirror source-file counts corroborate every page's dependency set.
- Rev2 addendum (delivered mid-run via message) fully absorbed: map-less pattern adopted, wrapper deleted only after zero imports remained.
- Action: verdict PASS; batch at full 2026.7.6 parity; merge to `chore/package-updates`, README rows updated, cross-batch note added to compound-selector-pruning README per plan 003's maintenance note.

