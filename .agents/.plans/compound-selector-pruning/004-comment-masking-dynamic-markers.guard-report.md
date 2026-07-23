# Guard report — 004 comment-masking-dynamic-markers

**Recommendation: PASS** — all three do-not-ship findings fixed red-first, the svelte:element redesign deletes more code than it adds while widening coverage, and every criterion plus all three end-to-end repros reproduced green under guard's own runs.
**Reviewed at** 14501d7 · 2026-07-23 18:12 · **Plan planned at** c136853 (plan committed at c649bf4; drift check via ancestor assertion passed)
**Integrated** — fast-forwarded to `feat/compound-selector-pruning` and pushed; PR #12 updated (see batch README for the commit range).

## Done criteria

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| 3 Step-1 red tests exist and pass (each failed at plan time) | met | Red at 8606096 guard-reproduced (`3 failed \| 16 passed` in file); green in 28/28 at 14501d7 |
| All unit tests + full gate | met | Guard re-ran: `Tests 28 passed (28)`; `pnpm run check` exit 0 |
| `grep -c "VOID_TYPES\|UNSYNTHESIZABLE_TYPES" src/index.ts` → 0 | met | Guard ran: 0 |
| No `warningFilter` suppression in the a11y test | met | Test 2 compiles unfiltered and asserts `warnings.filter(a11y)` empty — the blind spot Codex flagged is permanently closed |
| Docs aligned, no new problems | met | Executor's before/after problem-list diff empty; guard's audit of the prose diffs matches the new behavior (skip list shrinks correctly) |
| Trunk clean, scope clean | met | "Checked 5 files ✔ No issues"; status shows only in-scope files |
| End-to-end: all three findings fixed | met | Guard ran Codex's original repros against built dist: commented combinator kept; 0 a11y warnings; `p.a p.b`/`a.a a.b` compile and kept |

## Spirit

The review asked whether the typed-marker approach was the right design — and the honest answer was no: patching it (svelte-ignore comments, a content-model rule table) would have added a third and fourth special case to a mechanism that already needed two. The dynamic-element marker answers the design question instead: one node shape that the pruner must treat as any-type, eliminating the a11y surface, the void rules, the reserved-tag set, and the nesting hazards simultaneously — net −11 lines. Coverage widened (`input.a .b`, `body.foo`-class rules now defended) and the docs shrank their caveat list accordingly.

## Scope & conduct

- In-scope only? Yes — 5 files.
- STOP conditions respected? Exemplary: the executor STOPPED the initial dispatch when the plan file was missing from the worktree (reviewer's uncommitted-plan error, checkpoint 0) and refused to reconstruct tests from the summary; it also pre-verified the pruner-conservatism assumption empirically before rewriting legacy tests rather than discovering a failure late.
- Plan amendments: none post-commit; one deviation accepted as advisor over-specification (contiguous `.a.a .b.b` assertion — infeasible in kept output; split without weakening).
- Commits by guard only: c649bf4 (plan) → 8606096 (red) → 14501d7 (green).

## Residual risk / follow-ups

- The design depends on Svelte's pruner treating `svelte:element` as matching any type selector. The compile-level tests are the tripwire; if a future Svelte constant-folds literal `this={'x'}`, switch to a non-foldable expression (documented in the plan's maintenance notes).
- Attribute selectors and functional pseudo matching remain unmatched (correct `css_unused_selector` warnings) — unchanged limitation, still documented.
- The pruning-exemption tradeoff from plan 003's docs now extends to element-qualified rules of any tag — the limits page reflects this.
