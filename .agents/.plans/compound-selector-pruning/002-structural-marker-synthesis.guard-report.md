# Guard report — 002 structural-marker-synthesis

**Recommendation: PASS** — structural marker synthesis delivers the plan's intent, and the adversarial-review defect (final-void compile error) is fixed red-first with the exact failure reproduced, the fix verified end-to-end, and every criterion re-run green under guard's own commands.
**Reviewed at** 9e266e5 · 2026-07-23 14:32 · **Plan planned at** 570668f (amended 2026-07-23; 001's changes in between are the declared dependency, DONE at 74ecd0e)
**Integrated** — no PR opened: per operator instruction the integration target is the stacked branch `advisor/002-structural-marker-synthesis` on `advisor/001-compound-scoped-classes`; publication is the operator's call.

## History of this report

A first PASS was issued at b87898f, then **withdrawn** after an external adversarial review (Codex) found — and guard reproduced — that a selector whose final compound is a void element (`input.a`) synthesized `<input class="a"></input>`, a hard Svelte compile error (`void_element_invalid_content`). Classified as a plan defect (executor had implemented the design faithfully) plus a guard test-coverage miss. The plan was amended with operator agreement (final voids render self-closing; non-final voids still skip), and the fix landed red-first. Full trail: guard log checkpoints 3–5.

## Done criteria

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| `pnpm run check` exits 0 | met | Guard re-ran at 9e266e5: CHECK_EXIT=0 |
| All red tests exist and pass (each failed at its red commit) | met | Structural red at b1cb9ba (4 rules `(unused)`), void red at 9338c84 (`void_element_invalid_content` throw + missing self-closing form) — both guard-reproduced failing; `Tests 25 passed (25)` at 9e266e5 |
| Edge-case tests pass (pseudo strip, attribute skip, :global skip, dedup, void handling, custom element) | met | Part of the 25/25; void handling now covers both non-final skip (`input.a .b`) and final self-closing (`input.a`, `img.b`) |
| Plan 001's tests pass unmodified | met | 25/25 includes both; no test edits in any green commit |
| `trunk check` clean on both files | met | "Checked 2 files ✔ No issues" (re-run at the fix; formatting re-verified by trunk fmt no-op) |
| No files outside scope | met | `git diff --stat 74ecd0e...advisor/002` → src/index.ts, tests/transform.test.ts only |
| Adversarial finding resolved end-to-end | met | Guard ran Codex's exact repro against the fixed dist: marker `<input class="a" />`, compiles, CSS keeps `input.a.a.svelte-n50uah` |

## Spirit

The plan's intent — marker DOM derived from the component's own selectors so structural selectors survive pruning, for any element the consumer uses — is delivered, and the revision strengthened it: final-void selectors (`input.a`, `img.b`) now gain coverage instead of crashing the build or being silently dropped. The chosen fix (self-closing render) was selected over skip-all-voids precisely because it preserves the plan's purpose for legitimate selectors.

## Scope & conduct

- In-scope only? Yes, across the whole branch (two files).
- STOP conditions respected? Yes — the interrupted session left no unauthorized work: the recreated worktree started clean at the red commit, and the replacement executor changed exactly the one specified function.
- Plan amendments: one (2026-07-23, final-void self-closing rule), operator-agreed, dated in the plan and logged.
- All commits made by guard; executors never committed. Red→green pairs: b1cb9ba→b87898f, 9338c84→9e266e5.

## Residual risk / follow-ups

- A `scoped:`-using component effectively opts its style block out of unused-CSS pruning for class-based rules — by design; worth a docs note.
- Still skip-to-fallback by design: attribute selectors, `:has()`, positional pseudo-classes, unsynthesizable tags (`body` etc.). Endgame if demanded: the `:global`-rewrite architecture (new plan).
- Marker size scales with selector count (deduped; snippet never rendered).
- Don't squash the branch if the red commits should stay demonstrable.
- Process note for the operator: the original PASS at b87898f shipped a build-breaking hole that only an adversarial pass caught — future guard finals on synthesis-style changes should include a hostile-input sweep (all skip-set members in final position), not just the plan's listed edge cases.
