import { Link } from 'react-router-dom'
import seed from '../data/seed.json'
import courses from '../data/courses.json'
import slides from '../data/slides.json'

// ─── Evidence classification ────────────────────────────────────────────────
const decksByCourse: Record<string, number> = slides.reduce((acc, d) => {
  acc[d.course] = (acc[d.course] || 0) + 1
  return acc
}, {} as Record<string, number>)

type EvidenceType = 'outline' | 'pptx' | 'artifact' | 'provisional' | 'gap'

function getEvidenceType(course: typeof courses[0]): EvidenceType {
  if (course.source_status === 'unresolved') return 'gap'
  if ((course as any).provisional) return 'provisional'
  if (course.source_status === 'full_outline_confirmed') return 'outline'
  const code = course.course_code.replace('MBAN ', '')
  if (decksByCourse[code]) return 'pptx'
  return 'artifact'
}

const EVtype: Record<EvidenceType, { dot: string; pill: string; label: string; short: string }> = {
  outline:     { dot: 'bg-green-400',  pill: 'bg-green-900/40 text-green-300 border-green-700',   label: 'Outline',     short: 'Outline' },
  pptx:        { dot: 'bg-purple-400', pill: 'bg-purple-900/40 text-purple-300 border-purple-700', label: 'PPTX',        short: 'PPTX' },
  artifact:    { dot: 'bg-blue-400',   pill: 'bg-blue-900/40 text-blue-300 border-blue-700',       label: 'Artifact',    short: 'Artifact' },
  provisional: { dot: 'bg-yellow-400', pill: 'bg-yellow-900/40 text-yellow-300 border-yellow-700', label: 'Provisional', short: 'Provisional' },
  gap:         { dot: 'bg-red-400',    pill: 'bg-red-900/40 text-red-300 border-red-700',           label: 'Unresolved',  short: 'Gap' },
}

// Group courses by term
const fall2025  = courses.filter(c => c.semester === 'Fall 2025')
const winter2026 = courses.filter(c => c.semester === 'Winter 2026')
const unknown   = courses.filter(c => c.semester !== 'Fall 2025' && c.semester !== 'Winter 2026')

// Maturity summary counts
const counts = { outline: 0, pptx: 0, artifact: 0, provisional: 0, gap: 0 }
courses.forEach(c => { counts[getEvidenceType(c)]++ })

