# Guard log — 003 docs-and-example

## Checkpoint 1 — 2026-07-23 15:51 — ON TRACK (final)

bcfb645 · single-phase execution (docs plan, no red step per plan exemption); worktree `scratchpad/wt-003`, branch `advisor/003-docs-and-example` (9e266e5 → 4a9c64c docs prose → bcfb645 example)

- Snapshots committed before verdict: `4a9c64c` (README + limits + design-notes, +44/−10) and `bcfb645` (example pipeline, +151, 3 new files) — split per concern.
- Prose audited line-by-line against the behavior verified in plans 001/002: support matrix, skip list (matches `UNSYNTHESIZABLE_TYPES`/`VOID_TYPES` and the parse-skip rules exactly), "stripped, not matched" pseudo framing, and the pruning-exemption tradeoff — all accurate; no overclaiming found.
- Example audited: mirrors the field report (`scoped:class={['page-rows', { paged }]}` + `.page-rows.paged`), adds a descendant-combinator rule that genuinely matches the demo DOM (`.rows-frame` wraps the ChildCard). Registry entry, route pair, and index card all present.
- Gates reproduced by guard: `pnpm --filter docs check` → `13 ERRORS 23 WARNINGS` (baseline was 14/23 — net one error fixed, zero new), zero `Unused CSS selector` lines, zero problems referencing the new example; root `pnpm run check` → exit 0; `trunk check` on all 8 changed files → "✔ No issues".
- Two PLAN DEFECTS surfaced by execution, both accepted and recorded as a dated plan revision (not drift — the executor documented both and improvised around neither): the docs lint gate is pre-existingly red (criterion was written without recon-verifying it — advisor miss), and `examples-catalog:sync` is a no-op since the catalog object was refactored out of `+page.ts`.
- Executor judgment call ACCEPTED: `let rowClass = $derived(...)` matches the exemplar and all six sibling demos verbatim (the plan instructed wholesale copying); it adds one `prefer-const` instance of the pattern every sibling already has. A lone `const`-styled demo would be worse for consistency and would not turn the gate green. Logged as part of the follow-up finding below.
- Follow-up findings appended to batch README: docs lint gate red (prettier on generated/vendored files + processor `prefer-const` noise on `$derived` lets) — candidate future plan; dead `examples-catalog:sync` script.
- Action: verdict PASS in close-out report; stack now base → 001 → 002 → 003; PRs remain the operator's call.
