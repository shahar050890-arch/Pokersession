import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { formatMoney, formatShortDate, formatSigned } from '../lib/format'

export interface ChartPoint {
  date: string
  label: string
  value: number
}

const PROFIT = '#0E9F6E'
const LOSS = '#DC4B45'
const PROFIT_DARK = '#34D399'
const LOSS_DARK = '#F87171'

function useAxisColors() {
  const { resolved } = useTheme()
  const dark = resolved === 'dark'
  return {
    dark,
    axis: dark ? '#71717A' : '#A1A1AA',
    grid: dark ? '#26262C' : '#ECECE8',
    tooltipBg: dark ? '#151519' : '#FFFFFF',
    tooltipText: dark ? '#FAFAFA' : '#14141A',
    border: dark ? '#26262C' : '#ECECE8',
    up: dark ? PROFIT_DARK : PROFIT,
    down: dark ? LOSS_DARK : LOSS,
  }
}

/** LRM-prefixed so a leading minus isn't reordered to the end inside RTL text. */
function compact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  const body = abs >= 1000 ? `${Math.round(abs / 100) / 10}k` : String(Math.round(abs))
  return `\u200E${sign}${body}`
}

interface TipProps {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
  title: string
}

function Tip({ active, payload, title }: TipProps) {
  const c = useAxisColors()
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div
      dir="rtl"
      className="rounded-xl px-3 py-2 text-xs shadow-card"
      style={{ background: c.tooltipBg, color: c.tooltipText, border: `1px solid ${c.border}` }}
    >
      <p style={{ opacity: 0.6 }}>{formatShortDate(point.date)}</p>
      <p className="num mt-0.5 font-semibold" style={{ color: point.value >= 0 ? c.up : c.down }}>
        {title}: {formatSigned(point.value)}
      </p>
    </div>
  )
}

export function CumulativeChart({ data }: { data: ChartPoint[] }) {
  const c = useAxisColors()
  const { t, dir } = useI18n()
  // The value axis belongs on the side the eye finishes a row on.
  const axisSide = dir === 'rtl' ? 'right' : 'left'
  const last = data.at(-1)?.value ?? 0
  const stroke = last >= 0 ? c.up : c.down

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: c.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
          tickMargin={10}
          padding={dir === 'rtl' ? { right: 12 } : { left: 12 }}
        />
        <YAxis
          orientation={axisSide}
          tick={{ fill: c.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={46}
          tickMargin={4}
          tickFormatter={compact}
        />
        <ReferenceLine y={0} stroke={c.axis} strokeWidth={1.5} />
        <Tooltip content={<Tip title={t.chart.cumulative} />} cursor={{ stroke: c.axis, strokeDasharray: '3 3' }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function PerSessionChart({ data }: { data: ChartPoint[] }) {
  const c = useAxisColors()
  const { t, dir } = useI18n()
  const axisSide = dir === 'rtl' ? 'right' : 'left'

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: c.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
          tickMargin={10}
          padding={dir === 'rtl' ? { right: 12 } : { left: 12 }}
        />
        <YAxis
          orientation={axisSide}
          tick={{ fill: c.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={46}
          tickMargin={4}
          tickFormatter={compact}
        />
        <ReferenceLine y={0} stroke={c.axis} strokeWidth={1.5} />
        <Tooltip
          content={<Tip title={t.chart.session} />}
          cursor={{ fill: c.grid }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((d) => (
            <Cell key={d.date + d.label} fill={d.value >= 0 ? c.up : c.down} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ChartEmpty({ children }: { children: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-[15px] text-ink-soft dark:text-zinc-500">
      {children}
    </div>
  )
}

export { formatMoney }
