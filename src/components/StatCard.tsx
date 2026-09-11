interface Props {
  label: string
  value: string
  tone?: string
  hint?: string
}

export default function StatCard({ label, value, tone, hint }: Props) {
  return (
    <div className="rounded-xl2 bg-white p-4 shadow-card dark:bg-zinc-900">
      <p className="text-xs font-medium text-ink-soft dark:text-zinc-500">{label}</p>
      <p className={`mt-1.5 text-xl font-bold tabular-nums ${tone ?? ''}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ink-soft dark:text-zinc-500">{hint}</p>}
    </div>
  )
}
