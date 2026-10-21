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

interface Props {
  progress: number
  running: boolean
  className?: string
  children?: React.ReactNode
}

export default function Ring({ progress, running, className, children }: Props): React.JSX.Element {
  const filled = Math.floor(progress * SEGMENTS + 1e-6)
  return (
    <div className={`ring${className ? ` ${className}` : ''}`}>
      <svg viewBox="0 0 220 220" shapeRendering="crispEdges">
        {BLOCKS.map((b, i) => (
          <rect
            key={i}
            className={`block${i < filled ? ' on' : ''}${i === filled && running ? ' head' : ''}`}
            x={b.x}
            y={b.y}
            width={BLOCK}
            height={BLOCK}
          />
        ))}
      </svg>
      {children}
    </div>
  )
}
