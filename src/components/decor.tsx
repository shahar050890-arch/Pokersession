import type { ReactNode } from 'react'

/**
 * Poker motifs, kept deliberately quiet. This app is mostly money figures, so
 * every decorative mark sits far below the text in contrast and never competes
 * with a number.
 */

const SPADE =
  'M32 3c-2.1 6.2-25 21.8-25 36.2 0 8.1 6 13.8 13.5 13.8 4.4 0 8.1-1.8 10.3-4.6-.9 6.3-3.6 10.8-7.2 13.5-1.8.9-.9 3.6.9 3.6h15c1.8 0 2.7-2.7.9-3.6-3.6-2.7-6.3-7.2-7.2-13.5 2.2 2.8 5.9 4.6 10.3 4.6C51 53 57 47.3 57 39.2 57 24.8 34.1 9.2 32 3z'
const HEART =
  'M32 60C32 60 6 44.6 6 26.4 6 17.3 13 11 21 11c5 0 9.2 2.6 11 6.4C33.8 13.6 38 11 43 11c8 0 15 6.3 15 15.4C58 44.6 32 60 32 60z'
const DIAMOND = 'M32 4 57 32 32 60 7 32z'
const CLUB =
  'M32 4c-6.2 0-11.2 5-11.2 11.2 0 1.6.3 3.1.9 4.4a11 11 0 0 0-3.9-.7C11.6 18.9 6 24.5 6 31.4s5.6 12.5 12.5 12.5c3.9 0 7.3-1.8 9.6-4.5-.6 6.4-3.2 11-6.8 13.6-1.8.9-.9 3.6.9 3.6h19.6c1.8 0 2.7-2.7.9-3.6-3.6-2.6-6.2-7.2-6.8-13.6 2.3 2.7 5.7 4.5 9.6 4.5C52.4 43.9 58 38.3 58 31.4s-5.6-12.5-12.5-12.5c-1.4 0-2.7.2-3.9.7.6-1.3.9-2.8.9-4.4C43.2 9 38.2 4 32 4z'

/**
 * A sparse, fine-grained suit weave. Small marks at low contrast read as
 * texture; large ones read as clip art, so the scale here stays tight.
 */
