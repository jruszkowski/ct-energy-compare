'use client'

import { useState } from 'react'
import type { SavedComparison } from '@/lib/supabase'

interface Props { initialComparisons: SavedComparison[] }

export default function HistoryClient({ initialComparisons }: Props) {
  const [comparisons, setComparisons] = useState(initialComparisons)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch('/api/save-comparison', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setComparisons(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  if (comparisons.length === 0) {
    return (
      <div className="card p-12 text-center text-slate-500">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-sm">No saved comparisons yet.</p>
        <a href="/compare" className="btn-primary inline-block mt-4 text-sm">Run a comparison</a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {comparisons.map(c => {
        const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const isSaving = c.monthly_savings >= 0
        return (
          <div key={c.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-200 truncate">{c.selected_supplier}</span>
                <span className={isSaving ? 'badge-green' : 'badge-red'}>
                  {isSaving ? `saves $${Math.abs(c.monthly_savings).toFixed(0)}/mo` : `costs $${Math.abs(c.monthly_savings).toFixed(0)}/mo extra`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {c.utility === 'eversource' ? 'Eversource' : 'UI'} · {c.monthly_usage.toLocaleString()} kWh/mo ·
                {' '}{c.selected_rate.toFixed(3)}¢/kWh vs {c.std_rate.toFixed(3)}¢ standard
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {date} · Over {c.horizon_months} months: {isSaving ? '+' : '-'}${Math.abs(c.projected_savings).toFixed(0)}
                {c.occ_pub_date && ` · OCC data published ${c.occ_pub_date}`}
              </p>
              {c.note && <p className="text-xs text-slate-400 mt-1 italic">{c.note}</p>}
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deleting === c.id}
              className="text-slate-600 hover:text-rose-400 transition-colors text-xs shrink-0 self-start sm:self-center"
            >
              {deleting === c.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
