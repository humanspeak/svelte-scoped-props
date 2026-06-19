import { json } from '@sveltejs/kit'
import { render } from 'svelte/server'
import SsrProbe from '$lib/examples/scoped-props/demos/SsrProbe.svelte'

export function GET() {
    const rendered = render(SsrProbe)

    return json({
        head: rendered.head,
        body: rendered.body
    })
}
