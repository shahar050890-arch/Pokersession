const currency = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
})

const currencyPrecise = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatMoney(value: number, precise = false): string {
  const fmt = precise ? currencyPrecise : currency
  return fmt.format(value)
}

/** Money with an explicit sign, for profit/loss figures. */
export function formatSigned(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (rounded === 0) return formatMoney(0)
  return `${rounded > 0 ? '+' : '−'}${formatMoney(Math.abs(rounded))}`
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} דק׳`
  if (m === 0) return `${h} ש׳`
  return `${h}:${String(m).padStart(2, '0')} ש׳`
}

export function todayIso(): string {
  const now = new Date()
  const tz = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - tz).toISOString().slice(0, 10)
}

/** "2026-09" — the month bucket a session date belongs to. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function currentMonthKey(): string {
  return todayIso().slice(0, 7)
}

export function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  )
}
