import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const packageRuntime = fileURLToPath(new URL('./src/runtime.ts', import.meta.url));

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      'svelte-scoped-props/runtime': packageRuntime
    }
  }
});
