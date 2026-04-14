'use client'

import { useEffect, useRef } from 'react'
import type { Supplier } from '@/lib/occ-parser'

interface Props {
  suppliers: Supplier[]
  usage: number
  horizon: number
}

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316','#64748b']

export default function ProjectionChart({ suppliers, usage, horizon }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current || suppliers.length === 0) return

    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }

      const totals = suppliers.map(s => parseFloat((s.rate * usage / 100 * horizon).toFixed(2)))
      const minCost = Math.min(...totals)
      const std = suppliers.find(s => s.isStandard)
      const stdTotal = std ? totals[suppliers.indexOf(std)] : totals[0]

      chartRef.current = new Chart(canvasRef.current!, {
        type: 'bar',
        data: {
          labels: suppliers.map(s => s.name.length > 22 ? s.name.slice(0, 20) + '…' : s.name),
          datasets: [{
            label: `Total cost (${horizon} months)`,
            data: totals,
            backgroundColor: totals.map((t, i) => t === minCost ? '#22c55e' : COLORS[i % COLORS.length] + '99'),
            borderColor: totals.map((t, i) => t === minCost ? '#16a34a' : COLORS[i % COLORS.length]),
            borderWidth: 1,
            borderRadius: 4,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = ctx.parsed.x
                  const diff = total - stdTotal
                  const diffStr = diff === 0 ? '' : ` (${diff > 0 ? '+' : ''}$${diff.toFixed(0)} vs standard)`
                  return ` $${total.toFixed(0)} total${diffStr}`
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#94a3b8',
                callback: (v: any) => '$' + Number(v).toLocaleString()
              },
              grid: { color: '#1e293b' }
            },
            y: {
              ticks: { color: '#94a3b8', font: { size: 12 } },
              grid: { display: false }
            }
          }
        }
      })
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [suppliers, usage, horizon])

  const totals = suppliers.map(s => parseFloat((s.rate * usage / 100 * horizon).toFixed(2)))
  const std = suppliers.find(s => s.isStandard && !s.isNext)
  const stdTotal = std ? totals[suppliers.indexOf(std)] : totals[0]
  const minCost = Math.min(...totals)

  const chartHeight = Math.max(240, suppliers.length * 46 + 60)

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div style={{ height: chartHeight + 'px', position: 'relative' }}>
          <canvas ref={canvasRef}
            role="img"
            aria-label={`Bar chart comparing projected total electricity supply costs over ${horizon} months`}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Supplier</th>
              <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Rate</th>
              <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Term</th>
              <th className="text-right text-xs text-slate-500 px-4 py-3 font-medium">Total ({horizon} mo)</th>
              <th className="text-right text-xs text-slate-500 px-4 py-3 font-medium">vs. standard</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, i) => {
              const diff = totals[i] - stdTotal
              const isBest = totals[i] === minCost
              return (
                <tr key={i} className={`border-b border-slate-800/60 last:border-none ${isBest ? 'bg-volt-500/5' : ''}`}>
                  <td className="px-4 py-3 text-slate-200">
                    {s.name}
                    {isBest && <span className="ml-2 badge-green">cheapest</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{s.rate.toFixed(3)}¢</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.termLabel}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-200">${totals[i].toFixed(0)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${diff <= 0 ? 'text-volt-400' : 'text-rose-400'}`}>
                    {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}$${diff.toFixed(0)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
