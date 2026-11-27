import { defineStore } from 'pinia'
import { ref } from 'vue'

// Saldo iCoin ('Z'). Pemisah ribuan manual agar hasil SSR dan klien identik (tanpa Intl).
const formatId = (n) => String(Math.trunc(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(1250000)

  /** format() -> "1.250.000" (saldo); format(79000) -> "79.000" */
  function format(n = balance.value) {
    return formatId(n)
  }
  function topupMock(n) {
    const v = Math.trunc(Number(n) || 0)
    if (v > 0) balance.value += v
    return balance.value
  }

  return { balance, format, topupMock }
})
