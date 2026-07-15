'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface ChartCardProps {
  title: string
  data: ChartDataPoint[]
  type?: 'bar' | 'line'
  height?: number
  showValues?: boolean
}

export function ChartCard({ title, data, type = 'bar', height = 200, showValues = false }: ChartCardProps) {
  if (data.length === 0) return null

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const padding = { top: 20, right: 16, bottom: 40, left: 48 }
  const width = 600
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  function getBarX(i: number) {
    const barGap = 4
    const barWidth = (innerWidth - barGap * (data.length - 1)) / data.length
    return padding.left + i * (barWidth + barGap)
  }

  function getBarWidth() {
    const barGap = 4
    return (innerWidth - barGap * (data.length - 1)) / data.length
  }

  function getBarHeight(val: number) {
    return (val / maxVal) * innerHeight
  }

  function getBarY(val: number) {
    return padding.top + innerHeight - getBarHeight(val)
  }

  function buildLinePath() {
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth
      const y = padding.top + innerHeight - (d.value / maxVal) * innerHeight
      return `${x},${y}`
    })
    return `M ${points.join(' L ')}`
  }

  function buildAreaPath() {
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth
      const y = padding.top + innerHeight - (d.value / maxVal) * innerHeight
      return { x, y }
    })
    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ')
    const bottomLeft = `${padding.left},${padding.top + innerHeight}`
    const bottomRight = `${padding.left + innerWidth},${padding.top + innerHeight}`
    return `${linePath} L ${bottomRight} L ${bottomLeft} Z`
  }

  const ticks = 5
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((maxVal / ticks) * i))

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </CardHeader>
      <CardContent className="pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          {tickValues.map((val, i) => {
            const y = padding.top + innerHeight - (val / maxVal) * innerHeight
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray={i === 0 ? undefined : '3,3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-text-muted text-[10px]"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {type === 'bar' &&
            data.map((d, i) => {
              const x = getBarX(i)
              const bw = getBarWidth()
              const bh = getBarHeight(d.value)
              const y = getBarY(d.value)
              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={x}
                    y={y}
                    width={bw}
                    height={bh}
                    rx={4}
                    fill={d.color || '#3b82f6'}
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  />
                  {showValues && (
                    <text
                      x={x + bw / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="fill-text-secondary text-[10px] font-medium"
                    >
                      {d.value}
                    </text>
                  )}
                  <text
                    x={x + bw / 2}
                    y={height - 12}
                    textAnchor="middle"
                    className="fill-text-muted text-[10px]"
                  >
                    {d.label}
                  </text>
                </g>
              )
            })}

          {type === 'line' && (
            <>
              <path d={buildAreaPath()} fill="#3b82f6" className="opacity-10" />
              <path d={buildLinePath()} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {data.map((d, i) => {
                const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth
                const y = padding.top + innerHeight - (d.value / maxVal) * innerHeight
                return (
                  <g key={`point-${i}`}>
                    <circle cx={x} cy={y} r={4} fill="#3b82f6" className="stroke-surface" strokeWidth={2} />
                    {showValues && (
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        className="fill-text-secondary text-[10px] font-medium"
                      >
                        {d.value}
                      </text>
                    )}
                    <text
                      x={x}
                      y={height - 12}
                      textAnchor="middle"
                      className="fill-text-muted text-[10px]"
                    >
                      {d.label}
                    </text>
                  </g>
                )
              })}
            </>
          )}
        </svg>
      </CardContent>
    </Card>
  )
}
