import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import courses from '../data/courses.json'
import slides from '../data/slides.json'
import projects from '../data/projects.json'
import lessonsData from '../data/lessons.json'
import topicsData from '../data/topics.json'
import assignmentsData from '../data/assignments.json'

type Course = typeof courses[0]
type Lesson = typeof lessonsData[0]
type Tab = 'overview' | 'learn' | 'apply' | 'ask' | 'sources'

// Pre-compute PPTX data per course code
const decksByCourse: Record<string, { decks: typeof slides; count: number; slides: number }> = slides.reduce((acc, d) => {
  if (!acc[d.course]) acc[d.course] = { decks: [], count: 0, slides: 0 }
  acc[d.course].decks.push(d)
  acc[d.course].count++
  acc[d.course].slides += d.slide_count
  return acc
}, {} as Record<string, { decks: typeof slides; count: number; slides: number }>)

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

const EVconfig: Record<EvidenceType, { dot: string; pill: string; label: string }> = {
  outline:     { dot: 'bg-green-600',  pill: 'bg-gray-800 text-gray-500 border-gray-700',          label: 'Outline verified' },
  pptx:        { dot: 'bg-purple-600', pill: 'bg-gray-800 text-gray-500 border-gray-700',          label: 'Slides available' },
  artifact:    { dot: 'bg-blue-600',   pill: 'bg-gray-800 text-gray-500 border-gray-700',          label: 'Source material' },
  provisional: { dot: 'bg-yellow-600', pill: 'bg-gray-800 text-yellow-600/80 border-gray-700',     label: 'Needs verification' },
  gap:         { dot: 'bg-red-700',    pill: 'bg-gray-800 text-red-600/80 border-gray-700',        label: 'Unresolved' },
}

// ─── Lesson Card ──────────────────────────────────────────────────────────────

