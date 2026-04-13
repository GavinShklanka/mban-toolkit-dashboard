import governance from '../data/governance.json'

const _riskLevelBg: Record<string, string> = {
  'LOW': 'bg-green-900/40 text-green-300',
  'MEDIUM': 'bg-yellow-900/40 text-yellow-300',
  'HIGH': 'bg-orange-900/40 text-orange-300',
  'VERY HIGH': 'bg-red-900/50 text-red-300',
  'VERY LOW': 'bg-green-900/60 text-green-200',
  'MEDIUM (assumption violations)': 'bg-yellow-900/40 text-yellow-300',
  'MEDIUM (class imbalance)': 'bg-yellow-900/40 text-yellow-300',
  'HIGH (overfitting, architecture choice)': 'bg-orange-900/40 text-orange-300',
  'HIGH (training data bias)': 'bg-orange-900/40 text-orange-300',
  'HIGH (data passed through LLM APIs)': 'bg-orange-900/40 text-orange-300',
  'MEDIUM (k sensitivity)': 'bg-yellow-900/40 text-yellow-300',
  'MEDIUM (distribution assumptions)': 'bg-yellow-900/40 text-yellow-300',
  'MEDIUM (probability estimation)': 'bg-yellow-900/40 text-yellow-300',
  'MEDIUM (stale financial data)': 'bg-yellow-900/40 text-yellow-300',
  'MEDIUM (methodology selection)': 'bg-yellow-900/40 text-yellow-300',
  'HIGH (loop risk, hallucination, prompt injection)': 'bg-orange-900/40 text-orange-300',
  'MEDIUM (investment consequences)': 'bg-yellow-900/40 text-yellow-300',
  'HIGH (bias amplification)': 'bg-orange-900/40 text-orange-300',
  'HIGH (training corpus bias)': 'bg-orange-900/40 text-orange-300',
  'HIGH (encoded societal biases)': 'bg-orange-900/40 text-orange-300',
  'HIGH (memorization of training data)': 'bg-orange-900/40 text-orange-300',
  'HIGH (computational cost, versioning)': 'bg-orange-900/40 text-orange-300',
  'MEDIUM (coefficient accuracy)': 'bg-yellow-900/40 text-yellow-300',
  'HIGH (input probabilities)': 'bg-orange-900/40 text-orange-300',
  'HIGH (garbage-in-garbage-out)': 'bg-orange-900/40 text-orange-300',
  'MEDIUM (open data completeness)': 'bg-yellow-900/40 text-yellow-300',
  'MEDIUM (stakeholder representation)': 'bg-yellow-900/40 text-yellow-300',
  'MEDIUM (health data sensitivity)': 'bg-yellow-900/40 text-yellow-300',
}

function cellClass(val: string): string {
  const v = val?.toUpperCase() || ''
  if (v.startsWith('VERY HIGH')) return 'bg-red-900/50 text-red-300 text-xs text-center'
  if (v.startsWith('HIGH')) return 'bg-orange-900/40 text-orange-300 text-xs text-center'
  if (v.startsWith('MEDIUM')) return 'bg-yellow-900/40 text-yellow-300 text-xs text-center'
  if (v.startsWith('VERY LOW')) return 'bg-green-900/60 text-green-200 text-xs text-center'
  if (v.startsWith('LOW')) return 'bg-green-900/40 text-green-300 text-xs text-center'
  return 'text-gray-500 text-xs text-center'
}

function shortVal(val: string): string {
  if (!val) return '—'
  const v = val.toUpperCase()
  if (v.startsWith('VERY HIGH')) return 'VERY HIGH'
  if (v.startsWith('VERY LOW')) return 'VERY LOW'
  if (v.startsWith('HIGH')) return 'HIGH'
  if (v.startsWith('MEDIUM')) return 'MED'
  if (v.startsWith('LOW')) return 'LOW'
  return val.split(' ')[0]
}

