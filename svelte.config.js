import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { scopedProps } from './dist/index.js'

const config = {
    preprocess: [vitePreprocess(), scopedProps()],
    kit: {
        adapter: adapter()
    }
}

export default config
