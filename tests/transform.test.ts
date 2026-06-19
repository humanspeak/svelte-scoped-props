import { compile, preprocess } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { defaultCssHash, hash } from '../src/hash.js';
import { scopedProps, transformScopedProps } from '../src/index.js';

const filename = '/demo/Parent.svelte';
const expectedHash = defaultCssHash({
  css: '.parent-owned.parent-owned{color:purple}',
  filename,
  hash
});

describe('transformScopedProps', () => {
  it('rewrites literal scoped props into normal props with the parent scope hash', () => {
    const result = transformScopedProps(
      `<script>import Child from './Child.svelte';</script>
<Child scoped:class="parent-owned" />
<style>.parent-owned{color:purple}</style>`,
      { filename }
    );

    expect(result.code).toContain(`<Child class="parent-owned ${expectedHash}" />`);
    expect(result.code).toContain('.parent-owned.parent-owned{color:purple}');
    expect(result.code).toContain('{#snippet __svelte_scoped_props_marker()}');
  });

  it('rewrites dynamic scoped props through the runtime helper', () => {
    const result = transformScopedProps(
      `<script>import Child from './Child.svelte'; let dynamicClass = ['parent-owned'];</script>
<Child scoped:class={dynamicClass} />
<style>.parent-owned{color:purple}</style>`,
      { filename }
    );

    expect(result.code).toContain(
      `import { scopedClass as __svelte_scoped_props_class } from "svelte-scoped-props/runtime";`
    );
    expect(result.code).toContain(
      `<Child class={__svelte_scoped_props_class(dynamicClass, "${expectedHash}")} />`
    );
  });

  it('supports scoped prop aliases', () => {
    const result = transformScopedProps(
      `<script>import Child from './Child.svelte';</script>
<Child scoped:internalClass="parent-owned" />
<style>.parent-owned{color:purple}</style>`,
      { filename }
    );

    expect(result.code).toContain(`<Child internalClass="parent-owned ${expectedHash}" />`);
  });

  it('preserves parent selectors during Svelte CSS analysis', async () => {
    const source = `<script>import Child from './Child.svelte';</script>
<Child scoped:class="parent-owned" />
<style>.parent-owned{color:purple}</style>`;
    const processed = await preprocess(source, scopedProps(), { filename });
    const compiled = compile(processed.code, {
      filename,
      generate: 'client',
      warningFilter: () => false
    });

    expect(compiled.css?.code).toContain(`.parent-owned.parent-owned.${expectedHash}`);
    expect(compiled.css?.code).not.toContain('(unused) .parent-owned');
  });

  it('rejects scoped props on native elements', () => {
    expect(() =>
      transformScopedProps(`<div scoped:class="parent-owned"></div>`, { filename })
    ).toThrow('component tags');
  });
});
