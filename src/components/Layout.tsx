import { NavLink, Outlet } from 'react-router-dom'
import { ChartIcon, GearIcon, ListIcon, PlusIcon } from './icons'

const tabs = [
  { to: '/', label: 'דשבורד', Icon: ChartIcon, end: true },
  { to: '/sessions', label: 'סשנים', Icon: ListIcon, end: false },
  { to: '/add', label: 'הוספה', Icon: PlusIcon, end: false },
  { to: '/settings', label: 'הגדרות', Icon: GearIcon, end: false },
]

export default function Layout() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200/70 bg-white/85 backdrop-blur-xl
                   dark:border-zinc-800 dark:bg-black/80"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-3xl">
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-ink dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
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