export function SuitField({ opacity = 0.05, scale = 46 }: { opacity?: number; scale?: number }) {
  const id = `weave-${scale}-${String(opacity).replace('.', '')}`
  const k = scale / 320
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <pattern id={id} width={scale} height={scale} patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <g fill="currentColor" opacity={opacity}>
            <path d={SPADE} transform={`translate(${scale * 0.06} ${scale * 0.06}) scale(${k})`} />
            <path d={DIAMOND} transform={`translate(${scale * 0.56} ${scale * 0.3}) scale(${k})`} />
            <path d={CLUB} transform={`translate(${scale * 0.3} ${scale * 0.58}) scale(${k})`} />
            <path d={HEART} transform={`translate(${scale * 0.74} ${scale * 0.74}) scale(${k})`} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/**
 * The table: a single slab of green clay. It is the one surface that does not
 * change between the two modes, so switching never reads as a different app.
 */
export function Felt({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden text-white ${className}`}
      style={{
        background: 'linear-gradient(145deg, #12564A, #0A2E27)',
        boxShadow:
          '0 20px 38px -16px var(--clay-cast), inset 6px 6px 14px #ffffff1f, inset -6px -6px 14px #04171359',
      }}
    >
      <div className="absolute inset-0 text-white">
        <SuitField opacity={0.05} scale={38} />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

/**
 * The table's own lettering. Clay has no neon in it, so this is stamped into
 * the surface instead of glowing off it — a dark cut with a light edge under it.
 */
export function NeonSign({ children }: { children: string }) {
  return (
    <p
      className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-white/45"
      style={{ textShadow: '0 1px 0 #ffffff26, 0 -1px 1px #00000059' }}
    >
      {children}
    </p>
  )
}

interface ChipProps {
  /** 0–1 of the budget already used. */
  ratio: number
  color: string
  size?: number
  caption?: string
}

/**
 * A casino chip whose rim fills as the monthly budget is spent — the progress
 * meter and the motif in one object. The eight rim inlays and the double inner
 * ring are what make it read as a chip rather than a donut chart.
 */
export function BudgetChip({ ratio, color, size = 96, caption = '' }: ChipProps) {
  const r = 41
  const c = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, ratio))
  const pct = Math.round(clamped * 100)

  return (
    <svg
      viewBox="0 0 110 110"
      width={size}
      height={size}
      aria-hidden
      className="shrink-0"
      style={{ filter: 'drop-shadow(0 8px 12px var(--clay-cast))' }}
    >
      <defs>
        <linearGradient id="chip-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* body */}
      <circle cx="55" cy="55" r="52" fill={color} fillOpacity="0.10" />
      <circle cx="55" cy="55" r="52" fill="none" stroke={color} strokeOpacity="0.30" strokeWidth="1" />

      {/* eight rim inlays */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="50.5" y="2.5" width="9" height="13" rx="2.5"
          fill={color} fillOpacity={i % 2 === 0 ? 0.5 : 0.2}
          transform={`rotate(${i * 45} 55 55)`}
        />
      ))}

      {/* spent track + arc */}
      <circle cx="55" cy="55" r={r} fill="none" className="stroke-ink/[0.09]" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${clamped * c} ${c}`}
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dasharray 600ms cubic-bezier(0.22,1,0.36,1)' }}
      />

      {/* face */}
      <circle cx="55" cy="55" r="33" className="fill-panel" />
      <circle cx="55" cy="55" r="33" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="55" cy="55" r="28" fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="1" />
      <circle cx="55" cy="47" r="26" fill="url(#chip-face)" opacity="0.5" />

      <text
        x="55" y="53" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="20" fontWeight="800"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {pct}%
      </text>
      {caption && (
        <text x="55" y="70" textAnchor="middle" fill={color} fillOpacity="0.55" fontSize="11" fontWeight="600">
          {caption}
        </text>
      )}
    </svg>
  )
}

interface FanCard {
  rot: number
  x: number
  y: number
  rank: string
  suit: string
  red: boolean
}

const FAN: FanCard[] = [
  { rot: -22, x: -21, y: 4, rank: 'A', suit: SPADE, red: false },
  { rot: -1, x: 0, y: 0, rank: 'K', suit: HEART, red: true },
  { rot: 20, x: 21, y: 4, rank: 'Q', suit: DIAMOND, red: true },
]

/**
 * A fanned hand. Each card carries a corner index the way a real deck does —
 * in a fan the neighbour covers everything but that corner, so a centred pip
 * alone would be hidden on every card but the last.
 */
export function CardFan({ className = 'h-20 w-28' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 104" className={className} aria-hidden>
      <defs>
        <filter id="fan-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.32" />
        </filter>
      </defs>

      {FAN.map((c, i) => {
        const fill = c.red ? '#C8102E' : '#14141A'
        const last = i === FAN.length - 1
        return (
          <g
            key={i}
            filter="url(#fan-shadow)"
            transform={`translate(${70 + c.x} ${58 + c.y}) rotate(${c.rot}) translate(-23 -34)`}
          >
            <rect
              width="46" height="68" rx="6"
              fill="#F9F6EE"
              stroke="#00000018"
              strokeWidth="1.25"
            />
            {/* corner index */}
            <text x="10" y="16" textAnchor="middle" fontSize="13" fontWeight="700" fill={fill}>
              {c.rank}
            </text>
            <path d={c.suit} transform="translate(6.4 19) scale(0.115)" fill={fill} />
            {/* the top card has room for a full pip */}
            {last && <path d={c.suit} transform="translate(12 30) scale(0.34)" fill={fill} />}
          </g>
        )
      })}
    </svg>
  )
}

