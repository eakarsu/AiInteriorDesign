# Audit Apply Notes — AiInteriorDesign

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 35.

## Original Recommendations (AI Counterparts)
- `/trend-forecaster`
- `/room-optimizer`
- `/accessibility-recommender`

## Implemented (this pass)
Three endpoints appended to `backend/src/routes/ai.js` using existing `callOpenRouter`, `stripCodeBlocks`, `authenticateToken`, and Prisma `aIGeneration` persistence:

- `POST /api/ai/trend-forecaster` — region- and room-specific design trend forecast over a configurable horizon; returns headline trends, color palettes, materials, anti-trends, early-adoption recommendations.
- `POST /api/ai/room-optimizer` — layout/flow optimizer accepting dimensions, doorways, windows, focal points, current furniture, traffic priorities; returns zoned plan, placement, lighting and accessibility notes.
- `POST /api/ai/accessibility-recommender` — inclusive design recommendations across structural, furniture, fixture, lighting, color/contrast, sensory, wayfinding, with phased implementation plan.

All three persist to `aiGeneration` model fire-and-forget.

Syntax: `node --check` passes.

## Backlog (Custom Feature Suggestions)
- Agentic design consultant (multi-turn iteration loop).
- Sustainability scoring (carbon footprint per choice).
- Virtual VR/3D walkthrough (graphics SDK out of mechanical scope).
- Design cost prediction (could compose with `/plan-budget`).
- Designer marketplace, contractor integration, project management, AR mobile app, 3D model expansion.

## Categorization
- MECHANICAL: 3 endpoints (done).
- TOO-RISKY mechanically: VR/3D walkthrough generation.
- NEEDS-PRODUCT-DECISION: marketplace economics, sustainability scoring methodology.
- NEEDS-CREDS: contractor/vendor integrations, AR mobile distribution.

## Apply pass 3 (frontend)

LEFT-AS-IS. FE already complete: `frontend/src/components/AdvancedAITools.jsx` wires `/ai/trend-forecaster`, `/ai/room-optimizer`, `/ai/accessibility-recommender` via the shared `api.js` axios client (auto-injects `Authorization: Bearer <localStorage.token>` and handles 401). Component mounted in `App.jsx` at `/advanced-ai` behind `ProtectedRoute`. No changes needed (idempotence rule).

## Apply pass 4 (mechanical backlog)

Mechanical items only — skipped TOO-RISKY (VR/3D walkthrough generation, AR mobile distribution) and NEEDS-PRODUCT-DECISION (marketplace economics).

BE additions in `backend/src/routes/ai.js` (existing `callOpenRouter` + `stripCodeBlocks`, `authenticateToken`, Prisma `aIGeneration` persistence, new `checkOpenRouterKey` returning 503 when key missing):
- `POST /api/ai/sustainability-score` — sustainability scoring of materials/furniture/finishes with lower-impact swap suggestions.
- `POST /api/ai/cost-prediction` — heuristic itemized cost prediction with labor/material split, savings opportunities, premium upgrades.
- `POST /api/ai/design-consultant-turn` — agentic multi-turn design consultant: critique, revised plan, clarifying questions, agent self-assessment.

FE additions in `frontend/src/components/AdvancedAITools.jsx`:
- Three new TOOLS entries (`sustainability-score`, `cost-prediction`, `design-consultant-turn`) with declarative `fields[]` schemas.
- Submit handler unchanged — already handles 503 path returning a friendly "AI service unavailable" banner; auth via shared `api.js` axios client (Bearer from localStorage).

Total: 3 mechanical features. `node --check` clean. Persists to `aIGeneration` fire-and-forget.

Backlog still mechanical-but-out-of-scope-for-this-pass: `/plan-budget` ↔ `cost-prediction` composition; agentic consultant could be extended into a persisted multi-turn session model (NEEDS-PRODUCT-DECISION on session/conversation schema).
