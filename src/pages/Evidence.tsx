import seed from '../data/seed.json'
import courses from '../data/courses.json'

const tierInfo = [
  { tier: 'LOCAL_COURSE_OUTLINE', label: 'Outline Confirmed', count: 3, color: 'bg-green-900/40 text-green-300 border-green-700', description: 'Full course outline uploaded and verified' },
  { tier: 'LOCAL_COURSE_ARTIFACT', label: 'Artifact Only', count: 5, color: 'bg-blue-900/40 text-blue-300 border-blue-700', description: 'Evidence from assignments, exams, or labs only' },
  { tier: 'GAP_UNKNOWN', label: 'Unresolved', count: 1, color: 'bg-red-900/40 text-red-300 border-red-700', description: 'Identity unknown, single artifact only' },
]

const correctionLog = [
  { date: '2026-04-12', action: 'Upgrade', count: 23, detail: 'Evidence items upgraded from MODERATE_INFERENCE to LOCAL_COURSE_ARTIFACT or LOCAL_COURSE_OUTLINE based on artifact review' },
  { date: '2026-04-12', action: 'Downgrade', count: 0, detail: 'No items downgraded' },
]

const gapRegister = [
  { gap: 'MBAN_5540_outline', severity: 'HIGH', description: 'No course outline uploaded for Optimization & Decision Analysis. Provisional reconstruction from exam prep + assignment briefs.' },
  { gap: 'MBAN_5891_identity', severity: 'CRITICAL', description: 'Course identity unknown. Single artifact (Assignment 2 Verification Chat) does not confirm course code, title, or role.' },
  { gap: 'elective_options', severity: 'LOW', description: 'Elective course options not mapped. Program may include additional electives beyond the 9 mapped courses.' },
]

function statusBadge(status: string, provisional?: boolean) {
  if (provisional) return <span className="inline-block bg-yellow-900/50 text-yellow-300 text-xs px-2 py-0.5 rounded border border-yellow-700">Provisional</span>
  switch (status) {
    case 'full_outline_confirmed':
      return <span className="inline-block bg-green-900/50 text-green-300 text-xs px-2 py-0.5 rounded border border-green-700">Outline</span>
    case 'partial_artifacts_only':
      return <span className="inline-block bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-700">Artifact</span>
    case 'unresolved':
      return <span className="inline-block bg-red-900/50 text-red-300 text-xs px-2 py-0.5 rounded border border-red-700">Gap</span>
    default:
      return null
  }
}

export default function Evidence() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Evidence Audit</h1>
        <p className="text-gray-400 text-sm">Knowledge system evidence traceability and gap register</p>
      </div>

      {/* MBAN 5540 Prominent Warning */}
      <div className="mb-6 bg-yellow-900/20 border-2 border-yellow-700/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <span className="text-yellow-300 font-bold">MBAN 5540 — User-Confirmed Reconstruction</span>
        </div>
        <div className="text-yellow-200/80 text-sm mb-3">
          No course outline was uploaded for Optimization & Decision Analysis (Instructor: Majid Taghavi).
          All content is reconstructed from exam preparation materials and assignment briefs.
          Topics labeled "Provisional" should be treated as high-confidence but not outline-verified.
        </div>
        <div className="flex flex-wrap gap-1">
          {['Prescriptive Analytics', 'LP formulation', 'Integer Programming', 'Duality', 'Sensitivity Analysis', 'Decision Analysis (EMV/EVPI)', 'Multi-objective optimization', 'Gurobi', 'Excel Solver'].map(t => (
            <span key={t} className="bg-yellow-900/30 text-yellow-300 text-xs px-2 py-0.5 rounded border border-yellow-800">{t}</span>
          ))}
        </div>
      </div>

      {/* Evidence Tier Distribution */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Evidence Tier Distribution</h2>
        <div className="space-y-3">
          {tierInfo.map(t => (
            <div key={t.tier} className="flex items-center gap-4">
              <div className="w-32 shrink-0">
                <span className={`inline-block border text-xs px-2 py-0.5 rounded ${t.color}`}>{t.label}</span>
              </div>
              <div className="flex-1">
                <div className={`h-6 rounded flex items-center justify-between px-3 ${t.color}`}>
                  <span className="text-xs font-medium">{t.count} course{t.count !== 1 ? 's' : ''}</span>
                  <span className="text-xs opacity-70">{Math.round(t.count / 9 * 100)}%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 hidden md:block max-w-xs">{t.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Course Status Table */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Per-Course Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/50">
                <th className="text-left text-gray-400 font-medium p-3 text-xs uppercase tracking-wider">Course</th>
                <th className="text-left text-gray-400 font-medium p-3 text-xs uppercase tracking-wider">Title</th>
                <th className="text-left text-gray-400 font-medium p-3 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left text-gray-400 font-medium p-3 text-xs uppercase tracking-wider hidden md:table-cell">Confidence</th>
                <th className="text-left text-gray-400 font-medium p-3 text-xs uppercase tracking-wider hidden lg:table-cell">Evidence Origin</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, i) => (
                <tr key={course.course_code} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/60'}>
                  <td className="p-3 font-mono text-purple-400 text-sm">{course.course_code}</td>
                  <td className="p-3 text-gray-200 text-xs">{course.title}</td>
                  <td className="p-3">
                    {statusBadge(course.source_status, !!(course as any).provisional)}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={`text-xs font-medium ${
                      course.confidence === 'HIGHEST' ? 'text-green-400' :
                      course.confidence === 'HIGH' ? 'text-blue-400' :
                      course.confidence === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>{course.confidence}</span>
                  </td>
                  <td className="p-3 text-gray-500 text-xs hidden lg:table-cell">{course.evidence_origin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Log */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Correction Log Summary</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{seed.evidence_health.items_upgraded}</div>
            <div className="text-xs text-gray-400 mt-1">Items Upgraded</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-400">{seed.evidence_health.items_downgraded}</div>
            <div className="text-xs text-gray-400 mt-1">Items Downgraded</div>
          </div>
        </div>
        {correctionLog.map((entry, i) => (
          <div key={i} className="border border-gray-700 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 text-xs">{entry.date}</span>
              <span className={`text-xs font-medium ${entry.action === 'Upgrade' ? 'text-green-400' : 'text-red-400'}`}>
                {entry.action} ({entry.count})
              </span>
            </div>
            <p className="text-gray-400 text-xs">{entry.detail}</p>
          </div>
        ))}
      </div>

      {/* Gap Register */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Gap Register</h2>
        <div className="space-y-3">
          {gapRegister.map((gap, i) => (
            <div key={i} className={`border rounded-lg p-4 ${
              gap.severity === 'CRITICAL' ? 'border-red-700/60 bg-red-900/10' :
              gap.severity === 'HIGH' ? 'border-orange-700/60 bg-orange-900/10' :
              'border-gray-700 bg-gray-700/20'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <code className="text-purple-400 text-xs bg-gray-900 px-1.5 py-0.5 rounded">{gap.gap}</code>
                <span className={`text-xs font-medium ${
                  gap.severity === 'CRITICAL' ? 'text-red-400' :
                  gap.severity === 'HIGH' ? 'text-orange-400' :
                  'text-gray-400'
                }`}>{gap.severity}</span>
              </div>
              <p className="text-gray-300 text-xs">{gap.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
