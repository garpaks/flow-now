import type { AchievementStatus } from '../achievements'
import { dayKey, dayLabel } from '../utils'
import PixelIcon from './PixelIcon'

interface Props {
  list: AchievementStatus[]
  unlockedAt: Record<string, string>
}

const TIER_LABEL = { bronze: 'Bronce', silver: 'Plata', gold: 'Oro' }

export default function Achievements({ list: evaluated, unlockedAt }: Props): React.JSX.Element {
  // Un logro conseguido no se pierde aunque después se borren pomodoros o misiones
  const list = evaluated.map((a) => (unlockedAt[a.id] ? { ...a, unlocked: true } : a))
  const unlocked = list.filter((a) => a.unlocked).length
  const pct = (unlocked / list.length) * 100

  return (
    <section className="achievements">
      <div className="ach-summary">
        <PixelIcon art="trophy" scale={3} />
        <div className="ach-summary-text">
          <span className="ach-count">
            {unlocked}/{list.length}
          </span>
          <span className="muted">logros desbloqueados</span>
        </div>
        <div className="xp-bar ach-total">
          <span className="xp-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="ach-grid">
        {list.map((a, i) => (
          <li
            key={a.id}
            className={`ach tier-${a.tier}${a.unlocked ? ' unlocked' : ''}`}
            style={{ '--i': i } as React.CSSProperties}
            title={TIER_LABEL[a.tier]}
          >
            <div className="ach-icon">
              <PixelIcon art={a.icon} scale={3} />
            </div>
            <div className="ach-body">
              <span className="ach-title">{a.title}</span>
              <span className="ach-desc">{a.description}</span>
              {a.unlocked ? (
                <span className="ach-date">
                  {unlockedAt[a.id]
                    ? `Desbloqueado: ${dayLabel(dayKey(unlockedAt[a.id])).toLowerCase()}`
                    : 'Desbloqueado'}
                </span>
              ) : (
                <div className="ach-progress">
                  <div className="ach-bar">
                    <span style={{ width: `${(a.current / a.target) * 100}%` }} />
                  </div>
                  <span className="ach-num">
                    {a.current}/{a.target}
                  </span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
