import type { BudgetSettings, PokerSession, SessionInput } from './types'

/**
 * Mirrors Supabase's generated shape, but narrows the columns Postgres reports
 * as loose (`game_type`/`mode` are checked text, `total_in`/`profit` are
 * generated and never actually null) to the domain types in `./types`.
 */
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      poker_sessions: {
        Row: PokerSession
        Insert: SessionInput & { user_id: string; id?: string; created_at?: string }
        Update: Partial<SessionInput>
        Relationships: []
      }
      budget_settings: {
        Row: BudgetSettings
        Insert: Omit<BudgetSettings, 'updated_at'> & { updated_at?: string }
        Update: Partial<Omit<BudgetSettings, 'user_id'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
