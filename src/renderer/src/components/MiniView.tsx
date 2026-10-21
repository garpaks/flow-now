import type { Phase, Status } from '../hooks/useTimer'
import { formatClock, PHASE_LABEL } from '../utils'
import PixelIcon from './PixelIcon'
import Ring from './Ring'

interface Props {
  phase: Phase
  status: Status
  remaining: number
  total: number
  title: string
  canStart: boolean
  onToggle: () => void
  onSkip: () => void
  onExpand: () => void
}

// Ventanita flotante: solo el anillo, el tiempo y los controles básicos
export default function MiniView(props: Props): React.JSX.Element {
  const { phase, status, remaining, total, title } = props
  const progress = total > 0 ? 1 - remaining / total : 0
  const running = status === 'running'

  return (
    <div className="mini">
      <Ring progress={progress} running={running} className="mini-ring">
        <div className="clock" key={phase}>
          <span className="time">{formatClock(remaining)}</span>
          <span className="phase-label">{PHASE_LABEL[phase]}</span>
        </div>
      </Ring>
      <div className="mini-title" title={title}>
        {phase === 'work' ? title.trim() || 'Sin tarea' : '~ pausa ~'}
      </div>
      <div className="mini-controls">
        <button
          className="icon-btn primary-icon"
          onClick={props.onToggle}
          disabled={!running && !props.canStart}
          title={
            running ? 'Pausar' : props.canStart ? 'Iniciar' : 'Abre la app y escribe una tarea'
          }
        >
          <PixelIcon art={running ? 'pause' : 'play'} />
        </button>
        <button className="icon-btn nudge" onClick={props.onSkip} title="Saltar fase">
          <PixelIcon art="skip" />
        </button>
        <button className="icon-btn" onClick={props.onExpand} title="Volver a la vista completa">
          <PixelIcon art="expand" />
        </button>
      </div>
    </div>
  )
}
