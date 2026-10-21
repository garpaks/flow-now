import { ART, PALETTE, type ArtName } from '../pixelArt'

interface Props {
  art: ArtName
  scale?: number
  className?: string
}

export default function PixelIcon({ art, scale = 2, className }: Props): React.JSX.Element {
  const rows = ART[art]
  const width = rows[0].length
  const rects: React.JSX.Element[] = []
  rows.forEach((row, y) => {
    // Agrupa píxeles contiguos del mismo color en un solo rect
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let run = 1
      while (x + run < row.length && row[x + run] === ch) run++
      if (ch !== '.') {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={run}
            height={1}
            style={{ fill: ch === '#' ? 'currentColor' : PALETTE[ch] }}
          />
        )
      }
      x += run
    }
  })
  return (
    <svg
      className={`pixel-icon${className ? ` ${className}` : ''}`}
      width={width * scale}
      height={rows.length * scale}
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  )
}
