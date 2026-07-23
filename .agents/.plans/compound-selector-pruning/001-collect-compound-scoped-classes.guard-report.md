# Guard report — 001 collect-compound-scoped-classes

**Recommendation: PASS** — the lookbehind root cause is gone, both red repros flipped green untouched, and every criterion reproduced under guard's own runs.
**Reviewed at** 74ecd0e · 2026-07-23 13:16 · **Plan planned at** 570668f
**Integrated** — no PR opened: per operator instruction the integration target is the stacked branch `advisor/001-compound-scoped-classes` (base for plan 002); publication is the operator's next move.

## Done criteria

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| `pnpm run check` exits 0 | met | Guard re-ran in worktree: CHECK_EXIT=0 (tsc build + 16/16 vitest + docs-site vite build) |
| 2 Step-1 tests exist and pass (failed at plan time) | met | Red at 165c516 (`Tests 2 failed \| 5 passed`, guard-reproduced); green inside `pnpm run check` at 74ecd0e; commit 74ecd0e touches only src/index.ts, so the tests were not weakened |
| `grep -c "(?<!" src/index.ts` returns 0 | met | Guard ran: output `0` |
| `trunk check` on both files, no new issues | met | Guard ran: "Checked 2 files ✔ No issues" |
| No files outside scope modified | met | `git diff --stat 570668f...advisor/001` → src/index.ts (+41/−17), tests/transform.test.ts (+27) only |
| Batch README status row updated | met | Updated by guard (index maintained by reviewer per dispatch override) |

## Spirit

The plan's intent was to make compound selectors of scoped classes survive Svelte's unused-CSS pruning by fixing class collection, not by patching symptoms. The diff does exactly that: class names are now collected from selector preludes only (so the lookbehind that protected declaration values became unnecessary and is gone), and the specificity boost doubles every scoped class in a compound. The field-reported case — marker missing `paged`, warning `.page-rows.page-rows.paged` — is now covered by a permanent regression test asserting the corrected output shape. No symptom-patching, no marker hacks.

## Scope & conduct

- In-scope only? Yes — two files, verified by three-dot diff from the fork point.
- STOP conditions respected? Yes — none were hit; the executor stopped cleanly after the red phase as dispatched.
- Plan amendments during execution: one, pre-dispatch (2026-07-23) — removed references to the deleted `HANDOFF-compound-selector-pruning.md` at the operator's direction; content was already inlined. No goalpost movement.
- Documented deviation accepted on merit: `classPattern.lastIndex = 0` per prelude (required for the shared `/g` regex across visitor calls).

## Residual risk / follow-ups

- Scope hashes change for components whose CSS contains compound selectors of known classes (boosted CSS feeds the hash) — cosmetic, no consumer action.
- Element-qualified compounds (`button.foo`) and combinator selectors (`.a .b`) still prune — that is plan 002, stacked on this branch.
- Deferred: e2e fixture case; `DEFAULT_RUNTIME_MODULE` mismatch with the published package name (separate finding in the batch README).
- History on the branch is red→green by design: 165c516 (failing tests) → 74ecd0e (fix). Do not squash if you want the red commit demonstrable.
