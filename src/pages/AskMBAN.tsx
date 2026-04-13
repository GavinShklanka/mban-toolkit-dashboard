import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import methods from '../data/methods.json'
import courses from '../data/courses.json'
import templates from '../data/templates.json'
import slides from '../data/slides.json'
import projects from '../data/projects.json'

// ─── Types ────────────────────────────────────────────────────────────────────

type Template = typeof templates[0]
type ProjectItem = typeof projects[0]
type SearchResult =
  | { kind: 'method'; score: number; item: typeof methods[0] }
  | { kind: 'course'; score: number; item: typeof courses[0] }
  | { kind: 'slide'; score: number; item: { deck: string; course: string; title: string; bullets: string[]; slideNum: number } }
  | { kind: 'project'; score: number; item: ProjectItem }

// ─── Search Engine ────────────────────────────────────────────────────────────

function scoreText(text: string, q: string): number {
  if (!text) return 0
  const t = text.toLowerCase()
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  let score = 0
  for (const w of words) {
    if (t.includes(w)) score += w.length > 4 ? 3 : 1
  }
  if (t.includes(q.toLowerCase())) score += 5
  return score
}

function runSearch(query: string): SearchResult[] {
  if (!query.trim()) return []
  const q = query.trim()
  const results: SearchResult[] = []

  // Methods
  for (const m of methods) {
    const score =
      scoreText(m.method_name, q) * 4 +
      scoreText(m.what_it_solves, q) * 2 +
      scoreText(m.when_to_use, q) +
      scoreText(m.method_family, q) * 2 +
      (m.linked_problems || []).reduce((a, p) => a + scoreText(p, q), 0) +
      (m.linked_courses || []).reduce((a, c) => a + scoreText(c, q), 0)
    if (score > 0) results.push({ kind: 'method', score, item: m })
  }

  // Courses
  for (const c of courses) {
    const score =
      scoreText(c.course_code, q) * 4 +
      scoreText(c.title, q) * 3 +
      scoreText(c.business_framing, q) * 2 +
      (c.methods || []).reduce((a: number, m: string) => a + scoreText(m, q), 0) +
      (c.tools || []).reduce((a: number, t: string) => a + scoreText(t, q), 0) +
      (c.theories || []).reduce((a: number, t: string) => a + scoreText(t, q), 0) +
      (c.instructors || []).reduce((a: number, i: string) => a + scoreText(i, q) * 3, 0)
    if (score > 0) results.push({ kind: 'course', score, item: c })
  }

  // Slides
  for (const deck of slides) {
    for (const slide of deck.slides) {
      const titleScore = scoreText(slide.title, q) * 3
      const bulletScore = (slide.bullets || []).reduce((a: number, b: string) => a + scoreText(b, q), 0)
      const score = titleScore + bulletScore
      if (score > 1) {
        const matchedBullets = (slide.bullets || []).filter((b: string) =>
          q.toLowerCase().split(/\s+/).some(w => b.toLowerCase().includes(w))
        )
        results.push({
          kind: 'slide',
          score,
          item: {
            deck: deck.deck_label,
            course: deck.course,
            title: slide.title || `Slide ${slide.slide_number}`,
            bullets: matchedBullets.slice(0, 4),
            slideNum: slide.slide_number,
          },
        })
      }
    }
  }

  // Projects
  for (const p of projects) {
    const score =
      scoreText(p.name, q) * 4 +
      scoreText(p.business_problem, q) * 3 +
      scoreText(p.what_it_taught, q) * 2 +
      scoreText(p.professor, q) * 3 +
      scoreText(p.course, q) * 3 +
      p.methods.reduce((a, m) => a + scoreText(m, q) * 2, 0) +
      p.tools.reduce((a, t) => a + scoreText(t, q), 0) +
      p.search_keywords.reduce((a, k) => a + scoreText(k, q) * 2, 0)
    if (score > 0) results.push({ kind: 'project', score, item: p })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20)
}

// ─── Evidence badge helper ────────────────────────────────────────────────────

function evidenceBadge(origin: string) {
  if (!origin) return null
  const o = origin.toUpperCase()
  if (o.includes('OUTLINE'))
    return <span className="inline-flex items-center gap-1 bg-green-900/40 text-green-300 border border-green-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Outline</span>
  if (o.includes('ARTIFACT'))
    return <span className="inline-flex items-center gap-1 bg-blue-900/40 text-blue-300 border border-blue-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Artifact</span>
  if (o.includes('GAP') || o.includes('UNKNOWN'))
    return <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-300 border border-red-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Gap</span>
  return null
}