function CoursePill({ course }: { course: typeof courses[0] }) {
  const ev = getEvidenceType(course)
  const style = EVtype[ev]
  const code = course.course_code.replace('MBAN ', '')
  const deckCount = decksByCourse[code]
  return (
    <div className={`inline-flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 ${style.pill}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      <span className="font-mono font-bold text-xs">{course.course_code}</span>
      {deckCount && <span className="text-xs opacity-70">{deckCount}d</span>}
    </div>
  )
}

function TermRow({ label, term, courses: termCourses }: { label: string; term: string; courses: typeof courses }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-gray-600 text-xs">{term}</span>
        <span className="text-gray-600 text-xs">· {termCourses.length} courses</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {termCourses.map(c => <CoursePill key={c.course_code} course={c} />)}
      </div>
    </div>
  )
}

const metrics = [
  { label: 'Courses Mapped', value: seed.system_metadata.total_courses, color: 'text-blue-400' },
  { label: 'Methods', value: seed.system_metadata.total_methods, color: 'text-purple-400' },
  { label: 'Tools', value: seed.system_metadata.total_tools, color: 'text-green-400' },
  { label: 'Business Problems', value: seed.system_metadata.total_business_problems, color: 'text-yellow-400' },
  { label: 'Governance Overlays', value: seed.system_metadata.total_governance_overlays, color: 'text-orange-400' },
]

const actionCards = [
  {
    path: '/ask',
    icon: '💬',
    label: 'Refresh a concept',
    desc: 'Search 51 methods, 9 courses, and 476 extracted slides by keyword, professor, or topic.',
    highlight: true,
  },
  {
    path: '/methods',
    icon: '🔬',
    label: 'Find where a method was taught',
    desc: 'Browse the full method registry — filter by analytics level, family, or course.',
  },
  {
    path: '/projects',
    icon: '📁',
    label: 'Browse projects & assignments',
    desc: '6 substantive projects across 5 courses — SQL, ML, optimization, equity research, white paper.',
  },
  {
    path: '/courses',
    icon: '📚',
    label: 'Browse by course',
    desc: '9 MBAN courses with evidence strips, methods, tools, and deliverables.',
  },
  {
    path: '/router',
    icon: '🗺️',
    label: 'Map a business problem to methods',
    desc: '18 business problems pre-routed to candidate methods, tools, and governance cautions.',
  },
]

const moreCards = [
  { path: '/ladder', icon: '📊', label: 'Analytics Ladder', desc: '6-stage progression: Descriptive → Agentic AI' },
  { path: '/refresh', icon: '💡', label: 'Interactive Refresh', desc: '7 featured Q&A pairs + self-test prompts by topic' },
  { path: '/governance', icon: '🛡️', label: 'Governance & Risk', desc: 'Methods × risk dimensions color-coded grid' },
  { path: '/evidence', icon: '📋', label: 'Evidence Audit', desc: 'Tier distribution, correction log, gap register' },
]

export default function Cockpit() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header + Orientation */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Knowledge Cockpit</h1>
        <p className="text-gray-400 text-sm mb-3">MBAN Toolkit Dashboard · Saint Mary's University · v2.0</p>
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
          <p className="text-gray-200 text-sm font-medium">
            MBAN knowledge library and learning toolkit —{' '}
            <span className="text-blue-400">9 courses</span>,{' '}
            <span className="text-purple-400">51 methods</span>,{' '}
            <span className="text-green-400">476 slides</span>,{' '}
            <span className="text-yellow-400">6 projects</span>, source-backed retrieval
          </p>
          <p className="text-gray-500 text-xs mt-1">
            All content sourced from actual MBAN coursework, PPTX decks, SQL files, notebooks, and R scripts.
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="mb-6 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 flex items-start gap-3">
        <span className="text-yellow-400 text-lg mt-0.5">⚠️</span>
        <div>
          <div className="text-yellow-300 font-medium text-sm">MBAN 5540 — Provisional Status</div>
          <div className="text-yellow-200/70 text-xs mt-1">
            No course outline uploaded. Evidence from exam prep + assignment briefs only. Topics marked "User-Confirmed Reconstruction." Instructor: Majid Taghavi.
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-gray-400 text-xs mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* ── Coverage Rail ──────────────────────────────────────── */}
      <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-700/60">
          <h2 className="text-white font-semibold text-sm">Coverage Rail</h2>
          <div className="flex items-center gap-3 text-xs">
            {(Object.entries(EVtype) as [EvidenceType, typeof EVtype[EvidenceType]][]).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className="text-gray-400">{v.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <TermRow label="Term 1" term="Fall 2025" courses={fall2025} />
          <TermRow label="Term 2" term="Winter 2026" courses={[...winter2026, ...unknown]} />
        </div>

        {/* Maturity summary */}
        <div className="px-5 py-3 bg-gray-900/40 border-t border-gray-700/60">
          <p className="text-gray-400 text-xs leading-relaxed">
            <span className="text-green-400 font-semibold">{counts.outline} of {courses.length}</span> courses have full outlines.{' '}
            {counts.pptx > 0 && <><span className="text-purple-400 font-semibold">{counts.pptx}</span> are PPTX-primary. </>}
            {counts.artifact > 0 && <><span className="text-blue-400 font-semibold">{counts.artifact}</span> are artifact-backed. </>}
            {counts.provisional > 0 && <><span className="text-yellow-400 font-semibold">{counts.provisional}</span> {counts.provisional === 1 ? 'is' : 'are'} provisional. </>}
            {counts.gap > 0 && <><span className="text-red-400 font-semibold">{counts.gap}</span> {counts.gap === 1 ? 'is' : 'are'} unresolved.</>}
          </p>
        </div>
      </div>

      {/* Evidence Health */}
      <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h2 className="text-white font-semibold mb-4">Evidence Health</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{seed.system_metadata.outline_confirmed_courses}</div>
            <div className="text-xs text-gray-400 mt-1">Outline Confirmed</div>
            <div className="text-xs text-green-400 mt-1">5510 · 5560 · 5570</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{seed.system_metadata.artifact_only_courses}</div>
            <div className="text-xs text-gray-400 mt-1">Artifact Only</div>
            <div className="text-xs text-yellow-400 mt-1">5502 · 5520 · 5540 · 5550 · 5800</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{seed.system_metadata.unresolved_courses}</div>
            <div className="text-xs text-gray-400 mt-1">Unresolved</div>
            <div className="text-xs text-red-400 mt-1">5891</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>Correction log: <span className="text-green-400 font-medium">24 upgrades</span> (incl. Hai Wang / MBAN 5550)</span>
          <span>
            <span className="text-blue-400 font-medium">{(seed.system_metadata as any).slide_decks_extracted} decks</span>
            {' · '}
            <span className="text-blue-300 font-medium">{(seed.system_metadata as any).total_slides_extracted} slides</span>
            {' extracted · '}
            v{seed.system_metadata.version}
          </span>
        </div>
      </div>

      {/* Confusion Pairs */}
      <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h2 className="text-white font-semibold mb-4">Common Confusion Pairs</h2>
        <div className="space-y-3">
          {seed.confusion_pairs.map((cp, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex gap-1 shrink-0">
                <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-700">{cp.pair[0]}</span>
                <span className="text-gray-600 text-xs py-0.5">vs</span>
                <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-700">{cp.pair[1]}</span>
              </div>
              <p className="text-gray-400 text-xs">{cp.key_distinction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What can I do? — Action Cards */}
      <div className="mb-8">
        <h2 className="text-white font-semibold mb-1">What can I do?</h2>
        <p className="text-gray-500 text-xs mb-4">Primary entry points</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionCards.map(card => (
            <Link
              key={card.path}
              to={card.path}
              className={`border rounded-xl p-4 transition-all group ${
                card.highlight
                  ? 'bg-purple-900/20 border-purple-700 hover:border-purple-500'
                  : 'bg-gray-800 border-gray-700 hover:border-purple-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{card.icon}</span>
                <span className={`font-medium text-sm group-hover:text-purple-300 ${card.highlight ? 'text-purple-200' : 'text-white'}`}>
                  {card.label}
                </span>
              </div>
              <p className="text-gray-400 text-xs">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* More tools */}
      <div>
        <h2 className="text-gray-400 text-sm font-semibold mb-3">More tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {moreCards.map(card => (
            <Link
              key={card.path}
              to={card.path}
              className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 transition-all group hover:border-gray-600"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{card.icon}</span>
                <span className="text-gray-300 text-xs font-medium group-hover:text-white">{card.label}</span>
              </div>
              <p className="text-gray-500 text-xs">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
