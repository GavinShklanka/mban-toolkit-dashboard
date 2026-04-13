import { Link } from 'react-router-dom'
import seed from '../data/seed.json'
import courses from '../data/courses.json'
import slides from '../data/slides.json'
import lessonsData from '../data/lessons.json'

// Coverage summary computation
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

const counts = { outline: 0, pptx: 0, artifact: 0, provisional: 0, gap: 0 }
courses.forEach(c => { counts[getEvidenceType(c)]++ })

const learnCards = [
  {
    path: '/courses',
    icon: '📚',
    label: 'Course Refreshers',
    desc: 'Explore each course with lessons, key concepts, and the projects you built.',
    accent: 'border-purple-700 hover:border-purple-500 bg-purple-900/10',
    labelColor: 'text-purple-200',
  },
  {
    path: '/ask',
    icon: '💬',
    label: 'Ask a Question',
    desc: 'Search across 51 methods, 9 courses, and 476 extracted slides by keyword or topic.',
    accent: 'border-blue-700 hover:border-blue-500 bg-blue-900/10',
    labelColor: 'text-blue-200',
  },
  {
    path: '/projects',
    icon: '📁',
    label: 'Review a Project',
    desc: 'Revisit what you built — cruise line DB, equity research, ML assignments, and more.',
    accent: 'border-green-700 hover:border-green-500 bg-green-900/10',
    labelColor: 'text-green-200',
  },
]

const quickCards = [
  { path: '/methods', icon: '🔬', label: 'Method Library', desc: '51 methods across 6 analytics levels' },
  { path: '/ladder', icon: '📊', label: 'Analytics Ladder', desc: 'Descriptive → Agentic AI progression' },
  { path: '/router', icon: '🗺️', label: 'Solution Router', desc: '18 business problems → candidate methods' },
]

export default function Cockpit() {
  const totalSlides = slides.reduce((a, d) => a + d.slide_count, 0)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">

      {/* Welcome */}
      <div className="mb-10 mt-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          Your MBAN Toolkit
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed">
          {courses.length} courses · {seed.system_metadata.total_methods} methods · 6 projects · {lessonsData.length} guided lessons.{' '}
          <span className="text-gray-400">Pick up where you left off or start a refresher.</span>
        </p>
      </div>

      {/* Start Learning — 3 big cards */}
      <div className="mb-10">
        <h2 className="text-white font-semibold text-lg mb-4">Start Learning</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {learnCards.map(card => (
            <Link
              key={card.path}
              to={card.path}
              className={`border rounded-2xl p-5 transition-all group ${card.accent}`}
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <div className={`font-semibold text-base mb-2 group-hover:brightness-125 ${card.labelColor}`}>
                {card.label}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access — 3 smaller cards */}
      <div className="mb-10">
        <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickCards.map(card => (
            <Link
              key={card.path}
              to={card.path}
              className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 transition-all group hover:border-gray-500 hover:bg-gray-800"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-lg">{card.icon}</span>
                <span className="text-gray-200 text-sm font-medium group-hover:text-white">{card.label}</span>
              </div>
              <p className="text-gray-500 text-xs">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Coverage summary — compact, informative, not dominant */}
      <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Coverage</h3>
          <Link to="/admin/evidence" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Source quality →
          </Link>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          {courses.length} courses mapped ·{' '}
          <span className="text-green-400">{counts.outline} outline-backed</span>
          {counts.pptx > 0 && <> · <span className="text-purple-400">{counts.pptx} PPTX-backed ({totalSlides} slides)</span></>}
          {counts.artifact > 0 && <> · <span className="text-blue-400">{counts.artifact} artifact-backed</span></>}
          {counts.provisional > 0 && <> · <span className="text-yellow-400">{counts.provisional} provisional</span></>}
          {counts.gap > 0 && <> · <span className="text-red-400">{counts.gap} unresolved</span></>}
        </p>
        {/* Inline coverage bar */}
        <div className="mt-3 flex gap-0.5 h-1.5 rounded-full overflow-hidden">
          {counts.outline > 0 && (
            <div className="bg-green-500" style={{ width: `${(counts.outline / courses.length) * 100}%` }} />
          )}
          {counts.pptx > 0 && (
            <div className="bg-purple-500" style={{ width: `${(counts.pptx / courses.length) * 100}%` }} />
          )}
          {counts.artifact > 0 && (
            <div className="bg-blue-500" style={{ width: `${(counts.artifact / courses.length) * 100}%` }} />
          )}
          {counts.provisional > 0 && (
            <div className="bg-yellow-500" style={{ width: `${(counts.provisional / courses.length) * 100}%` }} />
          )}
          {counts.gap > 0 && (
            <div className="bg-red-500" style={{ width: `${(counts.gap / courses.length) * 100}%` }} />
          )}
        </div>
      </div>
    </div>
  )
}
