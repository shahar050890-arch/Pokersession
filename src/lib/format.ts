/**
 * Every amount in the database is shekels. The locale governs formatting
 * conventions, and the display currency governs what the reader sees — a USD
 * view divides by the current rate at render time, so those figures move a
 * little as the rate moves. Shekel figures never move.
 */
export type DisplayCurrency = 'ILS' | 'USD'

let locale = 'he-IL'
let display: DisplayCurrency = 'ILS'
let ilsPerUsd = 1
let currency = makeCurrency(locale, 'ILS', false)
let currencyPrecise = makeCurrency(locale, 'ILS', true)

function makeCurrency(loc: string, code: DisplayCurrency, precise: boolean) {
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: precise ? 2 : 0,
  })
}

function rebuild() {
  currency = makeCurrency(locale, display, false)
  currencyPrecise = makeCurrency(locale, display, true)
}

export function setLocale(next: string) {
  if (next === locale) return
  locale = next
  rebuild()
}

/** A USD display needs a rate; without one the caller must stay on ILS. */
export function setDisplayCurrency(next: DisplayCurrency, rate: number | null) {
  const usable = next === 'USD' && rate && rate > 0 ? next : 'ILS'
  const nextRate = usable === 'USD' && rate ? rate : 1
  if (usable === display && nextRate === ilsPerUsd) return
  display = usable
  ilsPerUsd = nextRate
  rebuild()
}

export function displayCurrency(): DisplayCurrency {
  return display
}

/** Converts a stored shekel amount into whatever is being displayed. */
export function toDisplay(ils: number): number {
  return display === 'USD' ? ils / ilsPerUsd : ils
}

/** The reverse, for inputs that are typed in the display currency. */
export function fromDisplay(shown: number): number {
  return display === 'USD' ? shown * ilsPerUsd : shown
}

export function formatMoney(value: number, precise = false): string {
  const fmt = precise ? currencyPrecise : currency
  return fmt.format(toDisplay(value))
}

/** Money with an explicit sign, for profit/loss figures. */
export function formatSigned(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (rounded === 0) return formatMoney(0)
  return `${rounded > 0 ? '+' : '−'}${formatMoney(Math.abs(rounded))}`
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}

/** ISO date shifted by whole days, staying in local time. */
export function shiftDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const shifted = new Date(y, m - 1, d + delta)
  const tz = shifted.getTimezoneOffset() * 60_000
  return new Date(shifted.getTime() - tz).toISOString().slice(0, 10)
}

/** "Today" / "Yesterday" where either reads better than a date. */
export function relativeDate(iso: string, labels: { today: string; yesterday: string }): string {
  const today = todayIso()
  if (iso === today) return labels.today
  if (iso === shiftDays(today, -1)) return labels.yesterday
  return formatDate(iso)
}

interface DurationUnits {
  minutes: string
  hours: string
  none: string
}

export function formatDuration(minutes: number | null, u: DurationUnits): string {
  if (minutes === null || minutes === 0) return u.none
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} ${u.minutes}`
  if (m === 0) return `${h} ${u.hours}`
  return `${h}:${String(m).padStart(2, '0')} ${u.hours}`
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
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  )
}
