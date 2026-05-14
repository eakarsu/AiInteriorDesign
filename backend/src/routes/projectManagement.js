/*
 * routes/projectManagement.js — Apply pass 5
 *
 * Mechanical design-project management: timeline + budget tracking. Uses raw
 * additive tables (`$executeRawUnsafe` with CREATE TABLE IF NOT EXISTS) to
 * stay strictly additive — no Prisma schema changes.
 *
 * Tables: ProjectMilestone, ProjectBudgetLine.
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

let bootstrapped = false;
async function ensureTables() {
  if (bootstrapped) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectMilestone" (
        id SERIAL PRIMARY KEY,
        design_id TEXT,
        user_id TEXT,
        title TEXT,
        target_date DATE,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectBudgetLine" (
        id SERIAL PRIMARY KEY,
        design_id TEXT,
        user_id TEXT,
        category TEXT,
        description TEXT,
        budget_amount NUMERIC,
        actual_amount NUMERIC,
        currency TEXT DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT NOW()
      )`);
    bootstrapped = true;
  } catch (e) {
    console.error('projectManagement bootstrap error:', e.message);
  }
}
ensureTables().catch(() => {});

// POST /api/project-management/milestones
router.post('/milestones', authenticateToken, async (req, res) => {
  try {
    await ensureTables();
    const { design_id, title, target_date, status, notes } = req.body || {};
    if (!design_id || !title) return res.status(400).json({ error: 'design_id and title required' });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectMilestone" (design_id, user_id, title, target_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      design_id, req.user.id, title, target_date || null, status || 'pending', notes || null
    );
    res.status(201).json(Array.isArray(r) ? r[0] : r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/project-management/milestones?design_id=
router.get('/milestones', authenticateToken, async (req, res) => {
  try {
    await ensureTables();
    const did = req.query.design_id;
    if (!did) return res.status(400).json({ error: 'design_id required' });
    const r = await prisma.$queryRawUnsafe(
      `SELECT * FROM "ProjectMilestone" WHERE design_id = $1 ORDER BY target_date ASC NULLS LAST`,
      did
    );
    res.json({ milestones: r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/project-management/milestones/:id/status
router.put('/milestones/:id/status', authenticateToken, async (req, res) => {
  try {
    await ensureTables();
    const { status } = req.body || {};
    const allowed = ['pending', 'in_progress', 'blocked', 'done'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
    const r = await prisma.$queryRawUnsafe(
      `UPDATE "ProjectMilestone" SET status = $1 WHERE id = $2 RETURNING *`,
      status, Number(req.params.id)
    );
    if (!r || r.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/project-management/budget
router.post('/budget', authenticateToken, async (req, res) => {
  try {
    await ensureTables();
    const { design_id, category, description, budget_amount, actual_amount, currency } = req.body || {};
    if (!design_id) return res.status(400).json({ error: 'design_id required' });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO "ProjectBudgetLine" (design_id, user_id, category, description, budget_amount, actual_amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      design_id, req.user.id, category || 'misc', description || null,
      budget_amount != null ? Number(budget_amount) : null,
      actual_amount != null ? Number(actual_amount) : null,
      currency || 'USD'
    );
    res.status(201).json(Array.isArray(r) ? r[0] : r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/project-management/budget?design_id=
router.get('/budget', authenticateToken, async (req, res) => {
  try {
    await ensureTables();
    const did = req.query.design_id;
    if (!did) return res.status(400).json({ error: 'design_id required' });
    const lines = await prisma.$queryRawUnsafe(`SELECT * FROM "ProjectBudgetLine" WHERE design_id = $1 ORDER BY created_at ASC`, did);
    let totalBudget = 0;
    let totalActual = 0;
    for (const l of lines) {
      totalBudget += Number(l.budget_amount || 0);
      totalActual += Number(l.actual_amount || 0);
    }
    res.json({
      lines,
      summary: {
        total_budget: +totalBudget.toFixed(2),
        total_actual: +totalActual.toFixed(2),
        variance: +(totalActual - totalBudget).toFixed(2),
        variance_pct: totalBudget ? +(((totalActual - totalBudget) / totalBudget) * 100).toFixed(1) : null,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
