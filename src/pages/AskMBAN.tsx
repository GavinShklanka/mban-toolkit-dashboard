import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import methods from '../data/methods.json'
import courses from '../data/courses.json'
import templates from '../data/templates.json'
import slides from '../data/slides.json'
import projects from '../data/projects.json'
import topicsData from '../data/topics.json'
import assignmentsData from '../data/assignments.json'
import resourcesData from '../data/resources.json'
import conceptFamiliesData from '../data/concept_families.json'

// ─── Types ────────────────────────────────────────────────────────────────────

type Template       = typeof templates[0]
type ProjectItem    = typeof projects[0]
type Topic          = typeof topicsData[0]
type Assignment     = typeof assignmentsData[0]
type Resource       = typeof resourcesData[0]
type ConceptFamily  = typeof conceptFamiliesData[0]

type SearchResult =
  | { kind: 'method';     score: number; item: typeof methods[0];    reason: string }
  | { kind: 'course';     score: number; item: typeof courses[0];    reason: string }
  | { kind: 'slide';      score: number; item: SlideItem;            reason: string }
  | { kind: 'project';    score: number; item: ProjectItem;          reason: string }
  | { kind: 'topic';      score: number; item: Topic;                reason: string }
  | { kind: 'assignment'; score: number; item: Assignment;           reason: string }
  | { kind: 'resource';   score: number; item: Resource;             reason: string }

interface SlideItem {
  deck: string
  course: string
  title: string
  bullets: string[]
  slideNum: number
}

// ─── Query Normalization ──────────────────────────────────────────────────────

const ABBR_MAP: Record<string, string> = {
  'cv': 'cross validation',
  'cross-validation': 'cross validation',
  'rf': 'random forest',
  'nb': 'naive bayes',
  'lp': 'linear programming',
  'ip': 'integer programming',
  'nn': 'neural network',
  'ml': 'machine learning',
  'dt': 'decision tree',
  'svm': 'support vector machine',
  'gbm': 'gradient boosting',
  'dp': 'dynamic programming',
  'er': 'entity relationship',
  'knn': 'k nearest neighbors',
  'erd': 'entity relationship diagram',
  'ols': 'linear regression',
  'nlp': 'natural language processing',
  'hitl': 'human in the loop',
  'emv': 'expected monetary value',
  'evpi': 'expected value of perfect information',
  'dcf': 'discounted cash flow',
  'dtmc': 'discrete time markov chain',
  'ctmc': 'continuous time markov chain',
}

