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

      {/* The same object as the primary button: a lit tube at night, a slab of
          felt with a brass rail by day. */}
      {!onEntry && (
        <NavLink
          to="/add"
          className={`fixed left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-tube px-6
                      py-3 text-[15.5px] font-bold shadow-tube transition active:scale-95 ${
                        resolved === 'dark'
                          ? 'border-[1.5px] border-jade/70 text-jade'
                          : 'text-[#FFF8E6]'
                      }`}
          style={{
            bottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
            ...(resolved === 'dark'
              ? {
                  background: 'linear-gradient(180deg, #100D1F, #0A0816)',
                  textShadow: '0 0 10px #0FBFA0cc',
                }
              : {
                  background: 'linear-gradient(180deg, #0D3A34, #08241F)',
                  boxShadow: 'inset 0 0 0 1.5px #A8801E, 0 6px 18px -8px #0D3A3499',
                }),
          }}
        >
          <PlusIcon className="h-[18px] w-[18px]" />
          {t.nav.add}
        </NavLink>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-hair-soft bg-room/90 backdrop-blur-xl"
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
