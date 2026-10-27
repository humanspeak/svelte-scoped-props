import { paraglideMiddleware } from '#lib/paraglide/server.js'
import { getPostHogClient } from '#lib/server/posthog.js'
import { createSecurityHeadersHandle } from '@humanspeak/docs-kit/hooks'
import { sequence, type Handle, type HandleServerError } from '@sveltejs/kit/hooks'

const handleParaglide: Handle = ({ event, resolve }) =>
    // Kit 3 makes `event.request` read-only, so the de-localized request from
    // paraglide is no longer swapped in. Routing is unaffected: the `reroute`
    // hook (src/hooks.ts) already de-localizes the path, and the site ships a
    // single base locale with no URL prefix.
    paraglideMiddleware(event.request, ({ locale }) =>
        resolve(event, {
            transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
        })
    )

const handlePostHogProxy: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url

    if (pathname.startsWith('/ingest')) {
        const useAssetHost =
            pathname.startsWith('/ingest/static/') || pathname.startsWith('/ingest/array/')
        const hostname = useAssetHost ? 'us-assets.i.posthog.com' : 'us.i.posthog.com'
        const url = new URL(event.request.url)

        url.protocol = 'https:'
        url.hostname = hostname
        url.port = '443'
        url.pathname = pathname.replace(/^\/ingest/, '')

        const headers = new Headers(event.request.headers)

        headers.set('host', hostname)
        headers.set('accept-encoding', '')

        const clientIp = event.request.headers.get('x-forwarded-for') || event.getClientAddress()

        if (clientIp) {
            headers.set('x-forwarded-for', clientIp)
        }

        const response = await fetch(url.toString(), {
            method: event.request.method,
            headers,
            body: event.request.body,
            // @ts-expect-error - duplex is required for streaming request bodies
            duplex: 'half'
        })

        return response
    }

    return resolve(event)
}

export const handle: Handle = sequence(
    handlePostHogProxy,
    handleParaglide,
    createSecurityHeadersHandle()
)

// Kit 3 routes expected errors (404s, `error()` calls) through this hook too;
// only report genuinely unexpected ones, as Kit 2 did. Returning nothing keeps
// SvelteKit's default status and message (500 / "Internal Error" for unknown errors).
export const handleError: HandleServerError = ({ kind, error }) => {
    if (kind !== 'unknown') return

    getPostHogClient().capture({
        distinctId: 'server',
        event: 'server_error',
        properties: {
            error: error instanceof Error ? error.message : String(error),
            status: 500,
            message: 'Internal Error'
        }
    })
}
