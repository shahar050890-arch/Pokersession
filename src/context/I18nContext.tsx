import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DICTS, type Lang, type Translations } from '../lib/i18n'
import { setLocale } from '../lib/format'

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
  dir: 'rtl' | 'ltr'
}

const I18nContext = createContext<I18nValue | null>(null)
const STORAGE_KEY = 'poker-lang'

function readStored(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'he' || raw === 'en') return raw
  } catch {
    /* private mode / blocked storage — fall through */
  }
  // Hebrew unless the browser clearly prefers something else.
  return navigator.language?.startsWith('he') === false ? 'en' : 'he'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored)
  const t = DICTS[lang]

  // Direction and locale are global concerns: the document element carries the
  // former, and the formatters read the latter.
  setLocale(t.locale)
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = t.dir
  }, [lang, t.dir])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      t,
      dir: t.dir,
      setLang: (l) => {
        setLangState(l)
        try {
          localStorage.setItem(STORAGE_KEY, l)
        } catch {
          /* preference just won't persist */
        }
      },
    }),
    [lang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
