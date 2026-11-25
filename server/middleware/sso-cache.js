import { defineEventHandler, getRequestHeader, getRequestURL, setResponseHeaders } from 'h3'
import { cacheHeadersFor } from '../sso/security.js'

export default defineEventHandler(event => {
    if (!useRuntimeConfig(event).sso.enabled) return
    setResponseHeaders(event, cacheHeadersFor({
        method: event.method,
        path: getRequestURL(event).pathname,
        cookie: getRequestHeader(event, 'cookie') || '',
    }))
})
