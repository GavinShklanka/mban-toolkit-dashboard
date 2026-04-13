import { useState } from 'react'
import { Link } from 'react-router-dom'
import projects from '../data/projects.json'

type Project = typeof projects[0]

// ─── Evidence badge config ────────────────────────────────────────────────────
type EvidenceType = 'outline' | 'pptx' | 'artifact' | 'provisional' | 'gap'

const EVconfig: Record<EvidenceType, { dot: string; bg: string; text: string; border: string; label: string }> = {
  outline:     { dot: 'bg-green-400',  bg: 'bg-green-900/30',  text: 'text-green-300',  border: 'border-green-700',  label: 'Full Outline' },
  pptx:        { dot: 'bg-purple-400', bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-700', label: 'PPTX Slides' },
  artifact:    { dot: 'bg-blue-400',   bg: 'bg-blue-900/30',   text: 'text-blue-300',   border: 'border-blue-700',   label: 'Artifacts' },
  provisional: { dot: 'bg-yellow-400', bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700', label: 'Provisional' },
  gap:         { dot: 'bg-red-400',    bg: 'bg-red-900/30',    text: 'text-red-300',    border: 'border-red-700',    label: 'Unresolved' },
}

function EvidenceBadge({ type }: { type: string }) {
  const cfg = EVconfig[(type as EvidenceType)] ?? EVconfig.gap
  return (
    <span className={`inline-flex items-center gap-1 border text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── Project Detail Modal ─────────────────────────────────────────────────────

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const cfg = EVconfig[(project.evidence_type as EvidenceType)] ?? EVconfig.gap

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-purple-400 font-mono text-sm font-bold">{project.course}</span>
              <EvidenceBadge type={project.evidence_type} />
              <span className="text-gray-600 text-xs">{project.term}</span>
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">{project.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {project.professor !== 'unknown' ? project.professor : 'Instructor unknown'} · {project.course}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4 shrink-0">✕</button>
        </div>

        {/* Evidence strip */}
        <div className={`px-5 py-2.5 border-b border-gray-800 ${cfg.bg} flex flex-wrap items-center gap-2`}>
          <span className={`text-xs font-semibold ${cfg.text}`}>Evidence:</span>
          <span className={`text-xs ${cfg.text} opacity-80`}>{cfg.label} · {project.source_artifacts.length} source artifact{project.source_artifacts.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="p-5 space-y-5">

          {/* Business Problem */}
          <div className="bg-gray-800/80 border border-purple-800/40 rounded-xl p-4">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>💼</span> Business Problem
            </div>
            <p className="text-gray-100 text-sm font-medium">{project.business_problem}</p>
          </div>

          {/* What it taught */}
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">What It Taught</div>
            <p className="text-gray-300 text-sm">{project.what_it_taught}</p>
          </div>

          {/* Methods + Tools grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Methods</div>
              <div className="flex flex-wrap gap-1">
                {project.methods.map(m => (
                  <span key={m} className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-900/60">{m}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Tools</div>
              <div className="flex flex-wrap gap-1">
                {project.tools.map(t => (
                  <span key={t} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-900/60">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Source Artifacts */}
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Source Artifacts</div>
            <ul className="space-y-1">
              {project.source_artifacts.map((a, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-blue-400 shrink-0 mt-0.5">›</span>
                  <span className="font-mono">{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Methods */}
          {project.related_methods.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Related Methods</div>
              <div className="flex flex-wrap gap-1">
                {project.related_methods.map(m => (
                  <Link
                    key={m}
                    to="/methods"
                    onClick={onClose}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2 py-0.5 rounded transition-colors"
                  >
                    {m} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer links */}
          <div className="pt-3 border-t border-gray-800 flex flex-wrap gap-3">
            <Link
              to="/courses"
              onClick={onClose}
              className="text-xs text-purple-400 hover:text-purple-300 underline"
            >
              View {project.course} course page →
            </Link>
            {project.related_methods.length > 0 && (
              <Link
                to="/methods"
                onClick={onClose}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Browse method registry →
              </Link>
            )}
            <Link
              to="/ask"
              onClick={onClose}
              className="text-xs text-green-400 hover:text-green-300 underline"
            >
              Review next: {project.review_next} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cfg = EVconfig[(project.evidence_type as EvidenceType)] ?? EVconfig.gap
  const borderColor: Record<string, string> = {
    outline:     'border-green-700/60',
    pptx:        'border-purple-700/60',
    artifact:    'border-blue-700/60',
    provisional: 'border-yellow-700/60',
    gap:         'border-red-700/60',
  }

  return (
    <button
      onClick={onClick}
      className={`bg-gray-800 border ${borderColor[project.evidence_type] ?? 'border-gray-700'} rounded-xl p-4 text-left hover:brightness-110 transition-all w-full`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-purple-400 text-xs font-bold">{project.course}</span>
        <EvidenceBadge type={project.evidence_type} />
      </div>

      {/* Name */}
      <div className="text-white text-sm font-semibold mb-1 leading-snug">{project.name}</div>

      {/* Professor + term */}
      <div className="text-gray-500 text-xs mb-3">
        {project.professor !== 'unknown' ? project.professor : 'Instructor TBD'} · {project.term}
      </div>

      {/* Business problem */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-gray-600 text-xs">💼</span>
          <span className="text-gray-500 text-xs font-medium">Business Problem</span>
        </div>
        <p className="text-gray-300 text-xs line-clamp-2">{project.business_problem}</p>
      </div>

      {/* Method pills */}
      <div className="flex flex-wrap gap-1">
        {project.methods.slice(0, 3).map(m => (
          <span key={m} className="bg-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded">{m}</span>
        ))}
        {project.methods.length > 3 && (
          <span className="text-gray-600 text-xs px-1 py-0.5">+{project.methods.length - 3} more</span>
        )}
      </div>

      {/* Tools */}
      <div className={`mt-2 pt-2 border-t ${borderColor[project.evidence_type] ?? 'border-gray-700'} border-opacity-50 flex flex-wrap gap-1`}>
        {project.tools.slice(0, 4).map(t => (
          <span key={t} className={`text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>{t}</span>
        ))}
        {project.tools.length > 4 && (
          <span className="text-gray-600 text-xs">+{project.tools.length - 4}</span>
        )}
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Projects() {
  const [selected, setSelected] = useState<Project | null>(null)

  const termGroups: Record<string, Project[]> = {}
  for (const p of projects) {
    if (!termGroups[p.term]) termGroups[p.term] = []
    termGroups[p.term].push(p)
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Projects &amp; Assignments</h1>
        <p className="text-gray-400 text-sm">
          {projects.length} major projects across {new Set(projects.map(p => p.course)).size} courses · Click any card for full detail
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /><span className="text-gray-400">Outline-confirmed</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /><span className="text-gray-400">Artifact-backed</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /><span className="text-gray-400">Provisional</span></div>
      </div>

      {/* Term groupings */}
      {Object.entries(termGroups).map(([term, termProjects]) => (
        <div key={term} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-gray-300 text-sm font-semibold">{term}</h2>
            <span className="text-gray-600 text-xs">{termProjects.length} project{termProjects.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {termProjects.map(p => (
              <ProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        </div>
      ))}

      {/* Footer nav */}
      <div className="mt-4 pt-6 border-t border-gray-800 flex flex-wrap gap-4">
        <Link to="/methods" className="text-sm text-purple-400 hover:text-purple-300 underline">Browse method registry →</Link>
        <Link to="/courses" className="text-sm text-blue-400 hover:text-blue-300 underline">Browse courses →</Link>
        <Link to="/ask" className="text-sm text-green-400 hover:text-green-300 underline">Ask MBAN about a project →</Link>
      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
