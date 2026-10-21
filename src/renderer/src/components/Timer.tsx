import type { Goal } from '../../../shared/types'
import type { Phase, Status } from '../hooks/useTimer'
import { formatClock, PHASE_LABEL, PHASE_MOOD } from '../utils'
import PixelIcon from './PixelIcon'

interface Props {
  phase: Phase
  status: Status
  remaining: number
  total: number
  completedWork: number
  longEvery: number
  title: string
  onTitleChange: (title: string) => void
  goals: Goal[]
  activeGoalId: string | null
  onGoalChange: (id: string | null) => void
  onStart: () => void
  onPause: () => void
  onSkip: () => void
  onReset: () => void
  onSwitch: (phase: Phase) => void
}

const PHASES: Phase[] = ['work', 'shortBreak', 'longBreak']

// Anillo de bloques pixelados en lugar de un círculo continuo
const SEGMENTS = 40
const CENTER = 110
const RADIUS = 96
const BLOCK = 10
const snap = (n: number): number => Math.round(n / 2) * 2
const BLOCKS = Array.from({ length: SEGMENTS }, (_, i) => {
  const angle = (i / SEGMENTS) * 2 * Math.PI - Math.PI / 2
  return {
    x: snap(CENTER + RADIUS * Math.cos(angle) - BLOCK / 2),
    y: snap(CENTER + RADIUS * Math.sin(angle) - BLOCK / 2)
  }
})

export default function Timer(props: Props): React.JSX.Element {
  const { phase, status, remaining, total, completedWork, longEvery, title } = props
  const isWork = phase === 'work'
  const canStart = !isWork || title.trim().length > 0
  const progress = total > 0 ? 1 - remaining / total : 0
  const filledBlocks = Math.floor(progress * SEGMENTS + 1e-6)
  // Puntos del ciclo: se llenan con cada pomodoro y se completan en la pausa larga
  const filledDots = phase === 'longBreak' ? longEvery : completedWork % longEvery

  return (
    <section className="timer">
      <div
        className="phase-chips"
        style={{ '--idx': PHASES.indexOf(phase) } as React.CSSProperties}
      >
        <span className="slider" />
        {PHASES.map((p) => (
          <button
            key={p}
            className={`chip chip-${p}${p === phase ? ' on' : ''}`}
            onClick={() => props.onSwitch(p)}
          >
            {PHASE_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="ring">
        <svg viewBox="0 0 220 220" shapeRendering="crispEdges">
          {BLOCKS.map((b, i) => (
            <rect
              key={i}
              className={`block${i < filledBlocks ? ' on' : ''}${
                i === filledBlocks && status === 'running' ? ' head' : ''
              }`}
              x={b.x}
              y={b.y}
              width={BLOCK}
              height={BLOCK}
            />
          ))}
        </svg>
        <div className="clock" key={phase}>
          <span className="time">{formatClock(remaining)}</span>
          <span className="phase-label">{PHASE_LABEL[phase]}</span>
        </div>
      </div>

      <div
        className="cycle-dots"
        title={`${completedWork} pomodoro${completedWork === 1 ? '' : 's'} en esta sesión`}
      >
        {Array.from({ length: longEvery }, (_, i) => (
          <span key={i} className={i < filledDots ? 'dot on' : 'dot'}>
            <PixelIcon art={i < filledDots ? 'star' : 'starEmpty'} />
          </span>
        ))}
      </div>

      <div className="mood" key={`mood-${phase}`}>
        {PHASE_MOOD[phase]}
      </div>

      <form
        className="task-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (status !== 'running' && canStart) props.onStart()
        }}
      >
        <input
          className="task-input"
          placeholder={isWork ? '¿En qué vas a trabajar?' : 'Descansa un poco...'}
          value={title}
          maxLength={120}
          disabled={!isWork}
          onChange={(e) => props.onTitleChange(e.target.value)}
          autoFocus
        />
      </form>

      {/* Solo se muestra con una misión elegida (se eligen en la pestaña Misiones) */}
      {props.goals.some((g) => g.id === props.activeGoalId) && (
        <label className="goal-picker">
          <PixelIcon art="target" />
          <select
            value={props.activeGoalId ?? ''}
            onChange={(e) => props.onGoalChange(e.target.value || null)}
          >
            <option value="">Sin misión</option>
            {props.goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="controls">
        {status === 'running' ? (
          <button key="pause" className="primary" onClick={props.onPause}>
            Pausar
          </button>
        ) : (
          <button
            key="start"
            className="primary"
            onClick={props.onStart}
            disabled={!canStart}
            title={canStart ? '' : 'Escribe un título para empezar'}
          >
            {status === 'paused' ? 'Reanudar' : 'Iniciar'}
          </button>
        )}
        <button
          className="icon-btn spin"
          onClick={props.onReset}
          disabled={status === 'idle'}
          title="Reiniciar fase"
        >
          <PixelIcon art="reset" />
        </button>
        <button className="icon-btn nudge" onClick={props.onSkip} title="Saltar fase">
          <PixelIcon art="skip" />
        </button>
      </div>
    </section>
  )
}
