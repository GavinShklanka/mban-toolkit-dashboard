import { useState } from 'react'
import router from '../data/router.json'

type Route = typeof router[0]

const layerColor: Record<string, string> = {
  predictive: 'bg-purple-900/30 text-purple-300 border-purple-700',
  diagnostic: 'bg-cyan-900/30 text-cyan-300 border-cyan-700',
  descriptive: 'bg-blue-900/30 text-blue-300 border-blue-700',
  prescriptive: 'bg-green-900/30 text-green-300 border-green-700',
  'ml_ai': 'bg-orange-900/30 text-orange-300 border-orange-700',
  'ML/AI': 'bg-orange-900/30 text-orange-300 border-orange-700',
  agentic: 'bg-red-900/30 text-red-300 border-red-700',
  meta: 'bg-gray-700 text-gray-300 border-gray-600',
  communication: 'bg-teal-900/30 text-teal-300 border-teal-700',
  governance: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  'diagnostic + predictive': 'bg-cyan-900/30 text-cyan-300 border-cyan-700',
}

function RouteDetail({ route, onClose }: { route: Route; onClose: () => void }) {
  const lc = layerColor[route.analytics_layer] || 'bg-gray-700 text-gray-300 border-gray-600'

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8">
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <span className={`inline-block border text-xs px-2 py-0.5 rounded mb-2 ${lc}`}>{route.analytics_layer}</span>
            <h2 className="text-white font-bold text-lg capitalize">{route.problem_type}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Candidate Methods</div>
            <div className="flex flex-wrap gap-1">
              {route.candidate_methods.map((m, i) => (
                <span key={i} className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded border border-gray-700">{m}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Likely Tools</div>
            <div className="flex flex-wrap gap-1">
              {route.likely_tools.map(t => (
                <span key={t} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-900">{t}</span>
              ))}
            </div>
          </div>
          {route.caution_flags && route.caution_flags.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Governance Cautions</div>
              <div className="space-y-1">
                {route.caution_flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-yellow-300">
                    <span className="shrink-0">⚠</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Course Anchors</div>
            <div className="flex flex-wrap gap-1">
              {route.course_anchors.map(c => (
                <span key={c} className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </div>
          {route.refresh_concepts && route.refresh_concepts.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Refresh Concepts</div>
              <div className="flex flex-wrap gap-1">
                {route.refresh_concepts.map((r, i) => (
                  <span key={i} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SolutionRouter() {
  const [selected, setSelected] = useState<Route | null>(null)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Solution Router</h1>
        <p className="text-gray-400 text-sm">{router.length} business problem routes · Select a card to see methods, tools, and governance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {router.map((route, i) => {
          const lc = layerColor[route.analytics_layer] || 'bg-gray-700 text-gray-300 border-gray-600'
          return (
            <button
              key={i}
              onClick={() => setSelected(route)}
              className="bg-gray-800 border border-gray-700 hover:border-purple-600 rounded-xl p-4 text-left transition-all"
            >
              <span className={`inline-block border text-xs px-2 py-0.5 rounded mb-2 ${lc}`}>{route.analytics_layer}</span>
              <div className="text-white font-medium text-sm mb-3 capitalize">{route.problem_type}</div>
              <div className="space-y-1">
                {route.candidate_methods.slice(0, 3).map((m, j) => (
                  <div key={j} className="text-gray-400 text-xs flex items-center gap-1">
                    <span className="text-purple-400">→</span> {m}
                  </div>
                ))}
                {route.candidate_methods.length > 3 && (
                  <div className="text-gray-600 text-xs">+{route.candidate_methods.length - 3} more...</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected && <RouteDetail route={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
