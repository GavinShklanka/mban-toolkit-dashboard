import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import modelLabData from '../data/model_lab.json'

type Track = typeof modelLabData.tracks[0]
type LabMethod = typeof modelLabData.tracks[0]['methods'][0]

const COMPARE_FIELDS: { key: keyof LabMethod; label: string }[] = [
  { key: 'what_it_does',       label: 'What it does' },
  { key: 'when_to_use',        label: 'When to use' },
  { key: 'evaluation_metric',  label: 'Evaluation metric' },
  { key: 'interpretability',   label: 'Interpretability' },
  { key: 'data_requirements',  label: 'Data requirements' },
  { key: 'common_confusion',   label: 'Common confusion' },
  { key: 'course',             label: 'Course' },
]

function MethodCard({
  method,
  compareMode,
  isSelected,
  onSelect,
}: {
  method: LabMethod
  compareMode: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  const navigate = useNavigate()
  return (
    <div className={`bg-gray-800 border rounded-2xl p-5 space-y-3 transition-colors ${
      compareMode
        ? isSelected
          ? 'border-blue-500 ring-1 ring-blue-500/50'
          : 'border-gray-700 hover:border-gray-600 cursor-pointer'
        : 'border-gray-700'
    }`}
    onClick={compareMode ? onSelect : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/ask?q=${encodeURIComponent(method.name)}&mode=learn`) }}
            className="text-white font-semibold text-base hover:text-purple-300 transition-colors text-left"
          >
            {method.name} →
          </button>
          <div className="text-gray-500 text-xs mt-0.5">{method.family} · {method.course}</div>
        </div>
        {compareMode && (
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
          }`}>
            {isSelected && <span className="text-white text-xs">✓</span>}
          </div>
        )}
      </div>
      <div className="bg-gray-900/60 rounded-xl p-3">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">What it does</div>
        <p className="text-gray-200 text-sm leading-relaxed">{method.what_it_does}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="bg-green-900/10 border border-green-800/25 rounded-lg p-2.5">
          <span className="text-green-400 font-semibold">When to use: </span>
          <span className="text-gray-300">{method.when_to_use}</span>
        </div>
        <div className="bg-blue-900/10 border border-blue-800/25 rounded-lg p-2.5">
          <span className="text-blue-400 font-semibold">Interpretability: </span>
          <span className="text-gray-300">{method.interpretability}</span>
        </div>
        <div className="bg-red-900/10 border border-red-800/25 rounded-lg p-2.5">
          <span className="text-red-400 font-semibold">Common confusion: </span>
          <span className="text-gray-300">{method.common_confusion}</span>
        </div>
      </div>
    </div>
  )
}

function CompareTable({ a, b }: { a: LabMethod; b: LabMethod }) {
  return (
    <div className="bg-gray-800/80 border border-blue-700/40 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-3 bg-gray-900/60 border-b border-gray-700">
        <div className="p-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Field</div>
        <div className="p-3 text-blue-300 text-sm font-semibold border-l border-gray-700">{a.name}</div>
        <div className="p-3 text-purple-300 text-sm font-semibold border-l border-gray-700">{b.name}</div>
      </div>
      {COMPARE_FIELDS.map(({ key, label }) => (
        <div key={key} className="grid grid-cols-3 border-t border-gray-700/60">
          <div className="p-3 text-gray-500 text-xs font-semibold uppercase tracking-wider self-start">{label}</div>
          <div className="p-3 text-gray-200 text-sm border-l border-gray-700/60">{String(a[key])}</div>
          <div className="p-3 text-gray-200 text-sm border-l border-gray-700/60">{String(b[key])}</div>
        </div>
      ))}
    </div>
  )
}

export default function ModelLab() {
  const [selectedTrack, setSelectedTrack] = useState('classification')
  const [compareMode, setCompareMode]     = useState(false)
  const [compareA, setCompareA]           = useState<string | null>(null)
  const [compareB, setCompareB]           = useState<string | null>(null)

  const track = modelLabData.tracks.find(t => t.id === selectedTrack) || modelLabData.tracks[0]

  const handleMethodSelect = (methodId: string) => {
    if (!compareMode) return
    if (compareA === methodId) { setCompareA(null); return }
    if (compareB === methodId) { setCompareB(null); return }
    if (!compareA) { setCompareA(methodId); return }
    if (!compareB) { setCompareB(methodId); return }
    // Replace the older selection
    setCompareA(compareB)
    setCompareB(methodId)
  }

  const methodA = compareA ? track.methods.find(m => m.id === compareA) : null
  const methodB = compareB ? track.methods.find(m => m.id === compareB) : null

  return (
    <div className="p-5 md:p-10 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Model Lab</h1>
          <p className="text-gray-400 text-sm">
            Compare methods side-by-side. Select a track, then toggle Compare.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {modelLabData.tracks.reduce((a, t) => a + t.methods.length, 0)} methods across {modelLabData.tracks.length} tracks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCompareMode(v => !v); setCompareA(null); setCompareB(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              compareMode
                ? 'bg-blue-700 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
          <Link to="/ask?mode=learn" className="text-purple-400 hover:text-purple-300 text-sm underline">
            Ask MBAN →
          </Link>
        </div>
      </div>

      {/* Compare hint */}
      {compareMode && (
        <div className="mb-5 bg-blue-900/20 border border-blue-800/40 rounded-xl p-3 text-sm text-blue-300">
          {!compareA && !compareB && 'Select two methods to compare side-by-side.'}
          {compareA && !compareB && `"${track.methods.find(m => m.id === compareA)?.name}" selected — pick one more.`}
          {compareA && compareB && `Comparing "${track.methods.find(m => m.id === compareA)?.name}" vs "${track.methods.find(m => m.id === compareB)?.name}" — scroll down to see the table.`}
        </div>
      )}

      {/* Track selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {modelLabData.tracks.map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedTrack(t.id); setCompareA(null); setCompareB(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              selectedTrack === t.id
                ? 'bg-purple-700 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Track description */}
      <p className="text-gray-500 text-sm mb-6">{track.description}</p>

      {/* Method cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {track.methods.map(method => (
          <MethodCard
            key={method.id}
            method={method}
            compareMode={compareMode}
            isSelected={compareA === method.id || compareB === method.id}
            onSelect={() => handleMethodSelect(method.id)}
          />
        ))}
      </div>

      {/* Compare table */}
      {compareMode && methodA && methodB && (
        <div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Side-by-Side Comparison
          </div>
          <CompareTable a={methodA} b={methodB} />
        </div>
      )}
    </div>
  )
}
