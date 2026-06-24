import { json } from '@sveltejs/kit'
import { render } from 'svelte/server'
import SsrProbe from '../lib/probes/SsrProbe.svelte'

export function GET() {
    const rendered = render(SsrProbe)

    return json({
        head: rendered.head,
        body: rendered.body
    })
}
