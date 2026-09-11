export type GameType = 'cash' | 'tournament'
export type EntryCurrency = 'ILS' | 'USD'
export type BudgetMode = 'fixed' | 'replenish'

/**
 * Declared as type aliases rather than interfaces: Supabase's generics require
 * `Record<string, unknown>` compatibility, and only type aliases get
 * TypeScript's implicit index signature.
 */
export type PokerSession = {
  id: string
  user_id: string
  date: string
  game_type: GameType
  location: string
  buy_in_amount: number
  rebuys: number
  cash_out: number
  duration_minutes: number | null
  notes: string | null
  created_at: string
  /** What the user typed in. Stored amounts are always ILS. */
  entry_currency: EntryCurrency
  /** ILS per 1 unit of entry_currency at save time; null for ILS entries. */
  fx_rate: number | null
  /** generated in Postgres: buy_in_amount * (1 + rebuys) */
  total_in: number
  /** generated in Postgres: cash_out - total_in */
  profit: number
}

export type SessionInput = Pick<
  PokerSession,
  | 'date'
  | 'game_type'
  | 'location'
  | 'buy_in_amount'
  | 'rebuys'
  | 'cash_out'
  | 'duration_minutes'
  | 'notes'
  | 'entry_currency'
  | 'fx_rate'
>

export type BudgetSettings = {
  user_id: string
  monthly_budget: number
  mode: BudgetMode
  rollover: boolean
  updated_at: string
}

export const DEFAULT_BUDGET: Omit<BudgetSettings, 'user_id' | 'updated_at'> = {
  monthly_budget: 0,
  mode: 'fixed',
  rollover: false,
}
