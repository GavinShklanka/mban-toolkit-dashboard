import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import methods from '../data/methods.json'

type Method = typeof methods[0]

// ─── Evidence badge ──────────────────────────────────────────────────────────
function evidenceBadge(origin: string) {
  if (!origin) return null
  const o = origin.toUpperCase()
  if (o.includes('OUTLINE'))
    return <span className="inline-flex items-center gap-1 bg-green-900/40 text-green-300 border border-green-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Outline</span>
  if (o.includes('ARTIFACT'))
    return <span className="inline-flex items-center gap-1 bg-blue-900/40 text-blue-300 border border-blue-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Artifact</span>
  if (o.includes('GAP') || o.includes('UNKNOWN'))
    return <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-300 border border-red-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Gap</span>
  return <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-400 border border-gray-600 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Unknown</span>
}

const riskColor = (risk: string) => {
  if (risk?.includes('VERY HIGH') || risk?.includes('VERY LOW')) return 'text-red-400'
  if (risk?.includes('HIGH') || risk?.includes('LOW')) return 'text-orange-400'
  if (risk?.includes('MEDIUM')) return 'text-yellow-400'
  return 'text-green-400'
}

const levelColor: Record<string, string> = {
  descriptive: 'bg-blue-900/40 text-blue-300 border-blue-700',
  diagnostic: 'bg-cyan-900/40 text-cyan-300 border-cyan-700',
  predictive: 'bg-purple-900/40 text-purple-300 border-purple-700',
  prescriptive: 'bg-green-900/40 text-green-300 border-green-700',
  'ml_ai': 'bg-orange-900/40 text-orange-300 border-orange-700',
  'ML/AI': 'bg-orange-900/40 text-orange-300 border-orange-700',
  agentic: 'bg-red-900/40 text-red-300 border-red-700',
  'agentic AI': 'bg-red-900/40 text-red-300 border-red-700',
}

