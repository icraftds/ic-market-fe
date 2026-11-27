// Peta kelas statis (literal penuh) supaya Tailwind memindai-nya; tanpa :style dinamis.
export const tabPath = (k) => (k === 'acct' ? '/akun' : '/akun/' + k)

const W = {
  0: 'tw:w-[0%]', 1: 'tw:w-[1%]', 4: 'tw:w-[4%]', 10: 'tw:w-[10%]', 12: 'tw:w-[12%]', 20: 'tw:w-[20%]', 30: 'tw:w-[30%]',
  40: 'tw:w-[40%]', 41: 'tw:w-[41%]', 50: 'tw:w-[50%]', 60: 'tw:w-[60%]', 70: 'tw:w-[70%]', 80: 'tw:w-[80%]', 90: 'tw:w-[90%]', 100: 'tw:w-[100%]'
}
export const widthClass = (n) => W[n] || W[0]

// Titik status situs: live hijau, siap (menunggu file) kuning, belum diatur abu.
export const dotClass = (live, configured) => (live ? 'tw:bg-[#22c55e]' : configured ? 'tw:bg-[#f59e0b]' : 'tw:bg-[#94a3b8]')
