import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import methods from '../data/methods.json'
import courses from '../data/courses.json'
import templates from '../data/templates.json'
import slides from '../data/slides.json'
import projects from '../data/projects.json'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Template = typeof templates[0]
type ProjectItem = typeof projects[0]
type SearchResult =
  | { kind: 'method'; score: number; item: typeof methods[0] }
  | { kind: 'course'; score: number; item: typeof courses[0] }
  | { kind: 'slide'; score: number; item: { deck: string; course: string; title: string; bullets: string[]; slideNum: number } }
  | { kind: 'project'; score: number; item: ProjectItem }

// ─── Search Engine ─────────────────────────────────────────────────────────────

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
            bullets: matchedBullets.slice(0, 3),
            slideNum: slide.slide_number,
          },
        })
      }
    }
  }

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

// ─── Mode badge colors ─────────────────────────────────────────────────────────

const modeColor: Record<string, string> = {
  recalibration: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  selection:     'bg-green-900/40 text-green-300 border-green-700',
  troubleshooting:'bg-red-900/40 text-red-300 border-red-700',
  transfer:      'bg-blue-900/40 text-blue-300 border-blue-700',
  recall:        'bg-purple-900/40 text-purple-300 border-purple-700',
}

// ─── Featured Q&A Card ────────────────────────────────────────────────────────

function FeaturedCard({ t, onSelect }: { t: Template; onSelect: (q: string) => void }) {
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
          <span className="text-purple-400 text-base mt-0.5 shrink-0">💬</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-white text-sm font-medium leading-snug">{t.query}</p>
              <span className={`border text-xs px-1.5 py-0.5 rounded shrink-0 capitalize ${modeCls}`}>
                {t.detected_mode}
              </span>
            </div>
            {!open && (
              <p className="text-gray-500 text-xs mt-1">Click to see answer</p>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-900/50">
          {!!r.key_distinction && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Key Distinction</div>
              <p className="text-gray-200 text-sm leading-relaxed">{String(r.key_distinction)}</p>
            </div>
          )}
          {!!r.answer && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Answer</div>
              <p className="text-gray-200 text-sm leading-relaxed">{String(r.answer)}</p>
            </div>
          )}
          {!!r.managerial_explanation && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Manager-Level</div>
              <p className="text-gray-200 text-sm leading-relaxed">{String(r.managerial_explanation)}</p>
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-600 text-xs">Learned in:</span>
              <span className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded">
                {String(r.course_origin || r.where_learned || r.course_anchor)}
              </span>
            </div>
          )}
          {!!r.review_next && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
              <span className="text-gray-500 text-xs">Review next:</span>
              <span className="text-yellow-400 text-xs">{String(r.review_next)}</span>
            </div>
          )}
          <button
            onClick={() => onSelect(t.query)}
            className="text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Search this topic →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Answer Cards (search results) ────────────────────────────────────────────

const levelCls: Record<string, string> = {
  descriptive:  'bg-blue-900/40 text-blue-300 border-blue-700',
  diagnostic:   'bg-cyan-900/40 text-cyan-300 border-cyan-700',
  predictive:   'bg-purple-900/40 text-purple-300 border-purple-700',
  prescriptive: 'bg-green-900/40 text-green-300 border-green-700',
  'ML/AI':      'bg-orange-900/40 text-orange-300 border-orange-700',
  'Agentic AI': 'bg-red-900/40 text-red-300 border-red-700',
}

