# Guard report — 002 example-sections-restructure

**Recommendation: PASS** — all 8 example pages restructured with verbatim content fidelity, the mirror plugin wired and emitting complete mirrors (shared-component source intact, zero duplication), the manual dependency map retired to the org's map-less pattern, and every criterion reproduced under guard's own runs.
**Reviewed at** e7efd2c · 2026-07-23 19:47 · **Plan planned at** 98e3ee7 (amended twice, both operator-recorded: Path A in-place design at 46884fd; rev2 map retirement at 3d39e27)
**Integrated** — cherry-picked onto `chore/package-updates` as 51f95b2 + 35bcd25 (histories had diverged: the rev2 plan commit landed on the branch after the worktree fork, so no fast-forward; the picks applied conflict-free and guard re-verified the docs gate post-pick). No PR — branch not yet published, per the operator's "all on this branch" instruction.

## Done criteria (amended set)

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| All 8 pages `const sections: ExampleSection[]` + `{#each}` | met | Guard ran `grep -L "const sections"` → empty; imports from `@humanspeak/docs-kit` ×8 |
| Demo keys/folders unchanged | met | No moves in either commit; 35 `scoped-props/demos` key references intact |
| Wrapper retired | met | `demo-code-samples.ts` deleted; `grep -rn "demo-code-samples" docs/src` → 0 |
| Plugin wired + outputs gitignored | met | Registered after docMirrorsPlugin; `git check-ignore` passes; status clean of mirrors |
| 8 complete mirrors incl. shared source | met | Guard verified `docs/static/examples/` ×8; ChildCard present in compound-selector's mirror; executor verified all 5 ChildCard consumers + spread/ssr extras |
| Docs check problem set = 10/6 baseline | met | Guard re-ran: `10 ERRORS 6 WARNINGS`, SsrLiteral error at unchanged path |
| Root gate, trunk, scope | met | `pnpm run check` exit 0 (28/28); trunk "No issues" (10 files); 11 changed files all in-scope |

## Spirit

The plan's goal was full docs-kit 2026.7.6 parity without content loss. The investigation phase (checkpoint 1) prevented the worst outcome — my original per-slug design would have silently dropped shared-component source from 4 of 5 mirrors or forced ×5 duplication. What landed instead is strictly better than the sibling repos' own pattern for this repo's topology: sibling-standard page structure, mirrors with complete source, zero file moves, and one less hand-maintained registry (`demoCodeDependencies` retired in favor of the map-less inline pattern svelte-markdown/virtual-chat use). Rendered output is panel-for-panel identical by construction and corroborated by the mirror source-file counts.

## Scope & conduct

- Two plan amendments, both PLAN DEFECT/operator-directed, dated and committed — never goalpost-moving: the work was held to the amended criteria, which are stricter where it matters (keys must NOT change).
- Executor conduct across the run: an exemplary investigation-first STOP with empirical proof for both resolution paths, a reverted throwaway pilot (clean tree at checkpoint), mid-run absorption of the rev2 addendum, and self-derived fidelity evidence (replicated the wrapper's id/label algorithm rather than eyeballing).
- All commits by guard: 2be5a73 (restructure), e7efd2c (plugin).

## Residual risk / follow-ups

- New example pages must use the sections pattern and inline `demoCodeSample` lists from day one; the compound-selector page is now a correct exemplar.
- Upstream docs-kit idea (operator-endorsed direction): auto-derive demo dependency panels by import-walking in `demoManifestPlugin` (the mirrors plugin already has the walk) — would remove even the inline lists. Candidate issue on humanspeak/docs-kit.
- Sibling parity tidbit for a future pass: svelte-virtual-chat pages set `seo.h1 = { title }` (the delta's context-driven h1); our pages don't use it yet.
- The vite dev server must be restarted (or will self-restart on config change) to pick up the new plugin.
