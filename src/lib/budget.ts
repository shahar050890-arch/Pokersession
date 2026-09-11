import type { BudgetSettings, PokerSession } from './types'
import { currentMonthKey, monthKey } from './format'

export interface MonthTotals {
  key: string
  totalIn: number
  cashOut: number
  profit: number
  sessions: number
}

/** Aggregates sessions into per-month buckets, ascending by month. */
export function monthlyTotals(sessions: PokerSession[]): MonthTotals[] {
  const buckets = new Map<string, MonthTotals>()

  for (const s of sessions) {
    const key = monthKey(s.date)
    const bucket = buckets.get(key) ?? { key, totalIn: 0, cashOut: 0, profit: 0, sessions: 0 }
    bucket.totalIn += s.total_in
    bucket.cashOut += s.cash_out
    bucket.profit += s.profit
    bucket.sessions += 1
    buckets.set(key, bucket)
  }

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key))
}

/**
 * Spend against the budget for a single month, before rollover.
 *
 *  - fixed:     every buy-in consumes budget; winnings are irrelevant.
 *  - replenish: cash-outs flow back in, so only the net loss consumes budget.
 */
function monthSpend(totals: MonthTotals | undefined, mode: BudgetSettings['mode']): number {
  if (!totals) return 0
  return mode === 'fixed' ? totals.totalIn : totals.totalIn - totals.cashOut
}

export interface BudgetStatus {
  /** Budget for the month including any carried-over surplus. */
  allowance: number
  /** Surplus carried in from previous months (0 when rollover is off). */
  carriedIn: number
  spent: number
  remaining: number
  /** 0–1, clamped. How much of the allowance is used up. */
  usedRatio: number
  overBudget: boolean
  configured: boolean
}

/**
 * Budget status for `targetMonth`, walking forward from the first recorded
 * month so rollover accumulates correctly.
 */
export function budgetStatus(
  sessions: PokerSession[],
  settings: BudgetSettings | null,
  targetMonth: string = currentMonthKey(),
): BudgetStatus {
  const monthly = settings?.monthly_budget ?? 0
  const mode = settings?.mode ?? 'fixed'
  const configured = !!settings && monthly > 0

  const totals = monthlyTotals(sessions)
  const byKey = new Map(totals.map((t) => [t.key, t]))

  let carriedIn = 0

  if (settings?.rollover && totals.length > 0) {
    // Walk every month from the first session up to (not including) the target.
    let cursor = totals[0].key
    while (cursor < targetMonth) {
      const allowance = monthly + carriedIn
      // Clamped so a winning replenish month cannot inflate the carry-over
      // beyond the unused part of that month's allowance.
      const spent = Math.max(0, monthSpend(byKey.get(cursor), mode))
      // Only an unused surplus rolls forward; an overrun does not create debt.
      carriedIn = Math.max(0, allowance - spent)
      cursor = nextMonth(cursor)
    }
  }

  const allowance = monthly + carriedIn
  const rawSpent = monthSpend(byKey.get(targetMonth), mode)

  // In replenish mode a winning month can push spend negative, which would read
  // as "more budget than you started with". Available never exceeds the cap.
  const spent = Math.max(0, rawSpent)
  const remaining = allowance - spent

  return {
    allowance,
    carriedIn,
    spent,
    remaining,
    usedRatio: allowance > 0 ? Math.min(1, Math.max(0, spent / allowance)) : 0,
    overBudget: allowance > 0 && remaining < 0,
    configured,
  }
}

function nextMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}
