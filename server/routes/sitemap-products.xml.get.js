import { defineCachedEventHandler } from 'nitropack/runtime'
import { fetchSitemapRows, sendXml, urlset } from '../utils/sitemap.js'

// Backend sudah mengirim URL lengkap + lastmod, jadi di sini tinggal dibungkus ke XML.
export default defineCachedEventHandler(async event => {
    const rows = await fetchSitemapRows(event, 'products')
    return sendXml(event, urlset(rows.filter(row => row.loc)))
}, { maxAge: 600, swr: true, name: 'sitemap-products' })