const dimensions = [
  { key: 'interpretability', label: 'Interpret' },
  { key: 'validation_risk', label: 'Validation' },
  { key: 'fairness', label: 'Fairness' },
  { key: 'privacy_security', label: 'Privacy' },
  { key: 'traceability', label: 'Trace' },
  { key: 'hitl_need', label: 'HITL Need' },
  { key: 'deployment_risk', label: 'Deploy' },
  { key: 'misuse_risk', label: 'Misuse' },
]

const specialSections = [
  {
    title: 'HITL Control Requirements',
    color: 'border-orange-700',
    items: governance.filter(g => {
      const v = (g as any).hitl_need?.toUpperCase() || ''
      return v.startsWith('HIGH') || v.startsWith('VERY HIGH')
    }),
    description: 'Methods requiring human-in-the-loop oversight due to high deployment stakes',
  },
  {
    title: 'Agent Observability',
    color: 'border-red-700',
    items: governance.filter(g => g.method_or_workflow.toLowerCase().includes('lang') || g.method_or_workflow.toLowerCase().includes('agent')),
    description: 'Agentic systems requiring LangSmith monitoring and checkpoint management',
  },
  {
    title: 'High Misuse Risk',
    color: 'border-yellow-700',
    items: governance.filter(g => {
      const v = (g as any).misuse_risk?.toUpperCase() || ''
      return v.startsWith('HIGH') || v.startsWith('VERY HIGH')
    }),
    description: 'Methods with elevated potential for misuse, misinformation, or harmful deployment',
  },
]

export default function Governance() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Governance & Risk Layer</h1>
        <p className="text-gray-400 text-sm">Methods × risk dimensions · {governance.length} methods assessed</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-900 border border-green-700 inline-block"></span><span className="text-gray-400">LOW</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-900 border border-yellow-700 inline-block"></span><span className="text-gray-400">MEDIUM</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-900 border border-orange-700 inline-block"></span><span className="text-gray-400">HIGH</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-900 border border-red-700 inline-block"></span><span className="text-gray-400">VERY HIGH</span></div>
      </div>

      {/* Main Grid */}
      <div className="mb-10 overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-gray-800">
              <th className="text-left text-gray-400 font-medium p-2 border border-gray-700 min-w-[180px]">Method / Workflow</th>
              {dimensions.map(d => (
                <th key={d.key} className="text-center text-gray-400 font-medium p-2 border border-gray-700 min-w-[70px]">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {governance.map((g, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                <td className="p-2 border border-gray-800 text-gray-300">{g.method_or_workflow}</td>
                {dimensions.map(d => {
                  const val = (g as any)[d.key] || ''
                  return (
                    <td key={d.key} className={`p-2 border border-gray-800 ${cellClass(val)}`}>
                      {shortVal(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special Sections */}
      <div className="space-y-6">
        {specialSections.map(section => (
          <div key={section.title} className={`bg-gray-800 border rounded-xl overflow-hidden ${section.color}`}>
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-white font-semibold">{section.title}</h2>
              <p className="text-gray-400 text-xs mt-1">{section.description}</p>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {section.items.map((item, i) => (
                  <span key={i} className="bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-600">
                    {item.method_or_workflow}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* White Paper Transparency Note */}
      <div className="mt-6 bg-teal-900/20 border border-teal-700/50 rounded-xl p-4">
        <h3 className="text-teal-300 font-semibold mb-2">White Paper Transparency Requirement (MBAN 5510)</h3>
        <p className="text-teal-200/70 text-sm">
          NS Health Data Project requires: transparent code for replication, peer data evaluation, peer code evaluation,
          non-technical methodology descriptions accessible to Nova Scotian stakeholders.
          Relational analysis cannot claim causation without experimental design.
        </p>
      </div>

      {/* AI Evaluation Note */}
      <div className="mt-4 bg-orange-900/20 border border-orange-700/50 rounded-xl p-4">
        <h3 className="text-orange-300 font-semibold mb-2">AI Evaluation Framework (MBAN 5570)</h3>
        <p className="text-orange-200/70 text-sm">
          Equity research requires explicit audit of AI outputs: what AI got right, what it got wrong,
          what was accepted/discarded. AI is positioned as analytical assistant, not decision-maker.
          Speed vs. judgment tradeoff must be documented.
        </p>
      </div>
    </div>
  )
}
