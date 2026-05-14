/*
 * routes/marketplace.js — Apply pass 5
 *
 * Mechanical designer-marketplace directory. Designers can register a profile;
 * customers browse + filter. Additive raw `DesignerProfile` table.
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

let bootstrapped = false;
async function ensureTables() {
  if (bootstrapped) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DesignerProfile" (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        display_name TEXT,
        bio TEXT,
        styles TEXT[],
        regions TEXT[],
        hourly_rate NUMERIC,
        years_experience INTEGER,
        portfolio_url TEXT,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`);
    bootstrapped = true;
  } catch (e) {
    console.error('marketplace bootstrap error:', e.message);
  }
}
ensureTables().catch(() => {});

// POST /api/marketplace/profile — upsert current user's designer profile
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    await ensureTables();
    const { display_name, bio, styles, regions, hourly_rate, years_experience, portfolio_url } = req.body || {};
    if (!display_name) return res.status(400).json({ error: 'display_name required' });
    const stylesArr = Array.isArray(styles) ? styles : [];
    const regionsArr = Array.isArray(regions) ? regions : [];
    const existing = await prisma.$queryRawUnsafe(`SELECT id FROM "DesignerProfile" WHERE user_id = $1 LIMIT 1`, req.user.id);
    if (existing && existing.length > 0) {
      const r = await prisma.$queryRawUnsafe(
        `UPDATE "DesignerProfile" SET display_name=$1, bio=$2, styles=$3, regions=$4, hourly_rate=$5, years_experience=$6, portfolio_url=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
        display_name, bio || null, stylesArr, regionsArr,
        hourly_rate != null ? Number(hourly_rate) : null,
        years_experience != null ? Number(years_experience) : null,
        portfolio_url || null, existing[0].id
      );
      return res.json(r[0]);
    }
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO "DesignerProfile" (user_id, display_name, bio, styles, regions, hourly_rate, years_experience, portfolio_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      req.user.id, display_name, bio || null, stylesArr, regionsArr,
      hourly_rate != null ? Number(hourly_rate) : null,
      years_experience != null ? Number(years_experience) : null,
      portfolio_url || null
    );
    res.status(201).json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/marketplace/search?style=&region=&max_rate=
router.get('/search', optionalAuth, async (req, res) => {
  try {
    await ensureTables();
    const { style, region, max_rate, min_years } = req.query;
    const params = [];
    let where = '1=1';
    if (style) { params.push(style); where += ` AND $${params.length} = ANY(styles)`; }
    if (region) { params.push(region); where += ` AND $${params.length} = ANY(regions)`; }
    if (max_rate) { params.push(Number(max_rate)); where += ` AND COALESCE(hourly_rate, 999999) <= $${params.length}`; }
    if (min_years) { params.push(Number(min_years)); where += ` AND COALESCE(years_experience, 0) >= $${params.length}`; }
    const r = await prisma.$queryRawUnsafe(
      `SELECT * FROM "DesignerProfile" WHERE ${where} ORDER BY verified DESC, years_experience DESC NULLS LAST LIMIT 50`,
      ...params
    );
    res.json({ designers: r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
