// Sustainability scoring tracking carbon footprint of material choices.
// Audit: batch_04.md / AiInteriorDesign / Custom Feature Suggestions #3
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
      'X-Title': 'AiInteriorDesign - Sustainability'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, max_tokens: 2500
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/sustainability/score
// Body: { design_id }
router.post('/score', async (req, res) => {
  try {
    const { design_id } = req.body || {};
    if (!design_id) return res.status(400).json({ error: 'design_id required' });

    let design = null, materials = [];
    try {
      design = await prisma.design.findUnique({ where: { id: Number(design_id) } });
    } catch (_) {}
    try {
      materials = await prisma.material.findMany({ take: 50 });
    } catch (_) {}

    const systemPrompt = `You are an interior-design sustainability analyst. Score the design's carbon
footprint (kg CO2e), recyclability, embodied-carbon hotspots, and recommend lower-impact swaps. Return STRICT
JSON only.`;

    const userPrompt = `Design: ${JSON.stringify(design)}
Available material catalog (sample): ${JSON.stringify(materials.slice(0, 20))}

Return JSON:
{
  "summary": "...",
  "total_kg_co2e_estimate": 0,
  "category_breakdown": [{ "category": "string", "kg_co2e": 0, "share_pct": 0 }],
  "embodied_carbon_hotspots": [{ "item": "string", "kg_co2e": 0, "issue": "string" }],
  "lower_impact_swaps": [{ "from_material": "string", "to_material": "string", "co2e_reduction_kg": 0, "cost_delta_usd": 0 }],
  "certifications_relevant": ["FSC", "GREENGUARD", "Cradle to Cradle", "EPD"],
  "overall_sustainability_grade": "A|B|C|D|F",
  "disclaimer": "Estimates; verify with LCA + EPDs."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ design_id, scoring: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/materials', async (_req, res) => {
  try {
    const r = await prisma.material.findMany({ take: 100 });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
