# Guard log — 004 comment-masking-dynamic-markers

## Checkpoint 0 — 2026-07-23 17:45 — BLOCKED (resolved)

c136853 · dispatch aborted by executor: plan file absent from the worktree

- Executor correctly STOPPED and proved the premise false: plan 004 had been authored in the main working tree but never committed, so the worktree (cut from c136853) lacked it. It refused to reconstruct the tests from the dispatch summary — exemplary STOP discipline.
- Reviewer error, not executor drift. Fixed by committing the plan + index row to `feat/compound-selector-pruning` (`c649bf4`) and fast-forwarding the worktree.
- Action: executor resumed with the committed plan.

## Checkpoint 1 — 2026-07-23 17:58 — ON TRACK

8606096 · after Step 1 (red tests); worktree `scratchpad/wt-004`, branch `advisor/004-comment-masking-dynamic-markers`

- Snapshot committed before review: `8606096` (tests/transform.test.ts +48, test-only).
- Red state reproduced independently by guard: `Tests 3 failed | 16 passed (19)` in the file — test 1 fails on `(unused) .a.a .b.b` behind the comment, test 2 on the four a11y codes (compiled WITHOUT warningFilter, per the Codex recommendation to remove that blind spot), test 3 throws `element_invalid_closing_tag_autoclosed`. Exactly the plan-predicted failures; all pre-existing tests pass.
- Assertions read: each pins the fixed behavior (rule kept + hash, zero a11y warnings, no throw) — not trivialities.
- Action: none needed; executor cleared for Steps 2–5.

## Checkpoint 2 — 2026-07-23 18:12 — ON TRACK (final)

14501d7 · final close-out after Steps 2–5; branch `advisor/004-comment-masking-dynamic-markers` (c649bf4 → 8606096 red → 14501d7 green)

- Snapshot committed before verdict: `14501d7` (5 files, +86/−97 — net code deletion despite three fixes, the svelte:element design's payoff).
- Done criteria re-run by guard: 28/28 unit tests; `pnpm run check` exit 0; `grep -c "VOID_TYPES|UNSYNTHESIZABLE_TYPES"` → 0; `trunk check` 5 files "✔ No issues"; scope-clean status.
- All three findings reproduced FIXED end-to-end against the built dist: commented `.a .b` kept (`.a.a.svelte-h .b.b:where(.svelte-h)`); typed selectors compile with 0 a11y warnings (unsuppressed) and all rules kept; `p.a p.b` + `a.a a.b` compile without error and kept.
- Full source diff read: matches plan Design exactly; `SelectorCompound.type` retained for tokenization only, `MarkerNode.tag` removed.
- Test-rewrite audit: every legacy shape assertion became a compile-level kept-rule assertion or the new exact shape — strengthened, not weakened. `input.a .b` flipped from "skipped" to "defended" (coverage gain, docs updated to match). Dedup test extended to type-agnostic collapse.
- Deviation ACCEPTED as plan over-specification (advisor authoring error): red test 1's contiguous `.a.a .b.b` substring cannot appear in kept output (Svelte interleaves the scope hash); executor split it into two contains + kept the load-bearing `not.toContain('(unused)')`. The red snapshot (8606096) preserves the original for the record.
- Docs-check invariant verified by executor (before/after problem-list diff empty in the fresh worktree; absolute counts differ from plan baseline due to absent generated artifacts — invariant is the meaningful check) and consistent with guard's main-tree runs.
- Action: verdict PASS; integrate to `feat/compound-selector-pruning` and push (PR #12 updates); README row → DONE.