function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-xl overflow-hidden">
      <button
        className="w-full text-left p-5 hover:bg-gray-800 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-700 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-purple-300 text-xs font-bold">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-base mb-1">{lesson.lessonTitle}</div>
            <p className="text-gray-400 text-sm leading-relaxed">{lesson.summary}</p>
          </div>
          <span className="text-gray-500 text-lg shrink-0 mt-1">{open ? '−' : '+'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-700 p-5 space-y-5 bg-gray-900/40">
          {/* Key Ideas */}
          <div>
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Key Ideas</div>
            <ol className="space-y-2.5">
              {lesson.keyIdeas.map((idea, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-purple-400 font-mono text-xs shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-gray-200 text-sm leading-relaxed">{idea}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Practical intuition */}
          <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4">
            <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Why this matters</div>
            <p className="text-gray-200 text-sm leading-relaxed">{lesson.practicalIntuition}</p>
          </div>

          {/* Common confusion */}
          <div className="bg-yellow-900/15 border border-yellow-800/30 rounded-xl p-4">
            <div className="text-yellow-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Common confusion</div>
            <p className="text-gray-300 text-sm leading-relaxed">{lesson.commonConfusion}</p>
          </div>

          {/* Business meaning */}
          <div className="bg-green-900/15 border border-green-800/30 rounded-xl p-4">
            <div className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Business meaning</div>
            <p className="text-gray-300 text-sm leading-relaxed">{lesson.businessMeaning}</p>
          </div>

          {/* Methods/Tools + Review next */}
          <div className="flex flex-wrap gap-4">
            {lesson.methodsTools.length > 0 && (
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Methods & Tools</div>
                <div className="flex flex-wrap gap-1.5">
                  {lesson.methodsTools.map(m => (
                    <span key={m} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-lg">{m}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="shrink-0">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Review next</div>
              <span className="text-purple-300 text-xs bg-purple-900/30 border border-purple-700 px-2 py-1 rounded-lg">
                {lesson.reviewNext}
              </span>
            </div>
          </div>

          {/* Assignment anchor */}
          {lesson.assignmentAnchor && (
            <div className="text-xs text-gray-500 border-t border-gray-700/50 pt-3">
              <span className="text-gray-600">Assignment: </span>{lesson.assignmentAnchor}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Course Detail Modal ──────────────────────────────────────────────────────

function CourseDetail({ course, onClose }: { course: Course; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [govOpen, setGovOpen] = useState(false)
  const navigate = useNavigate()
  const code = getCourseCode(course)
  const ev = getEvidenceType(course)
  const cfg = EVconfig[ev]
  const pptx = decksByCourse[code]
  const lessons = lessonsData.filter(l => l.courseCode === code)
  const courseProjects = projects.filter(p => p.course_code === code)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'learn', label: 'Learn' },
    { id: 'apply', label: 'Apply' },
    { id: 'ask', label: 'Ask' },
    { id: 'sources', label: 'Sources' },
  ]

  const courseTopics = topicsData.filter(t => t.course_code === `MBAN_${code}`)
  const courseAssignments = assignmentsData.filter(a => a.course_code === `MBAN_${code}`)

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full my-4 md:my-8">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-purple-400 font-mono text-sm font-bold">{course.course_code}</span>
              <span className={`inline-flex items-center gap-1 border text-xs px-1.5 py-0.5 rounded ${cfg.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">{course.title}</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {course.instructors.join(', ')} · {course.semester}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl ml-4 shrink-0 mt-1">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id
                  ? 'text-purple-300 border-purple-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Role description */}
              <div>
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">About This Course</div>
                <p className="text-gray-200 text-sm leading-relaxed">{course.role_in_degree}</p>
              </div>

              {/* Business framing */}
              {course.business_framing && (
                <div className="bg-purple-900/15 border border-purple-800/30 rounded-xl p-4">
                  <div className="text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>💼</span> Business Context
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{course.business_framing}</p>
                </div>
              )}

              {/* Dual pillar */}
              {(course as any).dual_pillar && (
                <div className="bg-blue-900/15 border border-blue-800/30 rounded-xl p-4">
                  <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">Dual-Pillar Course</div>
                  <p className="text-gray-300 text-sm">{(course as any).dual_pillar_description}</p>
                </div>
              )}

              {/* Methods as pills */}
              {course.methods.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Key Methods</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(course.methods as string[]).map(m => (
                      <span key={m} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools */}
              {course.tools.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Tools</div>
                  <div className="flex flex-wrap gap-1.5">
                    {course.tools.map(t => (
                      <span key={t} className="bg-blue-900/20 border border-blue-900 text-blue-300 text-xs px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-gray-800">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Format</div>
                  <div className="text-gray-200">{course.format}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Credits</div>
                  <div className="text-gray-200">{course.credit_hours} credits</div>
                </div>
              </div>
            </div>
          )}

          {/* LEARN */}
          {tab === 'learn' && (
            <div>
              {lessons.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-white font-semibold">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</div>
                      <p className="text-gray-500 text-xs mt-0.5">Click any lesson to expand teaching points, intuition, and common confusions.</p>
                    </div>
                  </div>
                  {lessons.map((lesson, i) => (
                    <LessonCard key={lesson.lessonTitle} lesson={lesson} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📖</div>
                  <div className="text-gray-300 font-medium mb-2">Lessons from coursework</div>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    This course is backed by artifacts and assignments rather than PPTX decks.
                    Review the Apply and Sources tabs for available materials.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* APPLY */}
          {tab === 'apply' && (
            <div className="space-y-5">
              {/* Deliverables */}
              {course.deliverables.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Deliverables</div>
                  <div className="space-y-2">
                    {course.deliverables.map((d, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3">
                        <span className="text-gray-200 text-sm">
                          {typeof d === 'string' ? d : (d as any).name}
                        </span>
                        {typeof d !== 'string' && (d as any).weight && (
                          <span className="text-purple-300 text-xs bg-purple-900/30 border border-purple-800 px-2 py-0.5 rounded-lg shrink-0 ml-3">
                            {(d as any).weight}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related projects */}
              {courseProjects.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Projects from This Course</div>
                  <div className="space-y-3">
                    {courseProjects.map(p => (
                      <div key={p.id} className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4">
                        <div className="text-white font-medium text-sm mb-1">{p.name}</div>
                        <p className="text-gray-400 text-xs mb-2 leading-relaxed">{p.business_problem}</p>
                        <div className="flex flex-wrap gap-1">
                          {p.methods.slice(0, 4).map(m => (
                            <span key={m} className="bg-purple-900/25 text-purple-300 text-xs px-2 py-0.5 rounded-lg">{m}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Week-by-week for 5560 */}
              {course.course_code === 'MBAN 5560' && course.workflows.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Week-by-Week</div>
                  <div className="space-y-1.5">
                    {course.workflows.map((w, i) => (
                      <div key={i} className="text-xs text-gray-300 bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2">{w}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk / governance notes — collapsed by default */}
              {course.governance_elements.length > 0 && (
                <div>
                  <button
                    onClick={() => setGovOpen(v => !v)}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Risk / governance notes</div>
                    <span className="text-gray-600 text-xs">{govOpen ? '−' : '+'}</span>
                  </button>
                  {govOpen && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {course.governance_elements.map(g => (
                        <span key={g} className="bg-gray-800/60 text-gray-500 text-xs px-2 py-1 rounded-lg border border-gray-700/40">{g}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Assignments from assignments.json */}
              {courseAssignments.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Assignments</div>
                  <div className="space-y-2">
                    {courseAssignments.map(a => (
                      <div key={a.id} className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-gray-200 text-sm font-medium">{a.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                            a.type === 'project'
                              ? 'bg-orange-900/30 text-orange-300'
                              : 'bg-blue-900/30 text-blue-300'
                          }`}>{a.type}</span>
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">{a.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {courseProjects.length === 0 && course.deliverables.length === 0 && courseAssignments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-6">No project data available for this course.</p>
              )}
            </div>
          )}

          {/* ASK */}
          {tab === 'ask' && (
            <div className="space-y-5 py-2">
              <div>
                <div className="text-white font-semibold text-base mb-1">Review this course</div>
                <p className="text-gray-400 text-sm">Results will be scoped to this course first.</p>
              </div>

              <button
                onClick={() => { onClose(); navigate(`/ask?course=MBAN_${code}`) }}
                className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Review concepts from {course.course_code}
              </button>

              {/* Course-specific topic chips */}
              {courseTopics.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    Concepts ({courseTopics.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {courseTopics.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onClose(); navigate(`/ask?course=MBAN_${code}&q=${encodeURIComponent(t.label)}`) }}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                        className="bg-gray-800 border border-gray-700 hover:border-purple-600 text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-xl transition-colors text-left"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: method chips if no topics */}
              {courseTopics.length === 0 && (course.methods as string[]).length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Quick topics</div>
                  <div className="flex flex-wrap gap-2">
                    {(course.methods as string[]).slice(0, 4).map(m => (
                      <button
                        key={m}
                        onClick={() => { onClose(); navigate(`/ask?course=MBAN_${code}&q=${encodeURIComponent(m)}`) }}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                        className="bg-gray-800 border border-gray-700 hover:border-purple-600 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOURCES */}
          {tab === 'sources' && (
            <div className="space-y-4">
              <p className="text-gray-500 text-xs">
                Raw source material — PPTX decks, SQL files, notebooks. For traceability and deep review.
              </p>

              {/* Evidence status */}
              <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className={`text-sm font-medium`} style={{ color: 'inherit' }}>{cfg.label}</span>
                </div>
                <p className="text-gray-400 text-xs">{course.evidence_origin}</p>
                <div className="mt-2 text-xs text-gray-600">Confidence: {course.confidence}</div>
              </div>

              {/* PPTX decks */}
              {pptx && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    PPTX Decks ({pptx.count} decks · {pptx.slides} slides)
                  </div>
                  <div className="space-y-1.5">
                    {pptx.decks.map((d, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-2">
                        <span className="text-gray-300 text-xs">{d.deck_label}</span>
                        <span className="text-gray-600 text-xs">{d.slide_count} slides</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Provisional note */}
              {(course as any).provisional && (
                <div className="bg-yellow-900/15 border border-yellow-800/30 rounded-xl p-4">
                  <div className="text-yellow-300 text-xs font-semibold mb-1.5">Provisional Note</div>
                  <p className="text-yellow-200/70 text-xs">{(course as any).provisional_note}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="px-5 pb-5 flex flex-wrap gap-3 border-t border-gray-800 pt-4">
          <Link to="/methods" onClick={onClose} className="text-xs text-purple-400 hover:text-purple-300 underline">
            Browse methods from this course →
          </Link>
          <Link to="/projects" onClick={onClose} className="text-xs text-blue-400 hover:text-blue-300 underline">
            View projects →
          </Link>
          <Link to="/ask" onClick={onClose} className="text-xs text-green-400 hover:text-green-300 underline">
            Ask MBAN →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Course Grid ──────────────────────────────────────────────────────────────

export default function Courses() {
  const [selected, setSelected] = useState<Course | null>(null)

  const fall2025 = courses.filter(c => c.semester === 'Fall 2025')
  const winter2026 = courses.filter(c => !fall2025.includes(c))

  function CourseCard({ course }: { course: Course }) {
    const ev = getEvidenceType(course)
    const cfg = EVconfig[ev]
    const code = getCourseCode(course)
    const pptx = decksByCourse[code]
    const lessonCount = lessonsData.filter(l => l.courseCode === code).length

    return (
      <button
        onClick={() => setSelected(course)}
        className="bg-gray-800/80 border border-gray-700/70 hover:border-purple-600/60 hover:bg-gray-800 rounded-2xl p-5 text-left w-full transition-all group"
      >
        {/* Title first */}
        <div className="text-white text-base font-semibold leading-snug mb-1">{course.title}</div>

        {/* Learning summary */}
        {(course as any).learning_summary && (
          <p className="text-gray-400 text-xs leading-relaxed mb-2">{(course as any).learning_summary}</p>
        )}

        {/* Term */}
        <div className="text-gray-500 text-xs mb-3">{course.semester}</div>

        {/* Method/tool pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          {(course.methods as string[]).slice(0, 3).map(m => (
            <span key={m} className="bg-gray-700/60 text-gray-400 text-xs px-2 py-0.5 rounded-lg">{m}</span>
          ))}
          {(course.methods as string[]).length > 3 && (
            <span className="text-gray-600 text-xs px-1 py-0.5">+{(course.methods as string[]).length - 3}</span>
          )}
        </div>

        {/* Evidence badge + course code — subdued, bottom */}
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-gray-600 text-xs">{course.course_code}</span>
          <span className={`inline-flex items-center gap-1 border text-xs px-1.5 py-0.5 rounded ${cfg.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {(lessonCount > 0 || pptx) && (
          <div className="mt-2 text-xs text-gray-600 flex gap-3">
            {lessonCount > 0 && <span className="text-purple-400/60">{lessonCount} lesson{lessonCount !== 1 ? 's' : ''}</span>}
            {pptx && <span>{pptx.count} deck{pptx.count !== 1 ? 's' : ''} · {pptx.slides} slides</span>}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">My Courses</h1>
        <p className="text-gray-400 text-sm">
          9 MBAN courses — click any card to explore lessons, projects, and sources
        </p>
      </div>

      {/* Term groups */}
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Term 1</span>
            <span className="text-gray-600 text-xs">Fall 2025 · {fall2025.length} courses</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fall2025.map(c => <CourseCard key={c.course_code} course={c} />)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Term 2</span>
            <span className="text-gray-600 text-xs">Winter 2026 · {winter2026.length} courses</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {winter2026.map(c => <CourseCard key={c.course_code} course={c} />)}
          </div>
        </div>
      </div>

      {selected && <CourseDetail course={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
