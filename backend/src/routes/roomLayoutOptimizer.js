// Room-layout optimization considering traffic flow, light, and focal points.
// Audit: batch_04.md / AiInteriorDesign / Custom Feature Suggestions #2
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken: authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();
router.use(authMiddleware);

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'AiInteriorDesign - Room Layout'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4, max_tokens: 2500
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/room-layout/optimize { room_id, intended_use?, furniture_ids? }
router.post('/optimize', async (req, res) => {
  try {
    const { room_id, intended_use = 'general living', furniture_ids = [] } = req.body || {};
    if (!room_id) return res.status(400).json({ error: 'room_id required' });

    let room = null, furniture = [];
    try { room = await prisma.room.findUnique({ where: { id: Number(room_id) } }); } catch (_) {}
    try {
      furniture = await prisma.furniture.findMany({
        where: furniture_ids.length ? { id: { in: furniture_ids.map(Number) } } : {},
        take: 30
      });
    } catch (_) {}

    const systemPrompt = `You are an interior-design layout optimizer. Generate a layout plan that maximizes
traffic flow, natural light usage, and focal points (fireplace, view, art). Place furniture with clearances and
ergonomic distances. Return STRICT JSON only.`;

    const userPrompt = `Room: ${JSON.stringify(room)}
Intended use: ${intended_use}
Available furniture: ${JSON.stringify(furniture)}

Return JSON:
{
  "summary": "...",
  "focal_point": "string",
  "primary_traffic_path": "string",
  "placements": [
    { "furniture_id": 0, "position_descriptor": "string", "clearance_in": 0, "rationale": "string" }
  ],
  "lighting_layers": [{ "type": "ambient|task|accent", "fixture_suggestion": "string" }],
  "rug_and_anchor_suggestions": ["..."],
  "common_pitfalls_avoided": ["..."],
  "disclaimer": "Layout guidance; verify with floor-plan measurement."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ room_id, layout: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rooms', async (_req, res) => {
  try {
    const r = await prisma.room.findMany({ take: 100 });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
