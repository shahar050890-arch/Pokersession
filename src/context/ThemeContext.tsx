import { useEffect, type ReactNode } from 'react'

/**
 * The app has one look: a dark room lit by a neon sign. There is no light
 * variant to switch to, so this only makes the choice explicit to the browser
 * rather than offering the user a setting that does nothing.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.style.colorScheme = 'dark'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#070510')
  }, [])

  return <>{children}</>
}