function MethodAnswer({ item }: { item: typeof methods[0] }) {
  const lvlCls = levelCls[item.analytics_level] || 'bg-gray-700 text-gray-300 border-gray-600'
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.method_name}</div>
          <div className="text-gray-500 text-xs">{item.method_family}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-600 font-semibold">Method</span>
          <span className={`border text-xs px-1.5 py-0.5 rounded ${lvlCls}`}>{item.analytics_level}</span>
        </div>
      </div>
      <p className="text-gray-300 text-xs leading-relaxed">{item.what_it_solves}</p>
      {(item.linked_courses || []).length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-600 text-xs">Learned in:</span>
          {(item.linked_courses || []).map((c: string) => (
            <Link key={c} to="/courses" className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded hover:bg-purple-900/50">
              MBAN {c}
            </Link>
          ))}
        </div>
      )}
      {(item as any).exam_formula && (
        <code className="block bg-gray-900 text-green-300 text-xs px-3 py-2 rounded">{(item as any).exam_formula}</code>
      )}
      <div className="flex gap-3 pt-1 border-t border-gray-700/60">
        <Link to="/methods" className="text-xs text-purple-400 hover:text-purple-300 underline">Full detail →</Link>
        <Link to="/governance" className="text-xs text-orange-400 hover:text-orange-300 underline">Governance →</Link>
      </div>
    </div>
  )
}

function CourseAnswer({ item }: { item: typeof courses[0] }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.course_code} — {item.title}</div>
          <div className="text-gray-500 text-xs">
            {(item.instructors || []).filter(i => i !== 'unknown').join(', ') || 'Instructor TBD'} · {item.semester}
          </div>
        </div>
        <span className="text-xs text-gray-600 font-semibold shrink-0">Course</span>
      </div>
      {item.business_framing && (
        <p className="text-gray-400 text-xs leading-relaxed">{item.business_framing}</p>
      )}
      {(item.methods || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(item.methods as string[]).slice(0, 4).map(m => (
            <span key={m} className="bg-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded">{m}</span>
          ))}
          {(item.methods as string[]).length > 4 && (
            <span className="text-gray-600 text-xs">+{(item.methods as string[]).length - 4} more</span>
          )}
        </div>
      )}
      <div className="flex gap-3 pt-1 border-t border-gray-700/60">
        <Link to="/courses" className="text-xs text-purple-400 hover:text-purple-300 underline">Course detail →</Link>
        <Link to="/methods" className="text-xs text-blue-400 hover:text-blue-300 underline">Methods taught →</Link>
      </div>
    </div>
  )
}

function SlideAnswer({ item }: { item: { deck: string; course: string; title: string; bullets: string[]; slideNum: number } }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.title || 'Untitled Slide'}</div>
          <div className="text-gray-500 text-xs">{item.deck} · Slide {item.slideNum}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-600 font-semibold">Slide</span>
          <span className="bg-purple-900/20 text-purple-300 text-xs px-1.5 py-0.5 rounded">MBAN {item.course}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600 text-xs">Learned in:</span>
        <Link to="/courses" className="bg-purple-900/20 text-purple-300 text-xs px-2 py-0.5 rounded hover:bg-purple-900/40">
          MBAN {item.course}
        </Link>
      </div>
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
    </div>
  )
}

function ProjectAnswer({ item }: { item: ProjectItem }) {
  return (
    <div className="bg-gray-800 border border-purple-900/30 rounded-xl p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-medium text-sm">{item.name}</div>
          <div className="text-gray-500 text-xs">
            {item.professor !== 'unknown' ? item.professor : 'Instructor TBD'} · {item.course} · {item.term}
          </div>
        </div>
        <span className="text-xs text-gray-600 font-semibold shrink-0">Project</span>
      </div>
      <p className="text-gray-300 text-xs leading-relaxed flex items-start gap-1.5">
        <span className="shrink-0">💼</span>
        <span>{item.business_problem}</span>
      </p>
      <div className="flex flex-wrap gap-1">
        {item.methods.slice(0, 3).map(m => (
          <span key={m} className="bg-purple-900/20 text-purple-300 text-xs px-1.5 py-0.5 rounded">{m}</span>
        ))}
        {item.methods.length > 3 && (
          <span className="text-gray-600 text-xs">+{item.methods.length - 3} more</span>
        )}
      </div>
      <p className="text-yellow-400/70 text-xs">Review next: {item.review_next}</p>
      <div className="pt-1 border-t border-gray-700/60">
        <Link to="/projects" className="text-xs text-purple-400 hover:text-purple-300 underline">View project detail →</Link>
      </div>
    </div>
  )
}

