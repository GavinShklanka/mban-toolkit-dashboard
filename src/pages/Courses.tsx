import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import courses from '../data/courses.json'
import slides from '../data/slides.json'
import projects from '../data/projects.json'
import lessonsData from '../data/lessons.json'

type Course = typeof courses[0]
type Tab = 'overview' | 'learn' | 'apply' | 'ask' | 'sources'

// Pre-compute PPTX deck + slide counts per course code
const decksByCourse: Record<string, { decks: number; slides: number; deckList: typeof slides }> = slides.reduce((acc, d) => {
  if (!acc[d.course]) acc[d.course] = { decks: 0, slides: 0, deckList: [] }
  acc[d.course].decks += 1
  acc[d.course].slides += d.slide_count
  acc[d.course].deckList.push(d)
  return acc
}, {} as Record<string, { decks: number; slides: number; deckList: typeof slides }>)

function getCourseCode(course: Course) {
  return course.course_code.replace('MBAN ', '')
}

type EvidenceType = 'outline' | 'pptx' | 'artifact' | 'provisional' | 'gap'

function getEvidenceType(course: Course): EvidenceType {
  if (course.source_status === 'unresolved') return 'gap'
  if ((course as any).provisional) return 'provisional'
  if (course.source_status === 'full_outline_confirmed') return 'outline'
  if (decksByCourse[getCourseCode(course)]) return 'pptx'
  return 'artifact'
}

