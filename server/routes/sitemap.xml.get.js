import { defineEventHandler } from 'h3'
import { escapeXml, sendXml, siteOrigin } from '../utils/sitemap.js'

// Sitemap index: mengarahkan ke sitemap halaman, toko, dan produk yang terpisah.
export default defineEventHandler(event => {
    const origin = siteOrigin(event)
    const now = new Date().toISOString()
    const items = ['pages', 'stores', 'products'].map(name => `<sitemap><loc>${escapeXml(`${origin}/sitemap-${name}.xml`)}</loc><lastmod>${now}</lastmod></sitemap>`).join('')
    return sendXml(event, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`)
})
