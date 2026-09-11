import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Defaults for this app's own Supabase project. The publishable key is a
 * client-side credential by design — it ships inside the JS bundle of every
 * Supabase web app, and grants nothing on its own: row-level security decides
 * what each signed-in user can read or write. Env vars override it so the app
 * can point at a different project without a code change.
 */
const DEFAULT_URL = 'https://ikgddtxyreqbaumkcvux.supabase.co'
const DEFAULT_KEY = 'sb_publishable_yuNpPxA-ef7Vvf7rG-U8TA_0b2jCLeF'

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
