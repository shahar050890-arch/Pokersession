/**
 * USD → ILS rate for the entry screen.
 *
 * Amounts are always stored in shekels, so this rate is only used at the
 * moment of saving. It is fetched in the browser (the app has no backend),
 * cached for the day, and — importantly — never guessed: if no rate can be
 * obtained, dollar entry is refused rather than converted at a made-up number.
 */

const CACHE_KEY = 'poker-usd-ils'
const MAX_AGE_MS = 6 * 60 * 60 * 1000

export interface Rate {
  /** ILS per 1 USD. */
  value: number
  /** Date the rate is published for, ISO. */
  date: string
  fetchedAt: number
}

interface Source {
  url: string
  parse: (json: unknown) => { value: number; date: string } | null
}

/** Both are free, keyless and CORS-enabled; the second covers the first. */
const SOURCES: Source[] = [
  {
    url: 'https://api.frankfurter.app/latest?from=USD&to=ILS',
    parse: (j) => {
      const d = j as { rates?: { ILS?: number }; date?: string }
      const value = d.rates?.ILS
      return typeof value === 'number' && value > 0
        ? { value, date: d.date ?? new Date().toISOString().slice(0, 10) }
        : null
    },
  },
  {
    url: 'https://open.er-api.com/v6/latest/USD',
    parse: (j) => {
      const d = j as { rates?: { ILS?: number }; time_last_update_utc?: string }
      const value = d.rates?.ILS
      if (typeof value !== 'number' || value <= 0) return null
      const stamp = d.time_last_update_utc ? new Date(d.time_last_update_utc) : new Date()
      return { value, date: stamp.toISOString().slice(0, 10) }
    },
  },
]

function readCache(): Rate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Rate
    if (typeof parsed.value !== 'number' || parsed.value <= 0) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(rate: Rate) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rate))
  } catch {
    /* the rate just won't persist between visits */
  }
}

export function isStale(rate: Rate): boolean {
  return Date.now() - rate.fetchedAt > MAX_AGE_MS
}

/**
 * Returns a usable rate, or null when none could be obtained. A cached rate is
 * served immediately and refreshed in the background; a stale cache is still
 * better than nothing and is surfaced as stale to the caller.
 */
export async function fetchRate(): Promise<Rate | null> {
  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { headers: { accept: 'application/json' } })
      if (!res.ok) continue
      const parsed = source.parse(await res.json())
      if (!parsed) continue
      const rate: Rate = { ...parsed, fetchedAt: Date.now() }
      writeCache(rate)
      return rate
    } catch {
      // Try the next source; a network failure here is not fatal.
    }
  }
  return readCache()
}

export function cachedRate(): Rate | null {
  return readCache()
}

/** ILS value of a USD amount, rounded to agorot. */
export function toIls(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100
}

export function formatRate(rate: number): string {
  return rate.toFixed(3)
}
