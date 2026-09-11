import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { formatDate, formatDuration, formatMoney, formatSigned } from '../lib/format'
import type { GameType } from '../lib/types'
import { PencilIcon, TrashIcon } from '../components/icons'
import { EmptyState, ErrorNote, PageTitle, Spinner, profitClass } from '../components/ui'

const GAME_LABEL: Record<GameType, string> = { cash: 'קאש', tournament: 'טורניר' }

export default function SessionsPage() {
  const { sessions, loading, error, locations, deleteSession } = useData()
  const navigate = useNavigate()
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all')
  const [locationFilter, setLocationFilter] = useState('all')
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

  if (loading) return <Spinner label="טוען סשנים…" />

  if (sessions.length === 0) {
    return (
      <div>
        <PageTitle title="סשנים" />
        <EmptyState
          title="אין עדיין סשנים"
          body="ברגע שתוסיף סשן ראשון הוא יופיע כאן, עם הרווח או ההפסד שלו."
          action={
            <Link to="/add" className="btn-primary block text-center">
              הוסף סשן ראשון
            </Link>
          }
        />
      </div>
    )
  }

  async function confirmDelete(id: string) {
    setDeleteError(null)
    try {
      await deleteSession(id)
      setPendingDelete(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'המחיקה נכשלה')
    }
  }

  return (
    <div>
      <PageTitle title="סשנים" subtitle={`${filtered.length} מתוך ${sessions.length}`} />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <select
          className="field appearance-none"
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value as GameType | 'all')}
          aria-label="סינון לפי סוג משחק"
        >
          <option value="all">כל סוגי המשחק</option>
          <option value="cash">קאש</option>
          <option value="tournament">טורניר</option>
        </select>

        <select
          className="field appearance-none"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          aria-label="סינון לפי מיקום"
        >
          <option value="all">כל המיקומים</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {deleteError && <ErrorNote>{deleteError}</ErrorNote>}

      {filtered.length === 0 ? (
        <div className="card py-10 text-center text-sm text-ink-soft dark:text-zinc-400">
          אין סשנים שמתאימים לסינון.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => (
            <li key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{formatDate(s.date)}</span>
                    <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft dark:bg-zinc-800 dark:text-zinc-400">
                      {GAME_LABEL[s.game_type]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-soft dark:text-zinc-400">
                    {s.location || 'ללא מיקום'}
                    {s.duration_minutes ? ` · ${formatDuration(s.duration_minutes)}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 text-lg font-bold tabular-nums ${profitClass(s.profit)}`}>
                  {formatSigned(s.profit)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                <div className="flex gap-4 text-ink-soft dark:text-zinc-400">
                  <span>
                    כניסות <span className="font-medium tabular-nums text-ink dark:text-zinc-200">{formatMoney(s.total_in)}</span>
                    {s.rebuys > 0 && <span className="text-xs"> ({s.rebuys + 1}×)</span>}
                  </span>
                  <span>
                    יציאה <span className="font-medium tabular-nums text-ink dark:text-zinc-200">{formatMoney(s.cash_out)}</span>
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate(`/sessions/${s.id}/edit`)}
                    className="rounded-lg p-2 text-ink-soft transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    aria-label="ערוך סשן"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => setPendingDelete(s.id)}
                    className="rounded-lg p-2 text-ink-soft transition hover:bg-red-50 hover:text-loss dark:text-zinc-400 dark:hover:bg-red-950/40"
                    aria-label="מחק סשן"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {s.notes && (
                <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-soft dark:bg-zinc-800 dark:text-zinc-400">
                  {s.notes}
                </p>
              )}

              {pendingDelete === s.id && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
                  <p className="text-sm text-red-900 dark:text-red-200">למחוק את הסשן הזה?</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => void confirmDelete(s.id)}
                      className="flex-1 rounded-lg bg-loss px-3 py-2 text-sm font-medium text-white"
                    >
                      מחק
                    </button>
                    <button
                      onClick={() => setPendingDelete(null)}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-900 dark:border-red-900 dark:text-red-200"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
