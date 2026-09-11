interface Stat {
  label: string
  value: string
  tone?: string
}

/**
 * Label/value pairs on hairlines rather than one bordered box each — six
 * identical cards read as filler, a list reads as a summary.
 */
export default function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <section className="surface divide-y divide-line px-5 dark:divide-night-line">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center justify-between py-3.5">
          <span className="text-[15px] text-ink-soft dark:text-zinc-400">{s.label}</span>
          <span className={`num text-[17px] font-semibold ${s.tone ?? ''}`}>{s.value}</span>
        </div>
      ))}
    </section>
  )
}
