import { ref, computed } from 'vue'

export const useTopupReward = ({ session, refresh }) => {
  const api = useProductApi()
  const config = useRuntimeConfig()
  const token = useAuthCredential()
  const status = ref('idle')
  const message = ref('')
  const reference = ref('')
  const refreshing = ref(false)
  const checking = ref(false)
  const busy = computed(() => refreshing.value || checking.value)
  let owner = ''
  const storageKey = () => `icmarket_topup_rewards:${owner}`
  const read = () => {
    try { const value = JSON.parse(sessionStorage.getItem(storageKey()) || '[]'); return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [] } catch { return [] }
  }
  const loadStatus = async isCurrent => {
    if (!reference.value || String(session.value?.id) !== owner) return true
    const currentReference = reference.value
    const response = await api(`${config.public.apiBase}/topup/reward-status`, {
      headers: { Authorization: `Bearer ${token.value}` }, query: { reference_id: currentReference }
    })
    if (!isCurrent() || String(session.value?.id) !== owner || reference.value !== currentReference) return false
    const data = response.data
    if (!response.success || data?.reference_id !== currentReference || !['pending', 'failed', 'fulfilled', 'not_eligible', 'legacy_fulfilled'].includes(data.reward_status)) throw Error('Status reward tidak tersedia.')
    status.value = data.reward_status
    if (status.value === 'pending' || status.value === 'failed') {
      message.value = status.value === 'failed'
        ? 'Pembayaran berhasil. Reward belum berhasil diproses; hubungi dukungan dengan referensi pembayaran. Tidak perlu membayar ulang.'
        : 'Pembayaran berhasil. Reward voucher masih diproses.'
      return false
    }
    refreshing.value = true
    try { await refresh(); }
    catch {
      if (isCurrent() && String(session.value?.id) === owner) message.value = 'Reward sudah dikonfirmasi, tetapi saldo, voucher, atau badge belum dapat diperbarui. Coba cek ulang.'
      return false
    } finally { refreshing.value = false }
    if (!isCurrent() || String(session.value?.id) !== owner || reference.value !== currentReference) return false
    message.value = status.value === 'not_eligible' ? 'Pembayaran berhasil. Nominal ini tidak mendapat reward otomatis.'
      : status.value === 'legacy_fulfilled' ? 'Reward transaksi ini sudah tercatat sebelumnya. Daftar voucher dan badge telah diperbarui.'
      : 'Reward topup berhasil diproses. Daftar voucher dan badge telah diperbarui.'
    const remaining = read().filter(item => item !== currentReference)
    sessionStorage.setItem(storageKey(), JSON.stringify(remaining))
    if (remaining.length) { reference.value = remaining[0]; status.value = 'pending'; return false }
    return true
  }
  const check = async isCurrent => {
    if (checking.value) return false
    checking.value = true
    try { return await loadStatus(isCurrent) }
    catch (error) {
      if (isCurrent() && String(session.value?.id) === owner) message.value = 'Status reward belum dapat diperiksa. Coba kembali; jangan membuat pembayaran ulang.'
      throw error
    } finally { checking.value = false }
  }
  const poll = usePaymentPoll(check, {
    isAuthenticated: () => !!session.value && String(session.value.id) === owner,
    onTimeout: () => { message.value = 'Pembayaran berhasil. Status reward belum selesai diverifikasi; cek ulang tanpa membuat pembayaran baru.' }
  })
  const start = transactionId => {
    if (!import.meta.client || !session.value || !transactionId) return
    owner = String(session.value.id)
    const queue = read()
    if (!queue.includes(transactionId)) queue.push(transactionId)
    sessionStorage.setItem(storageKey(), JSON.stringify(queue))
    reference.value = queue[0]
    status.value = 'pending'
    message.value = 'Pembayaran berhasil. Memeriksa pemenuhan reward...'
    poll.start()
  }
  const restore = () => {
    if (!import.meta.client || !session.value) return
    owner = String(session.value.id)
    const queue = read()
    if (queue.length) start(queue[0])
  }
  return { status, message, reference, refreshing, busy, start, restore, retry: () => { if (!busy.value) poll.start() }, dispose: poll.dispose }
}