const SUIT_FOR: Record<'cash' | 'tournament', { path: string; red: boolean }> = {
  cash: { path: SPADE, red: false },
  tournament: { path: DIAMOND, red: true },
}

/** Marks a session's game type with a suit instead of a word. */
export function SuitMark({ type, className = '' }: { type: 'cash' | 'tournament'; className?: string }) {
  const { path, red } = SUIT_FOR[type]
  return (
    <span
      aria-hidden
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]
                  ${red ? 'bg-loss/[0.12]' : 'bg-sunken'} ${className}`}
      style={{ boxShadow: 'var(--clay-press)' }}
    >
      <svg viewBox="0 0 64 64" className="h-[15px] w-[15px]">
        <path d={path} className={red ? 'fill-loss' : 'fill-ink'} fillOpacity={red ? 0.9 : 0.62} />
      </svg>
    </span>
  )
}

/**
 * Casino chips carry their value in their colour — black hundreds, blue
 * five-hundreds, purple for the big one. Using the real denomination palette
 * means the quick-add buttons are readable at a glance without reading them.
 */
const DENOM: Record<number, { body: string; rim: string; ink: string }> = {
  25: { body: '#1E7A4C', rim: '#FFFFFF', ink: '#FFFFFF' },
  50: { body: '#C8752B', rim: '#FFFFFF', ink: '#FFFFFF' },
  100: { body: '#1B1B22', rim: '#FFFFFF', ink: '#FFFFFF' },
  200: { body: '#1F4E8C', rim: '#FFFFFF', ink: '#FFFFFF' },
  500: { body: '#5B2D82', rim: '#FFFFFF', ink: '#FFFFFF' },
  1000: { body: '#B08322', rim: '#FFFFFF', ink: '#FFFFFF' },
}

function chipColors(value: number) {
  return DENOM[value] ?? { body: '#3F3F46', rim: '#FFFFFF', ink: '#FFFFFF' }
}

/** The chip face itself, without any button chrome around it. */
export function ChipFace({ value, size = 54 }: { value: number; size?: number }) {
  const { body, rim, ink } = chipColors(value)
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="shrink-0">
      <defs>
        <radialGradient id={`cg-${value}`} cx="50%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="32" r="31" fill={body} />
      {/* six rim inlays, the mark of a real chip */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={i}
          x="28" y="1.5" width="8" height="10" rx="2"
          fill={rim} fillOpacity="0.92"
          transform={`rotate(${i * 60} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="23" fill="none" stroke={rim} strokeOpacity="0.85" strokeWidth="2" />
      <circle cx="32" cy="32" r="19.5" fill={body} />
      <circle cx="32" cy="32" r="31" fill={`url(#cg-${value})`} />
      <circle cx="32" cy="32" r="31" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" />
      <text
        x="32" y="33" textAnchor="middle" dominantBaseline="central"
        fill={ink} fontSize={value >= 1000 ? 14 : 17} fontWeight="800"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </text>
    </svg>
  )
}

/** A chip you can press — the quick-add control on the entry screen. */
export function ChipButton({
  value,
  onClick,
  label,
  size = 54,
}: {
  value: number
  onClick: () => void
  label: string
  size?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 rounded-full transition duration-150 active:translate-y-[2px]"
      style={{ filter: 'drop-shadow(0 10px 14px var(--clay-cast))' }}
    >
      <ChipFace value={value} size={size} />
    </button>
  )
}

