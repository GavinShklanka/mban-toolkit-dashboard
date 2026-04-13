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

const TYPO_MAP: Record<string, string> = {
  'texhnicques': 'techniques',
  'algorhyms': 'algorithms',
  'bayse': 'bayes',
  'logisitic': 'logistic',
  'normilization': 'normalization',
  'simmulation': 'simulation',
  'foreest': 'forest',
  'bootsrap': 'bootstrap',
  'regrresion': 'regression',
  'classifcation': 'classification',
  'clustring': 'clustering',
  'optimizaton': 'optimization',
  'neurl': 'neural',
  'transfomer': 'transformer',
}

function normalizeQuery(q: string): string {
  let normalized = q.toLowerCase().trim()
  // Repair typos first
  for (const [typo, fix] of Object.entries(TYPO_MAP)) {
    normalized = normalized.replace(new RegExp(typo, 'gi'), fix)
  }
  // Expand abbreviations
  for (const [abbr, full] of Object.entries(ABBR_MAP)) {
    const re = new RegExp(`\\b${abbr}\\b`, 'gi')
    normalized = normalized.replace(re, full)
  }
  return normalized
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

type Intent = 'compare' | 'explain' | 'when_to_use' | 'assignment' | 'resource' | 'relation' | 'general'

function detectIntent(q: string): Intent {
  const lower = q.toLowerCase()
  if (/\bvs\b|versus|compare|difference between|or\b/.test(lower)) return 'compare'
  if (/\bexplain|what is|define|how does|why does|mean\b/.test(lower)) return 'explain'
  if (/\bwhen (to|should|would|do)|which should|best for/.test(lower)) return 'when_to_use'
  if (/\bassignment|homework|project|deliverable|due/.test(lower)) return 'assignment'
  if (/\bresource|video|watch|read|learn more|tutorial|link/.test(lower)) return 'resource'
  if (/\blike\b|similar to|related to|same family|alternatives to|techniques like|methods like|what kind of|closest thing to/.test(lower)) return 'relation'
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
  activeTopicId?: string,
): SearchResult[] {
  if (!rawQuery.trim()) return []
  const q = normalizeQuery(rawQuery.trim())
  const intent = detectIntent(rawQuery)
  const results: SearchResult[] = []
  const scopeCode = scopedCourse ? scopedCourse.replace('MBAN_', '') : ''
  const activeTopic = activeTopicId ? topicsData.find(t => t.id === activeTopicId) : undefined

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
    // Significantly stronger scope boost so course-scoped results always rise first
    const scopeBoost = scopeCode && courseNum === scopeCode ? 50 : 0
    // Exact active topic: top of results
    const topicBoost = activeTopicId && t.id === activeTopicId ? 100 : 0
    // Neighbor/followup of active topic
    const neighborBoost = activeTopic
      ? [...(activeTopic.nearest_neighbors as string[]), ...(activeTopic.suggested_followups as string[])]
          .some(n => n.toLowerCase() === t.label.toLowerCase()) ? 30 : 0
      : 0
    const intentBoost = intent === 'explain' ? 2 : 0

    let reason = 'Matched on concept'
    if (labelScore > 0) reason = 'Matched on topic label'
    else if (aliasScore > 0) reason = 'Matched on alias'
    if (scopeBoost > 0) reason += ` · scoped to ${scopedCourse?.replace('MBAN_', 'MBAN ')}`

    results.push({ kind: 'topic', score: base + scopeBoost + topicBoost + neighborBoost + intentBoost, item: t, reason })
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

    const scopeBoost = scopeCode && (m.linked_courses || []).some(c => c.includes(scopeCode)) ? 30 : 0
    // Boost methods referenced by active topic
    const topicMethodBoost = activeTopic
      ? (activeTopic.related_methods as string[]).some(rm => rm.toLowerCase() === m.method_name.toLowerCase()) ? 40 : 0
      : 0
    const intentBoost = intent === 'when_to_use' ? 2 : 0

    let reason = 'Matched on method definition'
    if (nameScore > 0)   reason = 'Matched on method name'
    else if (useScore > 0) reason = 'Matched on when to use'

    results.push({ kind: 'method', score: base + scopeBoost + topicMethodBoost + intentBoost, item: m, reason })
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

    const scopeBoost = scopeCode && c.course_code === `MBAN ${scopeCode}` ? 50 : 0

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
    const scopeBoost = scopeCode && a.course_code.includes(scopeCode) ? 40 : 0
    // Directly referenced by active topic
    const topicRefBoost = activeTopic
      ? (activeTopic.assignment_refs as string[]).includes(a.id) ? 75 : 0
      : 0

    results.push({ kind: 'assignment', score: base + modeBoost + scopeBoost + topicRefBoost, item: a, reason: 'Matched on assignment' })
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
    // Boost resources directly tied to active topic
    const topicResourceBoost = activeTopic
      ? (r.topic_ids as string[]).includes(activeTopic.id) ? 50 : 0
      : 0

    results.push({ kind: 'resource', score: base + modeBoost + topicResourceBoost, item: r, reason: 'Matched on resource' })
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
  | { type: 'bridge';   family: ConceptFamily; query: string; suggestions: string[] }
  | { type: 'none' }

function findPrimaryAnswer(rawQuery: string, results: SearchResult[], activeTopicId?: string): PrimaryAnswer {
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

  // Active topic from URL param — highest priority after template
  if (activeTopicId) {
    const activeTopic = topicsData.find(t => t.id === activeTopicId)
    if (activeTopic) {
      const bridge = findBridgeFamily(rawQuery)
      return { type: 'topic', topic: activeTopic, bridge }
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

  // Bridge answer: when concept family matches but no exact topic/method hit
  const bridgeFamily = findBridgeFamily(rawQuery)
  if (bridgeFamily) {
    const suggestions = topicsData
      .filter(t => (bridgeFamily.topic_ids as string[]).includes(t.id))
      .map(t => t.label)
      .slice(0, 5)
    return { type: 'bridge', family: bridgeFamily, query: rawQuery, suggestions }
  }

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

function PrimaryAnswerCard({ answer, onChipClick }: { answer: PrimaryAnswer; onChipClick?: (s: string) => void }) {
  if (answer.type === 'none') {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-center">
        <p className="text-gray-500 text-sm">No direct match found. Try a concept name, method, course code, or one of the chips below.</p>
      </div>
    )
  }

  if (answer.type === 'bridge') {
    const { family, query, suggestions } = answer
    const familyTopics = topicsData.filter(t => (family.topic_ids as string[]).includes(t.id))
    return (
      <div className="bg-blue-950/30 border border-blue-700/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-700/40 text-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Closest Academic Match
          </span>
        </div>
        <div className="text-gray-400 text-xs">Best interpretation of "{query}"</div>
        <div className="text-white font-semibold text-base">{family.label}</div>
        <div className="bg-gray-900/60 rounded-xl p-3">
          <p className="text-gray-100 text-sm leading-relaxed">{family.description}</p>
          <p className="text-gray-500 text-xs mt-2 italic">Core tension: {family.core_tension}</p>
        </div>
        <div className="bg-gray-900/40 rounded-xl p-3 border border-blue-800/30">
          <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">How it connects</div>
          <p className="text-gray-300 text-sm">{family.one_liner}</p>
        </div>
        {familyTopics.length > 0 && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">Topics in this family</div>
            <div className="flex flex-wrap gap-1.5">
              {familyTopics.map(t => (
                <button
                  key={t.id}
                  onClick={() => onChipClick?.(t.label)}
                  className="bg-gray-800 border border-gray-700 hover:border-blue-600 text-gray-300 hover:text-white text-xs px-2 py-0.5 rounded-lg transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {suggestions.length > 0 && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">You might be asking about:</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => onChipClick?.(s)}
                  className="bg-blue-900/30 border border-blue-800/50 text-blue-300 hover:text-white text-xs px-2.5 py-1 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
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

    // Layer 2: wire through topic refs
    const topicAssignments = assignmentsData.filter(a =>
      (topic.assignment_refs as string[]).includes(a.id)
    )
    const topicResources = resourcesData.filter(r =>
      (r.topic_ids as string[]).includes(topic.id)
    )

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

        {/* Assignment anchor — why it's relevant */}
        {topicAssignments.length > 0 && (
          <div className="bg-orange-900/15 border border-orange-800/30 rounded-xl p-3">
            <div className="text-orange-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Assignment / Example Anchor</div>
            <div className="space-y-2">
              {topicAssignments.slice(0, 2).map(a => (
                <div key={a.id}>
                  <div className="text-gray-200 text-sm font-medium">{a.title}</div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    This is where you applied {topic.label} — {a.description.slice(0, 100)}{a.description.length > 100 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reinforcement resources */}
        {topicResources.length > 0 && (
          <div className="bg-green-900/10 border border-green-800/25 rounded-xl p-3">
            <div className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Reinforce This Concept</div>
            <div className="space-y-2">
              {topicResources.slice(0, 2).map(r => (
                <div key={r.id} className="flex items-start justify-between gap-2">
                  <div>
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-green-300 hover:text-green-200 text-sm font-medium transition-colors">
                      {r.title} ↗
                    </a>
                    <div className="text-gray-500 text-xs">{r.author}{'duration_min' in r && (r as Resource & { duration_min?: number }).duration_min ? ` · ${(r as Resource & { duration_min?: number }).duration_min} min` : ''}</div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{r.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested followups */}
        {(topic.suggested_followups as string[]).length > 0 && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">Suggested follow-ups</div>
            <div className="flex flex-wrap gap-1.5">
              {(topic.suggested_followups as string[]).map(f => (
                <button
                  key={f}
                  onClick={() => onChipClick?.(f)}
                  className="bg-gray-800 border border-gray-700 hover:border-purple-600 text-gray-300 hover:text-white text-xs px-2 py-0.5 rounded-lg transition-colors"
                >
                  {f}
                </button>
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
    video:               'bg-red-900/30 text-red-300 border-red-800/40',
    article:             'bg-blue-900/30 text-blue-300 border-blue-800/40',
    docs:                'bg-cyan-900/30 text-cyan-300 border-cyan-800/40',
    course:              'bg-green-900/30 text-green-300 border-green-800/40',
    interactive:         'bg-yellow-900/30 text-yellow-300 border-yellow-800/40',
    diagram:             'bg-violet-900/30 text-violet-300 border-violet-800/40',
    figure:              'bg-violet-900/30 text-violet-300 border-violet-800/40',
    infographic:         'bg-pink-900/30 text-pink-300 border-pink-800/40',
    cheat_sheet:         'bg-amber-900/30 text-amber-300 border-amber-800/40',
    explainer_article:   'bg-blue-900/30 text-blue-300 border-blue-800/40',
  }
  const typeCls = typeColors[item.type] || 'bg-gray-700 text-gray-300 border-gray-600'
  const usageLabel = (item as Resource & { usage_label?: string }).usage_label
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
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded border ${typeCls}`}>{item.type}</span>
          {usageLabel && (
            <span className="text-xs text-emerald-400 font-medium">{usageLabel}</span>
          )}
        </div>
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

const GLOBAL_LEARN_CHIPS = [
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

function getSuggestionChips(
  scopedCourse: string | null,
  activeTopic: Topic | null,
): string[] {
  if (!scopedCourse) return GLOBAL_LEARN_CHIPS

  const courseCode = scopedCourse.startsWith('MBAN_') ? scopedCourse : scopedCourse.replace('MBAN ', 'MBAN_')

  // Active topic → followups that exist in same course
  if (activeTopic) {
    const courseTopicLabels = new Set(
      topicsData.filter(t => t.course_code === courseCode).map(t => t.label.toLowerCase())
    )
    const followups = [
      ...(activeTopic.suggested_followups as string[]),
      ...(activeTopic.nearest_neighbors as string[]),
    ].filter(f => courseTopicLabels.has(f.toLowerCase()))
    if (followups.length >= 3) return followups.slice(0, 8)
  }

  // Default: all topic labels for this course
  return topicsData.filter(t => t.course_code === courseCode).map(t => t.label).slice(0, 8)
}

const SCOPED_PLACEHOLDERS: Record<string, string> = {
  'MBAN_5550': 'Ask about ER diagrams, normalization, SQL joins, or schema design',
  'MBAN_5560': 'Ask about overfitting, cross-validation, random forest, or boosting',
  'MBAN_5540': 'Ask about LP formulation, duality, decision analysis, or dynamic programming',
  'MBAN_5570': 'Ask about Monte Carlo simulation, financial statements, or equity research',
  'MBAN_5510': 'Ask about AI agents, LangChain, LangGraph interrupts, or middleware',
  'MBAN_5520': 'Ask about regression, prediction intervals, or business prediction',
  'MBAN_5800': 'Ask about ethics vs morality, AI bias, or motivated reasoning',
  'MBAN_5502': 'Ask about Python, OOP, pandas, or experimental design',
}

function getScopedPlaceholder(scopedCourse: string | null): string {
  if (!scopedCourse) return 'Explain overfitting, normalization, LangGraph interrupts…'
  const courseCode = scopedCourse.startsWith('MBAN_') ? scopedCourse : scopedCourse.replace('MBAN ', 'MBAN_')
  if (SCOPED_PLACEHOLDERS[courseCode]) return SCOPED_PLACEHOLDERS[courseCode]
  const samples = topicsData.filter(t => t.course_code === courseCode).slice(0, 3).map(t => t.label).join(', ')
  return samples ? `Ask about topics from this course: ${samples}` : 'Ask a question about this course…'
}

// ─── Learn-mode Helpers ──────────────────────────────────────────────────────

type BestNextAction = { type: 'assignment' | 'compare' | 'resource'; title: string; reason: string; id?: string; url?: string }

function getBestNextAction(
  activeTopic: Topic | null,
  assignments: Assignment[],
  resources: Resource[],
): BestNextAction | null {
  if (!activeTopic) return null
  // A. Best assignment tied to matched topic
  if ((activeTopic.assignment_refs as string[]).length) {
    const best = assignments.find(a => (activeTopic.assignment_refs as string[]).includes(a.id))
    if (best) return { type: 'assignment', title: best.title, reason: 'Review the assignment where you applied this concept', id: best.id }
  }
  // B. Best comparison from nearest neighbors
  if ((activeTopic.nearest_neighbors as string[]).length) {
    return { type: 'compare', title: (activeTopic.nearest_neighbors as string[])[0], reason: 'Compare with a closely related concept' }
  }
  // D. Best reinforcement resource
  const resource = resources.find(r => {
    const tags = (r as Resource & { concept_tags?: string[] }).concept_tags
    if (!tags) return false
    return tags.some(t => [activeTopic.label, ...(activeTopic.aliases as string[])].some(a =>
      a.toLowerCase().includes(t.toLowerCase())
    ))
  })
  if (resource) return { type: 'resource', title: resource.title, reason: 'Reinforce with an external resource', url: resource.url }
  return null
}

function getStudyPath(
  activeTopic: Topic | null,
  assignments: Assignment[],
  resources: Resource[],
): { assignment?: string; compare?: string; reinforce?: string } | null {
  if (!activeTopic) return null
  const path: { assignment?: string; compare?: string; reinforce?: string } = {}
  const best = assignments.find(a => (activeTopic.assignment_refs as string[])?.includes(a.id))
  if (best) path.assignment = best.title
  const followups = activeTopic.suggested_followups as string[]
  const neighbors = activeTopic.nearest_neighbors as string[]
  if (followups.length) path.compare = followups[0]
  else if (neighbors.length) path.compare = neighbors[0]
  const bestResource = resources.find(r => {
    const tags = (r as Resource & { concept_tags?: string[] }).concept_tags
    if (!tags) return false
    return tags.some(t => [activeTopic.label, ...(activeTopic.aliases as string[])].some(a =>
      a.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(a.toLowerCase())
    ))
  })
  if (bestResource) path.reinforce = bestResource.title
  return Object.keys(path).length >= 2 ? path : null
}

function getFollowUpChips(
  activeTopic: Topic | null,
  bridgeFamily: ConceptFamily | null,
  scopedCourse: string | null | undefined,
): string[] {
  if (activeTopic) {
    const chips = [
      ...(activeTopic.suggested_followups as string[]),
      ...(activeTopic.nearest_neighbors as string[]),
    ]
    const courseTopics = topicsData
      .filter(t => t.course_code === activeTopic.course_code && t.id !== activeTopic.id)
      .map(t => t.label)
    return [...new Set([...chips, ...courseTopics])].slice(0, 8)
  }
  if (bridgeFamily) {
    return topicsData
      .filter(t => (bridgeFamily.topic_ids as string[]).includes(t.id))
      .map(t => t.label)
      .slice(0, 8)
  }
  if (scopedCourse) {
    const cc = scopedCourse.startsWith('MBAN_') ? scopedCourse : scopedCourse.replace('MBAN ', 'MBAN_')
    return topicsData.filter(t => t.course_code === cc).map(t => t.label).slice(0, 8)
  }
  return GLOBAL_LEARN_CHIPS.slice(0, 8)
}

// ─── Fallback heuristics for Learn-mode card enrichment ───────────────────────

const COURSE_HEURISTICS: Record<string, { why: string; artifact: string; look_for: string; mistake: string }> = {
  '5550': {
    why: 'Grounds data modeling theory in a real schema design decision.',
    artifact: 'Your ERD diagram or normalization steps document.',
    look_for: 'Primary/foreign key relationships and normal form violations.',
    mistake: 'Mixing up conceptual vs physical schema levels, or skipping 3NF checks.',
  },
  '5560': {
    why: 'Applies model evaluation and selection to a real prediction task.',
    artifact: 'Your model comparison table or validation learning curve.',
    look_for: 'How evaluation metrics vary across folds, and where the model overfits.',
    mistake: 'Tuning hyperparameters using test-set feedback (data leakage).',
  },
  '5540': {
    why: 'Demonstrates how to formulate and solve a real business optimization problem.',
    artifact: 'Your LP formulation worksheet or sensitivity analysis report.',
    look_for: 'Objective function structure, binding constraints, and shadow prices.',
    mistake: 'Misidentifying decision variables vs parameters, or relaxing integer constraints incorrectly.',
  },
  '5570': {
    why: 'Connects simulation and financial modeling to real decision uncertainty.',
    artifact: 'Your Monte Carlo output distribution or DCF sensitivity table.',
    look_for: 'Confidence intervals, sensitivity drivers, and scenario branching.',
    mistake: 'Treating a point estimate as certain when the input is a distribution.',
  },
  '5510': {
    why: 'Applies agentic AI concepts to a working pipeline or workflow.',
    artifact: 'Your LangGraph state machine diagram or agent interrupt log.',
    look_for: 'State transitions, tool call sequences, and human-in-the-loop checkpoints.',
    mistake: 'Confusing agent "memory" (context window) with persistent storage.',
  },
  '5520': {
    why: 'Puts regression and prediction modeling into a business context.',
    artifact: 'Your regression coefficient table or prediction interval output.',
    look_for: 'R², residual patterns, and how prediction intervals widen at extremes.',
    mistake: 'Interpreting correlation coefficients as causal effects.',
  },
  '5800': {
    why: 'Applies ethical reasoning to a real AI or data governance scenario.',
    artifact: 'Your ethics framework analysis or stakeholder impact map.',
    look_for: 'Competing stakeholder interests and normative vs consequentialist framings.',
    mistake: 'Assuming technical fairness metrics fully capture ethical fairness.',
  },
  '5502': {
    why: 'Builds your applied Python and experimental design intuition.',
    artifact: 'Your code notebook or experimental results summary.',
    look_for: 'OOP structure, pandas pipeline steps, and experimental controls.',
    mistake: 'Confusing descriptive statistics with inferential conclusions.',
  },
}

const METHOD_HEURISTICS: Record<string, { refresher: string; confusion: string }> = {
  predictive:   { refresher: 'Review the train/test split and how the evaluation metric was chosen.', confusion: 'Confusing in-sample fit with out-of-sample predictive power.' },
  prescriptive: { refresher: 'Restate the objective function and identify binding constraints.', confusion: 'Treating a relaxed LP solution as feasible for an integer problem.' },
  descriptive:  { refresher: 'Clarify what the statistic summarizes and its assumptions.', confusion: 'Reporting descriptive statistics as if they imply causation.' },
  diagnostic:   { refresher: 'Trace which variables explain the target outcome and in which direction.', confusion: 'Assuming correlation between features and outcome means one drives the other.' },
  ml_ai:        { refresher: 'Revisit the loss function and the model\'s inductive bias.', confusion: 'Overfitting to training accuracy while ignoring validation behavior.' },
  agentic:      { refresher: 'Re-read the state machine definition and tool invocation sequence.', confusion: 'Blending agent orchestration logic with individual tool implementation details.' },
}

// ─── Enhanced Learn-mode Cards ────────────────────────────────────────────────

function LearnAssignmentCard({ item, reason }: { item: Assignment; reason: string }) {
  const courseNum = item.course_code.replace('MBAN_', 'MBAN ')
  const code = item.course_code.replace('MBAN_', '')
  const h = COURSE_HEURISTICS[code]
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
        }`}>{item.type}</span>
      </div>
      <div className="bg-gray-900/60 rounded-xl p-3">
        <p className="text-gray-200 text-sm leading-relaxed">{item.description}</p>
      </div>
      {h && (
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="bg-blue-900/10 border border-blue-800/25 rounded-lg p-2.5">
            <span className="text-blue-400 font-semibold">Why this helps: </span>
            <span className="text-gray-300">{h.why}</span>
          </div>
          <div className="bg-amber-900/10 border border-amber-800/25 rounded-lg p-2.5">
            <span className="text-amber-400 font-semibold">Best artifact to review: </span>
            <span className="text-gray-300">{h.artifact}</span>
          </div>
          <div className="bg-green-900/10 border border-green-800/25 rounded-lg p-2.5">
            <span className="text-green-400 font-semibold">What to look for: </span>
            <span className="text-gray-300">{h.look_for}</span>
          </div>
          <div className="bg-red-900/10 border border-red-800/25 rounded-lg p-2.5">
            <span className="text-red-400 font-semibold">Common mistake: </span>
            <span className="text-gray-300">{h.mistake}</span>
          </div>
        </div>
      )}
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

function LearnMethodCard({ item, assignments, reason }: { item: typeof methods[0]; assignments: Assignment[]; reason: string }) {
  const level = (item.analytics_level || '').toLowerCase().replace(/[^a-z_]/g, '')
  const h = METHOD_HEURISTICS[level] || METHOD_HEURISTICS['predictive']
  // Best assignment example: find an assignment from a linked course
  const bestAssignment = assignments.find(a =>
    (item.linked_courses || []).some((c: string) => a.course_code.includes(c))
  )
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
      <div className="grid grid-cols-1 gap-2 text-xs">
        {(item.linked_courses || []).length > 0 && (
          <div className="bg-purple-900/10 border border-purple-800/25 rounded-lg p-2.5">
            <span className="text-purple-400 font-semibold">Used in: </span>
            <span className="text-gray-300">{(item.linked_courses as string[]).map(c => `MBAN ${c}`).join(', ')}</span>
          </div>
        )}
        {bestAssignment && (
          <div className="bg-orange-900/10 border border-orange-800/25 rounded-lg p-2.5">
            <span className="text-orange-400 font-semibold">Best assignment example: </span>
            <span className="text-gray-300">{bestAssignment.title}</span>
          </div>
        )}
        <div className="bg-cyan-900/10 border border-cyan-800/25 rounded-lg p-2.5">
          <span className="text-cyan-400 font-semibold">Fastest refresher: </span>
          <span className="text-gray-300">{h.refresher}</span>
        </div>
        <div className="bg-red-900/10 border border-red-800/25 rounded-lg p-2.5">
          <span className="text-red-400 font-semibold">Typical confusion: </span>
          <span className="text-gray-300">{h.confusion}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-gray-700/60">
        <div className="flex gap-3">
          <Link to="/methods" className="text-purple-400 hover:text-purple-300 underline">Full detail →</Link>
          <Link to="/model-lab" className="text-blue-400 hover:text-blue-300 underline">Compare in Model Lab →</Link>
        </div>
        <span className="text-gray-600 italic">{reason}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AskMBAN() {
  const [query, setQuery]               = useState('')
  const [submitted, setSubmitted]       = useState('')
  const [hasSearched, setHasSearched]   = useState(false)
  const [mode, setMode]                 = useState<'learn' | 'find'>('learn')
  const [inputFocused, setInputFocused] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const initializedFromUrl = useRef(false)

  const scopedCourse = searchParams.get('course') || undefined
  const topicParam   = searchParams.get('topic')  || ''
  const qParam       = searchParams.get('q')      || ''
  const modeParam    = searchParams.get('mode')   || ''

  useEffect(() => {
    if (!initializedFromUrl.current) {
      initializedFromUrl.current = true
      if (modeParam === 'learn' || modeParam === 'find') setMode(modeParam)
      if (qParam) { setQuery(qParam); setSubmitted(qParam); setHasSearched(true) }
    }
  }, [qParam, modeParam])

  const isMobile  = typeof window !== 'undefined' && window.innerWidth < 768
  const hideChips = inputFocused && isMobile

  const activeTopicFromUrl = topicParam ? topicsData.find(t => t.id === topicParam) || null : null

  const results = useMemo(
    () => runSearch(submitted, mode, scopedCourse, topicParam || undefined),
    [submitted, mode, scopedCourse, topicParam]
  )
  const primary = useMemo(
    () => submitted ? findPrimaryAnswer(submitted, results, topicParam || undefined) : null,
    [submitted, results, topicParam]
  )

  const activeTopic: Topic | null = activeTopicFromUrl ||
    (primary?.type === 'topic' ? primary.topic : null)

  const bridgeFamily: ConceptFamily | null =
    primary?.type === 'bridge' ? primary.family :
    primary?.type === 'topic' && primary.bridge ? primary.bridge :
    null

  const topicResults      = results.filter(r => r.kind === 'topic')      as Extract<SearchResult, { kind: 'topic' }>[]
  const methodResults     = results.filter(r => r.kind === 'method')     as Extract<SearchResult, { kind: 'method' }>[]
  const assignmentResults = results.filter(r => r.kind === 'assignment') as Extract<SearchResult, { kind: 'assignment' }>[]
  const resourceResults   = results.filter(r => r.kind === 'resource')   as Extract<SearchResult, { kind: 'resource' }>[]
  const courseResults     = results.filter(r => r.kind === 'course')     as Extract<SearchResult, { kind: 'course' }>[]
  const slideResults      = results.filter(r => r.kind === 'slide')      as Extract<SearchResult, { kind: 'slide' }>[]
  const projectResults    = results.filter(r => r.kind === 'project')    as Extract<SearchResult, { kind: 'project' }>[]

  // Learn-mode enrichment
  const studyPath      = getStudyPath(activeTopic, assignmentsData, resourcesData)
  const bestNextAction = getBestNextAction(activeTopic, assignmentsData, resourcesData)
  const followUpChips  = getFollowUpChips(activeTopic, bridgeFamily, scopedCourse || null)

  const handleSearch = (q: string) => { setQuery(q); setSubmitted(q); setHasSearched(true) }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(query); setHasSearched(true) }
  const handleClear  = () => { setQuery(''); setSubmitted(''); setHasSearched(false) }

  const totalSlides = slides.reduce((a, d) => a + d.slide_count, 0)

  // Scoped course stats for header
  const scopedCC = scopedCourse?.startsWith('MBAN_') ? scopedCourse : scopedCourse?.replace('MBAN ', 'MBAN_')
  const scopedTopicCount      = scopedCC ? topicsData.filter(t => t.course_code === scopedCC).length : 0
  const scopedAssignmentCount = scopedCC ? assignmentsData.filter(a => a.course_code.includes(scopedCC.replace('MBAN_', ''))).length : 0

  return (
    <div className={`p-5 md:p-10 max-w-3xl mx-auto ${hideChips ? 'pt-3' : ''}`}>

      {/* Header */}
      {!hideChips && (
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Ask MBAN</h1>
          {scopedCourse ? (
            <p className="text-purple-300 text-sm font-medium">
              Review {scopedCourse.replace('MBAN_', 'MBAN ')} concepts, assignments, and source material
            </p>
          ) : (
            <p className="text-gray-400 text-sm">
              Ask a study question, compare methods, or find an assignment.
            </p>
          )}
          <p className="text-gray-600 text-xs mt-1">
            {scopedCourse
              ? `${scopedTopicCount} core topics · ${scopedAssignmentCount} assignments`
              : `${topicsData.length} concepts · ${methods.length} methods · ${assignmentsData.length} assignments · ${resourcesData.length} resources · ${totalSlides} slides`
            }
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

      {/* Best starting points tray — scoped, no query yet */}
      {scopedCourse && !submitted && !hideChips && (
        <div className="mb-5 bg-gray-800/50 border border-gray-700/60 rounded-2xl p-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Best starting points</p>
          <div className="flex flex-wrap gap-2">
            {topicsData
              .filter(t => t.course_code === scopedCC)
              .slice(0, 6)
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSearch(t.label)}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                  className="text-xs bg-gray-700 hover:bg-gray-600 border border-purple-800/40 text-purple-300 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  {t.label}
                </button>
              ))}
          </div>
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
              mode === 'learn'
                ? getScopedPlaceholder(scopedCourse || null)
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

        {/* Chips: follow-up after search, starter wall before */}
        {!hideChips && (
          hasSearched && submitted && results.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs text-gray-500 text-center mb-2">Continue reviewing:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {followUpChips.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSearch(s)}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                    className="text-xs bg-gray-800 text-blue-300 border border-blue-800/50 hover:bg-gray-700 hover:border-blue-600 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasSearched ? (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {getSuggestionChips(scopedCourse || null, activeTopic).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSearch(s)}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                  className={`text-xs hover:bg-gray-700 border hover:border-gray-600 px-3 py-1.5 rounded-full transition-colors ${
                    scopedCourse
                      ? 'bg-gray-800 text-purple-300 border-purple-800/50 hover:text-white'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null
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
            scopedCourse ? (
              <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">No direct answer found in <span className="text-purple-300">{scopedCourse.replace('MBAN_', 'MBAN ')}</span>.</p>
                <p className="text-gray-600 text-xs mb-3">These are the closest topics in this course:</p>
                <div className="flex flex-wrap gap-2">
                  {topicsData
                    .filter(t => t.course_code === scopedCourse)
                    .slice(0, 6)
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSearch(t.label)}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-full text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center">
                <p className="text-gray-400">No results for "{submitted}"</p>
                <p className="text-gray-600 text-xs mt-1">
                  Try a concept name, method, assignment topic, or course code (e.g. 5560)
                </p>
              </div>
            )
          ) : mode === 'learn' ? (
            <div className="space-y-8">

              {/* 1. Primary Answer + Study Path */}
              {primary && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Primary Answer
                  </div>
                  <PrimaryAnswerCard answer={primary} onChipClick={handleSearch} />
                  {studyPath && (
                    <div className="bg-slate-800/40 rounded-lg p-3 mt-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Study path from here</p>
                      <div className="space-y-1.5">
                        {studyPath.assignment && <p className="text-sm"><span className="text-blue-400">First review:</span> <span className="text-slate-300">{studyPath.assignment}</span></p>}
                        {studyPath.compare && <p className="text-sm"><span className="text-emerald-400">Then compare:</span> <span className="text-slate-300">{studyPath.compare}</span></p>}
                        {studyPath.reinforce && <p className="text-sm"><span className="text-purple-400">Then reinforce:</span> <span className="text-slate-300">{studyPath.reinforce}</span></p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Best Next Action */}
              {bestNextAction && (
                <div className="bg-slate-800/60 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">Best next action</p>
                  <p className="text-white font-medium">{bestNextAction.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{bestNextAction.reason}</p>
                </div>
              )}

              {/* 3. Assignments — enhanced Learn-mode cards */}
              {assignmentResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Assignments ({assignmentResults.length})
                  </div>
                  <div className="space-y-3">
                    {assignmentResults.slice(0, 5).map(r => (
                      <LearnAssignmentCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Methods — enhanced Learn-mode cards */}
              {methodResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Methods ({methodResults.length})
                  </div>
                  <div className="space-y-3">
                    {methodResults.slice(0, 5).map(r => (
                      <LearnMethodCard key={r.item.method_name} item={r.item} assignments={assignmentsData} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Applied Examples */}
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

              {/* 6. Source Snippets */}
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

              {/* 7. Reinforcement Material */}
              {resourceResults.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Reinforcement Material ({resourceResults.length})
                  </div>
                  <div className="space-y-3">
                    {resourceResults.slice(0, 4).map(r => (
                      <ResourceCard key={r.item.id} item={r.item} reason={r.reason} />
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-8">

              {/* Find mode — keep original order */}

              {primary && (
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Primary Answer
                  </div>
                  <PrimaryAnswerCard answer={primary} onChipClick={handleSearch} />
                </div>
              )}

              {assignmentResults.length > 0 && (
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

              {topicResults.length > 0 && (
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
