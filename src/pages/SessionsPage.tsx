import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { formatDuration, formatMoney, formatSigned, monthKey, formatMonth, relativeDate } from '../lib/format'
import type { GameType, PokerSession } from '../lib/types'
import { PencilIcon, TrashIcon } from '../components/icons'
import { FeltHeader, SuitMark } from '../components/decor'
import { useI18n } from '../context/I18nContext'
import { EmptyState, ErrorNote, Spinner, moneyClass } from '../components/ui'

export default function SessionsPage() {
  const { t } = useI18n()
  const GAME_LABEL: Record<GameType, string> = { cash: t.form.cash, tournament: t.form.tournament }
  const { sessions, loading, error, locations, deleteSession } = useData()
  const navigate = useNavigate()
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (gameFilter === 'all' || s.game_type === gameFilter) &&
          (locationFilter === 'all' || s.location === locationFilter),
      ),
    [sessions, gameFilter, locationFilter],
  )

  // Grouped by month so a long history stays scannable.
  const months = useMemo(() => {
    const buckets = new Map<string, PokerSession[]>()
    for (const s of filtered) {
      const key = monthKey(s.date)
      const list = buckets.get(key) ?? []
      list.push(s)
      buckets.set(key, list)
    }
    return [...buckets.entries()]
  }, [filtered])

  if (loading) return <Spinner />

  if (sessions.length === 0) {
    return (
      <EmptyState
        title={t.list.emptyTitle}
        body={t.list.emptyBody}
        action={
          <Link to="/add" className="tube block">
            <span>{t.list.emptyCta}</span>
          </Link>
        }
      />
    )
  }

  async function confirmDelete(id: string) {
    setDeleteError(null)
    try {
      await deleteSession(id)
      setPendingDelete(null)
      setOpenId(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t.list.errDeleteFailed)
    }
  }

  const hasFilter = gameFilter !== 'all' || locationFilter !== 'all'

  return (
    <div>
      <FeltHeader
        title={t.list.title}
        right={
          <span className="num rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold">
            {filtered.length}
          </span>
        }
      />

      <div className="rail mb-4">
        <button
          onClick={() => {
            setGameFilter('all')
            setLocationFilter('all')
          }}
          className="chip-pill" data-on={!hasFilter}
        >
          {t.list.all}
        </button>
        {(['cash', 'tournament'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGameFilter(gameFilter === g ? 'all' : g)}
            className="chip-pill" data-on={gameFilter === g}
          >
            {GAME_LABEL[g]}
          </button>
        ))}
        {locations.map((l) => (
          <button
            key={l}
            onClick={() => setLocationFilter(locationFilter === l ? 'all' : l)}
            className="chip-pill" data-on={locationFilter === l}
          >
            {l}
          </button>
        ))}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {deleteError && <ErrorNote>{deleteError}</ErrorNote>}

      {filtered.length === 0 ? (
        <p className="surface px-5 py-10 text-center text-[15px] text-ink-soft">
          {t.list.noMatch}
        </p>
      ) : (
        <div className="space-y-5">
          {months.map(([key, list]) => {
            const monthProfit = list.reduce((sum, s) => sum + s.profit, 0)
            return (
              <section key={key}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="section-label">
                    {formatMonth(key)}
                  </h2>
                  <span className={`num text-[14px] font-semibold ${moneyClass(monthProfit)}`}>
                    {formatSigned(monthProfit)}
                  </span>
                </div>

                <div className="surface divide-y divide-hair-soft overflow-hidden">
                  {list.map((s) => {
                    const open = openId === s.id
                    return (
                      <div key={s.id}>
                        <button
                          onClick={() => {
                            setOpenId(open ? null : s.id)
                            setPendingDelete(null)
                          }}
                          className="row-press flex w-full items-center justify-between gap-3 px-5 py-3.5 text-start"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <SuitMark type={s.game_type} />
                            <span className="min-w-0">
                              <span className="block truncate text-[16px] font-medium">
                                {s.location || GAME_LABEL[s.game_type]}
                              </span>
                              <span className="mt-0.5 block text-[12.5px] text-ink-faint">
                                {relativeDate(s.date, { today: t.form.today, yesterday: t.form.yesterday })}
                                {s.rebuys > 0 ? ` · ${t.list.entries(s.rebuys + 1)}` : ''}
                              </span>
                            </span>
                          </span>
                          <span className={`num shrink-0 text-[18px] font-bold ${moneyClass(s.profit)}`}>
                            {formatSigned(s.profit)}
                          </span>
                        </button>

                        {open && (
                          <div className="border-t border-hair-soft bg-sunken/60 px-5 py-4">
                            <dl className="space-y-2 text-[14px]">
                              {(
                                [
                                  [t.list.type, GAME_LABEL[s.game_type]],
                                  [t.list.totalIn, formatMoney(s.total_in)],
                                  [t.list.cashOut, formatMoney(s.cash_out)],
                                  [t.list.duration, formatDuration(s.duration_minutes, t.units)],
                                  ...(s.entry_currency === 'USD' && s.fx_rate
                                    ? ([
                                        [
                                          t.list.inUsd,
                                          `$${Math.round((s.total_in / s.fx_rate) * 100) / 100} · ${t.form.rate} ${s.fx_rate}`,
                                        ],
                                      ] as const)
                                    : []),
                                ] as const
                              ).map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <dt className="text-ink-faint">{k}</dt>
                                  <dd className="num font-medium">{v}</dd>
                                </div>
                              ))}
                            </dl>

                            {s.notes && (
                              <p className="mt-3 rounded-control bg-sunken px-3.5 py-2.5 text-[14px] leading-relaxed text-ink-soft">
                                {s.notes}
                              </p>
                            )}

                            {pendingDelete === s.id ? (
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => void confirmDelete(s.id)}
                                  className="flex-1 rounded-tube bg-loss py-2.5 text-[15px] font-semibold text-room"
                                >
                                  {t.list.confirmDelete}
                                </button>
                                <button
                                  onClick={() => setPendingDelete(null)}
                                  className="plaque flex-1 !py-2.5 !text-[14px]"
                                >
                                  {t.list.cancel}
                                </button>
                              </div>
                            ) : (
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => navigate(`/sessions/${s.id}/edit`)}
                                  className="plaque flex flex-1 items-center justify-center gap-2 !py-2.5 !text-[14px]"
                                >
                                  <PencilIcon />
                                  {t.list.edit}
                                </button>
                                <button
                                  onClick={() => setPendingDelete(s.id)}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-tube border border-loss/40 py-2.5 text-[14px] font-semibold text-loss"
                                >
                                  <TrashIcon />
                                  {t.list.delete}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
