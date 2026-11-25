export const escapeXml = value => String(value).replace(/[<>&'"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char])

export const siteOrigin = event => String(useRuntimeConfig(event).public.siteUrl).replace(/\/$/, '')

// Ambil daftar ringan (slug + updated_at) dari endpoint sitemap backend yang sudah di-cache.
export const fetchSitemapRows = async (event, resource) => {
    const response = await $fetch(`${useRuntimeConfig(event).public.apiBase}/sitemap/${resource}`, { retry: 1, timeout: 10000 }).catch(() => null)
    return response?.success && Array.isArray(response.data) ? response.data : []
}

export const urlset = urls => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({ loc, lastmod }) => `<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`).join('')}</urlset>`

export const sendXml = (event, body) => {
    setResponseHeaders(event, {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    })
    return body
}
