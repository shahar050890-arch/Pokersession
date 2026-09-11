import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_BUDGET, type BudgetSettings, type PokerSession, type SessionInput } from '../lib/types'
import { useAuth } from './AuthContext'

interface DataValue {
  sessions: PokerSession[]
  settings: BudgetSettings | null
  loading: boolean
  error: string | null
  /** Distinct locations already used, most recent first — feeds autocomplete. */
  locations: string[]
  addSession: (input: SessionInput) => Promise<void>
  updateSession: (id: string, input: SessionInput) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  saveSettings: (patch: Partial<Omit<BudgetSettings, 'user_id' | 'updated_at'>>) => Promise<void>
  refresh: () => Promise<void>
}

const DataContext = createContext<DataValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<PokerSession[]>([])
  const [settings, setSettings] = useState<BudgetSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setSessions([])
      setSettings(null)
      setLoading(false)
      return
    }

    setError(null)
    const [sessionsRes, settingsRes] = await Promise.all([
      supabase
        .from('poker_sessions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('budget_settings').select('*').maybeSingle(),
    ])

    if (sessionsRes.error) setError(sessionsRes.error.message)
    else setSessions(sessionsRes.data as PokerSession[])

    if (settingsRes.error) setError(settingsRes.error.message)
    else setSettings((settingsRes.data as BudgetSettings | null) ?? null)

    setLoading(false)
  }, [user])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const addSession = useCallback(
    async (input: SessionInput) => {
      if (!user) throw new Error('לא מחובר')
      const { error } = await supabase.from('poker_sessions').insert({ ...input, user_id: user.id })
      if (error) throw new Error(error.message)
      await load()
    },
    [user, load],
  )

  const updateSession = useCallback(
    async (id: string, input: SessionInput) => {
      const { error } = await supabase.from('poker_sessions').update(input).eq('id', id)
      if (error) throw new Error(error.message)
      await load()
    },
    [load],
  )

  const deleteSession = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('poker_sessions').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await load()
    },
    [load],
  )

  const saveSettings = useCallback(
    async (patch: Partial<Omit<BudgetSettings, 'user_id' | 'updated_at'>>) => {
      if (!user) throw new Error('לא מחובר')
      const next = { ...DEFAULT_BUDGET, ...settings, ...patch, user_id: user.id }
      const { error } = await supabase
        .from('budget_settings')
        .upsert(next, { onConflict: 'user_id' })
      if (error) throw new Error(error.message)
      await load()
    },
    [user, settings, load],
  )

  const locations = useMemo(() => {
    const seen = new Set<string>()
    for (const s of sessions) {
      const name = s.location.trim()
      if (name) seen.add(name)
    }
    return [...seen]
  }, [sessions])

  const value = useMemo<DataValue>(
    () => ({
      sessions,
      settings,
      loading,
      error,
      locations,
      addSession,
      updateSession,
      deleteSession,
      saveSettings,
      refresh: load,
    }),
    [sessions, settings, loading, error, locations, addSession, updateSession, deleteSession, saveSettings, load],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
