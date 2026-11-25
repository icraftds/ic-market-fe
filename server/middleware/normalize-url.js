import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

// URL kanonik: huruf kecil, tanpa trailing slash. Cegah duplikat (/FAQ, /faq/, /product/Slug/).
const SKIP = /^\/(?:api|auth|_nuxt|__nuxt|_ipx|\.well-known)(?:\/|$)/

export default defineEventHandler(event => {
    if (!['GET', 'HEAD'].includes(event.method)) return
    const url = getRequestURL(event)
    const path = url.pathname
    if (path === '/' || SKIP.test(path) || /\.[a-z0-9]{2,5}$/i.test(path)) return

    const normalized = path.replace(/\/+$/, '').toLowerCase()
    if (normalized && normalized !== path) return sendRedirect(event, normalized + url.search, 301)
})
