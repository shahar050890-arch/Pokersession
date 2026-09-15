import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChartIcon, GearIcon, ListIcon, PlusIcon } from './icons'
import { useI18n } from '../context/I18nContext'
import { useTheme } from '../context/ThemeContext'

export default function Layout() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const { resolved } = useTheme()

  const TABS = [
    { to: '/', label: t.nav.summary, Icon: ChartIcon, end: true },
    { to: '/sessions', label: t.nav.sessions, Icon: ListIcon, end: false },
    { to: '/settings', label: t.nav.settings, Icon: GearIcon, end: false },
  ]

  // The keypad screen owns the whole viewport; the floating action would only
  // sit on top of it.
  const onEntry = pathname === '/add' || pathname.endsWith('/edit')

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-3 sm:px-6">
        <Outlet />
      </main>

      {/* The same lozenge of jade clay as the primary button, floating. */}
      {!onEntry && (
        <NavLink
          to="/add"
          className="fixed left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-tube
                     px-7 py-3.5 text-[15.5px] font-extrabold transition duration-150
                     active:translate-y-[2px]"
          style={{
            bottom: 'calc(5.75rem + env(safe-area-inset-bottom))',
            background: 'linear-gradient(145deg, rgb(var(--c-jade)), rgb(var(--c-jade) / 0.82))',
            color: resolved === 'dark' ? '#05221D' : '#F4FFFB',
            boxShadow: 'var(--sh-tube)',
          }}
        >
          <PlusIcon className="h-[18px] w-[18px]" />
          {t.nav.add}
        </NavLink>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 bg-panel/95 backdrop-blur-xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          boxShadow: '0 -10px 26px -14px var(--clay-cast), inset 0 2px 5px var(--clay-hi)',
        }}
      >
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-jade' : 'text-ink-dim'
                }`
              }
            >
              <Icon className="h-[22px] w-[22px]" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
