# MBAN Toolkit Dashboard

A phone-viewable, portfolio-grade knowledge system dashboard for the Master of Business Analytics (MBAN) program at Saint Mary's University.

**Live site:** https://GavinShklanka.github.io/mban-toolkit-dashboard

## What This Dashboard Is

A governed knowledge system showing:
- What was learned, where, and in which courses
- How analytics concepts connect across the 6-stage Analytics Ladder (Descriptive to Agentic AI)
- Which methods and tools apply to which business problems
- What governance and risk concerns matter for each method
- The evidence quality behind every claim

## How Evidence Works

Every method, course, and claim has an evidence tier:

| Badge | Tier | Meaning |
|---|---|---|
| Outline (green) | full_outline_confirmed | Full course outline uploaded and verified |
| Artifact (blue) | partial_artifacts_only | Evidence from assignments, exams, or labs only |
| Provisional (yellow) | user_confirmed_reconstruction | User-reconstructed from memory + artifacts, no outline |
| Gap (red) | unresolved | Course identity or content unknown |

## What "User-Confirmed Reconstruction" Means for MBAN 5540

MBAN 5540 (Optimization & Decision Analysis, Instructor: Majid Taghavi) was not accompanied by an uploaded course outline. All content for this course -- including LP formulation, Integer Programming, Duality, Sensitivity Analysis, Decision Analysis (EMV/EVPI), Multi-objective optimization, Gurobi, and Excel Solver -- was reconstructed from exam preparation materials and assignment briefs submitted during the course.

Topics are labeled "Provisional" and marked as partial_artifacts_only evidence. They represent high-confidence reconstruction but are not outline-verified.

## Pages

1. Knowledge Cockpit -- Metric overview, evidence health, confusion pairs, quick navigation
2. Analytics Ladder -- 6-stage progression with methods, tools, governance per stage
3. Course Intelligence -- 9 course cards with full detail drill-down
4. Method Registry -- 35+ searchable/filterable methods with governance risks
5. Solution Router -- Map business problems to candidate methods and tools
6. Interactive Refresh -- 7 Q&A pairs + 25 self-test prompts by topic
7. Governance & Risk -- Methods x risk dimensions color-coded grid
8. Evidence Audit -- Tier distribution, correction log, gap register

## Run Locally

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173

## Deploy to GitHub Pages

```bash
npm run build
npm run deploy
```

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- React Router v7 (HashRouter for GitHub Pages compatibility)
- Static JSON data, no backend

## Data Sources

All data is sourced from the MBAN Master Notes knowledge system (v2.1-delta, April 2026):
- Course objects with methods, tools, deliverables
- Method registry with governance risk assessments
- Business problem to method routing
- Governance overlay (methods x risk dimensions)
- Evidence health and correction log
