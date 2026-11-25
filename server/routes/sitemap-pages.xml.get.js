import { defineCachedEventHandler } from 'nitropack/runtime'
import { sendXml, siteOrigin, urlset } from '../utils/sitemap.js'

const paths = ['/', '/blog', '/faq', '/panduan', '/tentang', '/kebijakan']
const slugify = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default defineCachedEventHandler(async event => {
    const origin = siteOrigin(event)
    const response = await $fetch(`${useRuntimeConfig(event).public.apiBase}/products/categories`, { retry: 1, timeout: 8000 }).catch(() => null)
    const categories = response?.success ? response.data : []
    return sendXml(event, urlset([
        ...paths.map(path => ({ loc: origin + path })),
        ...categories.map(name => ({ loc: `${origin}/kategori/${slugify(name)}` })),
    ]))
}, { maxAge: 600, swr: true, name: 'sitemap-pages' })
