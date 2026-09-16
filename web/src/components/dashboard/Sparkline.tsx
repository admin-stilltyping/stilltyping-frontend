interface SparklineProps {
  data: number[]
  stroke: string
  width?: number
  height?: number
  className?: string
  /** Draw the soft area wash under the line. */
  fill?: boolean
}

/**
 * Tiny trend line for stat tiles. Straight 2px segments, an ~10% area wash,
 * and an end-dot on the latest point — the mark specs, shrunk.
 */
export function Sparkline({
  data,
  stroke,
  width = 120,
  height = 34,
  className,
  fill = true,
}: SparklineProps) {
  if (data.length < 2) return null
  const pad = 3
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const stepX = (width - pad * 2) / (data.length - 1)
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)
  const pts = data.map((v, i) => [pad + i * stepX, y(v)] as const)
  const line = pts.map(([x, yy], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${yy.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`
  const gid = `spark-${stroke.replace(/[^a-z0-9]/gi, '')}`
  const [lx, ly] = pts[pts.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      {fill && (
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r={2.4} fill={stroke} />
    </svg>
  )
}
