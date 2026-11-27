#!/usr/bin/env node
// Audit SEO terhadap server produksi lokal (node .output/server/index.mjs). Tanpa dependensi.
// Pakai: npm run audit:seo -- [--base http://127.0.0.1:3992] [--product slug] [--store slug] [--category slug]
// Tanpa --product/--store/--category, slug diambil dari sitemap (butuh backend hidup).
const args = process.argv.slice(2)
const opt = (name, fallback) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : fallback }
const base = String(opt('base', process.env.SEO_AUDIT_BASE || 'http://127.0.0.1:3992')).replace(/\/$/, '')

const results = []
const check = (page, name, ok, detail = '') => { results.push({ page, name, ok: !!ok, detail }) }
const get = async (path) => {
  try {
    const res = await fetch(base + path, { redirect: 'manual', headers: { accept: 'text/html,application/xml,text/plain' } })
    return { status: res.status, body: await res.text(), headers: res.headers }
  } catch (e) { return { status: 0, body: '', headers: new Headers(), error: e.message } }
}

const attrs = (tag) => {
  const out = {}
  for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*"([^"]*)"|([a-zA-Z:_-]+)\s*=\s*'([^']*)'/g)) out[(m[1] || m[3]).toLowerCase()] = m[2] ?? m[4]
  return out
}
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => attrs(m[0]))
const metas = (html) => tags(html, 'meta')
const metaBy = (html, key, val) => metas(html).filter(m => m[key] === val)
const stripText = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const jsonLd = (html) => [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
const flatten = (v) => Array.isArray(v) ? v.flatMap(flatten) : v && typeof v === 'object' ? [v, ...(Array.isArray(v['@graph']) ? v['@graph'].flatMap(flatten) : [])] : []

const publicPage = async (path, { ldTypes = [], minLinks = null, linkPrefix = null, h1 = 1 } = {}) => {
  const p = path
  const r = await get(path)
  check(p, 'status 200', r.status === 200, `status ${r.status}${r.error ? ' ' + r.error : ''}`)
  if (r.status !== 200) return
  const html = r.body
  const h1s = [...html.matchAll(/<h1\b[\s\S]*?<\/h1>/gi)]
  check(p, `tepat satu <h1>`, h1s.length === h1, `ditemukan ${h1s.length}`)
  if (h1s[0]) check(p, '<h1> tidak kosong', stripText(h1s[0][0]).length > 0)
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  check(p, '<title> ada', !!title, title || '')
  const desc = metaBy(html, 'name', 'description')
  check(p, 'meta description tepat satu & tidak kosong', desc.length === 1 && (desc[0].content || '').length >= 20, `jumlah ${desc.length}`)
  const canon = tags(html, 'link').filter(l => l.rel === 'canonical')
  check(p, 'canonical tepat satu', canon.length === 1, `jumlah ${canon.length}`)
  if (canon[0]) check(p, 'canonical absolut & path sesuai', /^https?:\/\//.test(canon[0].href) && new URL(canon[0].href).pathname.replace(/\/$/, '') === path.replace(/\/$/, ''), canon[0].href)
  for (const k of ['og:title', 'og:description', 'og:image', 'og:type', 'og:site_name']) {
    const m = metaBy(html, 'property', k)
    check(p, k, m.length >= 1 && !!m[0].content, `jumlah ${m.length}`)
  }
  const robots = metaBy(html, 'name', 'robots')
  check(p, 'robots meta: satu dan tidak noindex', robots.length === 1 && !/noindex/i.test(robots[0].content || ''), robots.map(r => r.content).join(' | '))
  // JSON-LD
  const blocks = jsonLd(html)
  check(p, 'JSON-LD ada', blocks.length > 0)
  const types = []
  let parseOk = true
  for (const b of blocks) {
    try { for (const o of flatten(JSON.parse(b))) if (o['@type']) types.push(...[].concat(o['@type'])) } catch { parseOk = false }
  }
  check(p, 'JSON-LD valid (JSON.parse)', parseOk && blocks.length > 0)
  for (const t of ldTypes) check(p, `JSON-LD bertipe ${Array.isArray(t) ? t.join('|') : t}`, [].concat(t).some(x => types.includes(x)), `tipe: ${[...new Set(types)].join(',')}`)
  // Link & gambar
  if (linkPrefix) {
    const anchors = tags(html, 'a').filter(a => a.href && a.href.startsWith(linkPrefix) && a.href.length > linkPrefix.length)
    check(p, `link ${linkPrefix}* berupa <a href> (min ${minLinks})`, anchors.length >= minLinks, `ditemukan ${anchors.length}`)
  }
  const imgs = tags(html, 'img')
  const noAlt = imgs.filter(i => i.alt === undefined)
  check(p, 'semua <img> punya atribut alt', noAlt.length === 0, noAlt.length ? `${noAlt.length}/${imgs.length} tanpa alt, contoh ${noAlt[0].src}` : `${imgs.length} gambar`)
  const emptyAltContent = imgs.filter(i => i.alt === '' && i.src && /\/(products?|stores?)\//.test(i.src))
  check(p, 'gambar konten tidak beralt kosong', emptyAltContent.length === 0, emptyAltContent.length ? `${emptyAltContent.length}, contoh ${emptyAltContent[0].src}` : '')
}

const privatePage = async (path) => {
  const r = await get(path)
  // Halaman privat boleh 200 (shell SPA) atau redirect; yang wajib: bila 200, noindex.
  if (r.status >= 300 && r.status < 400) return check(path, 'redirect (tidak terindeks)', true, `-> ${r.headers.get('location')}`)
  check(path, 'status 200', r.status === 200, `status ${r.status}`)
  if (r.status !== 200) return
  const robots = metaBy(r.body, 'name', 'robots')
  const header = r.headers.get('x-robots-tag') || ''
  const ok = (robots.length > 0 && robots.every(m => /noindex/i.test(m.content || ''))) || /noindex/i.test(header)
  check(path, 'robots noindex (semua tag robots)', ok, robots.map(m => m.content).join(' | ') || 'tidak ada meta robots')
}

const privatePaths = ['/cart', '/checkout', '/cari', '/seller', '/akun', '/hosting/pesan']
const urlsFromSitemap = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'))

const run = async () => {
  const sm = await get('/sitemap.xml')
  const sitemaps = sm.status === 200 ? urlsFromSitemap(sm.body) : []
  const allUrls = []
  check('/sitemap.xml', 'status 200 & sitemapindex valid', sm.status === 200 && /<sitemapindex[\s>]/.test(sm.body) && sitemaps.length > 0, `status ${sm.status}`)
  for (const loc of sitemaps) {
    const path = new URL(loc).pathname
    const r = await get(path)
    const wellFormed = r.status === 200 && /<urlset[\s>]/.test(r.body) && /<\/urlset>\s*$/.test(r.body) && /xml/.test(r.headers.get('content-type') || '')
    check(path, 'status 200, content-type xml, <urlset> utuh', wellFormed, `status ${r.status} ${r.headers.get('content-type') || ''}`)
    if (r.status === 200) allUrls.push(...urlsFromSitemap(r.body))
  }
  const sitemapPaths = allUrls.map(u => { try { return new URL(u).pathname } catch { return u } })
  check('sitemap', 'semua <loc> absolut http(s)', allUrls.every(u => /^https?:\/\//.test(u)))
  check('sitemap', 'tidak ada duplikat', new Set(allUrls).size === allUrls.length)
  const privatePrefixes = ['/admin', '/seller', '/cart', '/checkout', '/payment', '/success', '/orders', '/profile', '/topup', '/vouchers', '/login', '/register', '/auto-login', '/auth', '/api', '/akun', '/cari', '/dev', '/hosting/pesan']
  const leaks = sitemapPaths.filter(p => privatePrefixes.some(x => p === x || p.startsWith(x + '/')))
  check('sitemap', 'tidak memuat rute privat', leaks.length === 0, leaks.join(', '))

  const robotsTxt = await get('/robots.txt')
  check('/robots.txt', 'status 200 text/plain', robotsTxt.status === 200 && /text\/plain/.test(robotsTxt.headers.get('content-type') || ''), `status ${robotsTxt.status} ${robotsTxt.headers.get('content-type') || ''}`)
  check('/robots.txt', 'ada User-agent & Sitemap:', /^User-agent:/mi.test(robotsTxt.body) && /^Sitemap:\s*https?:\/\//mi.test(robotsTxt.body))
  const disallows = [...robotsTxt.body.matchAll(/^Disallow:\s*(\S+)/gmi)].map(m => m[1])
  check('/robots.txt', 'tidak memblokir seluruh situs / halaman publik', !disallows.includes('/') && !disallows.some(d => ['/product', '/kategori', '/store', '/hosting'].includes(d.replace(/\/$/, ''))), disallows.join(' '))
  for (const p of ['/admin', '/seller', '/cart', '/checkout', '/api']) check('/robots.txt', `Disallow ${p}`, disallows.some(d => p === d.replace(/\/$/, '') || d.startsWith(p + '/') || d === p))
  for (const m of robotsTxt.body.matchAll(/^Sitemap:\s*(\S+)/gmi)) check('/robots.txt', 'Sitemap menunjuk indeks yang dikenal', sitemaps.length === 0 || m[1].endsWith('/sitemap.xml'), m[1])

  const pick = (re, flag) => opt(flag) || sitemapPaths.find(p => re.test(p))?.split('/').pop()
  const productSlug = pick(/^\/product\//, 'product')
  const storeSlug = pick(/^\/store\//, 'store')
  const categorySlug = pick(/^\/kategori\//, 'category') || 'software'

  await publicPage('/', { ldTypes: [['WebSite', 'Organization']], linkPrefix: '/product/', minLinks: 1 })
  await publicPage(`/kategori/${categorySlug}`, { ldTypes: [['CollectionPage', 'ItemList', 'BreadcrumbList']], linkPrefix: '/product/', minLinks: 1 })
  if (productSlug) await publicPage(`/product/${productSlug}`, { ldTypes: ['Product'] })
  else check('/product/<slug>', 'ada slug produk untuk diuji', false, 'sitemap produk kosong; beri --product')
  if (storeSlug) await publicPage(`/store/${storeSlug}`, { ldTypes: [['Store', 'Organization', 'LocalBusiness', 'ProfilePage', 'CollectionPage']], linkPrefix: '/product/', minLinks: 0 })
  else check('/store/<slug>', 'ada slug toko untuk diuji', false, 'sitemap toko kosong; beri --store')
  await publicPage('/hosting', { ldTypes: ['Product'] })
  await publicPage('/seller/register', { ldTypes: ['WebPage', 'FAQPage'] })
  for (const p of privatePaths) await privatePage(p)
}

await run()
let failed = 0
let last = null
for (const r of results) {
  if (r.page !== last) { console.log(`\n${r.page}`); last = r.page }
  if (!r.ok) failed++
  console.log(`  ${r.ok ? 'OK  ' : 'FAIL'} ${r.name}${r.detail && !r.ok ? '  [' + r.detail + ']' : ''}`)
}
console.log(`\n${results.length - failed}/${results.length} lulus, ${failed} gagal (base ${base})`)
process.exit(failed ? 1 : 0)
