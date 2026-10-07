import { defineEventHandler, setResponseHeaders } from 'h3'
import { noStoreHeaders } from '../sso/security.js'

export default defineEventHandler(event => {
    if (useRuntimeConfig(event).sso.enabled) setResponseHeaders(event, noStoreHeaders)
})
