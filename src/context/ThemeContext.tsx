import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
export type Resolved = 'light' | 'dark'

const KEY = 'poker.theme'
const GROUND: Record<Resolved, string> = { dark: '#070510', light: '#F7F2E6' }

interface ThemeValue {
  /** What the user picked, which may be "follow the device". */
  theme: ThemePref
  /** What that actually renders as right now. */
  resolved: Resolved
  setTheme: (next: ThemePref) => void
}

const Ctx = createContext<ThemeValue | null>(null)

function stored(): ThemePref {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // Private browsing can refuse storage; the default still works.
  }
  return 'system'
}

const prefersDark = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(stored)
  const [systemDark, setSystemDark] = useState(prefersDark)

  // Only "system" needs to listen, but the listener is cheap and keeping it
  // unconditional avoids a stale reading the moment the user switches back.
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: Resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved
    // Tells the browser which way to paint scrollbars, form controls and the
    // native date picker — the palette alone does not reach those.
    root.style.colorScheme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', GROUND[resolved])
  }, [resolved])

  const setTheme = useCallback((next: ThemePref) => {
    setThemeState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Not persisting is survivable; the choice still holds for this visit.
    }
  }, [])

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
