// Post-processes `wrangler types` output.
//
// Newer Wrangler versions emit `Cloudflare.GlobalProps.mainModule` as
// `typeof import("../.svelte-kit/cloudflare/_worker")`. Because the docs
// tsconfig enables `checkJs`, that import drags the built SvelteKit worker
// bundle into svelte-check whenever a production build exists locally,
// producing thousands of errors in generated code. The site does not use
// typed `ctx.exports`, so drop the block.
import { readFileSync, writeFileSync } from 'node:fs'

const file = new URL('../src/worker-configuration.d.ts', import.meta.url)
const source = readFileSync(file, 'utf8')
const stripped = source.replace(/\n\tinterface GlobalProps \{\n\t\tmainModule: [^\n]*\n\t\}/, '')

if (stripped !== source) {
    writeFileSync(file, stripped)
    console.log('Removed Cloudflare.GlobalProps.mainModule from worker-configuration.d.ts')
}
