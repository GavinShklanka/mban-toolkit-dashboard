import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import methods from '../data/methods.json'

type Method = typeof methods[0]

const levelColor: Record<string, string> = {
  descriptive:  'bg-blue-900/40 text-blue-300 border-blue-700',
  diagnostic:   'bg-cyan-900/40 text-cyan-300 border-cyan-700',
  predictive:   'bg-purple-900/40 text-purple-300 border-purple-700',
  prescriptive: 'bg-green-900/40 text-green-300 border-green-700',
  'ML/AI':      'bg-orange-900/40 text-orange-300 border-orange-700',
  'Agentic AI': 'bg-red-900/40 text-red-300 border-red-700',
}

function levelCls(level: string) {
  return levelColor[level] || levelColor[level?.toLowerCase()] || 'bg-gray-700 text-gray-300 border-gray-600'
}

// ─── Method Card (grid) ────────────────────────────────────────────────────────

function MethodCard({ method, onClick }: { method: Method; onClick: () => void }) {
  const topRisk = (method.governance_risks || []).length > 0 ? method.governance_risks[0] : null

  return (
    <button
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 hover:border-purple-600 rounded-xl p-4 text-left w-full transition-all group"
    >
      {/* Name + level */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-medium text-white text-sm group-hover:text-purple-100 leading-snug">
          {method.method_name}
        </div>
        <span className={`inline-block border text-xs px-1.5 py-0.5 rounded shrink-0 ${levelCls(method.analytics_level)}`}>
          {method.analytics_level}
        </span>
      </div>

      {/* What it does */}
      <p className="text-gray-300 text-xs mb-2 leading-relaxed line-clamp-2">{method.what_it_solves}</p>

      {/* When you'd use it — one line */}
      {method.when_to_use && (
        <p className="text-gray-500 text-xs mb-3 line-clamp-1">
          <span className="text-gray-600">Use when: </span>{method.when_to_use}
        </p>
      )}

      {/* Footer: family + courses + top risk */}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="bg-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded">{method.method_family}</span>
        {(method.linked_courses || []).slice(0, 2).map(c => (
          <span key={c} className="bg-purple-900/20 text-purple-300 text-xs px-1.5 py-0.5 rounded">MBAN {c}</span>
        ))}
        {topRisk && (
          <span className="ml-auto text-xs text-orange-400/70 line-clamp-1">⚠️ {topRisk.replace('Risk of ', '').replace('risk of ', '')}</span>
        )}
      </div>
    </button>
  )
}

// ─── Method Modal ──────────────────────────────────────────────────────────────

function MethodModal({ method, onClose }: { method: Method; onClose: () => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-xl">{method.method_name}</h2>
            <div className="flex gap-2 mt-1.5">
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{method.method_family}</span>
              <span className={`border text-xs px-2 py-0.5 rounded ${levelCls(method.analytics_level)}`}>
                {method.analytics_level}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4 shrink-0">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* What it does */}
          <div className="bg-gray-800/80 border border-purple-900/30 rounded-xl p-4">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>💡</span> What it does
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{method.what_it_solves}</p>
          </div>

          {/* When to use / when not to use */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">When to Use</div>
              <p className="text-gray-300 text-sm leading-relaxed">{method.when_to_use}</p>
            </div>
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">When NOT to Use</div>
              <p className="text-gray-300 text-sm leading-relaxed">{method.when_not_to_use}</p>
            </div>
          </div>

          {/* Business problems */}
          {(method.linked_problems || []).length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Business Use</div>
              <div className="flex flex-wrap gap-1.5">
                {method.linked_problems.map(p => (
                  <span key={p} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700">
                    💼 {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Courses + Tools */}
          <div className="grid grid-cols-2 gap-4">
            {(method.linked_courses || []).length > 0 && (
              <div>
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Courses</div>
                <div className="flex flex-wrap gap-1">
                  {method.linked_courses.map(c => (
                    <span key={c} className="bg-purple-900/20 text-purple-300 text-xs px-2 py-1 rounded">MBAN {c}</span>
                  ))}
                </div>
              </div>
            )}
            {(method.linked_tools || []).length > 0 && (
              <div>
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Tools</div>
                <div className="flex flex-wrap gap-1">
                  {method.linked_tools.map(t => (
                    <span key={t} className="bg-blue-900/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-900/30">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top governance risk — visible, not buried */}
          {(method.governance_risks || []).length > 0 && (
            <div className="bg-orange-900/10 border border-orange-800/30 rounded-lg px-4 py-3">
              <div className="text-orange-400 text-xs font-semibold mb-1">⚠️ Top Risk</div>
              <p className="text-orange-200/80 text-sm">{method.governance_risks[0]}</p>
            </div>
          )}

          {/* Exam formula if present */}
          {(method as any).exam_formula && (
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-gray-500 text-xs font-semibold mb-1.5">Formula</div>
              <code className="text-green-300 text-xs">{(method as any).exam_formula}</code>
            </div>
          )}

          {/* Expandable details */}
          <div>
            <button
              onClick={() => setDetailsOpen(v => !v)}
              className="w-full flex items-center justify-between py-2 border-t border-gray-800 text-gray-500 hover:text-gray-300 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <span>More Details (failure modes, governance, prerequisites)</span>
              <span>{detailsOpen ? '▲' : '▼'}</span>
            </button>

            {detailsOpen && (
              <div className="space-y-4 pt-3">
                {(method as any).prerequisites && (method as any).prerequisites.length > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Prerequisites</div>
                    <div className="flex flex-wrap gap-1">
                      {(method as any).prerequisites.map((p: string) => (
                        <span key={p} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(method.failure_modes || []).length > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Failure Modes</div>
                    <ul className="space-y-1">
                      {method.failure_modes.map((f, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">!</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(method.governance_risks || []).length > 1 && (
                  <div>
                    <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">All Governance Risks</div>
                    <div className="flex flex-wrap gap-1">
                      {method.governance_risks.map((r, i) => (
                        <span key={i} className="bg-orange-900/10 text-orange-300 text-xs px-2 py-0.5 rounded border border-orange-900/30">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outward links */}
          <div className="pt-3 border-t border-gray-800 flex flex-wrap gap-3">
            <Link to="/courses" onClick={onClose} className="text-xs text-purple-400 hover:text-purple-300 underline">
              Courses where this is taught →
            </Link>
            <Link to="/ask" onClick={onClose} className="text-xs text-green-400 hover:text-green-300 underline">
              Ask MBAN about this method →
            </Link>
            <Link to="/router" onClick={onClose} className="text-xs text-blue-400 hover:text-blue-300 underline">
              Business problems it solves →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
      const matchSearch = !q ||
        m.method_name.toLowerCase().includes(q) ||
        m.what_it_solves.toLowerCase().includes(q) ||
        m.method_family.toLowerCase().includes(q) ||
        (m.when_to_use || '').toLowerCase().includes(q)
      const matchLevel = !filterLevel || m.analytics_level === filterLevel
      const matchFamily = !filterFamily || m.method_family === filterFamily
      const matchCourse = !filterCourse || (m.linked_courses || []).includes(filterCourse)
      return matchSearch && matchLevel && matchFamily && matchCourse
    })
  }, [search, filterLevel, filterFamily, filterCourse])

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Method Library</h1>
        <p className="text-gray-400 text-sm">{methods.length} methods across 6 analytics levels · click any card for detail</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
          {allCourses.map(c => <option key={c} value={c}>MBAN {c}</option>)}
        </select>
      </div>

      <div className="flex items-center mb-4">
        <span className="text-xs text-gray-500">{filtered.length} of {methods.length} methods</span>
        {(search || filterLevel || filterFamily || filterCourse) && (
          <button
            onClick={() => { setSearch(''); setFilterLevel(''); setFilterFamily(''); setFilterCourse('') }}
            className="ml-3 text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Clear filters
          </button>
        )}
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
