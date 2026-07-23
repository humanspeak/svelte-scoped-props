# Guard log — 002 structural-marker-synthesis

## Checkpoint 1 — 2026-07-23 13:19 — ON TRACK

b1cb9ba · after Step 1 (red test), executor phase 1 of 2; worktree `scratchpad/wt-002`, branch `advisor/002-structural-marker-synthesis` stacked on advisor/001 (74ecd0e)

- Snapshot committed before review: `b1cb9ba` (tests/transform.test.ts, +21 lines, nothing else).
- Prerequisites verified by executor and consistent with 001's reviewed diff: `mapCssPreludes`, `stripQuotedSections` present; `readCssClassNames` prelude-scoped.
- Red state reproduced independently by guard: `pnpm exec vitest run tests/transform.test.ts` → `Tests 1 failed | 7 passed (8)`; all four rules pruned (`(unused) button.a.a`, `.a.a .b.b`, `.a.a > .b.b`, `span.a.a + button.b.b`) — exactly the plan-predicted failure. Incidentally re-confirms 001's compound doubling is active in the pruned output.
- Test assertions read in the diff: they assert survival of the structural selectors, not trivialities.
- No commits by executor, lockfile untouched, src/index.ts unchanged this phase.
- Action: none needed; executor continued to Steps 2–4.

## Checkpoint 2 — 2026-07-23 13:31 — ON TRACK (final)

b87898f · final close-out after Steps 2–4; branch `advisor/002-structural-marker-synthesis` (74ecd0e → b1cb9ba red → b87898f green)

- Snapshot committed before review: `b87898f` (src/index.ts +257, tests/transform.test.ts +91 vs 74ecd0e including the red commit).
- Done criteria re-run by guard: `pnpm run check` → exit 0 with `Tests 23 passed (23)`; `trunk check src/index.ts tests/transform.test.ts` → "✔ No issues"; scope via `git diff --stat 74ecd0e...advisor/002` → only the two in-scope files; tree clean after commit.
- Full diff read; logic traced by hand: `.a > span.b ~ .c` builds `<div class="a"><span class="b"></span><div class="c"></div></div>`, top-level `+` produces sibling roots, single-bare-div chains dropped in favor of the fallback — all matching the plan's exact output shapes. Reuses `mapCssPreludes`/`stripQuotedSections`; no second walker.
- Edge-case tests audited: all six assert the plan's intended behavior; dedup and `:global` tests count occurrences rather than merely checking presence.
- Deviations, judged on merit, all documented by executor and ACCEPTED:
  1. Class dedup within a compound (`parseSelectorCompound`) — required because synthesis reads post-boost CSS (`.a` → `.a.a`); without it the plan's own exact shapes are unachievable. Duplicate classes in one compound only arise from the boost or user specificity hacks; dedup preserves matching semantics.
  2. Attribute-selector test scoped to the marker substring — the plan's literal `not.toContain('data-x')` against full output was unsatisfiable (the style block legitimately keeps `data-x`). Minor plan defect surfaced in execution; adaptation preserves intent.
  3. Unrecognized compound tokens (e.g. `#id`) return null → whole selector skipped, fallback div still emitted — safe degradation consistent with the plan's skip design.
- Step 1 red test unmodified between b1cb9ba and b87898f except being made green by src changes (diff shows no assertion edits).
- Action: verdict PASS in close-out report; stack complete (base → 001 → 002); PRs deferred to operator per instruction.

## Checkpoint 3 — 2026-07-23 14:07 — PLAN AMENDED

b87898f · post-close-out: external adversarial review (Codex) surfaced a defect the final pass missed; prior PASS withdrawn

- Finding, reproduced by guard before acting: source `<Child scoped:class="a" />` + `<style>input.a{color:red}</style>` preprocesses to marker `<input class="a"></input>` and Svelte hard-errors with `void_element_invalid_content`. Enabling the preprocessor can break an otherwise valid component at build time. This is worse than the pruning bug the plan fixes.
- Classification: PLAN DEFECT, not executor drift — the executor implemented the Design section faithfully; the plan's skip rule only excluded voids in NON-final compounds and its output shapes implied closing-tag rendering for every node. Secondary: GUARD MISS — checkpoint 2's edge tests covered only `input.a .b` (non-final), so the done criteria were green around the hole.
- Fix verified viable by guard before amending: self-closing void markers (`<input class="a" />`, `<img class="b" />`) compile cleanly and defend `input.a.a` / `img.b.b` from pruning (kept with hash). Chosen over skip-all-voids because it preserves coverage for legitimate final-void selectors.
- Plan amended with operator agreement (operator directed execution of the review's next steps): Design rule 3 now renders final-void compounds self-closing; dated revision note added under Status. Batch README: 002 DONE → IN PROGRESS.
- Action: fix dispatched to the same executor, red-first (regression tests for `input.a` and `img.b` full preprocess→compile, must fail with `void_element_invalid_content` before the fix); guard report to be rewritten after re-review.

## Checkpoint 4 — 2026-07-23 14:09 — ON TRACK

9338c84 · after revision red step (void regression tests); executor stopped at checkpoint as instructed

- Snapshot committed before review: `9338c84` (tests/transform.test.ts +28, test-only; src/index.ts untouched this round — verified in diff).
- Red state reproduced independently by guard: `pnpm exec vitest run tests/transform.test.ts` → `Tests 2 failed | 14 passed (16)`; test 1 throws `void_element_invalid_content` from the synthesized `</input>`, test 2 fails on the missing self-closing form. Exactly the amended plan's predicted failures.
- Assertions read: full-pipeline test pins `input.a.a` / `img.b.b` kept and no `(unused)`; unit test pins `<input class="a" />` and forbids `</input>` — both assert the amended design, not trivialities.
- Action: none needed; executor cleared to implement the self-closing fix.

## Checkpoint 5 — 2026-07-23 14:32 — ON TRACK (final, re-run)

9e266e5 · final close-out after the revision fix; branch `advisor/002-structural-marker-synthesis` (… → 9338c84 red → 9e266e5 green)

- Interruption note: the prior executor session died mid-dispatch and the worktree was lost; all committed work survived in refs. Worktree recreated from the branch; a fresh executor implemented only Step R2. No work was lost beyond an uncommitted attempt.
- Snapshot committed before review: `9e266e5` — a 3-line early return in `renderMarkerNode`: void tags render `<tag class="…" />`. Exactly the amended plan's prescription; nothing else changed (diff read in full).
- Done criteria re-run by guard: `pnpm run test:unit` → `Tests 25 passed (25)`; `pnpm run check` → exit 0; scope via `git diff --stat 74ecd0e...advisor/002` → only src/index.ts and tests/transform.test.ts; tree clean.
- End-to-end reproduction of the adversarial finding against the fixed build: `input.a` now yields marker `<input class="a" />`, compiles without error, and the rule is KEPT as `input.a.a.svelte-n50uah` — the exact failure Codex reported is resolved, with coverage preserved rather than dropped.
- Red tests unmodified between 9338c84 and 9e266e5 (green commit touches src/index.ts only).
- Action: guard report rewritten with verdict PASS; batch README 002 → DONE.




