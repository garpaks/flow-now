import { useMemo, useState } from 'react'
import { DEFAULT_CATEGORIES, type Goal, type Session } from '../../../shared/types'
import { categoryColor, dayKey, dayLabel, formatMinutes, timeRange } from '../utils'
import PixelIcon from './PixelIcon'

interface Props {
  goals: Goal[]
  sessions: Session[]
  activeGoalId: string | null
  onAdd: (title: string, category: string) => void
  onSelect: (id: string | null) => void
  onToggleDone: (id: string) => void
  onSetCategory: (id: string, category: string) => void
  onDelete: (id: string) => void
}

const ALL = '__all__'

function CategoryBadge({ category }: { category: string }): React.JSX.Element {
  return (
    <span className="cat-badge" style={{ '--cat': categoryColor(category) } as React.CSSProperties}>
      {category}
    </span>
  )
}

export default function Goals(props: Props): React.JSX.Element {
  const { goals, sessions, activeGoalId } = props
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState(DEFAULT_CATEGORIES[0])
  const [filter, setFilter] = useState(ALL)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Categorías de serie + las que el usuario haya creado
  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES)
    for (const g of goals) if (g.category) set.add(g.category)
    return [...set]
  }, [goals])
  const usedCategories = categories.filter((c) => goals.some((g) => g.category === c))

  const sessionsByGoal = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))) {
      if (!s.goalId) continue
      map.set(s.goalId, [...(map.get(s.goalId) ?? []), s])
    }
    return map
  }, [sessions])

  const visible = goals.filter((g) => filter === ALL || g.category === filter)
  const active = visible.filter((g) => !g.done)
  const done = visible
    .filter((g) => g.done)
    .sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''))

  const renderGoal = (goal: Goal, index: number): React.JSX.Element => {
    const list = sessionsByGoal.get(goal.id) ?? []
    const pomodoros = list.filter((s) => s.completed).length
    const minutes = list.reduce((sum, s) => sum + s.durationMin, 0)
    const isActive = goal.id === activeGoalId
    const expanded = goal.id === expandedId

    return (
      <li
        key={goal.id}
        className={`goal${isActive ? ' active' : ''}${goal.done ? ' done' : ''}`}
        style={{ '--i': index } as React.CSSProperties}
      >
        <div className="goal-row">
          <input
            type="checkbox"
            checked={goal.done}
            onChange={() => props.onToggleDone(goal.id)}
            title={goal.done ? 'Reabrir misión' : 'Marcar como completada'}
          />
          <button
            className="goal-title"
            onClick={() => setExpandedId(expanded ? null : goal.id)}
            title="Ver registro"
          >
            {goal.title}
          </button>
          {!goal.done && (
            <button
              className={`goal-select${isActive ? ' selected' : ''}`}
              onClick={() => props.onSelect(isActive ? null : goal.id)}
            >
              {isActive ? 'Elegida' : 'Elegir'}
            </button>
          )}
          <button
            className="delete"
            onClick={() => {
              if (confirm(`¿Borrar la misión "${goal.title}"? Sus pomodoros se conservan.`))
                props.onDelete(goal.id)
            }}
            title="Borrar misión"
          >
            ×
          </button>
        </div>
        <div className="goal-sub">
          {goal.category && <CategoryBadge category={goal.category} />}
          <span className="goal-stats">
            <PixelIcon art="tomato" /> {pomodoros} · {formatMinutes(minutes)}
          </span>
          {goal.done && goal.doneAt && (
            <span className="goal-meta">
              · completada {dayLabel(dayKey(goal.doneAt)).toLowerCase()}
            </span>
          )}
        </div>
        {expanded && (
          <div className="goal-detail">
            <label className="cat-edit">
              <span>Categoría</span>
              <input
                list="mission-categories"
                defaultValue={goal.category ?? ''}
                placeholder="Sin categoría"
                maxLength={30}
                onBlur={(e) => props.onSetCategory(goal.id, e.target.value.trim())}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </label>
            <ul className="goal-log">
              {list.length === 0 && <li className="muted">Aún no hay pomodoros en esta misión.</li>}
              {list.map((s) => (
                <li key={s.id} className={s.completed ? '' : 'incomplete'}>
                  <span className="time">
                    {dayLabel(dayKey(s.startedAt))} · {timeRange(s)}
                  </span>
                  <span className="log-title">{s.title}</span>
                  <span className="dur">{s.durationMin}′</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </li>
    )
  }

  return (
    <section className="goals">
      <datalist id="mission-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <form
        className="goal-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newTitle.trim()) return
          props.onAdd(newTitle.trim(), newCategory.trim())
          setNewTitle('')
        }}
      >
        <input
          className="goal-name"
          placeholder="Nueva misión…"
          value={newTitle}
          maxLength={120}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          className="goal-cat"
          list="mission-categories"
          placeholder="Categoría"
          value={newCategory}
          maxLength={30}
          onChange={(e) => setNewCategory(e.target.value)}
          title="Elige una o escribe una nueva"
        />
        <button type="submit" disabled={!newTitle.trim()}>
          Añadir
        </button>
      </form>

      {usedCategories.length > 0 && (
        <div className="cat-filter">
          <button className={filter === ALL ? 'on' : ''} onClick={() => setFilter(ALL)}>
            Todas
          </button>
          {usedCategories.map((c) => (
            <button
              key={c}
              className={filter === c ? 'on' : ''}
              style={{ '--cat': categoryColor(c) } as React.CSSProperties}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <p className="muted center">
          Crea una misión, elígela y los pomodoros que hagas quedarán registrados en ella.
        </p>
      )}

      {active.length > 0 && <ul className="goal-list">{active.map(renderGoal)}</ul>}

      {done.length > 0 && (
        <>
          <h3 className="goal-section">Completadas ({done.length})</h3>
          <ul className="goal-list">{done.map(renderGoal)}</ul>
        </>
      )}
    </section>
  )
}
