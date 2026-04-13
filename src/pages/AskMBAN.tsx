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
            bullets: matchedBullets.slice(0, 4),
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

// ─── Answer Cards ─────────────────────────────────────────────────────────────

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

function MethodAnswerCard({ item }: { item: typeof methods[0] }) {
  const lvlCls = levelColor[(item as any).analytics_level?.toLowerCase()] || levelColor[(item as any).analytics_level] || 'bg-gray-700 text-gray-300 border-gray-600'
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-semibold text-base">{item.method_name}</div>
          <div className="text-gray-500 text-xs mt-0.5">{item.method_family}</div>
        </div>
        <span className={`border text-xs px-1.5 py-0.5 rounded shrink-0 ${lvlCls}`}>{item.analytics_level}</span>
      </div>

      {/* Answer — what it does */}
      <div className="bg-gray-900/60 rounded-xl p-3">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">What it does</div>
        <p className="text-gray-200 text-sm leading-relaxed">{item.what_it_solves}</p>
      </div>

      {/* When to use */}
      {item.when_to_use && (
        <div>
          <div className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">When to use</div>
          <p className="text-gray-400 text-sm">{item.when_to_use}</p>
        </div>
      )}

      {/* Learned in + Related */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs pt-1 border-t border-gray-700/60">
        {(item.linked_courses || []).length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Learned in</span>
            {(item.linked_courses || []).map((c: string) => (
              <Link key={c} to="/courses" className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded hover:bg-purple-900/50 transition-colors">
                MBAN {c}
              </Link>
            ))}
          </div>
        )}
        {(item.linked_problems || []).length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Business use</span>
            <span className="text-gray-400">{item.linked_problems.slice(0, 2).join(', ')}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 text-xs">
        <Link to="/methods" className="text-purple-400 hover:text-purple-300 underline">Full detail →</Link>
        <Link to="/router" className="text-blue-400 hover:text-blue-300 underline">Business problems →</Link>
      </div>
    </div>
  )
}

function CourseAnswerCard({ item }: { item: typeof courses[0] }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div>
        <div className="text-white font-semibold text-base">{item.course_code}</div>
        <div className="text-gray-300 text-sm">{item.title}</div>
        <div className="text-gray-500 text-xs mt-0.5">{(item.instructors || []).join(', ')} · {item.semester}</div>
      </div>

      {item.business_framing && (
        <div className="bg-gray-900/60 rounded-xl p-3">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">What it covered</div>
          <p className="text-gray-200 text-sm leading-relaxed">{item.business_framing}</p>
        </div>
      )}

      {(item.methods || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(item.methods as string[]).slice(0, 4).map(m => (
            <span key={m} className="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-lg">{m}</span>
          ))}
          {(item.methods as string[]).length > 4 && (
            <span className="text-gray-600 text-xs px-1 py-0.5">+{(item.methods as string[]).length - 4} more</span>
          )}
        </div>
      )}

      <div className="flex gap-3 text-xs pt-1 border-t border-gray-700/60">
        <Link to="/courses" className="text-purple-400 hover:text-purple-300 underline">Course portal →</Link>
        <Link to="/methods" className="text-blue-400 hover:text-blue-300 underline">Methods taught →</Link>
      </div>
    </div>
  )
}

