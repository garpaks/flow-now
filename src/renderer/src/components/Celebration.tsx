import { useEffect } from 'react'
import type { ArtName } from '../pixelArt'
import PixelIcon from './PixelIcon'

export interface CelebrationData {
  id: number
  title: string
  subtitle: string
  kind: 'pomodoro' | 'level' | 'mission' | 'achievement'
  icon?: ArtName
}

interface Props {
  data: CelebrationData
  onDone: () => void
}

const STARS = 14
const DURATION = 2600

// Explosión de estrellas pixel + cartel al completar algo; se cierra sola o con un clic
export default function Celebration({ data, onDone }: Props): React.JSX.Element {
  useEffect(() => {
    const id = setTimeout(onDone, DURATION)
    return () => clearTimeout(id)
  }, [data.id, onDone])

  return (
    <div className={`celebration kind-${data.kind}`} onClick={onDone}>
      <div className="burst" aria-hidden>
        {Array.from({ length: STARS }, (_, i) => (
          <span
            key={i}
            className="burst-star"
            style={
              {
                '--a': `${(360 / STARS) * i}deg`,
                '--d': `${110 + (i % 3) * 35}px`,
                '--delay': `${(i % 4) * 40}ms`
              } as React.CSSProperties
            }
          >
            <PixelIcon art="star" scale={i % 2 ? 2 : 3} />
          </span>
        ))}
      </div>
      <div className="celebration-card">
        {data.icon && <PixelIcon art={data.icon} scale={4} className="celebration-icon" />}
        <span className="celebration-title">{data.title}</span>
        <span className="celebration-sub">{data.subtitle}</span>
      </div>
    </div>
  )
}
