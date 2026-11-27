import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { safeReturnTo, loginUrl } from '../app/utils/authRouting.js'
import { safeUrl, safeLink, safePreviewUrl, PREVIEW_SANDBOX } from '../app/utils/safeUrl.js'
import { sanitizeHtml } from '../app/utils/sanitizeHtml.js'
import { validateUpload } from '../app/utils/uploadGuard.js'
import { contentSecurityPolicy, securityHeaders } from '../server/utils/securityHeaders.js'

test('open redirect: safeReturnTo hanya path internal', () => {
  const bad = ['//evil.com', '///evil.com', 'https://evil.com', 'javascript:alert(1)', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', '/\r/evil.com',
    '/%2F/evil.com', '/%2f%2fevil.com', '/%5Cevil.com', '/%252F/evil.com', '/%0d%0a', '/%09/evil.com', 'evil.com', '', null, undefined, 42, {}, [], '/%E0%A4%A', '/' + 'a'.repeat(2100)]
  for (const t of bad) assert.equal(safeReturnTo(t), '/', JSON.stringify(t))
  for (const ok of ['/', '/checkout', '/product/x?ref=a%20b', '/cari?q=a b#x', '/seller/onboarding']) assert.equal(safeReturnTo(ok), ok)
  assert.equal(loginUrl('//evil.com'), '/auth/start?return_to=%2F')
})

