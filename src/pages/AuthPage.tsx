import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { SpadeIcon } from '../components/icons'
import { ErrorNote } from '../components/ui'

type Mode = 'signin' | 'signup'

/** Supabase surfaces English auth errors; map the common ones to Hebrew. */
function translateError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'אימייל או סיסמה שגויים'
  if (m.includes('user already registered')) return 'האימייל הזה כבר רשום. נסה להתחבר.'
  if (m.includes('password should be at least')) return 'הסיסמה חייבת להכיל לפחות 6 תווים'
  if (m.includes('unable to validate email')) return 'כתובת האימייל אינה תקינה'
  if (m.includes('email not confirmed')) return 'צריך לאשר את האימייל לפני ההתחברות'
  return message
}

export default function AuthPage() {
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
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    setBusy(true)
    const fn = mode === 'signin' ? supabase.auth.signInWithPassword : supabase.auth.signUp
    const { data, error: authError } = await fn.call(supabase.auth, { email: email.trim(), password })
    setBusy(false)

    if (authError) {
      setError(translateError(authError.message))
      return
    }

    // With email confirmation on, sign-up returns a user but no session.
    if (mode === 'signup' && data.user && !data.session) {
      setNotice('שלחנו לך אימייל לאישור החשבון. אשר אותו ואז התחבר.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-9 flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-ink text-white dark:bg-white dark:text-night-bg">
            <SpadeIcon className="h-8 w-8" />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight">מעקב פוקר</h1>
          <p className="mt-2 text-[15px] text-ink-soft dark:text-zinc-400">
            רווחים, הפסדים ותקציב — במקום אחד.
          </p>
        </div>

        <div className="surface p-5">
          <div className="mb-5 flex rounded-xl bg-line/60 p-1 dark:bg-night-line/60">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(null)
                  setNotice(null)
                }}
                className={`flex-1 rounded-lg py-2.5 text-[15px] font-medium transition ${
                  mode === m
                    ? 'bg-card text-ink shadow-soft dark:bg-night-card dark:text-white'
                    : 'text-ink-soft dark:text-zinc-400'
                }`}
              >
                {m === 'signin' ? 'התחברות' : 'הרשמה'}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label mb-1.5 block" htmlFor="email">
                אימייל
              </label>
              <input
                id="email"
                type="email"
                dir="ltr"
                required
                autoComplete="email"
                className="field text-right"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label mb-1.5 block" htmlFor="password">
                סיסמה
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="field"
                placeholder="לפחות 6 תווים"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}
            {notice && (
              <p className="rounded-xl bg-up-soft px-4 py-3 text-[15px] text-up dark:bg-up/10 dark:text-up-night">
                {notice}
              </p>
            )}

            <button type="submit" className="btn" disabled={busy}>
              {busy ? 'רגע…' : mode === 'signin' ? 'התחבר' : 'צור חשבון'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-ink-faint">
          הנתונים שלך פרטיים. כל משתמש רואה רק את הסשנים שלו.
        </p>
      </div>
    </div>
  )
}