function SlideAnswerCard({ item }: { item: { deck: string; course: string; title: string; bullets: string[]; slideNum: number } }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-semibold text-base">{item.title || 'Slide content'}</div>
          <div className="text-gray-500 text-xs mt-0.5">{item.deck} · Slide {item.slideNum} · MBAN {item.course}</div>
        </div>
        <span className="bg-blue-900/30 text-blue-300 text-xs px-1.5 py-0.5 rounded shrink-0">Slide</span>
      </div>

      {item.bullets.length > 0 && (
        <div className="bg-gray-900/60 rounded-xl p-3 space-y-1">
          {item.bullets.map((b, i) => (
            <div key={i} className="text-gray-300 text-xs flex items-start gap-2">
              <span className="text-gray-600 shrink-0">·</span>
              <span className="line-clamp-2">{b}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-gray-700/60">
        <span className="text-gray-600">Learned in</span>
        <Link to="/courses" className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded hover:bg-purple-900/50 transition-colors">
          MBAN {item.course}
        </Link>
      </div>
    </div>
  )
}

function ProjectAnswerCard({ item }: { item: ProjectItem }) {
  return (
    <div className="bg-gray-800 border border-purple-900/40 rounded-2xl p-5 space-y-3">
      <div>
        <div className="text-white font-semibold text-base">{item.name}</div>
        <div className="text-gray-500 text-xs mt-0.5">
          {item.professor !== 'unknown' ? item.professor : 'Instructor TBD'} · {item.course} · {item.term}
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl p-3">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Business problem</div>
        <p className="text-gray-200 text-sm leading-relaxed">{item.business_problem}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {item.methods.slice(0, 3).map(m => (
          <span key={m} className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded-lg">{m}</span>
        ))}
        {item.methods.length > 3 && (
          <span className="text-gray-600 text-xs px-1 py-0.5">+{item.methods.length - 3} more</span>
        )}
      </div>

      <div className="flex gap-3 text-xs pt-1 border-t border-gray-700/60">
        <Link to="/projects" className="text-purple-400 hover:text-purple-300 underline">Project detail →</Link>
        <Link to="/courses" className="text-blue-400 hover:text-blue-300 underline">Course page →</Link>
      </div>
    </div>
  )
}

// ─── Common Question Card ─────────────────────────────────────────────────────

function CommonQuestionCard({ t, onSelect }: { t: Template; onSelect: (q: string) => void }) {
  const [open, setOpen] = useState(false)
  const r = t.response as Record<string, unknown>

  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-2xl overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-gray-800 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-gray-200 text-sm leading-snug">{t.query}</p>
          <span className="text-gray-500 shrink-0 text-sm">{open ? '−' : '+'}</span>
        </div>
        {!open && (
          <button
            onClick={e => { e.stopPropagation(); onSelect(t.query) }}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Search this →
          </button>
        )}
      </button>

      {open && (
        <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-900/40">
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
              <span className="text-gray-500 text-xs">Learned in:</span>
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
          <button
            onClick={() => onSelect(t.query)}
            className="text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Search for more on this →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Suggested Chips ──────────────────────────────────────────────────────────

const suggestions = [
  'overfitting', 'LangGraph', 'Bayes', 'random forest',
  'Hai Wang', 'cruise line', 'equity research', 'NS Health',
  'linear programming', 'sentiment analysis', 'neural network',
]

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

  const totalSlides = slides.reduce((a, d) => a + d.slide_count, 0)

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Ask MBAN</h1>
        <p className="text-gray-400 text-sm">
          Search your MBAN knowledge base — {methods.length} methods, {courses.length} courses, {projects.length} projects, {totalSlides} slides
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Client-side search · Conversational AI tutor coming soon
        </p>
      </div>

      {/* Search Input — large, centered */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="What would you like to review?"
            className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 rounded-2xl px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none transition-colors pr-24"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSubmitted('') }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Ask
          </button>
        </div>

        {/* Suggested chips */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSearch(s)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {submitted && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-lg">
              <span className="text-purple-300">"{submitted}"</span>
            </h2>
            <button
              onClick={() => { setQuery(''); setSubmitted('') }}
              className="text-gray-600 hover:text-gray-400 text-xs underline"
            >
              Clear
            </button>
          </div>

          {results.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center">
              <div className="text-gray-500 mb-2 text-3xl">💭</div>
              <p className="text-gray-400">No results for "{submitted}"</p>
              <p className="text-gray-600 text-xs mt-1">Try a course code (5560), professor name, or method keyword</p>
            </div>
          ) : (
            <div className="space-y-8">
              {projectResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Projects ({projectResults.length})
                  </div>
                  <div className="space-y-3">
                    {projectResults.map(r => <ProjectAnswerCard key={r.item.id} item={r.item} />)}
                  </div>
                </div>
              )}

              {methodResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Methods ({methodResults.length})
                  </div>
                  <div className="space-y-3">
                    {methodResults.slice(0, 5).map(r => <MethodAnswerCard key={r.item.method_name} item={r.item} />)}
                  </div>
                </div>
              )}

              {courseResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Courses ({courseResults.length})
                  </div>
                  <div className="space-y-3">
                    {courseResults.map(r => <CourseAnswerCard key={r.item.course_code} item={r.item} />)}
                  </div>
                </div>
              )}

              {slideResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Slides ({slideResults.length})
                  </div>
                  <div className="space-y-3">
                    {slideResults.slice(0, 6).map((r, i) => <SlideAnswerCard key={i} item={r.item} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Common questions — always visible when no query */}
      {!submitted && (
        <div>
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg mb-1">Common Questions</h2>
            <p className="text-gray-500 text-sm">7 curated Q&A pairs — click to expand</p>
          </div>
          <div className="space-y-3">
            {templates.map((t, i) => (
              <CommonQuestionCard key={i} t={t} onSelect={handleSearch} />
            ))}
          </div>
        </div>
      )}

      {/* Show common questions below results */}
      {submitted && results.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-semibold">Common Questions</h2>
            <button
              onClick={() => { setQuery(''); setSubmitted('') }}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              Browse all
            </button>
          </div>
          <div className="space-y-3">
            {templates.slice(0, 3).map((t, i) => (
              <CommonQuestionCard key={i} t={t} onSelect={handleSearch} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
