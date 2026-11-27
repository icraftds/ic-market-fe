export const rupiah = (n) => (Number(n) === 0 ? 'Gratis' : 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n) || 0))
export const number = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0)
export const dateId = (d) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
