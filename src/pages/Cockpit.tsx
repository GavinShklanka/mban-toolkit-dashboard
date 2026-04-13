import { Link } from 'react-router-dom'
import courses from '../data/courses.json'
import slides from '../data/slides.json'

// Coverage bar data
const decksByCourse: Record<string, number> = slides.reduce((acc, d) => {
  acc[d.course] = (acc[d.course] || 0) + 1
  return acc
}, {} as Record<string, number>)

function getEvidenceType(course: typeof courses[0]) {
  if (course.source_status === 'unresolved') return 'gap'
  if ((course as any).provisional) return 'provisional'
  if (course.source_status === 'full_outline_confirmed') return 'outline'
  const code = course.course_code.replace('MBAN ', '')
  if (decksByCourse[code]) return 'pptx'
  return 'artifact'
}

const evDot: Record<string, string> = {
  outline:     'bg-green-400',
  pptx:        'bg-purple-400',
  artifact:    'bg-blue-400',
  provisional: 'bg-yellow-400',
  gap:         'bg-red-400',
}

export default function Cockpit() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">

      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Your MBAN Toolkit</h1>
        <p className="text-gray-400 text-lg">
          9 courses &middot; 51 methods &middot; 6 projects &mdash; Saint Mary's University MBAN
        </p>
      </div>

      {/* 3 large start-learning cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Link
          to="/courses"
          className="group bg-purple-900/30 border border-purple-700/60 hover:border-purple-500 rounded-2xl p-6 transition-all"
        >
          <div className="text-3xl mb-3">📚</div>
          <div className="text-white font-semibold text-lg mb-1 group-hover:text-purple-200">Course Refreshers</div>
          <p className="text-gray-400 text-sm">
            Revisit any course with guided lessons, key methods, and applied projects.
          </p>
        </Link>

        <Link
          to="/ask"
          className="group bg-blue-900/30 border border-blue-700/60 hover:border-blue-500 rounded-2xl p-6 transition-all"
        >
          <div className="text-3xl mb-3">💬</div>
          <div className="text-white font-semibold text-lg mb-1 group-hover:text-blue-200">Ask a Question</div>
          <p className="text-gray-400 text-sm">
            Search across 51 methods, 9 courses, and 476 extracted slides by keyword.
          </p>
        </Link>

        <Link
          to="/projects"
          className="group bg-green-900/30 border border-green-700/60 hover:border-green-500 rounded-2xl p-6 transition-all"
        >
          <div className="text-3xl mb-3">📁</div>
          <div className="text-white font-semibold text-lg mb-1 group-hover:text-green-200">Review a Project</div>
          <p className="text-gray-400 text-sm">
            6 substantive projects — SQL, ML, optimization, equity research, white paper.
          </p>
        </Link>
      </div>

      {/* Quick access row */}
      <div className="mb-10">
        <div className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">Quick Access</div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/methods"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-2.5 text-sm text-gray-200 transition-all"
          >
            <span>🔬</span>
            <span>Method Library</span>
            <span className="text-gray-500 text-xs ml-1">51 methods</span>
          </Link>
          <Link
            to="/ladder"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-2.5 text-sm text-gray-200 transition-all"
          >
            <span>📊</span>
            <span>Analytics Ladder</span>
            <span className="text-gray-500 text-xs ml-1">6 stages</span>
          </Link>
          <Link
            to="/router"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-2.5 text-sm text-gray-200 transition-all"
          >
            <span>🗺️</span>
            <span>Solution Router</span>
            <span className="text-gray-500 text-xs ml-1">18 problems</span>
          </Link>
          <Link
            to="/governance"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-2.5 text-sm text-gray-200 transition-all"
          >
            <span>🛡️</span>
            <span>Governance</span>
            <span className="text-gray-500 text-xs ml-1">14 overlays</span>
          </Link>
        </div>
      </div>

      {/* Coverage bar — compact, subordinate */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Coverage</span>
          <span className="text-gray-600 text-xs">9 courses mapped</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {courses.map(c => {
            const ev = getEvidenceType(c)
            const dot = evDot[ev]
            const code = c.course_code.replace('MBAN ', '')
            return (
              <div key={c.course_code} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700/60 rounded-lg px-2.5 py-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span className="text-gray-300 text-xs font-mono">{code}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Outline</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />PPTX</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />Artifact</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />Provisional</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Unresolved</span>
        </div>
      </div>
    </div>
  )
}