function projectEvidenceBadge(type: string) {
  const map: Record<string, React.ReactElement> = {
    outline:     <span className="inline-flex items-center gap-1 bg-green-900/40 text-green-300 border border-green-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Outline</span>,
    artifact:    <span className="inline-flex items-center gap-1 bg-blue-900/40 text-blue-300 border border-blue-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Artifact</span>,
    provisional: <span className="inline-flex items-center gap-1 bg-yellow-900/40 text-yellow-300 border border-yellow-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Provisional</span>,
    pptx:        <span className="inline-flex items-center gap-1 bg-purple-900/40 text-purple-300 border border-purple-700 text-xs px-1.5 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" />PPTX</span>,
  }
  return map[type] ?? null
}

// ─── Mode badge colors ─────────────────────────────────────────────────────────
const modeColor: Record<string, string> = {
  recalibration: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  selection: 'bg-green-900/40 text-green-300 border-green-700',
  troubleshooting: 'bg-red-900/40 text-red-300 border-red-700',
  transfer: 'bg-blue-900/40 text-blue-300 border-blue-700',
  recall: 'bg-purple-900/40 text-purple-300 border-purple-700',
}

const levelColor: Record<string, string> = {
  descriptive: 'bg-blue-900/40 text-blue-300 border-blue-700',
  predictive: 'bg-purple-900/40 text-purple-300 border-purple-700',
  prescriptive: 'bg-green-900/40 text-green-300 border-green-700',
  'ML/AI': 'bg-orange-900/40 text-orange-300 border-orange-700',
  agentic: 'bg-red-900/40 text-red-300 border-red-700',
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ t, onSelect }: { t: Template; onSelect: (q: string) => void }) {
  const [open, setOpen] = useState(false)
  const r = t.response as Record<string, unknown>
  const modeCls = modeColor[t.detected_mode] || 'bg-gray-700 text-gray-300 border-gray-600'

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-gray-750 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-start gap-3">
          <span className="text-purple-400 text-lg mt-0.5 shrink-0">?</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-white text-sm font-medium leading-snug">{t.query}</p>
              <span className={`border text-xs px-1.5 py-0.5 rounded shrink-0 capitalize ${modeCls}`}>
                {t.detected_mode}
              </span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onSelect(t.query) }}
              className="text-xs text-purple-400 hover:text-purple-300 underline"
            >
              Search this →
            </button>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-900/50">
          {!!r.key_distinction && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Key Distinction</div>
              <p className="text-gray-200 text-sm">{String(r.key_distinction)}</p>
            </div>
          )}
          {!!r.answer && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Answer</div>
              <p className="text-gray-200 text-sm">{String(r.answer)}</p>
            </div>
          )}
          {!!r.managerial_explanation && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Manager-Level</div>
              <p className="text-gray-200 text-sm">{String(r.managerial_explanation)}</p>
            </div>
          )}
          {!!r.fix_chain && Array.isArray(r.fix_chain) && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Fix Chain</div>
              <ul className="space-y-1">
                {(r.fix_chain as string[]).map((s, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 shrink-0">›</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!(r.course_origin || r.where_learned || r.course_anchor) && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Where learned:</span>
              <span className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded">
                {String(r.course_origin || r.where_learned || r.course_anchor)}
              </span>
            </div>
          )}
          {!!r.review_next && (
            <div className="pt-2 border-t border-gray-800">
              <span className="text-gray-500 text-xs">Review next: </span>
              <span className="text-yellow-400 text-xs">{String(r.review_next)}</span>
            </div>
          )}
          {!!r.adjacent_concept && (
            <div>
              <span className="text-gray-500 text-xs">Related: </span>
              <span className="text-gray-300 text-xs">{String(r.adjacent_concept)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Search Result Cards ───────────────────────────────────────────────────────

function MethodResult({ item }: { item: typeof methods[0] }) {
  const lvlCls = levelColor[(item as any).analytics_level] || 'bg-gray-700 text-gray-300 border-gray-600'
  const m = item as any
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.method_name}</div>
          <div className="text-gray-500 text-xs mt-0.5">{item.method_family}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-600 uppercase font-semibold">Method</span>
          <span className={`border text-xs px-1.5 py-0.5 rounded ${lvlCls}`}>{item.analytics_level}</span>
        </div>
      </div>

      {/* Business Use */}
      <div className="flex items-start gap-1 text-xs text-gray-400">
        <span className="shrink-0">💼</span>
        <span>{item.what_it_solves}</span>
      </div>

      {/* Learned In */}
      {(item.linked_courses || []).length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-gray-600 text-xs">Learned in:</span>
          {(item.linked_courses || []).map((c: string) => (
            <Link key={c} to="/courses" className="bg-purple-900/30 text-purple-300 text-xs px-1.5 py-0.5 rounded hover:bg-purple-900/50 transition-colors">
              MBAN {c}
            </Link>
          ))}
        </div>
      )}

      {/* Sources */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-600 text-xs">Sources:</span>
        {evidenceBadge((item as any).evidence_origin || '')}
        <span className="text-gray-600 text-xs">{(item as any).confidence}</span>
      </div>

      {/* Related problems */}
      {(item.linked_problems || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.linked_problems.slice(0, 3).map((p: string) => (
            <span key={p} className="bg-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded">{p}</span>
          ))}
        </div>
      )}

      {m.exam_formula && (
        <div className="bg-gray-900 rounded p-2">
          <div className="text-gray-500 text-xs font-semibold mb-1">Formula</div>
          <code className="text-green-300 text-xs">{m.exam_formula}</code>
        </div>
      )}

      {/* Outward links */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-700/60">
        <Link to="/methods" className="text-xs text-purple-400 hover:text-purple-300 underline">Full detail →</Link>
        <Link to="/router" className="text-xs text-blue-400 hover:text-blue-300 underline">Business problems →</Link>
        <Link to="/governance" className="text-xs text-orange-400 hover:text-orange-300 underline">Governance →</Link>
      </div>
    </div>
  )
}

function CourseResult({ item }: { item: typeof courses[0] }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.course_code} — {item.title}</div>
          <div className="text-gray-500 text-xs mt-0.5">
            {(item.instructors || []).join(', ')} · {item.semester}
          </div>
        </div>
        <span className="text-xs text-gray-600 uppercase font-semibold shrink-0">Course</span>
      </div>

      {/* Business Use */}
      {item.business_framing && (
        <div className="flex items-start gap-1 text-xs text-gray-400">
          <span className="shrink-0">💼</span>
          <span>{item.business_framing}</span>
        </div>
      )}

      {/* Sources */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-600 text-xs">Sources:</span>
        {evidenceBadge(item.evidence_origin || '')}
        <span className="text-gray-600 text-xs">{item.confidence}</span>
      </div>

      {/* Methods preview */}
      {(item.methods || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(item.methods as string[]).slice(0, 4).map(m => (
            <span key={m} className="bg-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded">{m}</span>
          ))}
          {(item.methods as string[]).length > 4 && (
            <span className="text-gray-600 text-xs px-1 py-0.5">+{(item.methods as string[]).length - 4} more</span>
          )}
        </div>
      )}

      {/* Outward links */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-700/60">
        <Link to="/courses" className="text-xs text-purple-400 hover:text-purple-300 underline">Course detail →</Link>
        <Link to="/methods" className="text-xs text-blue-400 hover:text-blue-300 underline">Methods taught →</Link>
        <Link to="/projects" className="text-xs text-green-400 hover:text-green-300 underline">Projects →</Link>
      </div>
    </div>
  )
}

function SlideResult({ item }: { item: { deck: string; course: string; title: string; bullets: string[]; slideNum: number } }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.title || 'Untitled Slide'}</div>
          <div className="text-gray-500 text-xs mt-0.5">{item.deck} · Slide {item.slideNum}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-600 uppercase font-semibold">Slide</span>
          <span className="bg-blue-900/30 text-blue-300 text-xs px-1.5 py-0.5 rounded">MBAN {item.course}</span>
        </div>
      </div>

      {/* Learned In */}
      <div className="flex items-center gap-1">
        <span className="text-gray-600 text-xs">Learned in:</span>
        <Link to="/courses" className="bg-purple-900/30 text-purple-300 text-xs px-1.5 py-0.5 rounded hover:bg-purple-900/50 transition-colors">
          MBAN {item.course}
        </Link>
      </div>

      {/* Matched bullets */}
      {item.bullets.length > 0 && (
        <ul className="space-y-1">
          {item.bullets.map((b, i) => (
            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
              <span className="text-gray-600 shrink-0">·</span>
              <span className="line-clamp-2">{b}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Outward links */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-700/60">
        <Link to="/courses" className="text-xs text-purple-400 hover:text-purple-300 underline">View course page →</Link>
        <Link to="/methods" className="text-xs text-blue-400 hover:text-blue-300 underline">Related methods →</Link>
      </div>
    </div>
  )
}

function ProjectResult({ item }: { item: ProjectItem }) {
  return (
    <div className="bg-gray-800 border border-purple-900/40 rounded-xl p-4 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.name}</div>
          <div className="text-gray-500 text-xs mt-0.5">
            {item.professor !== 'unknown' ? item.professor : 'Instructor TBD'} · {item.course} · {item.term}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-600 uppercase font-semibold">Project</span>
          {projectEvidenceBadge(item.evidence_type)}
        </div>
      </div>

      {/* Business Problem */}
      <div className="flex items-start gap-1 text-xs text-gray-300">
        <span className="shrink-0">💼</span>
        <span>{item.business_problem}</span>
      </div>

      {/* Methods */}
      <div className="flex flex-wrap gap-1">
        {item.methods.slice(0, 3).map(m => (
          <span key={m} className="bg-purple-900/30 text-purple-300 text-xs px-1.5 py-0.5 rounded">{m}</span>
        ))}
        {item.methods.length > 3 && (
          <span className="text-gray-600 text-xs px-1 py-0.5">+{item.methods.length - 3} more</span>
        )}
      </div>

      {/* Review Next */}
      <div className="text-xs text-yellow-400/80">
        Review next: {item.review_next}
      </div>

      {/* Outward links */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-700/60">
        <Link to="/projects" className="text-xs text-purple-400 hover:text-purple-300 underline">View project detail →</Link>
        <Link to="/courses" className="text-xs text-blue-400 hover:text-blue-300 underline">Course page →</Link>
        {item.related_methods.length > 0 && (
          <Link to="/methods" className="text-xs text-green-400 hover:text-green-300 underline">Related methods →</Link>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AskMBAN() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const results = useMemo(() => runSearch(submitted), [submitted])

  const methodResults = results.filter(r => r.kind === 'method') as Extract<SearchResult, { kind: 'method' }>[]
  const courseResults = results.filter(r => r.kind === 'course') as Extract<SearchResult, { kind: 'course' }>[]
  const slideResults = results.filter(r => r.kind === 'slide') as Extract<SearchResult, { kind: 'slide' }>[]
  const projectResults = results.filter(r => r.kind === 'project') as Extract<SearchResult, { kind: 'project' }>[]

  const handleSearch = (q: string) => {
    setQuery(q)
    setSubmitted(q)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(query)
  }

  const totalMethods = methods.length
  const totalSlides = slides.reduce((a, d) => a + d.slide_count, 0)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Ask MBAN</h1>
        <p className="text-gray-400 text-sm">
          Search across {totalMethods} methods, {courses.length} courses, {projects.length} projects, and {totalSlides} extracted slides
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. cruise line, overfitting, LangGraph, Hai Wang, equity research..."
              className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition-colors"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSubmitted('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-purple-700 hover:bg-purple-600 text-white font-medium px-5 py-3 rounded-xl text-sm transition-colors shrink-0"
          >
            Search
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {['overfitting', 'LangGraph', 'Bayes', 'Hai Wang', 'cruise line', 'equity research', 'NS Health', 'Looms of Ladakh'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSearch(s)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 px-2 py-1 rounded-lg transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Search Results */}
      {submitted && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">
              Results for <span className="text-purple-300">"{submitted}"</span>
            </h2>
            <span className="text-gray-500 text-xs">{results.length} matches</span>
          </div>

          {results.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <div className="text-gray-500 mb-2 text-2xl">🔍</div>
              <p className="text-gray-400 text-sm">No results found for "{submitted}"</p>
              <p className="text-gray-600 text-xs mt-1">Try a course code (5560), professor name, or method keyword</p>
            </div>
          ) : (
            <div className="space-y-6">
              {projectResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Projects ({projectResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projectResults.map(r => (
                      <ProjectResult key={r.item.id} item={r.item} />
                    ))}
                  </div>
                </div>
              )}

              {methodResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Methods ({methodResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {methodResults.slice(0, 6).map(r => (
                      <MethodResult key={r.item.method_name} item={r.item} />
                    ))}
                  </div>
                </div>
              )}

              {courseResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Courses ({courseResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courseResults.map(r => (
                      <CourseResult key={r.item.course_code} item={r.item} />
                    ))}
                  </div>
                </div>
              )}

              {slideResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Slides ({slideResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slideResults.slice(0, 8).map((r, i) => (
                      <SlideResult key={i} item={r.item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Featured Q&A — always visible when not searching */}
      {!submitted && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-semibold">Featured Q&A</h2>
            <span className="text-gray-600 text-xs">7 curated responses — click to expand</span>
          </div>
          <div className="space-y-3">
            {templates.map((t, i) => (
              <TemplateCard key={i} t={t} onSelect={handleSearch} />
            ))}
          </div>
        </div>
      )}

      {/* Show featured Q&A below results too */}
      {submitted && results.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-semibold">Featured Q&A</h2>
            <button
              onClick={() => { setQuery(''); setSubmitted('') }}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              Clear search to browse
            </button>
          </div>
          <div className="space-y-3">
            {templates.slice(0, 3).map((t, i) => (
              <TemplateCard key={i} t={t} onSelect={handleSearch} />
            ))}
            {templates.length > 3 && (
              <button
                onClick={() => { setQuery(''); setSubmitted('') }}
                className="text-xs text-purple-400 hover:text-purple-300 w-full py-2 text-center"
              >
                View all {templates.length} featured responses →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
