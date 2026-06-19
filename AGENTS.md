# svelte-scoped-props Agent Notes

This repo is an experimental package for proving the `scoped:<propName>` idea outside Svelte core.

## Current Goal

Prototype an installable ecosystem package that lets users write:

```svelte
<Component scoped:class="parent-owned" />
<Component scoped:class={classValue} />
<Component scoped:internalClass="parent-owned" />
```

The package rewrites those directives before Svelte parses the file, so the child receives a normal prop:

```svelte
<Component class="parent-owned svelte-abc123" />
```

## Hard-Won Design Notes

- Plain `class` on a component must not become magical. Components can use a prop named `class` for non-CSS data.
- The explicit syntax is the point. `scoped:class` says the parent owns the CSS token and wants the current component's scope hash attached.
- The child still controls where the prop is applied. This feature only prepares the value.
- `scoped:internalClass` and other aliases matter because wrapper components often expose class-like props that are not literally named `class`.
- Once a prop is scoped, it can be forwarded through a middle component with `{...props}` because it is just a normal prop after the parent transform.
- Parent-side spread objects cannot express scoped intent. Do not try to make `{...props}` magic at the parent call site.
- TypeScript cannot save the automatic `class` approach at this layer. Svelte strips TS before the compiler phase where class injection was prototyped, and full semantic typing would require a project graph.
- Build-time child prop metadata was considered but nixed for now because it starts rebuilding Svelte's module graph around a narrow styling feature.
- Rich Harris has historically pushed back on automatic component `class` magic. Keep this package explicit and usage-site controlled.

## External Package Strategy

The package uses a Svelte preprocessor. Install shape:

```ts
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { scopedProps } from 'svelte-scoped-props';

export default {
  preprocess: [vitePreprocess(), scopedProps()]
};
```

`scopedProps()` should run after style preprocessors. Svelte's default CSS hash is based on the filename when available, otherwise the CSS, and CSS preprocessors can change the CSS before hashing.

## Implementation Notes

- `src/index.ts` owns the markup transform.
- `src/hash.ts` mirrors Svelte's default CSS hash behavior.
- `src/runtime.ts` owns dynamic `ClassValue` handling.
- Literal scoped values are rewritten directly.
- Dynamic scoped values import `scopedClass` from `svelte-scoped-props/runtime`.
- The preprocessor sees absolute filenames in Vite, while Svelte/Vite's CSS hash path is repo-relative in this demo. The package therefore normalizes filenames under `process.cwd()` to POSIX relative paths by default.
- CSS pruning is the awkward part outside core. Svelte does not count component props as local CSS usage, so this package injects an uncalled snippet containing the local class names from the component's `<style>`.
- The snippet does not render, but it keeps Svelte's CSS analysis from commenting out the parent selectors. This is acceptable for an experiment and a good thing to call out in an upstream issue.

## Test Page Cases

The visual repro lives in `src/routes/tests/scoped-props`. Keep it as a test page, not docs. Playwright tests in `e2e/` should assert the behavior directly against that page and its SSR endpoint.

- Explicit scoped literal prop
- Plain component class is not scoped
- SSR scoped literal prop through `/tests/scoped-props/ssr-check`
- Explicit scoped dynamic `ClassValue`
- Non-`ClassValue` class prop remains untouched when plain `class` is used
- Explicit scoped prop alias
- Scoped prop through spread forwarding

Keep each case in its own component. The page is for reviewers, so avoid a mega-component.

## Commands

```sh
pnpm install
pnpm run check
pnpm run test:e2e
pnpm run test:all
pnpm run dev
pnpm pack --dry-run
```

## Release Notes

- The package is alpha-publishable and uses `publishConfig.tag = "alpha"`.
- `npm-publish.yml` is manual-only for now and can publish with the `alpha`, `beta`, or `latest` dist-tag.
- Docs and Cloudflare deploy workflows are placeholders until a real docs app exists.
- Coveralls and Trunk workflows are placeholders until those services are intentionally wired for this repo.

## Caution

This package is a proof vehicle, not the final ideal implementation. Native Svelte support can handle parser validation, CSS pruning, SSR, and runtime helper placement more cleanly than a preprocessor can.
