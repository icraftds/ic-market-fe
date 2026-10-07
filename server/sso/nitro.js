import { defineEventHandler, toWebRequest, sendWebResponse } from 'h3'
import { marketRuntime } from './runtime.js'
import { handleSso } from './handler.js'
import { SsoError, noStoreHeaders } from './security.js'

export default defineEventHandler(async event => {
    try {
        return await sendWebResponse(event, await handleSso(toWebRequest(event), marketRuntime(useRuntimeConfig(event).sso)))
    } catch (error) {
        const safe = error instanceof SsoError ? error : new SsoError(503, 'SSO service is unavailable.')
        return sendWebResponse(event, new Response(JSON.stringify({ message: safe.message, code: safe.code }), { status: safe.status, headers: { ...noStoreHeaders, 'content-type': 'application/json' } }))
    }
})
