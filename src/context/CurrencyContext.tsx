import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cachedRate, fetchRate, type Rate } from '../lib/fx'
import { setDisplayCurrency, type DisplayCurrency } from '../lib/format'

interface CurrencyValue {
  display: DisplayCurrency
  setDisplay: (c: DisplayCurrency) => void
  rate: Rate | null
  /** True when USD was chosen but no rate is available, so ILS is shown instead. */
  fellBack: boolean
}

const CurrencyContext = createContext<CurrencyValue | null>(null)
const STORAGE_KEY = 'poker-display-currency'

function readStored(): DisplayCurrency {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'USD' ? 'USD' : 'ILS'
  } catch {
    return 'ILS'
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [display, setDisplayState] = useState<DisplayCurrency>(readStored)
  const [rate, setRate] = useState<Rate | null>(() => cachedRate())

  useEffect(() => {
    let alive = true
    void fetchRate().then((r) => {
      if (alive && r) setRate(r)
    })
    return () => {
      alive = false
    }
  }, [])

  // Applied during render so the first paint already uses the right currency.
  setDisplayCurrency(display, rate?.value ?? null)
  const fellBack = display === 'USD' && !rate

  const value = useMemo<CurrencyValue>(
    () => ({
      display,
      rate,
      fellBack,
      setDisplay: (c) => {
        setDisplayState(c)
        try {
          localStorage.setItem(STORAGE_KEY, c)
        } catch {
          /* preference just won't persist */
        }
      },
    }),
    [display, rate, fellBack],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}