function MethodCard({ method, onClick }: { method: Method; onClick: () => void }) {
  const lvl = (method as any).analytics_level?.toLowerCase() || ''
  const cls = levelColor[lvl] || 'bg-gray-700 text-gray-300 border-gray-600'

  return (
    <button
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 hover:border-purple-600 rounded-xl p-4 text-left w-full transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-medium text-white text-sm">{method.method_name}</div>
        <span className={`inline-block border text-xs px-1.5 py-0.5 rounded shrink-0 ${cls}`}>
          {method.analytics_level}
        </span>
      </div>
      <div className="text-gray-400 text-xs mb-2 line-clamp-2">{method.what_it_solves}</div>
      {/* Business Use */}
      {(method.linked_problems || []).length > 0 && (
        <div className="text-xs text-gray-500 mb-3 flex items-start gap-1">
          <span className="shrink-0">💼</span>
          <span className="line-clamp-1">{method.linked_problems.slice(0, 2).join(', ')}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="bg-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded">{method.method_family}</span>
        {method.linked_courses?.map(c => (
          <span key={c} className="bg-purple-900/30 text-purple-300 text-xs px-1.5 py-0.5 rounded">{c}</span>
        ))}
        <span className="ml-auto">{evidenceBadge((method as any).evidence_origin || '')}</span>
      </div>
    </button>
  )
}

function MethodModal({ method, onClose }: { method: Method; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8">
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">{method.method_name}</h2>
            <div className="flex gap-2 mt-1">
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{method.method_family}</span>
              <span className="bg-purple-900/40 text-purple-300 text-xs px-2 py-0.5 rounded">{method.analytics_level}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Business Use — visible, not expandable */}
          <div className="bg-gray-800/80 border border-purple-900/40 rounded-xl p-3">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>💼</span> Business Use
            </div>
            <p className="text-gray-200 text-sm">
              {method.what_it_solves}
              {(method.linked_problems || []).length > 0 && (
                <span className="text-gray-400"> — applied to: {method.linked_problems.slice(0, 3).join(', ')}.</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">When to Use</div>
              <p className="text-gray-300 text-sm">{method.when_to_use}</p>
            </div>
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">When NOT to Use</div>
              <p className="text-gray-300 text-sm">{method.when_not_to_use}</p>
            </div>
          </div>
          {method.linked_tools && method.linked_tools.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Tools</div>
              <div className="flex flex-wrap gap-1">
                {method.linked_tools.map(t => (
                  <span key={t} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-900">{t}</span>
                ))}
              </div>
            </div>
          )}
          {method.linked_courses && method.linked_courses.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Courses</div>
              <div className="flex flex-wrap gap-1">
                {method.linked_courses.map(c => (
                  <span key={c} className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded">{c}</span>
                ))}
              </div>
            </div>
          )}
          {method.governance_risks && method.governance_risks.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Governance Risks</div>
              <div className="flex flex-wrap gap-1">
                {method.governance_risks.map((r, i) => (
                  <span key={i} className="bg-red-900/20 text-red-300 text-xs px-2 py-0.5 rounded border border-red-900">{r}</span>
                ))}
              </div>
            </div>
          )}
          {method.failure_modes && method.failure_modes.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Failure Modes</div>
              <ul className="space-y-1">
                {method.failure_modes.map((f, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">!</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {method.linked_problems && method.linked_problems.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Business Problems</div>
              <div className="flex flex-wrap gap-1">
                {method.linked_problems.map(p => (
                  <span key={p} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{p}</span>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-gray-800">
            <div className="text-xs text-gray-600 mb-3">Evidence: {method.evidence_origin} · Confidence: {method.confidence}</div>
            <div className="flex flex-wrap gap-3">
              <Link to="/courses" onClick={onClose} className="text-xs text-purple-400 hover:text-purple-300 underline">
                Browse courses where this is taught →
              </Link>
              <Link to="/ask" onClick={onClose} className="text-xs text-green-400 hover:text-green-300 underline">
                Ask MBAN about this method →
              </Link>
              <Link to="/router" onClick={onClose} className="text-xs text-blue-400 hover:text-blue-300 underline">
                Find business problems this solves →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Methods() {
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterFamily, setFilterFamily] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [selected, setSelected] = useState<Method | null>(null)

  const levels = [...new Set(methods.map(m => m.analytics_level).filter(Boolean))]
  const families = [...new Set(methods.map(m => m.method_family).filter(Boolean))]
  const allCourses = [...new Set(methods.flatMap(m => m.linked_courses || []))]

  const filtered = useMemo(() => {
    return methods.filter(m => {
      const q = search.toLowerCase()
      const matchSearch = !q || m.method_name.toLowerCase().includes(q) || m.what_it_solves.toLowerCase().includes(q) || m.method_family.toLowerCase().includes(q)
      const matchLevel = !filterLevel || m.analytics_level === filterLevel
      const matchFamily = !filterFamily || m.method_family === filterFamily
      const matchCourse = !filterCourse || (m.linked_courses || []).includes(filterCourse)
      return matchSearch && matchLevel && matchFamily && matchCourse
    })
  }, [search, filterLevel, filterFamily, filterCourse])

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Method Registry</h1>
        <p className="text-gray-400 text-sm">{methods.length} methods · Click any card for full detail</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <input
          type="text"
          placeholder="Search methods..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="col-span-2 md:col-span-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-600"
        />
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600"
        >
          <option value="">All Levels</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filterFamily}
          onChange={e => setFilterFamily(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600"
        >
          <option value="">All Families</option>
          {families.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600"
        >
          <option value="">All Courses</option>
          {allCourses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500">{filtered.length} of {methods.length} methods</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />Outline</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Artifact</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Gap</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => (
          <MethodCard key={m.method_name} method={m} onClick={() => setSelected(m)} />
        ))}
      </div>

      {selected && <MethodModal method={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