test('safeUrl menolak skema berbahaya dan penyamarannya', () => {
  for (const u of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,<script>1</script>', 'vbscript:x', 'file:///etc/passwd', 'blob:https://x/1', '//evil.com', 'https://u:p@evil.com', '/\\evil.com', '', null, 5])
    assert.equal(safeUrl(u, { allowRelative: true }), '', String(u))
  assert.equal(safeUrl('https://a.id/x?y=1'), 'https://a.id/x?y=1')
  assert.equal(safeUrl('/x'), '')
  assert.equal(safeUrl('/x', { allowRelative: true }), '/x')
  assert.equal(safeLink('mailto:a@b.id'), 'mailto:a@b.id')
  assert.equal(safeLink('javascript:1'), '')
})

test('preview iframe: https, bukan origin situs, sandbox tanpa top-navigation', () => {
  assert.equal(safePreviewUrl('https://engine.example/p/1', 'https://market.icraftds.id'), 'https://engine.example/p/1')
  assert.equal(safePreviewUrl('https://market.icraftds.id/x', 'https://market.icraftds.id'), '')
  assert.equal(safePreviewUrl('http://evil.example/x', 'https://market.icraftds.id'), '')
  assert.equal(safePreviewUrl('http://localhost:9000/x', 'http://localhost:3000'), 'http://localhost:9000/x')
  assert.equal(safePreviewUrl('javascript:1', ''), '')
  assert.ok(!PREVIEW_SANDBOX.includes('allow-top-navigation'))
  assert.ok(!PREVIEW_SANDBOX.includes('allow-modals'))
})

test('sanitizeHtml: payload XSS klasik', () => {
  const payloads = [
    '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<svg onload=alert(1)>', '<svg><script>alert(1)</script></svg>',
    '<a href="javascript:alert(1)">x</a>', '<a href="  JaVa\tScRiPt:alert(1)">x</a>', '<a href="&#106;avascript:alert(1)">x</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>', '<iframe src="https://evil"></iframe>', '<object data=x></object>',
    '<p onclick="alert(1)">x</p>', '<style>body{display:none}</style>', '<img src="javascript:alert(1)">', '<img src=data:text/html,x>',
    '<math><mi><script>alert(1)</script></mi></math>', '<!--<script>-->alert(1)<!-- -->', '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '<a href="https://x" onmouseover="alert(1)">x</a>', '<form action=javascript:alert(1)><button>x</button></form>', '<base href="//evil">',
    '<meta http-equiv=refresh content="0;url=//evil">', '<link rel=stylesheet href=//evil>', '<textarea><script>alert(1)</script></textarea>'
  ]
  for (const p of payloads) {
    const out = sanitizeHtml(p)
    assert.ok(!/<script|<iframe|<object|<style|<svg|<math|<form|<base|<meta|<link|onerror|onload|onclick|onmouseover|javascript:|data:text/i.test(out), `${p} -> ${out}`)
  }
})

test('sanitizeHtml: markup yang sah dipertahankan', () => {
  assert.equal(sanitizeHtml('<p>Halo <strong>dunia</strong> &amp; <em>semua</em></p>'), '<p>Halo <strong>dunia</strong> &amp; <em>semua</em></p>')
  assert.equal(sanitizeHtml('<ul><li>a</li><li>b</li></ul>'), '<ul><li>a</li><li>b</li></ul>')
  assert.equal(sanitizeHtml('<h1>Judul</h1>'), '<h2>Judul</h2>')
  assert.equal(sanitizeHtml('<a href="https://a.id/x?a=1&b=2">t</a>'), '<a href="https://a.id/x?a=1&amp;b=2" target="_blank" rel="noopener noreferrer nofollow ugc">t</a>')
  assert.equal(sanitizeHtml('<a href="javascript:alert(1)">t</a>'), '<a>t</a>')
  assert.equal(sanitizeHtml('a < b > c'), 'a &lt; b &gt; c')
  assert.equal(sanitizeHtml('&lt;script&gt;alert(1)&lt;/script&gt;'), '&lt;script&gt;alert(1)&lt;/script&gt;')
  assert.equal(sanitizeHtml('<p>tidak ditutup<b>x'), '<p>tidak ditutup<b>x</b></p>')
  assert.equal(sanitizeHtml(null), '')
  assert.equal(sanitizeHtml('<img src="https://a.id/i.png" alt=\'a"b\' onerror=1>'), '<img src="https://a.id/i.png" alt="a&quot;b" loading="lazy" decoding="async" referrerpolicy="no-referrer">')
  // atribut dengan > di dalam kutip tidak memecah tag
  assert.equal(sanitizeHtml('<a title="x>y<script>alert(1)</script>" href="https://a.id">t</a>').includes('<script'), false)
})

test('unggahan: tipe, ekstensi, ukuran', () => {
  const MB = 1024 * 1024
  assert.equal(validateUpload({ name: 'a.png', type: 'image/png', size: 1000 }, 'image'), '')
  assert.match(validateUpload({ name: 'a.png', type: 'image/png', size: 6 * MB }, 'image'), /Ukuran/)
  assert.match(validateUpload({ name: 'a.html', type: 'image/png', size: 10 }, 'image'), /Format/)
  assert.match(validateUpload({ name: 'a.png', type: 'text/html', size: 10 }, 'image'), /Format/)
  assert.match(validateUpload({ name: 'a.svg', type: 'image/svg+xml', size: 10 }, 'image'), /Format/)
  assert.equal(validateUpload({ name: 'a.zip', type: '', size: 10 }, 'archive'), '')
  assert.equal(validateUpload({ name: 'a.ZIP', type: 'application/zip', size: 10 }, 'previewZip'), '')
  assert.match(validateUpload({ name: 'a.zip', type: 'application/zip', size: 51 * MB }, 'previewZip'), /Ukuran/)
  assert.match(validateUpload({ name: 'a.exe', type: 'application/zip', size: 10 }, 'archive'), /Format/)
  assert.match(validateUpload({ name: 'a.zip', type: 'application/zip', size: 0 }, 'archive'), /kosong/)
  assert.match(validateUpload({ name: 'a.zip', type: 'application/zip', size: 11 * MB }, 'archive', { maxBytes: 10 * MB }), /10 MB/)
  assert.match(validateUpload(null, 'archive'), /Pilih/)
})

test('header keamanan & CSP', () => {
  const h = securityHeaders({ production: true, apiBase: 'https://api.example.id/api', authApiBase: 'https://auth.example.id/api' })
  assert.equal(h['x-content-type-options'], 'nosniff')
  assert.equal(h['x-frame-options'], 'SAMEORIGIN')
  assert.equal(h['referrer-policy'], 'strict-origin-when-cross-origin')
  assert.match(h['permissions-policy'], /camera=\(\)/)
  const csp = h['content-security-policy']
  for (const d of ["frame-ancestors 'self'", "object-src 'none'", "base-uri 'self'", "default-src 'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'connect-src \'self\' https://api.example.id https://auth.example.id']) assert.ok(csp.includes(d), d)
  assert.ok(!/script-src[^;]*\*/.test(csp) && !csp.includes("'unsafe-eval'"))
  assert.equal(securityHeaders({ production: false })['content-security-policy'], undefined)
  assert.ok(contentSecurityPolicy({ production: false }).includes('http:'))
})

// CSRF: semua panggilan jaringan klien lewat useApi -> useProductApi (X-CSRF-Token untuk mutasi BFF).
// Satu-satunya $fetch langsung yang diizinkan: GET publik tanpa sesi (saran pencarian) dan transport internal.
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(js|vue|ts)$/.test(f)) out.push(p)
  }
  return out
}
test('CSRF: tidak ada fetch mutasi di luar jalur useApi/useProductApi', () => {
  const allowed = new Set(['app/composables/useProductApi.js', 'app/composables/useSsoAuth.js', 'app/services/http.js', 'app/components/SiteNav.vue', 'app/services/errors.js'])
  const offenders = []
  for (const f of walk('app')) {
    if (allowed.has(f) || f.startsWith('app/mocks')) continue
    const src = readFileSync(f, 'utf8')
    if (/\$fetch\(|useFetch\(|useAsyncData\([^)]*\$fetch|\bfetch\(|XMLHttpRequest|axios/.test(src.replace(/\/\/.*$/gm, ''))) offenders.push(f)
  }
  assert.deepEqual(offenders, [])
  const bff = readFileSync('app/composables/useProductApi.js', 'utf8')
  assert.match(bff, /!\['GET', 'HEAD'\]\.includes\(.*\)\) headers\.set\('X-CSRF-Token'/)
  const sso = readFileSync('app/composables/useSsoAuth.js', 'utf8')
  const mutating = sso.match(/transport\([^)]*method: '(POST|PUT|PATCH|DELETE)'[^\n]*/g) || []
  assert.ok(mutating.length >= 2)
  for (const m of mutating) assert.match(m, /X-CSRF-Token/, m)
  const nav = readFileSync('app/components/SiteNav.vue', 'utf8')
  assert.ok(!/\$fetch\([^)]*method:\s*'(POST|PUT|PATCH|DELETE)'/.test(nav))
})

test('JSON-LD: unhead meng-escape </script> pada skrip ld+json (guard upgrade)', async () => {
  const { createHead, renderSSRHead } = await import('unhead/server')
  const head = createHead()
  head.push({ script: [{ type: 'application/ld+json', innerHTML: JSON.stringify({ name: '</script><script>alert(1)</script>' }) }] })
  const { headTags } = await renderSSRHead(head)
  assert.ok(!/<\/script><script>alert/.test(headTags), headTags)
  assert.equal((headTags.match(/<\/script>/g) || []).length, 1)
})
