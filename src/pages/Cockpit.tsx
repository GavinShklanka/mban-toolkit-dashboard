import { Link } from 'react-router-dom'
import seed from '../data/seed.json'

const metrics = [
  { label: 'Courses Mapped', value: seed.system_metadata.total_courses, color: 'text-blue-400' },
  { label: 'Methods', value: seed.system_metadata.total_methods, color: 'text-purple-400' },
  { label: 'Tools', value: seed.system_metadata.total_tools, color: 'text-green-400' },
  { label: 'Business Problems', value: seed.system_metadata.total_business_problems, color: 'text-yellow-400' },
  { label: 'Governance Overlays', value: seed.system_metadata.total_governance_overlays, color: 'text-orange-400' },
]

const navCards = [
  { path: '/ask', icon: '💬', label: 'Ask MBAN', desc: 'Search methods, courses, and 476 extracted slides. 7 featured Q&A responses.', highlight: true },
  { path: '/ladder', icon: '📊', label: 'Analytics Ladder', desc: '6-stage progression from Descriptive → Agentic AI' },
  { path: '/courses', icon: '📚', label: 'Course Intelligence', desc: '9 courses with evidence, methods, and deliverables' },
  { path: '/methods', icon: '🔬', label: 'Method Registry', desc: '51 searchable/filterable analytics methods' },
  { path: '/router', icon: '🗺️', label: 'Solution Router', desc: 'Map business problems to methods and tools' },
  { path: '/refresh', icon: '💡', label: 'Interactive Refresh', desc: 'Q&A pairs and self-test prompts by topic' },
  { path: '/governance', icon: '🛡️', label: 'Governance & Risk', desc: 'Methods × risk dimensions color-coded grid' },
  { path: '/evidence', icon: '📋', label: 'Evidence Audit', desc: 'Tier distribution, correction log, gap register' },
]

export default function Cockpit() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Knowledge Cockpit</h1>
        <p className="text-gray-400 text-sm">MBAN Toolkit Dashboard · Saint Mary's University · v2.0</p>
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

      {/* Quick Jump Nav Cards */}
      <div>
        <h2 className="text-white font-semibold mb-4">Quick Jump</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {navCards.map(card => (
            <Link
              key={card.path}
              to={card.path}
              className={`border rounded-xl p-4 transition-all group ${
                (card as any).highlight
                  ? 'bg-purple-900/20 border-purple-700 hover:border-purple-500 col-span-1 sm:col-span-2 lg:col-span-1'
                  : 'bg-gray-800 border-gray-700 hover:border-purple-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{card.icon}</span>
                <span className={`font-medium text-sm group-hover:text-purple-300 ${(card as any).highlight ? 'text-purple-200' : 'text-white'}`}>{card.label}</span>
                {(card as any).highlight && <span className="ml-auto text-xs bg-purple-700/50 text-purple-300 px-1.5 py-0.5 rounded">New</span>}
              </div>
              <p className="text-gray-400 text-xs">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
