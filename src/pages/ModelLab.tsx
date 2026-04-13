import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import modelLabData from '../data/model_lab.json'

type Track = typeof modelLabData.tracks[0]
type Comparison = Track['comparisons'][0]

// ─── CompareTable ─────────────────────────────────────────────────────────────

function CompareTable({ comparison, onClose }: { comparison: Comparison; onClose: () => void }) {
  const rows: { label: string; key: keyof Comparison }[] = [
    { label: 'Use Case',          key: 'use_case' },
    { label: 'Data Assumption',   key: 'data_assumption' },
    { label: 'Interpretability',  key: 'interpretability' },
    { label: 'Tuning Burden',     key: 'tuning_burden' },
    { label: 'Overfitting Risk',  key: 'overfitting_risk' },
    { label: 'Common Metric',     key: 'common_metric' },
    { label: 'Best Assignment',   key: 'best_assignment' },
    { label: 'Best Resource',     key: 'best_resource' },
  ]

  const rowColors: Record<string, string> = {
    'Use Case':         'border-blue-800/30',
    'Data Assumption':  'border-yellow-800/20',
    'Interpretability': 'border-green-800/20',
    'Tuning Burden':    'border-orange-800/20',
    'Overfitting Risk': 'border-red-800/20',
    'Common Metric':    'border-cyan-800/20',
    'Best Assignment':  'border-purple-800/30',
    'Best Resource':    'border-gray-700/40',
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/80 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-purple-700/40 text-purple-200 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Compare
          </span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">{comparison.pair[0]}</span>
            <span className="text-gray-500 text-xs">vs</span>
            <span className="text-white font-semibold text-sm">{comparison.pair[1]}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">✕</button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 border-b border-gray-700 bg-gray-800/40">
        <div className="px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Dimension</div>
        <div className="px-4 py-3 border-l border-gray-700">
          <span className="text-blue-300 font-semibold text-sm">{comparison.pair[0]}</span>
        </div>
        <div className="px-4 py-3 border-l border-gray-700">
          <span className="text-purple-300 font-semibold text-sm">{comparison.pair[1]}</span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-800">
        {rows.map(({ label, key }) => {
          const values = comparison[key] as string[]
          return (
            <div key={key} className={`grid grid-cols-3 border-l-2 ${rowColors[label] || 'border-gray-700/30'}`}>
              <div className="px-4 py-3 text-gray-500 text-xs font-semibold flex items-start">{label}</div>
              <div className="px-4 py-3 border-l border-gray-800 text-gray-200 text-sm leading-relaxed">{values[0]}</div>
              <div className="px-4 py-3 border-l border-gray-800 text-gray-200 text-sm leading-relaxed">{values[1]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MethodPicker ─────────────────────────────────────────────────────────────

function MethodPicker({
  methods,
  selected,
  onToggle,
  max,
}: {
  methods: string[]
  selected: string[]
  onToggle: (m: string) => void
  max: number
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {methods.map(m => {
        const isSelected = selected.includes(m)
        const disabled = !isSelected && selected.length >= max
        return (
          <button
            key={m}
            onClick={() => onToggle(m)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              isSelected
                ? 'bg-purple-700 border-purple-500 text-white'
                : disabled
                  ? 'bg-gray-800/40 border-gray-700/40 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-600 hover:text-white'
            }`}
          >
            {m}
          </button>
        )
      })}
    </div>
  )
}

// ─── TrackPanel ───────────────────────────────────────────────────────────────

function TrackPanel({ track }: { track: Track }) {
  const [selected, setSelected] = useState<string[]>([])
  const [activeComparison, setActiveComparison] = useState<Comparison | null>(null)

  const toggleMethod = (m: string) => {
    setSelected(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
    setActiveComparison(null)
  }

  const findComparison = () => {
    if (selected.length !== 2) return
    const pair = selected
    const comp = track.comparisons.find(c =>
      (c.pair[0] === pair[0] && c.pair[1] === pair[1]) ||
      (c.pair[0] === pair[1] && c.pair[1] === pair[0])
    )
    if (comp) {
      // Normalize order to match selected order
      if (comp.pair[0] !== pair[0]) {
        setActiveComparison({
          ...comp,
          pair: [pair[0], pair[1]] as [string, string],
          use_case:         [comp.use_case[1], comp.use_case[0]],
          data_assumption:  [comp.data_assumption[1], comp.data_assumption[0]],
          interpretability: [comp.interpretability[1], comp.interpretability[0]],
          tuning_burden:    [comp.tuning_burden[1], comp.tuning_burden[0]],
          overfitting_risk: [comp.overfitting_risk[1], comp.overfitting_risk[0]],
          common_metric:    [comp.common_metric[1], comp.common_metric[0]],
          best_assignment:  [comp.best_assignment[1], comp.best_assignment[0]],
          best_resource:    [comp.best_resource[1], comp.best_resource[0]],
        })
      } else {
        setActiveComparison(comp)
      }
    } else {
      setActiveComparison(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-gray-400 text-sm mb-3">
          Select <span className="text-white font-semibold">2 methods</span> to compare side-by-side.
          {selected.length === 1 && (
            <span className="text-purple-300"> Select one more to unlock comparison.</span>
          )}
          {selected.length === 2 && !activeComparison && (
            <span className="text-yellow-300"> No stored comparison for this pair — try a different combination.</span>
          )}
        </div>
        <MethodPicker methods={track.methods} selected={selected} onToggle={toggleMethod} max={2} />
      </div>

      {selected.length === 2 && !activeComparison && (
        <button
          onClick={findComparison}
          className="bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Compare {selected[0]} vs {selected[1]}
        </button>
      )}

      {selected.length === 2 && activeComparison === null && (
        <button
          onClick={findComparison}
          className="bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Compare {selected[0]} vs {selected[1]}
        </button>
      )}

      {activeComparison && (
        <CompareTable
          comparison={activeComparison}
          onClose={() => { setActiveComparison(null); setSelected([]) }}
        />
      )}

      {/* Available comparisons hint */}
      {!activeComparison && track.comparisons.length > 0 && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Available Comparisons</div>
          <div className="space-y-1.5">
            {track.comparisons.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelected(c.pair as unknown as string[])
                  setActiveComparison(c)
                }}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors group"
              >
                <span className="text-gray-600 group-hover:text-purple-400">→</span>
                <span className="text-blue-300">{c.pair[0]}</span>
                <span className="text-gray-600">vs</span>
                <span className="text-purple-300">{c.pair[1]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ModelLab Page ────────────────────────────────────────────────────────────

export default function ModelLab() {
  const [searchParams] = useSearchParams()
  const compareParam = searchParams.get('compare') || ''

  const trackOrder = ['classification', 'optimization', 'database_design']
  const tracks = trackOrder
    .map(id => modelLabData.tracks.find(t => t.id === id))
    .filter(Boolean) as Track[]

  const defaultTrackIndex = (() => {
    if (!compareParam) return 0
    const lower = compareParam.toLowerCase()
    if (lower.includes('lp') || lower.includes('optimization') || lower.includes('programming') || lower.includes('decision')) return 1
    if (lower.includes('erd') || lower.includes('sql') || lower.includes('norm') || lower.includes('database')) return 2
    return 0
  })()

  const [activeTrack, setActiveTrack] = useState(defaultTrackIndex)

  const trackColors: Record<string, string> = {
    classification: 'text-blue-300 border-blue-700',
    optimization: 'text-green-300 border-green-700',
    database_design: 'text-orange-300 border-orange-700',
  }

  const trackIcons: Record<string, string> = {
    classification: '📊',
    optimization: '🎯',
    database_design: '🗄️',
  }

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Model Lab</h1>
          <span className="bg-purple-700/30 text-purple-300 border border-purple-700/50 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Phase 1
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          Compare methods side-by-side — use cases, assumptions, tradeoffs, and MBAN assignment anchors.
        </p>
        {compareParam && (
          <div className="mt-2 text-xs text-purple-300 bg-purple-900/20 border border-purple-800/40 rounded-lg px-3 py-1.5 inline-block">
            Comparing: "{compareParam}"
          </div>
        )}
      </div>

      {/* Track tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tracks.map((track, i) => (
          <button
            key={track.id}
            onClick={() => setActiveTrack(i)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
              activeTrack === i
                ? `bg-gray-800 ${trackColors[track.id] || 'text-white border-gray-600'}`
                : 'bg-gray-900 border-gray-700/60 text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <span>{trackIcons[track.id] || '📋'}</span>
            <span>{track.title}</span>
          </button>
        ))}
      </div>

      {/* Active track */}
      {tracks[activeTrack] && (
        <div className="space-y-5">
          <div className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-4">
            <div className="text-white font-semibold mb-1">{tracks[activeTrack].title}</div>
            <p className="text-gray-400 text-sm">{tracks[activeTrack].description}</p>
          </div>
          <TrackPanel track={tracks[activeTrack]} />
        </div>
      )}

      {/* Coming soon notice */}
      <div className="mt-10 bg-gray-800/30 border border-gray-700/40 rounded-xl p-4 text-center">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Phase 2 Coming</div>
        <p className="text-gray-500 text-sm">
          Time-Series Lab · Unsupervised Lab · Regression Lab
        </p>
      </div>
    </div>
  )
}
