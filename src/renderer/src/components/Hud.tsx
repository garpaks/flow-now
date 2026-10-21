import type { LevelInfo } from '../progress'
import PixelIcon from './PixelIcon'

interface Props {
  level: LevelInfo
  streak: number
}

// Indicadores de juego: nivel con barra de experiencia y racha de días
export default function Hud({ level, streak }: Props): React.JSX.Element {
  const pct = Math.min(100, (level.into / level.needed) * 100)
  return (
    <div className="hud">
      <span className="lv" key={level.level}>
        LV {level.level}
      </span>
      <div
        className="xp-bar"
        title={`${level.into} / ${level.needed} XP para el nivel ${level.level + 1}`}
      >
        <span className="xp-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="xp-text">
        {level.into}/{level.needed} XP
      </span>
      <span
        className={`streak${streak > 0 ? ' on' : ''}`}
        title={`${streak} día${streak === 1 ? '' : 's'} seguidos con pomodoros`}
      >
        <PixelIcon art="flame" />
        {streak}
      </span>
    </div>
  )
}
