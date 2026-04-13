import { useState } from 'react'

const stages = [
  {
    level: 1,
    name: 'Descriptive',
    color: 'blue',
    definition: 'Summarize what happened using historical data',
    question: 'What happened?',
    methods: ['SQL KPI queries', 'K-Means clustering', 'DBSCAN', 'Hierarchical clustering', 'Summary statistics', 'Dashboards'],
    tools: ['SQL', 'R', 'Python', 'Power BI'],
    governance: ['Data completeness', 'KPI definition accuracy', 'Representation bias in aggregation'],
    courses: ['MBAN 5550', 'MBAN 5560'],
    capability: 'Characterize and segment historical data to understand current state',
  },
  {
    level: 2,
    name: 'Diagnostic',
    color: 'cyan',
    definition: 'Identify root causes and understand why something happened',
    question: 'Why did it happen?',
    methods: ['Feature importance (RF/XGBoost)', 'Residual analysis', 'Correlation analysis', 'SQL KPI drilling', 'Standardized coefficients'],
    tools: ['R', 'Python', 'SQL'],
    governance: ['Correlation ≠ causation', 'Post-hoc rationalization risk', 'Confounding variables'],
    courses: ['MBAN 5520', 'MBAN 5560', 'MBAN 5550'],
    capability: 'Decompose drivers of performance and identify root causes',
  },
  {
    level: 3,
    name: 'Predictive',
    color: 'purple',
    definition: 'Forecast future outcomes using statistical models',
    question: 'What will happen?',
    methods: ['Linear/Logistic Regression', 'kNN', 'Naive Bayes', 'CART', 'Random Forest', 'GBM', 'XGBoost', 'SVM', 'Cross-validation'],
    tools: ['R', 'Python scikit-learn', 'caret'],
    governance: ['Overfitting', 'Data leakage', 'Class imbalance', 'Extrapolation risk'],
    courses: ['MBAN 5520', 'MBAN 5560', 'MBAN 5570'],
    capability: 'Anticipate future values, classify outcomes, and quantify uncertainty',
  },
  {
    level: 4,
    name: 'Prescriptive',
    color: 'green',
    definition: 'Determine the optimal course of action given constraints',
    question: 'What should we do?',
    methods: ['Linear Programming', 'Integer Programming', 'Duality', 'Decision Analysis (EMV/EVPI)', 'Monte Carlo Simulation', 'Multi-objective optimization'],
    tools: ['Excel Solver', 'Gurobi', '@RISK', 'Precision Tree'],
    governance: ['Constraint validity', 'Shadow price limits', 'Probability estimation accuracy', 'Linearity assumption'],
    courses: ['MBAN 5540', 'MBAN 5570'],
    capability: 'Optimize resource allocation and make evidence-based decisions under uncertainty',
  },
  {
    level: 5,
    name: 'ML / AI',
    color: 'orange',
    definition: 'Learn complex patterns and representations from large data',
    question: 'What patterns can machines find that humans cannot?',
    methods: ['Neural Networks', 'CNN', 'RNN / LSTM', 'NLP with Word2Vec', 'Transformers / Attention', 'Hugging Face Fine-Tuning', 'Gradient Descent variants'],
    tools: ['Keras', 'PyTorch', 'TensorFlow', 'Hugging Face', 'scikit-learn'],
    governance: ['Black-box interpretability', 'Training data bias', 'Hallucination', 'Adversarial vulnerability', 'Computational cost'],
    courses: ['MBAN 5560', 'MBAN 5570'],
    capability: 'Extract meaning from images, text, and sequences at scale',
  },
  {
    level: 6,
    name: 'Agentic AI',
    color: 'red',
    definition: 'Autonomous, goal-directed AI systems that plan, use tools, and coordinate with humans',
    question: 'What can an AI agent do autonomously on my behalf?',
    methods: ['LangChain Agent Workflow', 'LangGraph Stateful Orchestration', 'HITL Control', 'ReAct Architecture', 'Multi-agent coordination', 'RAG patterns'],
    tools: ['LangChain', 'LangGraph', 'LangSmith', 'Python'],
    governance: ['Agent loop risk', 'Prompt injection', 'Hallucination in reasoning', 'Interrupt timing', 'Observability gaps', 'Uncontrolled execution'],
    courses: ['MBAN 5510'],
    capability: 'Design governed autonomous systems for business analysis automation',
  },
]

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue: { bg: 'bg-blue-900/20', border: 'border-blue-700/50', text: 'text-blue-300', badge: 'bg-blue-900 text-blue-300' },
  cyan: { bg: 'bg-cyan-900/20', border: 'border-cyan-700/50', text: 'text-cyan-300', badge: 'bg-cyan-900 text-cyan-300' },
  purple: { bg: 'bg-purple-900/20', border: 'border-purple-700/50', text: 'text-purple-300', badge: 'bg-purple-900 text-purple-300' },
  green: { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-300', badge: 'bg-green-900 text-green-300' },
  orange: { bg: 'bg-orange-900/20', border: 'border-orange-700/50', text: 'text-orange-300', badge: 'bg-orange-900 text-orange-300' },
  red: { bg: 'bg-red-900/20', border: 'border-red-700/50', text: 'text-red-300', badge: 'bg-red-900 text-red-300' },
}

export default function Ladder() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Analytics Ladder</h1>
        <p className="text-gray-400 text-sm">6-stage progression from Descriptive to Agentic AI · Click a stage to expand</p>
      </div>

      <div className="space-y-3">
        {stages.map(stage => {
          const c = colorMap[stage.color]
          const isOpen = active === stage.level

          return (
            <div key={stage.level} className={`rounded-xl border ${c.border} overflow-hidden`}>
              <button
                className={`w-full flex items-center gap-4 p-4 text-left ${c.bg} hover:brightness-110 transition-all`}
                onClick={() => setActive(isOpen ? null : stage.level)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${c.badge} shrink-0`}>
                  {stage.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${c.text}`}>{stage.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5 truncate">{stage.definition}</div>
                </div>
                <div className={`text-xs ${c.text} hidden sm:block shrink-0 italic`}>"{stage.question}"</div>
                <span className="text-gray-500 shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="p-4 bg-gray-900 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Decision Question</div>
                    <div className={`text-sm italic ${c.text} mb-4`}>"{stage.question}"</div>

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What This Lets Me Do</div>
                    <p className="text-gray-300 text-sm mb-4">{stage.capability}</p>

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Courses</div>
                    <div className="flex flex-wrap gap-1">
                      {stage.courses.map(c => (
                        <span key={c} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded border border-gray-700">{c}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Methods</div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {stage.methods.map(m => (
                        <span key={m} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded">{m}</span>
                      ))}
                    </div>

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tools</div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {stage.tools.map(t => (
                        <span key={t} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-800">{t}</span>
                      ))}
                    </div>

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Governance Concerns</div>
                    <div className="flex flex-wrap gap-1">
                      {stage.governance.map(g => (
                        <span key={g} className="bg-red-900/20 text-red-300 text-xs px-2 py-0.5 rounded border border-red-900">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
