import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import methods from '../data/methods.json'

type Method = typeof methods[0]

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

function getLevelCls(level: string) {
  return levelColor[level?.toLowerCase()] || levelColor[level] || 'bg-gray-700/60 text-gray-300 border-gray-600'
}

// ─── Method Card — clean, lead with essence ───────────────────────────────────

function MethodCard({ method, onClick }: { method: Method; onClick: () => void }) {
  const lvlCls = getLevelCls((method as any).analytics_level)

  return (
    <button
      onClick={onClick}
      className="bg-gray-800/80 border border-gray-700/70 hover:border-purple-600/60 rounded-2xl p-5 text-left w-full transition-all group"
    >
      {/* Name + level badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-semibold text-white text-sm leading-snug group-hover:text-purple-100">{method.method_name}</div>
        <span className={`inline-block border text-xs px-1.5 py-0.5 rounded shrink-0 ${lvlCls}`}>
          {method.analytics_level}
        </span>
      </div>

      {/* What it does */}
      <p className="text-gray-400 text-xs mb-3 leading-relaxed line-clamp-2">{method.what_it_solves}</p>

      {/* When to use */}
      {method.when_to_use && (
        <p className="text-gray-500 text-xs mb-3 leading-relaxed line-clamp-1">
          <span className="text-gray-600">Use when: </span>{method.when_to_use}
        </p>
      )}

      {/* Course + business use */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(method.linked_courses || []).map(c => (
          <span key={c} className="bg-purple-900/25 text-purple-300 text-xs px-2 py-0.5 rounded-full">MBAN {c}</span>
        ))}
        {(method.linked_problems || []).slice(0, 1).map(p => (
          <span key={p} className="text-gray-600 text-xs px-1">· {p}</span>
        ))}
      </div>
    </button>
  )
}

// ─── Method Modal — clean focus, expandable details ──────────────────────────

function MethodModal({ method, onClose }: { method: Method; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const lvlCls = getLevelCls((method as any).analytics_level)

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-4 md:my-8">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-xl mb-1">{method.method_name}</h2>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-gray-700/60 text-gray-300 text-xs px-2 py-0.5 rounded-full">{method.method_family}</span>
              <span className={`border text-xs px-2 py-0.5 rounded-full ${lvlCls}`}>{method.analytics_level}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4 shrink-0">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* What it does — lead */}
          <div className="bg-gray-800/60 border border-purple-900/30 rounded-2xl p-4">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>💡</span> What it does
            </div>
            <p className="text-gray-100 text-sm leading-relaxed">{method.what_it_solves}</p>
          </div>

          {/* When to use + when not to */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-4">
              <div className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-2">When to use</div>
              <p className="text-gray-300 text-sm leading-relaxed">{method.when_to_use}</p>
            </div>
            {method.when_not_to_use && (
              <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4">
                <div className="text-red-300 text-xs font-semibold uppercase tracking-wider mb-2">When NOT to use</div>
                <p className="text-gray-300 text-sm leading-relaxed">{method.when_not_to_use}</p>
              </div>
            )}
          </div>

          {/* Course link + business use */}
          <div className="flex flex-wrap gap-4">
            {method.linked_courses && method.linked_courses.length > 0 && (
              <div>
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Learned in</div>
                <div className="flex flex-wrap gap-1.5">
                  {method.linked_courses.map(c => (
                    <Link key={c} to="/courses" onClick={onClose}
                      className="bg-purple-900/30 text-purple-300 text-xs px-2.5 py-1 rounded-full hover:bg-purple-900/50 transition-colors">
                      MBAN {c}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {method.linked_tools && method.linked_tools.length > 0 && (
              <div>
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Tools</div>
                <div className="flex flex-wrap gap-1.5">
                  {method.linked_tools.map(t => (
                    <span key={t} className="bg-blue-900/25 text-blue-300 text-xs px-2.5 py-1 rounded-full border border-blue-900/40">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Business problems */}
          {method.linked_problems && method.linked_problems.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Business use</div>
              <div className="flex flex-wrap gap-1.5">
                {method.linked_problems.map(p => (
                  <span key={p} className="bg-gray-700/60 text-gray-300 text-xs px-2.5 py-1 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Expandable details */}
          <div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <span>{expanded ? '−' : '+'}</span>
              <span>{expanded ? 'Hide' : 'Show'} prerequisites, failure modes & governance</span>
            </button>

            {expanded && (
              <div className="mt-4 space-y-4">
                {(method as any).prerequisites && (method as any).prerequisites.length > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Prerequisites</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(method as any).prerequisites.map((p: string) => (
                        <span key={p} className="bg-gray-700/60 text-gray-400 text-xs px-2 py-0.5 rounded-lg">{p}</span>
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
                          <span className="text-red-400 shrink-0">!</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {method.governance_risks && method.governance_risks.length > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Governance Risks</div>
                    <div className="flex flex-wrap gap-1.5">
                      {method.governance_risks.map((r, i) => (
                        <span key={i} className="bg-red-900/15 text-red-300 text-xs px-2 py-0.5 rounded-lg border border-red-900/30">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(method as any).exam_formula && (
                  <div className="bg-gray-950 rounded-xl p-3">
                    <div className="text-gray-500 text-xs font-semibold mb-1.5">Formula</div>
                    <code className="text-green-300 text-xs">{(method as any).exam_formula}</code>
                  </div>
                )}

                <div className="text-xs text-gray-600 pt-1">
                  Evidence: {(method as any).evidence_origin} · Confidence: {(method as any).confidence}
                </div>
              </div>
            )}
          </div>

          {/* Footer links */}
          <div className="pt-3 border-t border-gray-800 flex flex-wrap gap-3">
            <Link to="/courses" onClick={onClose} className="text-xs text-purple-400 hover:text-purple-300 underline">
              Courses where taught →
            </Link>
            <Link to="/ask" onClick={onClose} className="text-xs text-green-400 hover:text-green-300 underline">
              Ask MBAN →
            </Link>
            <Link to="/router" onClick={onClose} className="text-xs text-blue-400 hover:text-blue-300 underline">
              Business problems it solves →
            </Link>
            <Link to="/governance" onClick={onClose} className="text-xs text-orange-400 hover:text-orange-300 underline">
              Governance grid →
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
      const matchSearch = !q || m.method_name.toLowerCase().includes(q) || m.what_it_solves.toLowerCase().includes(q) || m.method_family.toLowerCase().includes(q)
      const matchLevel = !filterLevel || m.analytics_level === filterLevel
      const matchFamily = !filterFamily || m.method_family === filterFamily
      const matchCourse = !filterCourse || (m.linked_courses || []).includes(filterCourse)
      return matchSearch && matchLevel && matchFamily && matchCourse
    })
  }, [search, filterLevel, filterFamily, filterCourse])

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Method Library</h1>
        <p className="text-gray-400 text-sm">{methods.length} methods across 9 courses — click any card for full detail</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          placeholder="Search methods..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="col-span-2 md:col-span-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-600"
        />
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600"
        >
          <option value="">All Levels</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filterFamily}
          onChange={e => setFilterFamily(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600"
        >
          <option value="">All Families</option>
          {families.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600"
        >
          <option value="">All Courses</option>
          {allCourses.map(c => <option key={c} value={c}>MBAN {c}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500">{filtered.length} of {methods.length} methods</span>
        {(search || filterLevel || filterFamily || filterCourse) && (
          <button
            onClick={() => { setSearch(''); setFilterLevel(''); setFilterFamily(''); setFilterCourse('') }}
            className="text-xs text-gray-500 hover:text-gray-300 underline"
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
