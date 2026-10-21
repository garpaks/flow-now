import { useMemo, useState } from 'react'
import type { Goal, Session } from '../../../shared/types'
import { categoryColor, formatMinutes } from '../utils'

interface Props {
  sessions: Session[]
  goals: Goal[]
}

type Range = 7 | 30 | 0
const RANGES: { value: Range; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 0, label: 'Todo' }
]

// Lunes primero
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos']
const SLOTS = [
  { name: 'de madrugada', from: 0, to: 6 },
  { name: 'por la mañana', from: 6, to: 12 },
  { name: 'por la tarde', from: 12, to: 18 },
  { name: 'por la noche', from: 18, to: 24 }
]
const NO_CATEGORY = 'Sin categoría'

const daysAgo = (days: number): number => (days ? Date.now() - days * 86_400_000 : 0)

const pad = (h: number): string => `${String(h % 24).padStart(2, '0')}:00`

/**
 * Reparte los minutos de cada pomodoro entre las horas del reloj que abarcó,
 * en proporción al solape con cada hora.
 */
function minutesByHour(sessions: Session[]): number[] {
  const hours = Array<number>(24).fill(0)
  for (const s of sessions) {
    const start = new Date(s.startedAt).getTime()
    const end = Math.max(new Date(s.endedAt).getTime(), start + 1)
    const span = end - start
    let t = start
    while (t < end) {
      const d = new Date(t)
      const nextHour = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours() + 1
      ).getTime()
      const sliceEnd = Math.min(nextHour, end)
      hours[d.getHours()] += (s.durationMin * (sliceEnd - t)) / span
      t = sliceEnd
    }
  }
  return hours
}

function BarChart({
  values,
  labels,
  showLabel,
  tooltip
}: {
  values: number[]
  labels: string[]
  showLabel: (i: number) => boolean
  tooltip: (i: number) => string
}): React.JSX.Element {
  const max = Math.max(...values, 1)
  const peak = values.indexOf(Math.max(...values))
  return (
    <div className="bars" style={{ '--n': values.length } as React.CSSProperties}>
      {values.map((v, i) => {
        // Alturas en escalones de 4px para que se vea pixelado
        const steps = v > 0 ? Math.max(1, Math.round((v / max) * 14)) : 0
        return (
          <div key={i} className="bar-col" title={tooltip(i)}>
            <div
              className={`bar${i === peak && v > 0 ? ' peak' : ''}`}
              style={{ height: steps * 4, '--i': i } as React.CSSProperties}
            />
            <span className="bar-label">{showLabel(i) ? labels[i] : ''}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Schedule({ sessions, goals }: Props): React.JSX.Element {
  const [range, setRange] = useState<Range>(30)
  // Inicio del periodo; se calcula al elegirlo (la pestaña se monta de nuevo al entrar)
  const [since, setSince] = useState(() => daysAgo(30))
  const pickRange = (r: Range): void => {
    setRange(r)
    setSince(daysAgo(r))
  }

  const stats = useMemo(() => {
    const list = sessions.filter((s) => new Date(s.startedAt).getTime() >= since)

    const hours = minutesByHour(list)
    const weekdays = Array<number>(7).fill(0)
    for (const s of list) weekdays[(new Date(s.startedAt).getDay() + 6) % 7] += s.durationMin

    const goalCategory = new Map(goals.map((g) => [g.id, g.category || NO_CATEGORY]))
    const byCategory = new Map<string, number>()
    for (const s of list) {
      const cat = (s.goalId && goalCategory.get(s.goalId)) || NO_CATEGORY
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + s.durationMin)
    }

    const total = list.reduce((sum, s) => sum + s.durationMin, 0)
    const slotMinutes = SLOTS.map((slot) =>
      hours.slice(slot.from, slot.to).reduce((a, b) => a + b, 0)
    )
    const topSlot = slotMinutes.indexOf(Math.max(...slotMinutes))
    const peakHour = hours.indexOf(Math.max(...hours))
    const topDay = weekdays.indexOf(Math.max(...weekdays))

    return {
      count: list.filter((s) => s.completed).length,
      total,
      hours,
      weekdays,
      categories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
      slot: SLOTS[topSlot].name,
      slotPct: total ? Math.round((slotMinutes[topSlot] / total) * 100) : 0,
      peakHour,
      topDay
    }
  }, [sessions, goals, since])

  const maxCategory = Math.max(...stats.categories.map(([, m]) => m), 1)

  return (
    <section className="schedule">
      <div className="cat-filter">
        {RANGES.map((r) => (
          <button
            key={r.value}
            className={range === r.value ? 'on' : ''}
            onClick={() => pickRange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {stats.total === 0 ? (
        <p className="muted center">
          Aún no hay pomodoros en este periodo. Cuando completes algunos verás aquí a qué horas
          sueles trabajar.
        </p>
      ) : (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-value">{stats.count}</span>
              <span className="stat-label">pomodoros</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatMinutes(Math.round(stats.total))}</span>
              <span className="stat-label">enfocado</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{pad(stats.peakHour)}</span>
              <span className="stat-label">hora pico</span>
            </div>
          </div>

          <p className="insight">
            Sueles trabajar <strong>{stats.slot}</strong> ({stats.slotPct}%), sobre todo entre las{' '}
            <strong>
              {pad(stats.peakHour)} y {pad(stats.peakHour + 1)}
            </strong>
            . Tu día más productivo: los <strong>{WEEKDAY_NAMES[stats.topDay]}</strong>.
          </p>

          <h3 className="goal-section">Por hora del día</h3>
          <div className="chart-box">
            <BarChart
              values={stats.hours}
              labels={stats.hours.map((_, h) => String(h))}
              showLabel={(h) => h % 3 === 0}
              tooltip={(h) =>
                `${pad(h)}–${pad(h + 1)} · ${formatMinutes(Math.round(stats.hours[h]))}`
              }
            />
          </div>

          <h3 className="goal-section">Por día de la semana</h3>
          <div className="chart-box">
            <BarChart
              values={stats.weekdays}
              labels={WEEKDAYS}
              showLabel={() => true}
              tooltip={(d) => `${WEEKDAYS[d]} · ${formatMinutes(stats.weekdays[d])}`}
            />
          </div>

          <h3 className="goal-section">Por categoría</h3>
          <ul className="cat-bars">
            {stats.categories.map(([cat, min], i) => (
              <li
                key={cat}
                style={
                  {
                    '--cat': cat === NO_CATEGORY ? 'var(--muted)' : categoryColor(cat),
                    '--i': i
                  } as React.CSSProperties
                }
              >
                <span className="cat-name">{cat}</span>
                <span className="cat-track">
                  <span className="cat-fill" style={{ width: `${(min / maxCategory) * 100}%` }} />
                </span>
                <span className="cat-min">{formatMinutes(Math.round(min))}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
