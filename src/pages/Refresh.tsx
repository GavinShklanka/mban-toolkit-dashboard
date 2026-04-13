import { useState } from 'react'
import templates from '../data/templates.json'
import seed from '../data/seed.json'

type Template = typeof templates[0]

const modeColor: Record<string, string> = {
  recalibration: 'bg-purple-900/40 text-purple-300 border-purple-700',
  selection: 'bg-blue-900/40 text-blue-300 border-blue-700',
  troubleshooting: 'bg-red-900/40 text-red-300 border-red-700',
  transfer: 'bg-green-900/40 text-green-300 border-green-700',
  recall: 'bg-cyan-900/40 text-cyan-300 border-cyan-700',
}

const refreshPrompts = [
  { topic: 'Overfitting & Validation', prompts: ['What is the bias-variance tradeoff?', 'How does k-fold CV differ from bootstrap?', 'What causes data leakage?', 'How do you detect overfitting?', 'What is OOB error in random forests?'] },
  { topic: 'Classification Methods', prompts: ['When should you use logistic regression vs. kNN?', 'What is the difference between precision and recall?', 'How does XGBoost differ from GBM?', 'What kernel functions are common in SVMs?', 'When does Naive Bayes fail?'] },
  { topic: 'Optimization & Decision Analysis', prompts: ['What are the 4 steps of LP formulation?', 'What does shadow price mean?', 'When is integer programming required?', 'What does EVPI measure?', 'How do you interpret sensitivity analysis results?'] },
  { topic: 'Agentic AI', prompts: ['What is a ReAct architecture?', 'What are super-steps in LangGraph?', 'Why do interrupt functions matter in agent systems?', 'What does LangSmith monitor?', 'What are the risks of multi-agent systems?'] },
  { topic: 'Governance & Ethics', prompts: ['When is HITL control required?', 'What is the difference between AI as assistant vs. decision-maker?', 'What governance concerns apply to LLMs?', 'How does motivated reasoning affect analytics?', 'What transparency is required for the white paper methodology?'] },
]

function QACard({ template }: { template: Template }) {
  const [open, setOpen] = useState(false)
  const mc = modeColor[template.detected_mode] || 'bg-gray-700 text-gray-300 border-gray-600'
  const resp = template.response as any

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-750 transition-all"
        onClick={() => setOpen(!open)}
      >
        <span className={`inline-block border text-xs px-2 py-0.5 rounded shrink-0 mt-0.5 ${mc}`}>
          {template.detected_mode}
        </span>
        <span className="text-gray-200 text-sm font-medium flex-1">{template.query}</span>
        <span className="text-gray-500 shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700 space-y-3">
          {resp.key_distinction && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Key Distinction</div>
              <p className="text-gray-200 text-sm">{resp.key_distinction}</p>
            </div>
          )}
          {resp.answer && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Answer</div>
              <p className="text-gray-200 text-sm">{resp.answer}</p>
            </div>
          )}
          {resp.managerial_explanation && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Managerial Framing</div>
              <p className="text-gray-300 text-sm italic">{resp.managerial_explanation}</p>
            </div>
          )}
          {resp.memory_anchor && (
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg px-3 py-2">
              <span className="text-purple-300 text-xs font-semibold">Memory Anchor: </span>
              <span className="text-purple-200 text-xs">{resp.memory_anchor}</span>
            </div>
          )}
          {resp.common_mistake && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg px-3 py-2">
              <span className="text-red-300 text-xs font-semibold">Common Mistake: </span>
              <span className="text-red-200 text-xs">{resp.common_mistake}</span>
            </div>
          )}
          {resp.where_learned && (
            <div className="text-xs text-gray-600">Source: {resp.where_learned}</div>
          )}
          {resp.course_origin && (
            <div className="text-xs text-gray-600">Source: {resp.course_origin}</div>
          )}
          {resp.governance_cautions && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Governance Cautions</div>
              <div className="space-y-1">
                {resp.governance_cautions.map((g: string, i: number) => (
                  <div key={i} className="text-xs text-yellow-300 flex items-start gap-1">
                    <span>⚠</span><span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Refresh() {
  const [activePromptTopic, setActivePromptTopic] = useState<number | null>(null)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Interactive Refresh Module</h1>
        <p className="text-gray-400 text-sm">Q&A pairs + self-test prompts organized by topic</p>
      </div>

      <h2 className="text-white font-semibold mb-4 text-lg">Q&A Pairs</h2>
      <div className="space-y-3 mb-10">
        {templates.map((t, i) => <QACard key={i} template={t} />)}
      </div>

      <h2 className="text-white font-semibold mb-4 text-lg">Self-Test Prompts</h2>
      <div className="space-y-3">
        {refreshPrompts.map((topic, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setActivePromptTopic(activePromptTopic === i ? null : i)}
            >
              <span className="text-white font-medium text-sm">{topic.topic}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{topic.prompts.length} prompts</span>
                <span className="text-gray-500">{activePromptTopic === i ? '▲' : '▼'}</span>
              </div>
            </button>
            {activePromptTopic === i && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-700 space-y-2">
                {topic.prompts.map((prompt, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-purple-400 shrink-0 mt-0.5">{j + 1}.</span>
                    <span>{prompt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