// ─── Suggested chips ──────────────────────────────────────────────────────────

const suggestedQueries = [
  'bootstrap vs cross-validation',
  'overfitting',
  'LangGraph interrupts',
  'equity research',
  'LangChain',
  'cruise line',
  'Hai Wang',
  'random forest',
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AskMBAN() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const results = useMemo(() => runSearch(submitted), [submitted])

  const methodResults  = results.filter(r => r.kind === 'method')  as Extract<SearchResult, { kind: 'method' }>[]
  const courseResults  = results.filter(r => r.kind === 'course')  as Extract<SearchResult, { kind: 'course' }>[]
  const slideResults   = results.filter(r => r.kind === 'slide')   as Extract<SearchResult, { kind: 'slide' }>[]
  const projectResults = results.filter(r => r.kind === 'project') as Extract<SearchResult, { kind: 'project' }>[]

  const handleSearch = (q: string) => {
    setQuery(q)
    setSubmitted(q)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(query)
  }

  const totalSlides = slides.reduce((a, d) => a + d.slide_count, 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">

      {/* Conversational header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Ask MBAN</h1>
        <p className="text-gray-400 text-sm">
          Search across {methods.length} methods, {courses.length} courses, {projects.length} projects, and {totalSlides} slides
        </p>
      </div>

      {/* Large centered search input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">💬</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="What would you like to review?"
            className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 rounded-2xl pl-12 pr-28 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none transition-colors shadow-lg"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSubmitted('') }}
                className="text-gray-500 hover:text-gray-300 text-sm px-2"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Ask
            </button>
          </div>
        </div>

        {/* Suggested chips */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          <span className="text-gray-600 text-xs self-center">Try:</span>
          {suggestedQueries.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSearch(s)}
              className="text-xs bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 px-3 py-1.5 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Search Results */}
      {submitted && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-gray-500 text-sm">Results for</p>
              <h2 className="text-white font-semibold text-lg">"{submitted}"</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-xs">{results.length} matches</span>
              <button
                onClick={() => { setQuery(''); setSubmitted('') }}
                className="text-xs text-gray-500 hover:text-gray-300 underline"
              >
                Clear
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🤔</div>
              <p className="text-gray-300 text-sm font-medium mb-1">Nothing found for "{submitted}"</p>
              <p className="text-gray-500 text-xs">Try a course code (5560), professor name, or method keyword</p>
            </div>
          ) : (
            <div className="space-y-6">
              {projectResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📁</span> Projects ({projectResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projectResults.map(r => <ProjectAnswer key={r.item.id} item={r.item} />)}
                  </div>
                </div>
              )}

              {methodResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>🔬</span> Methods ({methodResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {methodResults.slice(0, 6).map(r => <MethodAnswer key={r.item.method_name} item={r.item} />)}
                  </div>
                </div>
              )}

              {courseResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📚</span> Courses ({courseResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courseResults.map(r => <CourseAnswer key={r.item.course_code} item={r.item} />)}
                  </div>
                </div>
              )}

              {slideResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📄</span> Lecture Slides ({slideResults.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slideResults.slice(0, 8).map((r, i) => <SlideAnswer key={i} item={r.item} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Common Questions — always visible when not searching */}
      {!submitted && (
        <div>
          <div className="mb-4">
            <h2 className="text-white font-semibold text-base mb-1">Common Questions</h2>
            <p className="text-gray-500 text-xs">7 curated answers — click any to expand</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {templates.map((t, i) => (
              <FeaturedCard key={i} t={t} onSelect={handleSearch} />
            ))}
          </div>
        </div>
      )}

      {/* Show 3 featured questions below results */}
      {submitted && results.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-400 text-sm font-semibold">Common Questions</h2>
            <button
              onClick={() => { setQuery(''); setSubmitted('') }}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              See all →
            </button>
          </div>
          <div className="space-y-2">
            {templates.slice(0, 3).map((t, i) => (
              <FeaturedCard key={i} t={t} onSelect={handleSearch} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
