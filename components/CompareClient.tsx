'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Supplier, OCCData } from '@/lib/occ-parser'
import ProjectionChart from './ProjectionChart'

interface RatesResponse {
  occData: OCCData
  suppliers: { eversource: Supplier[]; ui: Supplier[] }
  fallback: boolean
}

interface Props { isLoggedIn: boolean }

type Tab = 'compare' | 'project' | 'manage'

export default function CompareClient({ isLoggedIn }: Props) {
  const [rates, setRates] = useState<RatesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [utility, setUtility] = useState<'eversource' | 'ui'>('eversource')
  const [usage, setUsage] = useState(750)
  const [horizon, setHorizon] = useState(12)
  const [selIdx, setSelIdx] = useState(0)
  const [tab, setTab] = useState<Tab>('compare')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [addName, setAddName] = useState('')
  const [addRate, setAddRate] = useState('')
  const [addTerm, setAddTerm] = useState('')
  const [customSuppliers, setCustomSuppliers] = useState<Supplier[]>([])

  useEffect(() => {
    fetch('/api/fetch-rates')
      .then(r => r.json())
      .then(data => { setRates(data); setLoading(false) })
      .catch(() => { setError('Could not load rate data'); setLoading(false) })
  }, [])

  const suppliers: Supplier[] = rates
    ? [...(rates.suppliers[utility] ?? []), ...customSuppliers]
    : []

  const std = suppliers.find(s => s.isStandard && !s.isNext)
  const nextStd = suppliers.find(s => s.isNext)
  const sel = suppliers[selIdx] ?? suppliers[0]

  const monthlyCost = sel ? sel.rate * usage / 100 : 0
  const stdMonthlyCost = std ? std.rate * usage / 100 : 0
  const monthlySavings = stdMonthlyCost - monthlyCost
  const projSavings = monthlySavings * horizon

  const handleSave = useCallback(async () => {
    if (!isLoggedIn || !sel || !std) return
    setSaving(true)
    try {
      const res = await fetch('/api/save-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utility,
          monthly_usage: usage,
          horizon_months: horizon,
          selected_supplier: sel.name,
          selected_rate: sel.rate,
          std_rate: std.rate,
          monthly_savings: monthlySavings,
          projected_savings: projSavings,
          occ_pub_date: rates?.occData.pubDate ?? null,
          note: null,
        }),
      })
      if (res.ok) {
        setSaveMsg('Saved!')
        setTimeout(() => setSaveMsg(''), 3000)
      }
    } finally {
      setSaving(false)
    }
  }, [isLoggedIn, sel, std, utility, usage, horizon, monthlySavings, projSavings, rates])

  const handleAddSupplier = () => {
    const name = addName.trim()
    const rate = parseFloat(addRate)
    const term = parseInt(addTerm) || 6
    if (!name || isNaN(rate)) return
    setCustomSuppliers(prev => [...prev, {
      name, rate, termCycles: term, type: 'fixed',
      isStandard: false, isNext: false, termLabel: `${term} billing cycles`
    }])
    setAddName(''); setAddRate(''); setAddTerm('')
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
      </div>
    </div>
  )

  if (error) return (
    <div className="card p-6 text-center text-slate-400">
      <p className="mb-3">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-ghost">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Source bar */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 flex-wrap">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rates?.fallback ? 'bg-amber-400' : 'bg-volt-400'}`} />
        {rates?.fallback
          ? 'OCC fact sheet unavailable — showing last known rates. Edit manually in "Manage rates".'
          : <>
              Live data from OCC fact sheet
              {rates?.occData.dataMonth && <> · Data through <strong className="text-slate-300">{rates.occData.dataMonth}</strong></>}
              {rates?.occData.pubDate && <> · Published {rates.occData.pubDate}</>}
              {rates?.occData.sourceUrl && (
                <a href={rates.occData.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-volt-500 hover:text-volt-400 transition-colors">
                  View PDF ↗
                </a>
              )}
            </>
        }
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Utility</label>
          <select className="input" value={utility} onChange={e => { setUtility(e.target.value as 'eversource' | 'ui'); setSelIdx(0) }}>
            <option value="eversource">Eversource</option>
            <option value="ui">United Illuminating</option>
          </select>
        </div>
        <div>
          <label className="label">Monthly usage (kWh)</label>
          <input type="number" className="input" value={usage} min={100} max={5000} step={50}
            onChange={e => setUsage(parseInt(e.target.value) || 750)} />
        </div>
        <div>
          <label className="label">Projection (months)</label>
          <input type="number" className="input" value={horizon} min={1} max={36}
            onChange={e => setHorizon(parseInt(e.target.value) || 12)} />
        </div>
        <div className="flex items-end">
          {isLoggedIn ? (
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : saveMsg || 'Save comparison'}
            </button>
          ) : (
            <a href="/sign-in" className="btn-ghost w-full text-center text-sm">Sign in to save</a>
          )}
        </div>
      </div>

      {/* Forward-looking banner */}
      {nextStd && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-300">
          <strong>Upcoming rate change:</strong> The next standard service rate will be{' '}
          <strong>{nextStd.rate.toFixed(3)}¢/kWh</strong> ({nextStd.termLabel}).{' '}
          {nextStd.rate > (std?.rate ?? 0)
            ? `That's a ${(((nextStd.rate - (std?.rate ?? nextStd.rate)) / (std?.rate ?? nextStd.rate)) * 100).toFixed(1)}% increase — consider locking in a supplier rate now.`
            : `That's lower than the current standard rate.`}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 pb-1">
        {(['compare', 'project', 'manage'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors capitalize ${tab === t ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-500 hover:text-slate-300'}`}>
            {t === 'project' ? 'Forward cost' : t === 'manage' ? 'Manage rates' : 'Compare'}
          </button>
        ))}
      </div>

      {/* Compare tab */}
      {tab === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suppliers.map((s, i) => {
              const diff = s.rate - (std?.rate ?? s.rate)
              const isSel = i === selIdx
              let badgeEl
              if (s.isNext) badgeEl = <span className="badge-amber">Upcoming standard</span>
              else if (s.isStandard) badgeEl = <span className="badge-blue">Standard service</span>
              else if (diff < 0) badgeEl = <span className="badge-green">Below standard ↓</span>
              else badgeEl = <span className="badge-red">Above standard ↑</span>

              return (
                <div key={i} onClick={() => setSelIdx(i)}
                  className={`card-hover p-4 transition-all ${isSel ? 'border-volt-500/60 bg-slate-800/60' : ''}`}>
                  <div className="mb-2">{badgeEl}</div>
                  <p className="text-sm font-medium text-slate-200 mb-1">{s.name}</p>
                  <p className="text-2xl font-medium text-slate-100">
                    {s.rate.toFixed(3)}
                    <span className="text-sm font-normal text-slate-400">¢/kWh</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{s.type === 'fixed' ? 'Fixed' : 'Variable'} · {s.termLabel}</p>
                  {!s.isStandard && !s.isNext && std && (
                    <p className={`text-xs mt-2 font-medium ${diff < 0 ? 'text-volt-400' : 'text-rose-400'}`}>
                      {diff < 0 ? '↓' : '↑'} {Math.abs(diff).toFixed(3)}¢ vs standard
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Metrics for selected */}
          <div>
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
              Summary — {sel?.name}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Supply rate', value: `${sel?.rate.toFixed(3)}¢`, sub: 'per kWh' },
                { label: 'Monthly supply cost', value: `$${monthlyCost.toFixed(0)}`, sub: `at ${usage.toLocaleString()} kWh/mo` },
                { label: 'vs. standard service', value: `${monthlySavings >= 0 ? '+' : ''}$${Math.abs(monthlySavings).toFixed(0)}/mo`, sub: monthlySavings >= 0 ? 'savings' : 'extra cost', color: monthlySavings >= 0 ? 'text-volt-400' : 'text-rose-400' },
                { label: `Over ${horizon} months`, value: `${projSavings >= 0 ? '+' : '-'}$${Math.abs(projSavings).toFixed(0)}`, sub: projSavings >= 0 ? 'total savings' : 'total extra cost', color: projSavings >= 0 ? 'text-volt-400' : 'text-rose-400' },
              ].map(m => (
                <div key={m.label} className="card p-4">
                  <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                  <p className={`text-xl font-medium ${m.color ?? 'text-slate-100'}`}>{m.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Forward cost tab */}
      {tab === 'project' && (
        <ProjectionChart
          suppliers={suppliers.filter(s => !s.isNext)}
          usage={usage}
          horizon={horizon}
        />
      )}

      {/* Manage rates tab */}
      {tab === 'manage' && (
        <div className="space-y-6">
          <div className="card p-5">
            <p className="text-sm font-medium text-slate-300 mb-4">Add a supplier</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="label">Supplier name</label>
                <input className="input" placeholder="e.g. Think Energy" value={addName} onChange={e => setAddName(e.target.value)} />
              </div>
              <div>
                <label className="label">Rate (¢/kWh)</label>
                <input type="number" className="input" placeholder="e.g. 11.49" step="0.001" value={addRate} onChange={e => setAddRate(e.target.value)} />
              </div>
              <div>
                <label className="label">Term (billing cycles)</label>
                <input type="number" className="input" placeholder="e.g. 6" value={addTerm} onChange={e => setAddTerm(e.target.value)} />
              </div>
              <div className="flex items-end">
                <button onClick={handleAddSupplier} className="btn-primary w-full">+ Add</button>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Supplier</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Rate</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Term</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={i} className="border-b border-slate-800/60 last:border-none hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-200">{s.name}</td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.001" defaultValue={s.rate}
                        className="input w-24 py-1 text-xs"
                        onBlur={e => {
                          const newRate = parseFloat(e.target.value)
                          if (!isNaN(newRate)) {
                            if (i < (rates?.suppliers[utility]?.length ?? 0)) {
                              // Can't mutate server data; add to custom override
                            }
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.termLabel}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs capitalize">{s.type}</td>
                    <td className="px-4 py-3">
                      {!s.isStandard && customSuppliers.includes(s) && (
                        <button onClick={() => setCustomSuppliers(prev => prev.filter((_, ci) => ci !== i - (rates?.suppliers[utility]?.length ?? 0)))}
                          className="text-slate-600 hover:text-rose-400 transition-colors text-lg leading-none">×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-600">
            Source: <a href="https://portal.ct.gov/occ/electricity" className="hover:text-slate-400 transition-colors" target="_blank" rel="noopener noreferrer">OCC Electric Supplier Market Fact Sheets</a>
            {' '}· PURA Docket 06-10-22 compliance filings · OCC publishes top 5 cheapest offers below standard service.
            Always verify at <a href="https://www.energizect.com/rate-board/compare-energy-supplier-rates" className="hover:text-slate-400 transition-colors" target="_blank" rel="noopener noreferrer">energizect.com</a> before enrolling.
          </p>
        </div>
      )}
    </div>
  )
}
