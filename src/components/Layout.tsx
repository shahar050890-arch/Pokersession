import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChartIcon, GearIcon, ListIcon, PlusIcon } from './icons'

const TABS = [
  { to: '/', label: 'סיכום', Icon: ChartIcon, end: true },
  { to: '/sessions', label: 'סשנים', Icon: ListIcon, end: false },
  { to: '/settings', label: 'הגדרות', Icon: GearIcon, end: false },
]

export default function Layout() {
  const { pathname } = useLocation()
  // The keypad screen owns the whole viewport; the floating action would only
  // sit on top of it.
  const onEntry = pathname === '/add' || pathname.endsWith('/edit')

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-3 sm:px-6">
        <Outlet />
      </main>

      {!onEntry && (
        <NavLink
          to="/add"
          className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full
                     bg-ink py-3.5 pl-6 pr-5 text-[16px] font-semibold text-white shadow-lift
                     transition active:scale-95 dark:bg-white dark:text-night-bg"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
        >
          <PlusIcon className="h-5 w-5" />
          סשן חדש
        </NavLink>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t hairline bg-paper/90 backdrop-blur-xl dark:bg-night-bg/90"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-ink dark:text-white' : 'text-ink-faint dark:text-zinc-600'
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
