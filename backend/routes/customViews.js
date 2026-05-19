// Custom Views — Design Views feature pack
// 4 endpoints:
//   GET  /room-style-distribution      (VIZ: chart data — counts per style)
//   GET  /color-palette-heatmap        (VIZ: matrix room x palette)
//   POST /design-brief-pdf             (NON-VIZ: returns PDF download of design brief)
//   GET/POST/PUT/DELETE /style-rules   (NON-VIZ: CRUD style->furniture mappings)

const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();

// --- Seeded reference data (deterministic, in-memory) ---
const ROOM_TYPES = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
  'Home Office', 'Dining Room', 'Kids Room', 'Outdoor Patio',
];

const STYLES = [
  'Modern', 'Scandinavian', 'Industrial', 'Mid-Century',
  'Bohemian', 'Coastal', 'Farmhouse', 'Minimalist',
  'Art Deco', 'Japandi',
];

const PALETTES = [
  'Warm Neutrals', 'Cool Blues', 'Earth Tones', 'Monochrome',
  'Pastel Pinks', 'Forest Greens', 'Sunset Oranges', 'Charcoal & Brass',
];

// Deterministic pseudo-random (avoids Math.random churn between requests)
function seedHash(a, b) {
  let h = 2166136261;
  const s = `${a}|${b}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// Aggregate design counts per style across rooms
function buildStyleDistribution() {
  const data = STYLES.map((style) => {
    let count = 0;
    for (const room of ROOM_TYPES) {
      // 0..14 designs per (room, style)
      count += seedHash(room, style) % 15;
    }
    return { style, designCount: count };
  });
  data.sort((a, b) => b.designCount - a.designCount);
  const total = data.reduce((s, r) => s + r.designCount, 0);
  return {
    total,
    rooms: ROOM_TYPES.length,
    distribution: data,
    generatedAt: new Date().toISOString(),
  };
}

// Build room x palette frequency matrix (intensity 0-100)
function buildPaletteHeatmap() {
  const matrix = ROOM_TYPES.map((room) => {
    const cells = PALETTES.map((palette) => {
      const intensity = seedHash(room, palette) % 101; // 0..100
      return { palette, intensity };
    });
    return { room, cells };
  });
  return {
    rooms: ROOM_TYPES,
    palettes: PALETTES,
    matrix,
    legend: { min: 0, max: 100, unit: 'usage_score' },
    generatedAt: new Date().toISOString(),
  };
}

// --- In-memory CRUD store for style->furniture mappings ---
let nextRuleId = 1;
const styleRules = new Map();

function seedRules() {
  const seed = [
    { style: 'Modern',       furniture: ['Sleek Sofa', 'Glass Coffee Table', 'Floor Lamp'],          notes: 'Clean lines, neutral palette.' },
    { style: 'Scandinavian', furniture: ['Light Wood Chair', 'Wool Throw', 'Pendant Light'],         notes: 'Light woods + cozy textiles.' },
    { style: 'Industrial',   furniture: ['Metal Shelving', 'Leather Sofa', 'Edison Bulb Fixture'],   notes: 'Exposed materials, raw textures.' },
    { style: 'Bohemian',     furniture: ['Rattan Chair', 'Macrame Hanging', 'Layered Rugs'],         notes: 'Mix patterns + plants.' },
    { style: 'Japandi',      furniture: ['Low Platform Bed', 'Wabi-Sabi Vase', 'Tatami Mat'],        notes: 'Japanese + Scandinavian fusion.' },
  ];
  for (const r of seed) {
    const id = nextRuleId++;
    styleRules.set(id, { id, ...r, createdAt: new Date().toISOString() });
  }
}
seedRules();

// === VIZ 1: room style distribution chart ===
router.get('/room-style-distribution', (req, res) => {
  try {
    res.json(buildStyleDistribution());
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to build distribution' });
  }
});

// === VIZ 2: color palette heatmap (room x palette) ===
router.get('/color-palette-heatmap', (req, res) => {
  try {
    res.json(buildPaletteHeatmap());
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to build heatmap' });
  }
});

// === NON-VIZ 1: design brief PDF ===
router.post('/design-brief-pdf', (req, res) => {
  try {
    const body = req.body || {};
    const projectName  = String(body.projectName || 'Untitled Project').slice(0, 120);
    const clientName   = String(body.clientName  || 'Client').slice(0, 80);
    const roomType     = String(body.roomType    || 'Living Room').slice(0, 60);
    const style        = String(body.style       || 'Modern').slice(0, 60);
    const palette      = String(body.palette     || 'Warm Neutrals').slice(0, 60);
    const budget       = Number(body.budget) > 0 ? Number(body.budget) : 5000;
    const requirements = String(body.requirements || 'No specific requirements supplied.').slice(0, 2000);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="design-brief-${projectName.replace(/[^a-z0-9-_]+/gi, '_')}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(22).fillColor('#0f172a').text('Interior Design Brief', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text(`Generated ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor('#0f172a').text('Project Overview', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#334155');
    doc.text(`Project:   ${projectName}`);
    doc.text(`Client:    ${clientName}`);
    doc.text(`Room:      ${roomType}`);
    doc.text(`Style:     ${style}`);
    doc.text(`Palette:   ${palette}`);
    doc.text(`Budget:    $${budget.toLocaleString()}`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0f172a').text('Requirements', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#334155').text(requirements, { align: 'left' });
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0f172a').text('Suggested Direction', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#334155').text(
      `Anchor the ${roomType.toLowerCase()} around the "${style}" style using the "${palette}" palette. ` +
      `Allocate roughly 60% of the $${budget.toLocaleString()} budget to anchor furniture (sofa/bed, dining table, storage), ` +
      `25% to lighting + textiles, and 15% to decor and art. Prioritize one statement piece consistent with the chosen style.`,
      { align: 'left' }
    );
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#0f172a').text('Next Steps', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#334155').list([
      'Confirm measurements + scaled floor plan',
      'Approve mood board + 3D preview',
      'Lock in furniture + finishes',
      'Schedule delivery and installation',
    ]);

    doc.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Failed to build PDF' });
  }
});

