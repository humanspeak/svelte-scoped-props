import SsrProbe from '$lib/examples/scoped-props/demos/SsrProbe.svelte'
import { json } from '@sveltejs/kit'
import { render } from 'svelte/server'

export function GET() {
    const rendered = render(SsrProbe)

    return json({
        head: rendered.head,
        body: rendered.body
    })
}
