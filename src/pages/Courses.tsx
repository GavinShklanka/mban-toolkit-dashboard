import { useState } from 'react'
import courses from '../data/courses.json'

type Course = typeof courses[0]

function statusBadge(status: string) {
  switch (status) {
    case 'full_outline_confirmed':
      return <span className="inline-block bg-green-900/50 text-green-300 text-xs px-2 py-0.5 rounded border border-green-700">Outline</span>
    case 'partial_artifacts_only':
      return <span className="inline-block bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-700">Artifact</span>
    case 'unresolved':
      return <span className="inline-block bg-red-900/50 text-red-300 text-xs px-2 py-0.5 rounded border border-red-700">Gap</span>
    default:
      return <span className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{status}</span>
  }
}

function CourseDetail({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8">
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-purple-400 font-mono text-sm">{course.course_code}</span>
              {statusBadge(course.source_status)}
              {(course as any).provisional && (
                <span className="inline-block bg-yellow-900/50 text-yellow-300 text-xs px-2 py-0.5 rounded border border-yellow-700">Provisional</span>
              )}
            </div>
            <h2 className="text-white font-bold text-lg">{course.title}</h2>
            <p className="text-gray-400 text-sm">{course.role_in_degree}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Provisional warning */}
          {(course as any).provisional && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
              <div className="text-yellow-300 font-medium text-sm mb-1">User-Confirmed Reconstruction</div>
              <div className="text-yellow-200/70 text-xs">{(course as any).provisional_note}</div>
              {(course as any).provisional_topics && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(course as any).provisional_topics.map((t: string) => (
                    <span key={t} className="bg-yellow-900/30 text-yellow-300 text-xs px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dual pillar */}
          {(course as any).dual_pillar && (
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
              <div className="text-purple-300 font-medium text-sm mb-1">Dual-Pillar Course</div>
              <div className="text-purple-200/70 text-xs">{(course as any).dual_pillar_description}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-1">Semester</div>
              <div className="text-gray-200">{course.semester}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Format</div>
              <div className="text-gray-200">{course.format}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Instructors</div>
              <div className="text-gray-200">{course.instructors.join(', ')}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Confidence</div>
              <div className="text-gray-200">{course.confidence}</div>
            </div>
          </div>

          {course.methods.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Methods</div>
              <div className="flex flex-wrap gap-1">
                {(course.methods as string[]).map(m => (
                  <span key={m} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded">{m}</span>
                ))}
              </div>
            </div>
          )}

          {course.tools.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Tools</div>
              <div className="flex flex-wrap gap-1">
                {course.tools.map(t => (
                  <span key={t} className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-900">{t}</span>
                ))}
              </div>
            </div>
          )}

          {course.deliverables.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Deliverables</div>
              <ul className="space-y-1">
                {course.deliverables.map((d, i) => (
                  <li key={i} className="text-gray-300 text-xs flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{typeof d === 'string' ? d : `${(d as any).name} ${(d as any).weight ? `(${(d as any).weight})` : ''}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.governance_elements.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Governance</div>
              <div className="flex flex-wrap gap-1">
                {course.governance_elements.map(g => (
                  <span key={g} className="bg-red-900/20 text-red-300 text-xs px-2 py-0.5 rounded border border-red-900">{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Week-by-week for 5560 */}
          {course.course_code === 'MBAN 5560' && course.workflows.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Week-by-Week Progression</div>
              <div className="space-y-1">
                {course.workflows.map((w, i) => (
                  <div key={i} className="text-xs text-gray-300 bg-gray-800 rounded px-3 py-2">{w}</div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-800">
            <div className="text-xs text-gray-600">Evidence: {course.evidence_origin}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Courses() {
  const [selected, setSelected] = useState<Course | null>(null)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Course Intelligence</h1>
        <p className="text-gray-400 text-sm">9 courses · Click any card for full detail</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block"></span> <span className="text-gray-400">Outline Confirmed</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block"></span> <span className="text-gray-400">Artifact Only</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block"></span> <span className="text-gray-400">Provisional</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block"></span> <span className="text-gray-400">Unresolved</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => {
          const borderColor =
            course.source_status === 'full_outline_confirmed' ? 'border-green-700/60' :
            (course as any).provisional ? 'border-yellow-700/60' :
            course.source_status === 'unresolved' ? 'border-red-700/60' :
            'border-blue-700/60'

          return (
            <button
              key={course.course_code}
              onClick={() => setSelected(course)}
              className={`bg-gray-800 border ${borderColor} rounded-xl p-4 text-left hover:bg-gray-750 hover:brightness-110 transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-purple-400 text-sm font-bold">{course.course_code}</span>
                {statusBadge((course as any).provisional ? 'provisional' : course.source_status)}
              </div>
              <div className="text-white text-sm font-medium mb-1">{course.title}</div>
              <div className="text-gray-500 text-xs mb-3">{course.semester}</div>
              <div className="flex flex-wrap gap-1">
                {course.tools.slice(0, 4).map(t => (
                  <span key={t} className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded">{t}</span>
                ))}
                {course.tools.length > 4 && <span className="text-gray-500 text-xs">+{course.tools.length - 4}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {selected && <CourseDetail course={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
