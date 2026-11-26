const gtq = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
})
const gtqExact = new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Q144,850 */
export const money = (n: number) => gtq.format(n).replace('GTQ', 'Q').replace(/Q[\s\u00a0]+/, 'Q')
/** Q 18,450.00 (cotizaciones) */
export const moneyExact = (n: number) => `Q ${gtqExact.format(n)}`
export const decimal = (n: number) => gtqExact.format(n)

export const compactMoney = (n: number) =>
  n >= 1_000_000 ? `Q${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `Q${Math.round(n / 1000)}K` : `Q${n}`

const dateFmt = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—')

const shortFmt = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false })

export const formatShortDate = (iso?: string | null) =>
  iso ? shortFmt.format(new Date(iso)).replace('.', '') : '—'
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))

export function relativeTime(iso?: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  if (d < 7) return `hace ${d} d`
  return formatShortDate(iso)
}

/** "12 sep · 15:00" para próximos seguimientos */
export const formatFollowUp = (iso?: string | null) =>
  iso ? `${formatShortDate(iso)} · ${formatTime(iso)}` : '—'

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export const toDateInput = (iso: string) => iso.slice(0, 10)
