# svelte-scoped-props

Experimental Svelte preprocessor for usage-site scoped component class props.

```svelte
<ChildCard scoped:class="parent-owned" />
<MotionBox scoped:class={['panel', { active }]} />
<FancyCard scoped:internalClass="inner-panel" />
```

The directive is rewritten before Svelte parses the component:

```svelte
<ChildCard class="parent-owned svelte-abc123" />
```

Dynamic values are routed through a tiny `ClassValue` helper that appends the current component's CSS hash.

## Install

```sh
pnpm add -D svelte-scoped-props
```

```ts
// svelte.config.ts
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { scopedProps } from 'svelte-scoped-props'

export default {
    preprocess: [vitePreprocess(), scopedProps()]
}
```

Place `scopedProps()` after style preprocessors. The package computes the same default CSS hash Svelte uses, so it needs to see the post-processed CSS.

## ESLint

`eslint-plugin-svelte` compiles the raw `.svelte` source for `svelte/valid-compile`, so `scoped:class` needs the same rewrite during linting:

```js
// eslint.config.js
import svelte from 'eslint-plugin-svelte'
import scopedProps from '@humanspeak/svelte-scoped-props/eslint'

export default [...svelte.configs['flat/recommended'], ...scopedProps.configs.recommended]
```

Place the scoped props config after the Svelte flat config. ESLint only supports one active processor per file, so this keeps the Svelte parser and rules while the scoped props processor supplies transformed markup. Static values, dynamic `ClassValue` expressions, and scoped aliases use the same transform as the Svelte preprocessor. Parent-side spread objects still cannot express scoped intent; scope the prop before it is spread, then forward the transformed prop normally.

If you pass custom hash options to the Svelte preprocessor, pass the same options to ESLint:

```js
import svelte from 'eslint-plugin-svelte'
import { createProcessor } from '@humanspeak/svelte-scoped-props/eslint'

export default [
    ...svelte.configs['flat/recommended'],
    {
        files: ['**/*.svelte'],
        processor: createProcessor({ cssHash })
    }
]
```

## Alpha Test Pages

```sh
pnpm install
pnpm run dev
```

The visual checklist lives at `/tests/scoped-props`. It is intentionally a SvelteKit test page, not docs. Playwright tests in `e2e/` exercise that route so the package behavior stays provable while the API is still experimental.

Useful commands:

```sh
pnpm run check
pnpm run test:e2e
pnpm run test:all
pnpm pack --dry-run
```

## Current Limits

- This is an experiment, not a Svelte core feature.
- The package mirrors Svelte's private default hash function because Svelte does not publicly export it. If Svelte changes that private implementation, this package can drift until it is updated. Native compiler support would use Svelte's already-computed scope hash instead.
- It only supports component tags with uppercase or dotted names.
- It preserves scoped CSS selectors by injecting an uncalled snippet marker. That marker does not render, but it does leave a small unused function in the compiled module.
- If a project uses a custom Svelte `cssHash`, pass the same function to `scopedProps({ cssHash })`.
- The default hash path normalizer matches Vite/SvelteKit's repo-relative filenames for files inside `process.cwd()`. Disable that with `scopedProps({ normalizeFilename: false })` for direct `svelte.compile` experiments that use absolute filenames.
- Parent-side spread objects cannot express scoped intent. Scope the prop before it is spread.