function normalizeQuery(q: string): string {
  let normalized = q.toLowerCase().trim()
  for (const [abbr, full] of Object.entries(ABBR_MAP)) {
    const re = new RegExp(`\\b${abbr}\\b`, 'gi')
    normalized = normalized.replace(re, full)
  }
  return normalized
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

type Intent = 'compare' | 'explain' | 'when_to_use' | 'assignment' | 'resource' | 'general'

function detectIntent(q: string): Intent {
  const lower = q.toLowerCase()
  if (/\bvs\b|versus|compare|difference between|or\b/.test(lower)) return 'compare'
  if (/\bexplain|what is|define|how does|why does|mean\b/.test(lower)) return 'explain'
  if (/\bwhen (to|should|would|do)|which should|best for/.test(lower)) return 'when_to_use'
  if (/\bassignment|homework|project|deliverable|due/.test(lower)) return 'assignment'
  if (/\bresource|video|watch|read|learn more|tutorial|link/.test(lower)) return 'resource'
  return 'general'
}

// ─── Concept Family Bridge ────────────────────────────────────────────────────

function findBridgeFamily(q: string): ConceptFamily | null {
  const normalized = normalizeQuery(q)
  let best: ConceptFamily | null = null
  let bestScore = 0
  for (const cf of conceptFamiliesData) {
    let score = 0
    score += scoreText(cf.label, normalized) * 4
    score += scoreText(cf.description, normalized) * 2
    score += scoreText(cf.core_tension, normalized)
    score += (cf.bridge_terms as string[]).reduce((a, t) => a + scoreText(t, normalized) * 2, 0)
    if (score > bestScore) { bestScore = score; best = cf }
  }
  return bestScore >= 4 ? best : null
}

// ─── Search Engine ────────────────────────────────────────────────────────────

function scoreText(text: string, q: string): number {
  if (!text) return 0
  const t = text.toLowerCase()
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  let score = 0
  for (const w of words) {
    if (t.includes(w)) score += w.length > 4 ? 3 : 1
  }
  if (t.includes(q.toLowerCase())) score += 5
  return score
}

function runSearch(
  rawQuery: string,
  mode: 'learn' | 'find',
  scopedCourse?: string,
): SearchResult[] {
  if (!rawQuery.trim()) return []
  const q = normalizeQuery(rawQuery.trim())
  const intent = detectIntent(rawQuery)
  const results: SearchResult[] = []
  const scopeCode = scopedCourse ? scopedCourse.replace('MBAN_', '') : ''

  // ── Topics ─────────────────────────────────────────────────────────────────
  for (const t of topicsData) {
    const labelScore   = scoreText(t.label, q) * 5
    const aliasScore   = (t.aliases as string[]).reduce((a, al) => a + scoreText(al, q) * 3, 0)
    const summaryScore = scoreText(t.summary, q) * 2
    const familyScore  = scoreText(t.broader_family, q) * 2
    const nnScore      = (t.nearest_neighbors as string[]).reduce((a, n) => a + scoreText(n, q), 0)
    const base = labelScore + aliasScore + summaryScore + familyScore + nnScore
    if (base <= 0) continue

    const courseNum = t.course_code.replace('MBAN_', '')
    const scopeBoost = scopeCode && courseNum === scopeCode ? 5 : 0
    const intentBoost = intent === 'explain' ? 2 : 0

    let reason = 'Matched on concept'
    if (labelScore > 0) reason = 'Matched on topic label'
    else if (aliasScore > 0) reason = 'Matched on alias'

    results.push({ kind: 'topic', score: base + scopeBoost + intentBoost, item: t, reason })
  }

  // ── Methods ────────────────────────────────────────────────────────────────
  for (const m of methods) {
    const nameScore    = scoreText(m.method_name,   q) * 4
    const solvesScore  = scoreText(m.what_it_solves, q) * 2
    const useScore     = scoreText(m.when_to_use,    q)
    const familyScore  = scoreText(m.method_family,  q) * 2
    const probScore    = (m.linked_problems || []).reduce((a, p) => a + scoreText(p, q), 0)
    const courseScore  = (m.linked_courses  || []).reduce((a, c) => a + scoreText(c, q), 0)
    const base = nameScore + solvesScore + useScore + familyScore + probScore + courseScore
    if (base <= 0) continue

    const scopeBoost = scopeCode && (m.linked_courses || []).some(c => c.includes(scopeCode)) ? 3 : 0
    const intentBoost = intent === 'when_to_use' ? 2 : 0

    let reason = 'Matched on method definition'
    if (nameScore > 0)   reason = 'Matched on method name'
    else if (useScore > 0) reason = 'Matched on when to use'

    results.push({ kind: 'method', score: base + scopeBoost + intentBoost, item: m, reason })
  }

  // ── Courses ────────────────────────────────────────────────────────────────
  for (const c of courses) {
    const codeScore    = scoreText(c.course_code,     q) * 4
    const titleScore   = scoreText(c.title,            q) * 3
    const framingScore = scoreText(c.business_framing, q) * 2
    const methodScore  = (c.methods  || []).reduce((a: number, m: string) => a + scoreText(m, q), 0)
    const toolScore    = (c.tools    || []).reduce((a: number, t: string) => a + scoreText(t, q), 0)
    const theoryScore  = (c.theories || []).reduce((a: number, t: string) => a + scoreText(t, q), 0)
    const instrScore   = mode === 'find'
      ? (c.instructors || []).reduce((a: number, i: string) => a + scoreText(i, q) * 3, 0)
      : 0
    const base = codeScore + titleScore + framingScore + methodScore + toolScore + theoryScore + instrScore
    if (base <= 0) continue

    const scopeBoost = scopeCode && c.course_code === `MBAN ${scopeCode}` ? 5 : 0

    let reason = 'Matched on course concept'
    if (codeScore    > 0) reason = 'Matched on course code'
    else if (titleScore   > 0) reason = 'Matched on course title'
    else if (framingScore > 0) reason = 'Matched on course context'
    else if (instrScore   > 0) reason = 'Matched on instructor'

    results.push({ kind: 'course', score: base + scopeBoost, item: c, reason })
  }

  // ── Assignments (Find mode emphasizes; Learn mode includes) ────────────────
  for (const a of assignmentsData) {
    const titleScore = scoreText(a.title, q) * 4
    const descScore  = scoreText(a.description, q) * 2
    const delivScore = (a.deliverables as string[]).reduce((acc, d) => acc + scoreText(d, q), 0)
    const courseScore = scoreText(a.course_code, q) * 3
    const base = titleScore + descScore + delivScore + courseScore
    if (base <= 0) continue

    const modeBoost = mode === 'find' || intent === 'assignment' ? 4 : 0
    const scopeBoost = scopeCode && a.course_code.includes(scopeCode) ? 4 : 0

    results.push({ kind: 'assignment', score: base + modeBoost + scopeBoost, item: a, reason: 'Matched on assignment' })
  }

  // ── Resources (Learn mode emphasizes) ─────────────────────────────────────
  for (const r of resourcesData) {
    const titleScore  = scoreText(r.title, q) * 4
    const descScore   = scoreText(r.description, q) * 2
    const authorScore = scoreText(r.author, q)
    const typeScore   = intent === 'resource' ? scoreText(r.type, q) * 3 : 0
    const base = titleScore + descScore + authorScore + typeScore
    if (base <= 0) continue

    const modeBoost = mode === 'learn' || intent === 'resource' ? 3 : 0

    results.push({ kind: 'resource', score: base + modeBoost, item: r, reason: 'Matched on resource' })
  }

  // ── Slides ─────────────────────────────────────────────────────────────────
  for (const deck of slides) {
    for (const slide of deck.slides) {
      const titleScore  = scoreText(slide.title, q) * 3
      const bulletScore = (slide.bullets || []).reduce((a: number, b: string) => a + scoreText(b, q), 0)
      const base = titleScore + bulletScore
      if (base <= 1) continue

      const matchedBullets = (slide.bullets || []).filter((b: string) =>
        q.split(/\s+/).some(w => b.toLowerCase().includes(w))
      )
      const scopeBoost = scopeCode && deck.course === scopeCode ? 2 : 0

      results.push({
        kind: 'slide',
        score: base + scopeBoost,
        item: {
          deck:    deck.deck_label,
          course:  deck.course,
          title:   slide.title || `Slide ${slide.slide_number}`,
          bullets: matchedBullets.slice(0, 4),
          slideNum: slide.slide_number,
        },
        reason: 'Matched on source snippet',
      })
    }
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  for (const p of projects) {
    const nameScore   = scoreText(p.name,              q) * 4
    const probScore   = scoreText(p.business_problem,  q) * 3
    const taughtScore = scoreText(p.what_it_taught,    q) * 2
    const cScore      = scoreText(p.course,             q) * 3
    const mScore      = p.methods.reduce((a, m) => a + scoreText(m, q) * 2, 0)
    const tScore      = p.tools.reduce((a, t) => a + scoreText(t, q), 0)
    const kwScore     = p.search_keywords.reduce((a, k) => a + scoreText(k, q) * 2, 0)
    const profScore   = mode === 'find' ? scoreText(p.professor, q) * 3 : 0
    const base = nameScore + probScore + taughtScore + cScore + mScore + tScore + kwScore + profScore
    if (base <= 0) continue

    let reason = 'Matched on applied example'
    if (probScore  > 0) reason = 'Matched on business problem'
    else if (mScore > 0) reason = 'Matched on method used'

    results.push({ kind: 'project', score: base, item: p, reason })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 30)
}

// ─── Primary Answer Finder ────────────────────────────────────────────────────

type PrimaryAnswer =
  | { type: 'template'; t: Template }
  | { type: 'topic';    topic: Topic; bridge: ConceptFamily | null }
  | { type: 'method';   m: typeof methods[0] }
  | { type: 'none' }

function findPrimaryAnswer(rawQuery: string, results: SearchResult[]): PrimaryAnswer {
  const q = normalizeQuery(rawQuery.toLowerCase())
  const words = q.split(/\s+/).filter(w => w.length > 2)

  // Template match
  for (const t of templates) {
    const tq = normalizeQuery(t.query.toLowerCase())
    const matchCount = words.filter(w => tq.includes(w)).length
    if (matchCount >= Math.max(2, Math.floor(words.length * 0.4))) {
      return { type: 'template', t }
    }
  }

  // Topic match (highest-scored topic)
  const topTopic = results.find(r => r.kind === 'topic' && r.score >= 6) as
    Extract<SearchResult, { kind: 'topic' }> | undefined
  if (topTopic) {
    const bridge = findBridgeFamily(rawQuery)
    return { type: 'topic', topic: topTopic.item, bridge }
  }

  // Method match
  const topMethod = results.find(r => r.kind === 'method' && r.score >= 8) as
    Extract<SearchResult, { kind: 'method' }> | undefined
  if (topMethod) return { type: 'method', m: topMethod.item }

  return { type: 'none' }
}

// ─── Level Colors ─────────────────────────────────────────────────────────────

const levelColor: Record<string, string> = {
  descriptive:  'bg-blue-900/40 text-blue-300 border-blue-700',
  diagnostic:   'bg-cyan-900/40 text-cyan-300 border-cyan-700',
  predictive:   'bg-purple-900/40 text-purple-300 border-purple-700',
  prescriptive: 'bg-green-900/40 text-green-300 border-green-700',
  ml_ai:        'bg-orange-900/40 text-orange-300 border-orange-700',
  'ML/AI':      'bg-orange-900/40 text-orange-300 border-orange-700',
  agentic:      'bg-red-900/40 text-red-300 border-red-700',
  'agentic AI': 'bg-red-900/40 text-red-300 border-red-700',
}
function lvlCls(level: string): string {
  return levelColor[level?.toLowerCase()] || levelColor[level] || 'bg-gray-700 text-gray-300 border-gray-600'
}

// ─── Primary Answer Card ──────────────────────────────────────────────────────

function PrimaryAnswerCard({ answer }: { answer: PrimaryAnswer }) {
  if (answer.type === 'none') {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-center">
        <p className="text-gray-500 text-sm">Related material found, but no direct answer for this question.</p>
      </div>
    )
  }

  if (answer.type === 'template') {
    const r = answer.t.response as Record<string, unknown>
    return (
      <div className="bg-purple-950/30 border border-purple-700/50 rounded-2xl p-5 space-y-3">
        <span className="bg-purple-700/40 text-purple-200 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Direct Answer
        </span>
        {!!r.key_distinction && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Key Distinction</div>
            <p className="text-gray-100 text-sm leading-relaxed">{String(r.key_distinction)}</p>
          </div>
        )}
        {!!r.answer && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Answer</div>
            <p className="text-gray-100 text-sm leading-relaxed">{String(r.answer)}</p>
          </div>
        )}
        {!!r.fix_chain && Array.isArray(r.fix_chain) && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Fix Chain</div>
            <ul className="space-y-1">
              {(r.fix_chain as string[]).map((s, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 shrink-0">›</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!!(r.course_origin || r.where_learned || r.course_anchor) && (
          <div className="flex items-center gap-2 pt-1 border-t border-purple-800/40 text-xs">
            <span className="text-gray-500">Where you learned this:</span>
            <span className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded">
              {String(r.course_origin || r.where_learned || r.course_anchor)}
            </span>
          </div>
        )}
        {!!r.review_next && (
          <div className="text-xs text-gray-500 pt-1">
            Review next: <span className="text-yellow-400">{String(r.review_next)}</span>
          </div>
        )}
      </div>
    )
  }

  if (answer.type === 'topic') {
    const { topic, bridge } = answer
    const courseNum = topic.course_code.replace('MBAN_', 'MBAN ')
    return (
      <div className="bg-purple-950/30 border border-purple-700/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-purple-700/40 text-purple-200 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Concept
          </span>
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded border border-gray-700">
            {courseNum}
          </span>
        </div>
        <div className="text-white font-semibold text-base">{topic.label}</div>
        <div className="bg-gray-900/60 rounded-xl p-3">
          <p className="text-gray-100 text-sm leading-relaxed">{topic.summary}</p>
        </div>
        {(topic.suggested_followups as string[]).length > 0 && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">Suggested follow-ups</div>
            <div className="flex flex-wrap gap-1.5">
              {(topic.suggested_followups as string[]).map(f => (
                <span key={f} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-lg">{f}</span>
              ))}
            </div>
          </div>
        )}
        {bridge && (
          <div className="bg-gray-900/40 rounded-xl p-3 border border-gray-700/40">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Broader family: {bridge.label}</div>
            <p className="text-gray-400 text-xs leading-relaxed">{bridge.one_liner}</p>
          </div>
        )}
      </div>
    )
  }

  // method type
  const m = answer.m
  return (
    <div className="bg-purple-950/30 border border-purple-700/50 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="bg-purple-700/40 text-purple-200 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Best Match
        </span>
        <span className={`border text-xs px-1.5 py-0.5 rounded ${lvlCls(m.analytics_level)}`}>
          {m.analytics_level}
        </span>
      </div>
      <div className="text-white font-semibold text-base">{m.method_name}</div>
      <div className="bg-gray-900/60 rounded-xl p-3">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">What it does</div>
        <p className="text-gray-100 text-sm leading-relaxed">{m.what_it_solves}</p>
      </div>
      {m.when_to_use && (
        <div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">When to use</div>
          <p className="text-gray-300 text-sm">{m.when_to_use}</p>
        </div>
      )}
      {(m.linked_courses || []).length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-purple-800/40 text-xs">
          <span className="text-gray-500">Where you learned this:</span>
          {(m.linked_courses || []).map((c: string) => (
            <span key={c} className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded">MBAN {c}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Result Cards ─────────────────────────────────────────────────────────────

function TopicCard({ item, reason }: { item: Topic; reason: string }) {
  const courseNum = item.course_code.replace('MBAN_', 'MBAN ')
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-white font-semibold text-base">{item.label}</div>
          <div className="text-gray-500 text-xs mt-0.5">{item.broader_family} · {courseNum}</div>
        </div>
      </div>
      <div className="bg-gray-900/60 rounded-xl p-3">
        <p className="text-gray-200 text-sm leading-relaxed">{item.summary}</p>
      </div>
      {(item.nearest_neighbors as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-gray-600 text-xs self-center">Related:</span>
          {(item.nearest_neighbors as string[]).map(n => (
            <span key={n} className="bg-gray-700/60 text-gray-400 text-xs px-2 py-0.5 rounded-lg">{n}</span>
          ))}
        </div>
      )}
      <div className="text-xs text-gray-600 italic pt-1 border-t border-gray-700/60">{reason}</div>
    </div>
  )
}

function AssignmentCard({ item, reason }: { item: Assignment; reason: string }) {
  const courseNum = item.course_code.replace('MBAN_', 'MBAN ')
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-white font-semibold text-base">{item.title}</div>
          <div className="text-gray-500 text-xs mt-0.5">{courseNum} · {item.type}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${
          item.type === 'project'
            ? 'bg-orange-900/30 text-orange-300 border-orange-800/40'
            : 'bg-blue-900/30 text-blue-300 border-blue-800/40'
        }`}>
          {item.type}
        </span>
      </div>
      <div className="bg-gray-900/60 rounded-xl p-3">
        <p className="text-gray-200 text-sm leading-relaxed">{item.description}</p>
      </div>
      {(item.deliverables as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(item.deliverables as string[]).map(d => (
            <span key={d} className="bg-gray-700/50 text-gray-400 text-xs px-2 py-0.5 rounded-lg">{d}</span>
          ))}
        </div>
      )}
      <div className="text-xs text-gray-600 italic pt-1 border-t border-gray-700/60">{reason}</div>
    </div>
  )
}

function ResourceCard({ item, reason }: { item: Resource; reason: string }) {
  const typeColors: Record<string, string> = {
    video:       'bg-red-900/30 text-red-300 border-red-800/40',
    article:     'bg-blue-900/30 text-blue-300 border-blue-800/40',
    docs:        'bg-cyan-900/30 text-cyan-300 border-cyan-800/40',
    course:      'bg-green-900/30 text-green-300 border-green-800/40',
    interactive: 'bg-yellow-900/30 text-yellow-300 border-yellow-800/40',
  }
  const typeCls = typeColors[item.type] || 'bg-gray-700 text-gray-300 border-gray-600'
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-semibold text-base hover:text-purple-300 transition-colors"
          >
            {item.title} ↗
          </a>
          <div className="text-gray-500 text-xs mt-0.5">
            {item.author}{'duration_min' in item && (item as Resource & { duration_min?: number }).duration_min
              ? ` · ${(item as Resource & { duration_min?: number }).duration_min} min`
              : ''}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${typeCls}`}>{item.type}</span>
      </div>
      <p className="text-gray-300 text-sm">{item.description}</p>
      <div className="text-xs text-gray-600 italic pt-1 border-t border-gray-700/60">{reason}</div>
    </div>
  )
}

function MethodCard({ item, reason }: { item: typeof methods[0]; reason: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-semibold text-base">{item.method_name}</div>
          <div className="text-gray-500 text-xs mt-0.5">{item.method_family}</div>
        </div>
        <span className={`border text-xs px-1.5 py-0.5 rounded shrink-0 ${lvlCls(item.analytics_level)}`}>
          {item.analytics_level}
        </span>
      </div>
      <div className="bg-gray-900/60 rounded-xl p-3">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">What it does</div>
        <p className="text-gray-200 text-sm leading-relaxed">{item.what_it_solves}</p>
      </div>
      {item.when_to_use && (
        <div>
          <div className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">When to use</div>
          <p className="text-gray-400 text-sm">{item.when_to_use}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs pt-1 border-t border-gray-700/60">
        {(item.linked_courses || []).length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Learned in</span>
            {(item.linked_courses || []).map((c: string) => (
              <Link key={c} to="/courses" className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded hover:bg-purple-900/50 transition-colors">
                MBAN {c}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex gap-3">
          <Link to="/methods" className="text-purple-400 hover:text-purple-300 underline">Full detail →</Link>
          <Link to="/router" className="text-blue-400 hover:text-blue-300 underline">Business problems →</Link>
        </div>
        <span className="text-gray-600 italic">{reason}</span>
      </div>
    </div>
  )
}

function CourseCard({ item, reason }: { item: typeof courses[0]; reason: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div>
        <div className="text-white font-semibold text-base">{item.course_code}</div>
        <div className="text-gray-300 text-sm">{item.title}</div>
        <div className="text-gray-500 text-xs mt-0.5">{item.semester}</div>
      </div>
      {item.business_framing && (
        <div className="bg-gray-900/60 rounded-xl p-3">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">What it covered</div>
          <p className="text-gray-200 text-sm leading-relaxed">{item.business_framing}</p>
        </div>
      )}
      {(item.methods || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(item.methods as string[]).slice(0, 4).map(m => (
            <span key={m} className="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-lg">{m}</span>
          ))}
          {(item.methods as string[]).length > 4 && (
            <span className="text-gray-600 text-xs px-1 py-0.5">+{(item.methods as string[]).length - 4} more</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-gray-700/60">
        <Link to="/courses" className="text-purple-400 hover:text-purple-300 underline">Course portal →</Link>
        <span className="text-gray-600 italic">{reason}</span>
      </div>
    </div>
  )
}

function SlideCard({ item, reason }: { item: SlideItem; reason: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-semibold text-base">{item.title}</div>
          <div className="text-gray-500 text-xs mt-0.5">{item.deck} · Slide {item.slideNum} · MBAN {item.course}</div>
        </div>
        <span className="bg-blue-900/30 text-blue-300 text-xs px-1.5 py-0.5 rounded shrink-0 border border-blue-800/40">Slide</span>
      </div>
      {item.bullets.length > 0 && (
        <div className="bg-gray-900/60 rounded-xl p-3 space-y-1">
          {item.bullets.map((b, i) => (
            <div key={i} className="text-gray-300 text-xs flex items-start gap-2">
              <span className="text-gray-600 shrink-0">·</span>
              <span className="line-clamp-2">{b}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-700/60">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600">Learned in</span>
          <Link to="/courses" className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded hover:bg-purple-900/50 transition-colors">
            MBAN {item.course}
          </Link>
        </div>
        <span className="text-gray-600 italic">{reason}</span>
      </div>
    </div>
  )
}

function ProjectCard({ item, reason }: { item: ProjectItem; reason: string }) {
  return (
    <div className="bg-gray-800 border border-purple-900/40 rounded-2xl p-5 space-y-3">
      <div>
        <div className="text-white font-semibold text-base">{item.name}</div>
        <div className="text-gray-500 text-xs mt-0.5">{item.course} · {item.term}</div>
      </div>
      <div className="bg-gray-900/60 rounded-xl p-3">
        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Business problem</div>
        <p className="text-gray-200 text-sm leading-relaxed">{item.business_problem}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {item.methods.slice(0, 3).map(m => (
          <span key={m} className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded-lg">{m}</span>
        ))}
        {item.methods.length > 3 && (
          <span className="text-gray-600 text-xs px-1 py-0.5">+{item.methods.length - 3} more</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-gray-700/60">
        <Link to="/projects" className="text-purple-400 hover:text-purple-300 underline">Project detail →</Link>
        <span className="text-gray-600 italic">{reason}</span>
      </div>
    </div>
  )
}

// ─── Common Question Card ─────────────────────────────────────────────────────

function CommonQuestionCard({ t, onSelect }: { t: Template; onSelect: (q: string) => void }) {
  const [open, setOpen] = useState(false)
  const r = t.response as Record<string, unknown>

  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-2xl overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-gray-800 transition-colors"
        style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-gray-200 text-sm leading-snug">{t.query}</p>
          <span className="text-gray-500 shrink-0 text-sm">{open ? '−' : '+'}</span>
        </div>
        {!open && (
          <button
            onClick={e => { e.stopPropagation(); onSelect(t.query) }}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Search this →
          </button>
        )}
      </button>

      {open && (
        <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-900/40">
          {!!r.key_distinction && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Key Distinction</div>
              <p className="text-gray-200 text-sm">{String(r.key_distinction)}</p>
            </div>
          )}
          {!!r.answer && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Answer</div>
              <p className="text-gray-200 text-sm">{String(r.answer)}</p>
            </div>
          )}
          {!!r.managerial_explanation && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Manager-Level</div>
              <p className="text-gray-200 text-sm">{String(r.managerial_explanation)}</p>
            </div>
          )}
          {!!r.fix_chain && Array.isArray(r.fix_chain) && (
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Fix Chain</div>
              <ul className="space-y-1">
                {(r.fix_chain as string[]).map((s, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 shrink-0">›</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!(r.course_origin || r.where_learned || r.course_anchor) && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Learned in:</span>
              <span className="bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded">
                {String(r.course_origin || r.where_learned || r.course_anchor)}
              </span>
            </div>
          )}
          {!!r.review_next && (
            <div className="pt-2 border-t border-gray-800">
              <span className="text-gray-500 text-xs">Review next: </span>
              <span className="text-yellow-400 text-xs">{String(r.review_next)}</span>
            </div>
          )}
          <button
            onClick={() => onSelect(t.query)}
            className="text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Search for more on this →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'overfitting',
  'bias-variance tradeoff',
  'k-fold CV vs bootstrap',
  'random forest vs boosting',
  'logistic regression',
  'linear programming',
  'ER diagram vs normalization',
  'LangGraph interrupts',
  'Monte Carlo simulation',
  'decision analysis',
  'NLP transformers',
  'SQL KPI queries',
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AskMBAN() {
  const [query, setQuery]           = useState('')
  const [submitted, setSubmitted]   = useState('')
  const [mode, setMode]             = useState<'learn' | 'find'>('learn')
  const [inputFocused, setInputFocused] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const initializedFromUrl = useRef(false)

  const scopedCourse = searchParams.get('course') || undefined
  const qParam       = searchParams.get('q') || ''

  useEffect(() => {
    if (!initializedFromUrl.current) {
      initializedFromUrl.current = true
      if (qParam) { setQuery(qParam); setSubmitted(qParam) }
    }
  }, [qParam])

  const isMobile  = typeof window !== 'undefined' && window.innerWidth < 768
  const hideChips = inputFocused && isMobile

  const results = useMemo(() => runSearch(submitted, mode, scopedCourse), [submitted, mode, scopedCourse])
  const primary = useMemo(() => submitted ? findPrimaryAnswer(submitted, results) : null, [submitted, results])

  const topicResults      = results.filter(r => r.kind === 'topic')      as Extract<SearchResult, { kind: 'topic' }>[]
  const methodResults     = results.filter(r => r.kind === 'method')     as Extract<SearchResult, { kind: 'method' }>[]
  const assignmentResults = results.filter(r => r.kind === 'assignment') as Extract<SearchResult, { kind: 'assignment' }>[]
  const resourceResults   = results.filter(r => r.kind === 'resource')   as Extract<SearchResult, { kind: 'resource' }>[]
  const courseResults     = results.filter(r => r.kind === 'course')     as Extract<SearchResult, { kind: 'course' }>[]
  const slideResults      = results.filter(r => r.kind === 'slide')      as Extract<SearchResult, { kind: 'slide' }>[]
  const projectResults    = results.filter(r => r.kind === 'project')    as Extract<SearchResult, { kind: 'project' }>[]

  const handleSearch = (q: string) => { setQuery(q); setSubmitted(q) }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(query) }
  const handleClear  = () => { setQuery(''); setSubmitted('') }

  const totalSlides = slides.reduce((a, d) => a + d.slide_count, 0)

  // In Learn mode, show topics + resources prominently. In Find mode, show assignments + methods.
  const learnMode = mode === 'learn'

  return (
    <div className={`p-5 md:p-10 max-w-3xl mx-auto ${hideChips ? 'pt-3' : ''}`}>

      {/* Header */}
      {!hideChips && (
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Ask MBAN</h1>
          <p className="text-gray-400 text-sm">
            Ask a study question, compare methods, or find an assignment.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {topicsData.length} concepts · {methods.length} methods · {assignmentsData.length} assignments · {resourcesData.length} resources · {totalSlides} slides
          </p>
        </div>
      )}

      {/* Scoped course badge */}
      {scopedCourse && (
        <div className="flex items-center gap-2 mb-4 justify-center">
          <span className="bg-purple-900/40 border border-purple-700 text-purple-300 text-xs px-3 py-1 rounded-full flex items-center gap-2">
            Scoped to {scopedCourse.replace('MBAN_', 'MBAN ')}
            <button
              onClick={() => setSearchParams({})}
              className="text-purple-400 hover:text-white leading-none ml-1"
              aria-label="Clear scope"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Learn / Find toggle */}
      <div className="flex justify-center gap-2 mb-4">
        {([
          { id: 'learn', label: 'Learn', hint: 'concepts, topics, resources' },
          { id: 'find',  label: 'Find',  hint: 'assignments, methods, examples' },
        ] as const).map(({ id, label, hint }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            title={hint}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              mode === id
                ? 'bg-purple-700 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={
              learnMode
                ? 'Explain overfitting, normalization, LangGraph interrupts…'
                : 'Find assignment on SQL, project using random forest, method for classification…'
            }
            className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 rounded-2xl px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none transition-colors pr-24"
            enterKeyHint="search"
            inputMode="search"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            autoFocus={!isMobile}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Ask
          </button>
        </div>

        {/* Suggestion chips */}
        {!hideChips && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleSearch(s)}
                style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {submitted && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-lg">
              <span className="text-purple-300">"{submitted}"</span>
            </h2>
            <button onClick={handleClear} className="text-gray-600 hover:text-gray-400 text-xs underline">
              Clear
            </button>
          </div>

          {results.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center">
              <p className="text-gray-400">No results for "{submitted}"</p>
              <p className="text-gray-600 text-xs mt-1">
                Try a concept name, method, assignment topic, or course code (e.g. 5560)
              </p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Primary Answer */}
              {primary && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Primary Answer
                  </div>
                  <PrimaryAnswerCard answer={primary} />
                </div>
              )}

              {/* Learn mode: Topics first, then Resources */}
              {learnMode && topicResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Concepts ({topicResults.length})
                  </div>
                  <div className="space-y-3">
                    {topicResults.slice(0, 5).map(r => (
                      <TopicCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {learnMode && resourceResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Resources ({resourceResults.length})
                  </div>
                  <div className="space-y-3">
                    {resourceResults.slice(0, 4).map(r => (
                      <ResourceCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* Find mode: Assignments first */}
              {!learnMode && assignmentResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Assignments ({assignmentResults.length})
                  </div>
                  <div className="space-y-3">
                    {assignmentResults.slice(0, 5).map(r => (
                      <AssignmentCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* Methods */}
              {methodResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Methods ({methodResults.length})
                  </div>
                  <div className="space-y-3">
                    {methodResults.slice(0, 5).map(r => (
                      <MethodCard key={r.item.method_name} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* Find mode: Topics after methods */}
              {!learnMode && topicResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Concepts ({topicResults.length})
                  </div>
                  <div className="space-y-3">
                    {topicResults.slice(0, 4).map(r => (
                      <TopicCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {courseResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Courses ({courseResults.length})
                  </div>
                  <div className="space-y-3">
                    {courseResults.map(r => (
                      <CourseCard key={r.item.course_code} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* Applied Examples */}
              {projectResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Applied Examples ({projectResults.length})
                  </div>
                  <div className="space-y-3">
                    {projectResults.map(r => (
                      <ProjectCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* Source Snippets */}
              {slideResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Source Snippets ({slideResults.length})
                  </div>
                  <div className="space-y-3">
                    {slideResults.slice(0, 6).map((r, i) => (
                      <SlideCard key={i} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* Learn mode: Resources after slides */}
              {learnMode && assignmentResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Assignments ({assignmentResults.length})
                  </div>
                  <div className="space-y-3">
                    {assignmentResults.slice(0, 3).map(r => (
                      <AssignmentCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Common questions — idle state */}
      {!submitted && !hideChips && (
        <div>
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg mb-1">Common Questions</h2>
            <p className="text-gray-500 text-sm">Curated Q&amp;A pairs — click to expand</p>
          </div>
          <div className="space-y-3">
            {templates.map((t, i) => (
              <CommonQuestionCard key={i} t={t} onSelect={handleSearch} />
            ))}
          </div>
        </div>
      )}

      {/* Common questions — below results */}
      {submitted && results.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-white font-semibold">Common Questions</h2>
            <button onClick={handleClear} className="text-xs text-gray-500 hover:text-gray-300 underline">
              Browse all
            </button>
          </div>
          <div className="space-y-3">
            {templates.slice(0, 3).map((t, i) => (
              <CommonQuestionCard key={i} t={t} onSelect={handleSearch} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
