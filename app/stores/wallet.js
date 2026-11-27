import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isMockMode } from '~/utils/authRouting'

// Saldo iCoin ('Z'). Pemisah ribuan manual agar hasil SSR dan klien identik (tanpa Intl).
const formatId = (n) => String(Math.trunc(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const useWalletStore = defineStore('wallet', () => {
  const config = useRuntimeConfig()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })

  const mockBalance = ref(1250000)
  const apiBalance = useState('icmarket-wallet-balance', () => null)
  const apiStatus = useState('icmarket-wallet-status', () => 'unavailable')
  const session = useState('icmarket-auth-session', () => null)

  const balance = computed({
    get: () => (mock ? mockBalance.value : apiBalance.value),
    set: (v) => {
      if (mock) {
        mockBalance.value = Math.max(0, Math.trunc(Number(v) || 0))
        return
      }
      setBalance(v)
    }
  })

  const status = computed(() => (mock ? 'fresh' : apiStatus.value))
  const hasBalance = computed(() => balance.value !== null && Number.isFinite(Number(balance.value)))

  /** Sinkronkan saldo dari respons API (mis. setelah pay hosting atau account/summary). */
  function setBalance(n) {
    if (n == null || !Number.isFinite(Number(n))) return balance.value
    const next = Math.max(0, Math.trunc(Number(n)))
    if (mock) {
      mockBalance.value = next
      return next
    }
    apiBalance.value = next
    apiStatus.value = 'fresh'
    if (session.value) session.value = { ...session.value, coins: next }
    return next
  }

  /** Muat ulang saldo dari server (mode API). */
  async function syncBalance() {
    if (mock) return true
    try {
      return await useDemoAuth().fetchWallet()
    } catch {
      return false
    }
  }

  /** format() -> "1.250.000" (saldo); format(79000) -> "79.000" */
  function format(n = balance.value) {
    return formatId(n)
  }

  function topupMock(n) {
    const v = Math.trunc(Number(n) || 0)
    if (v > 0 && mock) mockBalance.value += v
    return balance.value
  }

  return { balance, status, hasBalance, isMock: mock, format, setBalance, syncBalance, topupMock }
})
