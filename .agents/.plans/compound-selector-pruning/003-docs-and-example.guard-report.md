# Guard report — 003 docs-and-example

**Recommendation: PASS** — the docs now say exactly what the verified behavior supports (no overclaiming), the example doubles as a living regression fixture (zero unused-CSS warnings for its compound/combinator rules), and every achievable criterion reproduced green; the one failed criterion was unachievable before work started and is amended, not waived around weak work.
**Reviewed at** bcfb645 · 2026-07-23 15:51 · **Plan planned at** 9e266e5 (same-day; no source drift — the plan's ancestor check passed)
**Integrated** — no PR opened: integration target remains the stacked branches per operator instruction; `advisor/003-docs-and-example` sits on `advisor/002-structural-marker-synthesis`.

## Done criteria

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Docs check: no new errors/warnings vs baseline; zero mention of new example | met | Guard re-ran: `13 ERRORS 23 WARNINGS` vs baseline `14/23` (net −1 error, 0 new); zero `Unused CSS selector` lines; zero problems referencing CompoundSelector/compound-selector |
| `pnpm --filter docs lint` exits 0 | AMENDED | Pre-existingly red before any change (prettier on 2 untouched generated/vendored files; 19 pre-existing eslint `prefer-const` errors across all sibling demos). Replaced per dated plan revision with: prettier-clean changed files + trunk clean + no new problems beyond the sibling-shared pattern — all met (`trunk check` 8 files "✔ No issues") |
| Root `pnpm run check` exits 0 | met | Guard re-ran: exit 0 (library untouched) |
| Stale hedge gone ("normal class selectors") | met | Grep: no matches in limits page |
| Limits page names the skip list | met | `attribute selectors` and `:has` both present in the new "Selector support" section |
| `/examples/compound-selector` route + index entry + catalog sync | met (sync amended) | Route pair and `exampleCases` entry committed at bcfb645; `examples-catalog:sync` is a no-op in this repo (catalog object refactored out of `+page.ts`) — plan revision records it; nothing to regenerate |
| No files outside scope | met | `git status` clean after commits; 8 files, all in-scope |
| Batch README status updated | met | Maintained by guard |

## Spirit

The plan's intent was that the next field adopter should not rediscover any of this the hard way. The limits page now carries the support matrix and — more importantly — the honest skip list and the pruning-exemption tradeoff, which existed nowhere user-visible before. The example is the field report made live: the same conditionally-toggled compound the first adopter had to work around, plus a combinator rule, with `svelte-check`'s zero unused-CSS warnings as the standing proof. Prose was audited claim-by-claim against the tested behavior; nothing promises more than plans 001/002 deliver.

## Scope & conduct

- In-scope only? Yes — 8 files, verified by status and diff.
- STOP conditions respected? Yes — the executor correctly judged the pre-existing red docs check/lint as reportable context rather than STOPs (the check ran to completion; the plan's STOP was for an outright failure), and documented every deviation instead of improvising.
- Plan amendments: one post-execution revision (dated) covering the two planning-assumption defects — the unverifiable lint criterion (advisor recon miss) and the dead catalog-sync script. Neither weakens a criterion the work could actually have met.
- Executor judgment call accepted: exemplar-verbatim `let … = $derived(…)` in the new demo (adds one instance of the error pattern all six siblings share; consistency chosen over a lone lint-clean outlier).

## Residual risk / follow-ups

- **Docs lint gate is red repo-wide** (prettier on `src/worker-configuration.d.ts` + a vendored skill file; eslint `prefer-const` from the scoped-props processor on every `let x = $derived(...)` demo). Candidate future plan: fix the prettier ignores, then either a directory-wide `const` sweep or teach the ESLint processor rune-awareness — the latter is a library bug worth investigating.
- **`examples-catalog:sync` is dead code** — it scans for a catalog object that no longer exists in `examples/+page.ts`. Remove the script or restore the pattern; until then the hardcoded `exampleCases` array is the only registry (documented in the plan revision).
- The README install section still shows the unscoped package name — deliberately untouched; coupled to the `DEFAULT_RUNTIME_MODULE` fix (deferred finding in the batch README).
- If selector support grows (`:has()`, attribute selectors), the limits matrix and the example page are the two places to update.