/** A leaning stack of chips, for decoration where there is room for it. */
export function ChipStack({ className = 'h-16 w-16' }: { className?: string }) {
  const stack = [500, 100, 25, 100]
  return (
    <svg
      viewBox="0 0 80 92"
      className={className}
      aria-hidden
      style={{ filter: 'drop-shadow(0 8px 10px var(--clay-cast))' }}
    >
      {stack.map((v, i) => {
        const { body, rim } = chipColors(v)
        const y = 66 - i * 13
        return (
          <g key={i}>
            <ellipse cx="40" cy={y + 7} rx="30" ry="10.5" fill="#000" opacity="0.16" />
            <rect x="10" y={y - 1} width="60" height="9" fill={body} />
            <ellipse cx="40" cy={y + 8} rx="30" ry="10.5" fill={body} />
            <ellipse cx="40" cy={y} rx="30" ry="10.5" fill={body} />
            <ellipse cx="40" cy={y} rx="30" ry="10.5" fill="#FFF" fillOpacity="0.10" />
            {[-1, 0, 1].map((k) => (
              <rect key={k} x={38 + k * 20} y={y - 11} width="5" height="5" rx="1.5" fill={rim} fillOpacity="0.85" />
            ))}
            <ellipse cx="40" cy={y} rx="15" ry="5.2" fill="none" stroke={rim} strokeOpacity="0.7" strokeWidth="1.5" />
          </g>
        )
      })}
    </svg>
  )
}

/**
 * A card-room rule: a hairline broken by the four suits. Classic printer's
 * ornament, and it separates sections without adding another boxed card.
 */
export function SuitRule({ className = '' }: { className?: string }) {
  const suits = [SPADE, HEART, CLUB, DIAMOND]
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-hair" />
      <span className="flex items-center gap-1.5">
        {suits.map((d, i) => (
          <svg key={i} viewBox="0 0 64 64" className="h-[9px] w-[9px]">
            <path
              d={d}
              className={i === 1 || i === 3 ? 'fill-loss' : 'fill-ink'}
              fillOpacity={i === 1 || i === 3 ? 0.62 : 0.3}
            />
          </svg>
        ))}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-hair" />
    </div>
  )
}

/** Slim felt banner used as a page header, so every screen sits on the table. */
export function FeltHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <Felt className="mb-4 rounded-surface px-6 py-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {right}
      </div>
    </Felt>
  )
}

const RANKS = ['A', 'K', 'Q', 'J', '10'] as const

interface HandCard {
  id: string
  profit: number
  gameType: 'cash' | 'tournament'
}

/**
 * The most recent hands, dealt face up on the felt. Each card carries a real
 * figure — the rank is positional, the suit follows the game type, and the rim
 * light follows the result.
 */
export function RecentHand({
  sessions,
  format,
}: {
  sessions: HandCard[]
  format: (value: number) => string
}) {
  if (sessions.length === 0) return null

  return (
    <div className="mt-3.5 flex gap-2.5">
      {sessions.slice(0, 3).map((s, i) => {
        const up = s.profit >= 0
        const { path, red } = SUIT_FOR[s.gameType]
        const rim = up ? '#0FBFA0' : '#FF4D6D'
        return (
          <div
            key={s.id}
            className="relative flex min-h-[86px] flex-1 flex-col overflow-hidden rounded-[18px] p-3"
            style={{
              background: '#F9F6EE',
              boxShadow: `0 10px 18px -8px #00000073, inset 3px 3px 7px #ffffffcc,
                          inset -3px -3px 7px ${rim}33`,
            }}
          >
            <span className="flex items-center gap-[3px] text-[12px] font-extrabold">
              <span style={{ color: red ? '#C8102E' : '#14141A' }}>{RANKS[i]}</span>
              <svg viewBox="0 0 64 64" className="h-[11px] w-[11px]">
                <path d={path} fill={red ? '#C8102E' : '#14141A'} />
              </svg>
            </span>
            <svg
              viewBox="0 0 64 64"
              className="pointer-events-none absolute -inset-x-2 bottom-1.5 ms-auto h-[46px] w-[46px]"
              style={{ insetInlineEnd: -9, insetInlineStart: 'auto' }}
            >
              <path d={path} fill={red ? '#C8102E' : '#14141A'} opacity="0.12" />
            </svg>
            <span
              className="num relative mt-auto text-[15px] font-extrabold"
              style={{ color: up ? '#0A8F79' : '#D2273F' }}
            >
              {format(s.profit)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
