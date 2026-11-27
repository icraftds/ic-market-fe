import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// Setiap tautan internal di header/footer/nav (components/layout, sellerNav, onboardingRouting) harus menuju halaman yang ada.
const root = new URL('..', import.meta.url).pathname
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))

// Rute halaman dari app/pages: [param].vue -> segmen dinamis, index.vue -> direktori.
const routes = walk('app/pages').filter((f) => f.endsWith('.vue')).map((f) => {
  const rel = f.replace(/^app\/pages\//, '').replace(/\.vue$/, '').replace(/(^|\/)index$/, '')
  return '/' + rel
})
const matchers = routes.map((r) => new RegExp('^' + r.replace(/\[[^\]]+\]/g, '[^/]+') + '$'))
const pageExists = (p) => matchers.some((re) => re.test(p))

// Rute server (bukan halaman Nuxt) yang sah ditautkan.
const serverPrefixes = ['/auth/', '/api/', '/sitemap']

const sources = [
  ...walk('app/components/layout').filter((f) => f.endsWith('.vue')),
  'app/utils/sellerNav.js',
  'app/utils/onboardingRouting.js'
]

function internalPaths(file) {
  const src = rd(file)
  const found = new Set()
  for (const m of src.matchAll(/(['"`])(\/[^'"`\s<>]*)\1/g)) {
    let p = m[2].replace(/\$\{[^}]*\}/g, 'x').split('?')[0].split('#')[0]
    if (!p || p === '/') { found.add('/'); continue }
    if (/\.[a-z0-9]{2,5}$/i.test(p) && fs.existsSync(path.join(root, 'public', p))) continue // aset statis
    if (/\.[a-z0-9]{2,5}$/i.test(p)) continue // bukan rute (mis. ikon/gambar)
    if (p.includes('//') || /^\/(\W|$)/.test(p)) continue // regex/komentar, bukan path
    found.add(p.replace(/\/+$/, '') || '/')
  }
  return [...found]
}

test('semua tautan internal layout/nav menuju halaman yang ada', () => {
  const broken = []
  let checked = 0
  for (const file of sources) {
    for (const p of internalPaths(file)) {
      if (serverPrefixes.some((s) => p.startsWith(s))) continue
      checked++
      if (!pageExists(p)) broken.push(`${file}: ${p}`)
    }
  }
  assert.ok(checked > 20, `terlalu sedikit tautan terperiksa (${checked}); ekstraktor rusak?`)
  assert.deepEqual(broken, [])
})

test('pemeriksa tautan benar-benar mendeteksi rute yang tidak ada', () => {
  assert.equal(pageExists('/game-z'), true)
  assert.equal(pageExists('/seller/products/12/edit'), true)
  assert.equal(pageExists('/rute-yang-tidak-ada'), false)
})
