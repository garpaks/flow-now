import { useMemo } from 'react'
import type { Goal, Session } from '../../../shared/types'
import { dayKey, dayLabel, formatMinutes, timeRange } from '../utils'
import PixelIcon from './PixelIcon'

interface Props {
  sessions: Session[]
  goals: Goal[]
  onDelete: (id: string) => void
  onReuse: (title: string) => void
}

export default function History({ sessions, goals, onDelete, onReuse }: Props): React.JSX.Element {
  const days = useMemo(() => {
    const groups = new Map<string, Session[]>()
    for (const s of [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))) {
      const key = dayKey(s.startedAt)
      groups.set(key, [...(groups.get(key) ?? []), s])
    }
    return [...groups.entries()]
  }, [sessions])

  const goalTitle = useMemo(() => new Map(goals.map((g) => [g.id, g.title])), [goals])

  if (days.length === 0) {
    return (
      <section className="history empty">
        Aún no hay pomodoros. Escribe una tarea y pulsa Iniciar.
      </section>
    )
  }

  return (
    <section className="history">
      {days.map(([key, list]) => {
        const done = list.filter((s) => s.completed).length
        const minutes = list.reduce((sum, s) => sum + s.durationMin, 0)
        return (
          <div className="day" key={key}>
            <header className="day-header">
              <span className="day-name">{dayLabel(key)}</span>
              <span className="day-stats">
                <PixelIcon art="tomato" /> {done} · {formatMinutes(minutes)}
              </span>
            </header>
            <ul>
              {list.map((s, i) => (
                <li
                  key={s.id}
                  className={s.completed ? '' : 'incomplete'}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className="time" title={new Date(s.startedAt).toLocaleString('es-ES')}>
                    {timeRange(s)}
                  </span>
                  <button
                    className="title"
                    onClick={() => onReuse(s.title)}
                    title="Usar este título"
                  >
                    {s.title}
                  </button>
                  {s.goalId && goalTitle.has(s.goalId) && (
                    <span className="goal-tag" title="Misión">
                      <PixelIcon art="target" scale={1.5} /> {goalTitle.get(s.goalId)}
                    </span>
                  )}
                  <span className="dur">{s.durationMin}′</span>
                  <button
                    className="delete"
                    onClick={() => onDelete(s.id)}
                    title="Borrar del historial"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