const EVconfig: Record<EvidenceType, { dot: string; bg: string; text: string; border: string; label: string }> = {
  outline:     { dot: 'bg-green-400',  bg: 'bg-green-900/30',  text: 'text-green-300',  border: 'border-green-700',  label: 'Full Outline' },
  pptx:        { dot: 'bg-purple-400', bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-700', label: 'PPTX Slides' },
  artifact:    { dot: 'bg-blue-400',   bg: 'bg-blue-900/30',   text: 'text-blue-300',   border: 'border-blue-700',   label: 'Artifacts' },
  provisional: { dot: 'bg-yellow-400', bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700', label: 'Provisional' },
  gap:         { dot: 'bg-red-400',    bg: 'bg-red-900/30',    text: 'text-red-300',    border: 'border-red-700',    label: 'Unresolved' },
}

// Get lessons for a course — new schema uses courseCode: "MBAN 5510"
function getLessons(courseCode: string) {
  return (lessonsData as any[]).filter(l => l.courseCode === `MBAN ${courseCode}`)
}

// Get projects for a course
function getCourseProjects(courseCode: string) {
  return (projects as any[]).filter(p => p.course_code === courseCode || p.course === `MBAN ${courseCode}`)
}

// ─── Lesson Card ──────────────────────────────────────────────────────────────

function LessonCard({ lesson, index }: { lesson: any; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-gray-800 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-purple-400 text-xs font-mono font-bold mb-1">Lesson {index + 1}</div>
            <h3 className="text-white font-semibold text-base leading-snug">{lesson.lessonTitle}</h3>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">{lesson.summary}</p>
          </div>
          <span className="text-gray-500 text-lg mt-1 shrink-0">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-700 p-4 space-y-4 bg-gray-900/40">
          {/* Key Ideas */}
          {lesson.keyIdeas && lesson.keyIdeas.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Key Ideas</div>
              <ul className="space-y-2">
                {lesson.keyIdeas.map((idea: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-purple-400 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="text-gray-200 text-sm leading-relaxed">{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Practical Intuition */}
          {lesson.practicalIntuition && (
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3">
              <div className="text-blue-400 text-xs font-semibold mb-1">Why this matters</div>
              <p className="text-blue-100/80 text-sm">{lesson.practicalIntuition}</p>
            </div>
          )}

          {/* Common Confusion */}
          {lesson.commonConfusion && (
            <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3">
              <div className="text-yellow-400 text-xs font-semibold mb-1">Common confusion</div>
              <p className="text-yellow-200/80 text-sm">{lesson.commonConfusion}</p>
            </div>
          )}

          {/* Business Meaning */}
          {lesson.businessMeaning && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Business value</div>
              <p className="text-gray-300 text-sm">{lesson.businessMeaning}</p>
            </div>
          )}

          {/* Footer: assignment, methods/tools, review next */}
          <div className="pt-2 border-t border-gray-800 space-y-1.5">
            {lesson.assignmentAnchor && (
              <p className="text-gray-500 text-xs">
                <span className="text-gray-600">Assignment: </span>{lesson.assignmentAnchor}
              </p>
            )}
            {lesson.methodsTools && lesson.methodsTools.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {lesson.methodsTools.map((m: string) => (
                  <Link
                    key={m}
                    to="/methods"
                    className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-800/40 hover:bg-purple-900/50 transition-colors"
                  >
                    {m}
                  </Link>
                ))}
              </div>
            )}
            {lesson.reviewNext && (
              <p className="text-gray-600 text-xs">
                Review next: <span className="text-yellow-500">{lesson.reviewNext}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Course Detail Modal ───────────────────────────────────────────────────────

function CourseDetail({ course, onClose }: { course: Course; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [askQuery, setAskQuery] = useState('')
  const ev = getEvidenceType(course)
  const cfg = EVconfig[ev]
  const code = getCourseCode(course)
  const pptx = decksByCourse[code]
  const lessons = getLessons(code)
  const courseProjects = getCourseProjects(code)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'learn',    label: `Learn${lessons.length > 0 ? ` (${lessons.length})` : ''}` },
    { id: 'apply',    label: `Apply${courseProjects.length > 0 ? ` (${courseProjects.length})` : ''}` },
    { id: 'ask',      label: 'Ask' },
    { id: 'sources',  label: 'Sources' },
  ]

  // Course-scoped lesson search
  const filteredLessons = useMemo(() => {
    if (!askQuery.trim()) return lessons
    const q = askQuery.toLowerCase()
    return lessons.filter((l: any) =>
      (l.lessonTitle || '').toLowerCase().includes(q) ||
      (l.summary || '').toLowerCase().includes(q) ||
      (l.keyIdeas || []).some((k: string) => k.toLowerCase().includes(q)) ||
      (l.methodsTools || []).some((m: string) => m.toLowerCase().includes(q)) ||
      (l.practicalIntuition || '').toLowerCase().includes(q) ||
      (l.businessMeaning || '').toLowerCase().includes(q)
    )
  }, [askQuery, lessons])

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-purple-400 font-mono text-sm font-bold">{course.course_code}</span>
              <span className={`inline-flex items-center gap-1 border text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {(course as any).dual_pillar && (
                <span className="text-xs bg-purple-900/30 text-purple-400 border border-purple-800/50 px-1.5 py-0.5 rounded">Dual-Pillar</span>
              )}
            </div>
            <h2 className="text-white font-bold text-xl leading-tight">{course.title}</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {course.instructors.filter(i => i !== 'unknown').join(', ')} · {course.semester}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4 shrink-0">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-5 gap-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 px-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.id
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">

          {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div>
                <p className="text-gray-200 text-sm leading-relaxed">{course.business_framing}</p>
              </div>

              {course.methods.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">What it added to your toolkit</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(course.methods as string[]).map(m => (
                      <Link
                        key={m}
                        to="/methods"
                        onClick={onClose}
                        className="bg-purple-900/20 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-800/40 hover:bg-purple-900/40 transition-colors"
                      >
                        {m}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Format</div>
                  <div className="text-gray-200">{course.format}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Credit Hours</div>
                  <div className="text-gray-200">{course.credit_hours}</div>
                </div>
                {course.theories.length > 0 && (
                  <div className="col-span-2">
                    <div className="text-gray-500 text-xs mb-1.5">Key Theories</div>
                    <div className="flex flex-wrap gap-1">
                      {course.theories.map(t => (
                        <span key={t} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {course.tools.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Tools</div>
                  <div className="flex flex-wrap gap-1">
                    {course.tools.map(t => (
                      <span key={t} className="bg-blue-900/20 text-blue-300 text-xs px-2.5 py-1 rounded-full border border-blue-900/40">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {course.governance_elements.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Governance</div>
                  <div className="flex flex-wrap gap-1">
                    {course.governance_elements.map(g => (
                      <span key={g} className="bg-orange-900/20 text-orange-300 text-xs px-2 py-0.5 rounded border border-orange-900/30">⚠️ {g}</span>
                    ))}
                  </div>
                </div>
              )}

              {(course as any).dual_pillar && (
                <div className="bg-purple-900/20 border border-purple-700/40 rounded-lg p-3">
                  <div className="text-purple-300 font-medium text-sm mb-1">Dual-Pillar Course</div>
                  <div className="text-purple-200/70 text-xs">{(course as any).dual_pillar_description}</div>
                </div>
              )}

              {(course as any).provisional && (
                <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-3">
                  <div className="text-yellow-300 font-medium text-sm mb-1">Provisional Reconstruction</div>
                  <div className="text-yellow-200/70 text-xs">{(course as any).provisional_note}</div>
                </div>
              )}
            </div>
          )}

          {/* ── LEARN TAB ─────────────────────────────────────────── */}
          {tab === 'learn' && (
            <div className="space-y-3">
              {lessons.length > 0 ? (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    {pptx
                      ? `${lessons.length} lessons built from ${pptx.decks} extracted PPTX ${pptx.decks === 1 ? 'deck' : 'decks'} (${pptx.slides} slides).`
                      : `${lessons.length} lessons derived from assignments and course materials.`
                    }
                  </p>
                  {lessons.map((lesson: any, i: number) => (
                    <LessonCard key={lesson.lessonTitle} lesson={lesson} index={i} />
                  ))}
                </>
              ) : (
                <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">📄</div>
                  <p className="text-gray-400 text-sm">No lesson content extracted for this course yet.</p>
                  <p className="text-gray-600 text-xs mt-1">Check the Sources tab for available course materials.</p>
                </div>
              )}
              {!pptx && lessons.length > 0 && (
                <p className="text-gray-600 text-xs mt-3 text-center">
                  Content derived from assignments and course materials — no lecture slides extracted.
                </p>
              )}
            </div>
          )}

          {/* ── APPLY TAB ─────────────────────────────────────────── */}
          {tab === 'apply' && (
            <div className="space-y-4">
              {courseProjects.length > 0 ? (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    {courseProjects.length} project{courseProjects.length !== 1 ? 's' : ''} from this course.
                  </p>
                  {courseProjects.map((p: any) => (
                    <div key={p.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-medium text-sm">{p.name}</h3>
                        <span className="text-xs text-gray-500 shrink-0">{p.term}</span>
                      </div>
                      <p className="text-gray-400 text-xs mb-3 flex items-start gap-1.5">
                        <span className="shrink-0">💼</span>
                        <span>{p.business_problem}</span>
                      </p>
                      {p.what_it_taught && (
                        <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                          <span className="text-gray-500 font-semibold">What it taught: </span>
                          {p.what_it_taught}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.methods.slice(0, 4).map((m: string) => (
                          <span key={m} className="bg-purple-900/20 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-800/30">{m}</span>
                        ))}
                        {p.methods.length > 4 && (
                          <span className="text-gray-500 text-xs px-1 py-0.5">+{p.methods.length - 4} more</span>
                        )}
                      </div>
                      {p.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.tools.map((t: string) => (
                            <span key={t} className="bg-blue-900/20 text-blue-300 text-xs px-2 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <Link
                      to="/projects"
                      onClick={onClose}
                      className="text-sm text-purple-400 hover:text-purple-300 underline"
                    >
                      View all projects in detail →
                    </Link>
                  </div>
                </>
              ) : (
                <div>
                  {course.deliverables.length > 0 && (
                    <div className="mb-5">
                      <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Lessons from Assignments</div>
                      <ul className="space-y-2">
                        {course.deliverables.map((d, i) => (
                          <li key={i} className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 text-sm text-gray-300">
                            <span className="text-purple-400 mr-2">•</span>
                            {typeof d === 'string' ? d : `${(d as any).name}${(d as any).weight ? ` (${(d as any).weight})` : ''}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-gray-600 text-xs text-center">No project artifacts linked to this course yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── ASK TAB ───────────────────────────────────────────── */}
          {tab === 'ask' && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Search this course's lessons, methods, and topics.</p>
                <p className="text-gray-600 text-xs">Search-backed — results come from course lesson data.</p>
              </div>

              <input
                type="text"
                value={askQuery}
                onChange={e => setAskQuery(e.target.value)}
                placeholder={`Search ${course.course_code} lessons...`}
                className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-colors"
                autoFocus
              />

              {askQuery.trim() && filteredLessons.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No lessons match "{askQuery}"</p>
                  <Link
                    to="/ask"
                    onClick={onClose}
                    className="text-xs text-purple-400 hover:text-purple-300 underline mt-2 inline-block"
                  >
                    Search all courses in Ask MBAN →
                  </Link>
                </div>
              )}

              {filteredLessons.length > 0 && (
                <div className="space-y-2">
                  {!askQuery.trim() && (
                    <p className="text-gray-600 text-xs">{lessons.length} lessons in this course</p>
                  )}
                  {filteredLessons.map((l: any) => (
                    <button
                      key={l.lessonTitle}
                      onClick={() => { setAskQuery(''); setTab('learn') }}
                      className="w-full text-left bg-gray-800/60 border border-gray-700 hover:border-purple-700 rounded-xl p-3 transition-colors group"
                    >
                      <div className="text-white text-sm font-medium group-hover:text-purple-200">{l.lessonTitle}</div>
                      <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">{l.summary}</div>
                      {l.methodsTools && l.methodsTools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {l.methodsTools.slice(0, 3).map((m: string) => (
                            <span key={m} className="text-xs bg-purple-900/20 text-purple-400 px-1.5 py-0.5 rounded">{m}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {course.methods.length > 0 && (
                <div className="pt-3 border-t border-gray-800">
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Methods in this course</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(course.methods as string[]).map(m => (
                      <Link
                        key={m}
                        to="/methods"
                        onClick={onClose}
                        className="bg-gray-800 text-gray-300 hover:text-white text-xs px-2.5 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors"
                      >
                        {m}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-center">
                <Link
                  to="/ask"
                  onClick={onClose}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  Open full Ask MBAN search →
                </Link>
              </div>
            </div>
          )}

          {/* ── SOURCES TAB ───────────────────────────────────────── */}
          {tab === 'sources' && (
            <div className="space-y-4">
              <div className={`border rounded-xl p-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className={`font-medium text-sm ${cfg.text}`}>{cfg.label}</span>
                  <span className={`text-xs opacity-70 ${cfg.text}`}>· {course.confidence} confidence</span>
                </div>
                <p className="text-xs text-gray-400">{course.evidence_origin}</p>
              </div>

              {pptx && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    Extracted PPTX Decks ({pptx.decks} {pptx.decks === 1 ? 'deck' : 'decks'} · {pptx.slides} slides)
                  </div>
                  <div className="space-y-1.5">
                    {pptx.deckList.map((deck: any) => (
                      <div key={deck.file} className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                          <span className="text-gray-200 text-xs font-medium">{deck.deck_label}</span>
                          <span className="text-gray-600 text-xs ml-2">{deck.file}</span>
                        </div>
                        <span className="text-purple-400 text-xs">{deck.slide_count} slides</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {course.deliverables.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Deliverables</div>
                  <ul className="space-y-1">
                    {course.deliverables.map((d, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-gray-600 shrink-0">•</span>
                        <span>{typeof d === 'string' ? d : `${(d as any).name}${(d as any).weight ? ` — ${(d as any).weight}` : ''}${(d as any).details ? ` · ${(d as any).details}` : ''}`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-gray-800 flex flex-wrap gap-3">
                <Link to="/methods" onClick={onClose} className="text-xs text-purple-400 hover:text-purple-300 underline">
                  Methods from this course →
                </Link>
                <Link to="/ask" onClick={onClose} className="text-xs text-green-400 hover:text-green-300 underline">
                  Ask MBAN about this course →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Course Card (grid) ────────────────────────────────────────────────────────

function CourseCard({ course, onClick }: { course: Course; onClick: () => void }) {
  const ev = getEvidenceType(course)
  const cfg = EVconfig[ev]
  const code = getCourseCode(course)
  const lessonCount = getLessons(code).length

  return (
    <button
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 hover:border-purple-600 rounded-xl p-4 text-left transition-all group"
    >
      {/* Title first */}
      <div className="mb-3">
        <div className="font-mono text-purple-400 text-xs font-bold mb-1">{course.course_code}</div>
        <div className="text-white text-sm font-semibold leading-snug group-hover:text-purple-100">
          {course.title}
        </div>
        <div className="text-gray-500 text-xs mt-1">
          {course.instructors.filter(i => i !== 'unknown').join(', ') || 'Instructor TBD'} · {course.semester}
        </div>
      </div>

      {/* Footer: lesson count + evidence badge (small, secondary) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-gray-600 text-xs">
          {lessonCount > 0 ? `${lessonCount} lessons` : 'Open to explore'}
        </span>
        <span className={`inline-flex items-center gap-1 border text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Courses() {
  const [selected, setSelected] = useState<Course | null>(null)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">My Courses</h1>
        <p className="text-gray-400 text-sm">
          {courses.length} MBAN courses — click any card to explore lessons, projects, and sources
        </p>
      </div>

      {/* Legend — compact, secondary */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        {(Object.entries(EVconfig) as [EvidenceType, typeof EVconfig[EvidenceType]][]).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${v.dot}`} />
            <span className="text-gray-500">{v.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => (
          <CourseCard
            key={course.course_code}
            course={course}
            onClick={() => setSelected(course)}
          />
        ))}
      </div>

      {selected && <CourseDetail course={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