// === NON-VIZ 2: design style rules CRUD ===
router.get('/style-rules', (req, res) => {
  res.json({ rules: Array.from(styleRules.values()), styles: STYLES });
});

router.post('/style-rules', (req, res) => {
  try {
    const body = req.body || {};
    const style = String(body.style || '').trim();
    if (!style) return res.status(400).json({ error: 'style is required' });
    const furniture = Array.isArray(body.furniture)
      ? body.furniture.map((s) => String(s).trim()).filter(Boolean).slice(0, 20)
      : String(body.furniture || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const notes = String(body.notes || '').slice(0, 500);
    const id = nextRuleId++;
    const rule = { id, style, furniture, notes, createdAt: new Date().toISOString() };
    styleRules.set(id, rule);
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create rule' });
  }
});

router.put('/style-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = styleRules.get(id);
  if (!existing) return res.status(404).json({ error: 'rule not found' });
  const body = req.body || {};
  if (body.style !== undefined)     existing.style = String(body.style).trim() || existing.style;
  if (body.notes !== undefined)     existing.notes = String(body.notes).slice(0, 500);
  if (body.furniture !== undefined) {
    existing.furniture = Array.isArray(body.furniture)
      ? body.furniture.map((s) => String(s).trim()).filter(Boolean).slice(0, 20)
      : String(body.furniture).split(',').map((s) => s.trim()).filter(Boolean);
  }
  existing.updatedAt = new Date().toISOString();
  styleRules.set(id, existing);
  res.json(existing);
});

router.delete('/style-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!styleRules.has(id)) return res.status(404).json({ error: 'rule not found' });
  styleRules.delete(id);
  res.json({ ok: true, id });
});

module.exports = router;
