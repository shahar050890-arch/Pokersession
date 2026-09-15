import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { CardFan, SuitField } from '../components/decor'
import { useI18n } from '../context/I18nContext'
import type { Translations } from '../lib/i18n'
import { ErrorNote } from '../components/ui'

type Mode = 'signin' | 'signup'

/** Supabase returns raw English auth errors; map the common ones. */
function translateError(message: string, t: Translations): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return t.auth.errBadCreds
  if (m.includes('user already registered')) return t.auth.errRegistered
  if (m.includes('password should be at least')) return t.auth.errShortPassword
  if (m.includes('unable to validate email')) return t.auth.errBadEmail
  if (m.includes('email not confirmed')) return t.auth.errUnconfirmed
  return message
}

export default function AuthPage() {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (password.length < 6) {
      setError(t.auth.errShortPassword)
      return
    }

    setBusy(true)
    const fn = mode === 'signin' ? supabase.auth.signInWithPassword : supabase.auth.signUp
    const { data, error: authError } = await fn.call(supabase.auth, { email: email.trim(), password })
    setBusy(false)

    if (authError) {
      setError(translateError(authError.message, t))
      return
    }

    // With email confirmation on, sign-up returns a user but no session.
    if (mode === 'signup' && data.user && !data.session) {
      setNotice(t.auth.checkEmail)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      {/* The sign-in screen is the one place the table can be felt outright. */}
      <div
        className="absolute inset-x-0 top-0 h-[46vh]"
        style={{ background: 'linear-gradient(145deg, #12564A, #0A2E27)' }}
      />
      <div className="absolute inset-x-0 top-0 h-[46vh] text-white">
        <SuitField opacity={0.06} scale={44} />
      </div>
      {/* The band is a slab of clay, so it ends with a soft edge, not a rule. */}
      <div
        className="absolute inset-x-0 top-[calc(46vh-26px)] h-[26px]"
        style={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30, boxShadow: '0 16px 28px -14px var(--clay-cast)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-9 flex flex-col items-center text-center">
          <CardFan className="mb-4 h-24 w-32" />
          <h1 className="text-[32px] font-bold tracking-tight text-white">{t.auth.title}</h1>
          <p className="mt-2 text-[15px] text-white/70">{t.auth.tagline}</p>
        </div>

        <div className="surface-lit p-5">
          <div className="seg mb-5">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(null)
                  setNotice(null)
                }}
                data-on={mode === m}
              >
                {m === 'signin' ? t.auth.signIn : t.auth.signUp}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label mb-1.5 block" htmlFor="email">
                {t.auth.email}
              </label>
              <input
                id="email"
                type="email"
                dir="ltr"
                required
                autoComplete="email"
                className="field text-start"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label mb-1.5 block" htmlFor="password">
                {t.auth.password}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="field"
                placeholder={t.auth.passwordHint}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}
            {notice && (
              <p
                className="rounded-control bg-jade/[0.12] px-4 py-3.5 text-[15px] text-jade"
                style={{ boxShadow: 'var(--clay-press)' }}
              >
                {notice}
              </p>
            )}

            <button type="submit" className="tube" disabled={busy}>
              <span>{busy ? t.auth.working : mode === 'signin' ? t.auth.submitIn : t.auth.submitUp}</span>
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-ink-dim">
          {t.auth.privacy}
        </p>
      </div>
    </div>
  )
}
