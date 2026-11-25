const LOADING_HTML = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Menyiapkan preview...</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html,body{height:100%;margin:0}
  body{display:grid;place-items:center;background:#0b1220;color:#e2e8f0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  .box{text-align:center}
  .spin{width:44px;height:44px;margin:0 auto 18px;border:4px solid rgba(255,255,255,.18);border-top-color:#3b82f6;border-radius:50%;animation:s .8s linear infinite}
  p{margin:0;font-size:15px;font-weight:600}
  small{display:block;margin-top:6px;color:#94a3b8;font-size:12.5px}
  @keyframes s{to{transform:rotate(360deg)}}
</style></head>
<body><div class="box"><div class="spin"></div><p>Menyiapkan preview...</p><small>Mohon tunggu sebentar</small></div></body></html>`

/**
 * Open a product's live preview.
 *
 * On the store's own origin the preview is embedded in an overlay (the engine only allows framing
 * from the store domain via CSP frame-ancestors). Anywhere else (e.g. localhost) it falls back to a new tab.
 * `openingId` drives spinners on the trigger button.
 */
export const useEnginePreview = () => {
  const config = useRuntimeConfig()
  const authToken = useAuthCredential()
  const productApi = useProductApi()
  const openingId = useState('icmarket-opening-preview-id', () => null)
  const overlay = useState('icmarket-preview-overlay', () => ({ open: false, url: '', title: '', error: '' }))

  const canEmbed = () => {
    try {
      return new URL(String(config.public.siteUrl)).origin === window.location.origin
    } catch {
      return false
    }
  }

  const fetchSessionUrl = async (productId) => {
    const response = await productApi(`${config.public.apiBase}/products/${productId}/preview/session`, {
      method: 'POST',
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
    })
    const url = response?.data?.url
    if (!url) throw new Error('no_url')
    return url
  }

  const failure = (error) => error?.data?.message || 'Preview belum bisa dibuka. Coba lagi sebentar.'

  const openPreview = async (productId, title = '') => {
    if (!import.meta.client || openingId.value) return { ok: false, message: '' }
    openingId.value = productId

    if (canEmbed()) {
      overlay.value = { open: true, url: '', title, error: '' }
      try {
        overlay.value = { ...overlay.value, url: await fetchSessionUrl(productId) }
        return { ok: true, message: '' }
      } catch (error) {
        const message = failure(error)
        overlay.value = { ...overlay.value, error: message }
        return { ok: false, message: '' }
      } finally {
        openingId.value = null
      }
    }

    // Tab dibuka sinkron saat klik agar tidak diblokir popup blocker.
    const tab = window.open('', '_blank')
    if (tab) {
      tab.opener = null
      tab.document.write(LOADING_HTML)
      tab.document.close()
    }

    try {
      const url = await fetchSessionUrl(productId)
      if (tab) tab.location.replace(url)
      else window.location.href = url
      return { ok: true, message: '' }
    } catch (error) {
      tab?.close()
      return { ok: false, message: failure(error) }
    } finally {
      openingId.value = null
    }
  }

  return { openPreview, openingId }
}
