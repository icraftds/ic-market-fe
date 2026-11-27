// Murni (tanpa DOM, jalan di SSR dan klien). Sanitizer allowlist untuk HTML dari seller/editor.
// Keluaran dibangun ulang dari token: teks di-escape, hanya tag & atribut dalam allowlist yang ditulis ulang.
// Isi <script>/<style>/<iframe>/dll dibuang beserta isinya; tag tak dikenal dibuang tetapi teksnya dipertahankan.
import { safeLink, safeImageUrl } from './safeUrl.js'

const VOID = new Set(['br', 'hr'])
const ALLOWED = new Set(['p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'])
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'textarea', 'title', 'head', 'form', 'select', 'xmp'])
// h1 diturunkan jadi h2 (satu h1 per halaman milik template).
const RENAME = { h1: 'h2', h5: 'h4', h6: 'h4' }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', colon: ':', tab: '\t', newline: '\n', lpar: '(', rpar: ')' }
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (m, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    }
    return Object.hasOwn(ENTITIES, body.toLowerCase()) ? ENTITIES[body.toLowerCase()] : m
  })
}

/** Baca atribut dari bagian dalam tag: name=value | name="v" | name='v' | name. */
function parseAttrs(src) {
  const attrs = {}
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let m
  while ((m = re.exec(src))) {
    const name = m[1].toLowerCase()
    if (!(name in attrs)) attrs[name] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '')
  }
  return attrs
}

function openTag(tag, attrs) {
  if (tag === 'a') {
    const href = safeLink(attrs.href)
    const title = attrs.title ? ` title="${esc(attrs.title.slice(0, 200))}"` : ''
    return href
      ? `<a href="${esc(href)}"${title} target="_blank" rel="noopener noreferrer nofollow ugc">`
      : '<a>'
  }
  if (tag === 'img') {
    const src = safeImageUrl(attrs.src)
    if (!src) return ''
    return `<img src="${esc(src)}" alt="${esc((attrs.alt || '').slice(0, 200))}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
  }
  return `<${tag}>`
}

export function sanitizeHtml(input, { maxLength = 200000 } = {}) {
  if (typeof input !== 'string' || !input) return ''
  const src = input.length > maxLength ? input.slice(0, maxLength) : input
  const out = []
  const stack = []
  let dropUntil = null
  let i = 0
  while (i < src.length) {
    const lt = src.indexOf('<', i)
    if (lt === -1) { if (!dropUntil) out.push(esc(decodeEntities(src.slice(i)))); break }
    if (lt > i && !dropUntil) out.push(esc(decodeEntities(src.slice(i, lt))))
    // komentar / CDATA / doctype / processing instruction: buang
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4)
      i = end === -1 ? src.length : end + 3
      continue
    }
    const next = src[lt + 1]
    if (!next || !/[a-zA-Z\/]/.test(next)) {
      // '<' literal (mis. "a < b", "<!doctype", "<?x")
      if (next === '!' || next === '?') {
        const end = src.indexOf('>', lt)
        i = end === -1 ? src.length : end + 1
      } else {
        if (!dropUntil) out.push('&lt;')
        i = lt + 1
      }
      continue
    }
    // cari '>' penutup dengan memperhatikan kutip
    let j = lt + 1
    let quote = ''
    while (j < src.length) {
      const c = src[j]
      if (quote) { if (c === quote) quote = '' } else if (c === '"' || c === "'") quote = c
      else if (c === '>') break
      j++
    }
    if (j >= src.length) { i = src.length; break } // tag tidak ditutup: buang sisa
    const inner = src.slice(lt + 1, j)
    i = j + 1
    const closing = inner[0] === '/'
    const m = /^\/?\s*([a-zA-Z][a-zA-Z0-9:-]*)([\s\S]*)$/.exec(inner)
    if (!m) continue
    let tag = m[1].toLowerCase()
    if (dropUntil) {
      if (closing && tag === dropUntil) dropUntil = null
      continue
    }
    if (DROP_WITH_CONTENT.has(tag)) {
      if (!closing && !/\/\s*$/.test(m[2])) dropUntil = tag
      continue
    }
    tag = RENAME[tag] || tag
    if (!ALLOWED.has(tag)) continue
    if (closing) {
      if (VOID.has(tag) || tag === 'img') continue
      const at = stack.lastIndexOf(tag)
      if (at === -1) continue
      while (stack.length > at) out.push(`</${stack.pop()}>`)
      continue
    }
    const html = openTag(tag, parseAttrs(m[2]))
    if (!html) continue
    out.push(html)
    if (!VOID.has(tag) && tag !== 'img') stack.push(tag)
  }
  while (stack.length) out.push(`</${stack.pop()}>`)
  return out.join('')
}
