'use strict';
const express = require('express');
const crypto = require('node:crypto');
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const REQUIRED_BASE_URL = 'https://openrouter.ai/api/v1';

router.use(authenticateToken);

router.post('/design-advice', async (req, res, next) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (prompt.length < 10 || prompt.length > 5000) return res.status(400).json({ error: 'PROMPT_LENGTH_INVALID' });
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required');
    if (!process.env.OPENROUTER_MODEL) throw new Error('OPENROUTER_MODEL is required');
    if (process.env.OPENROUTER_BASE_URL !== REQUIRED_BASE_URL) throw new Error('OPENROUTER_BASE_URL must use the configured OpenRouter API');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(process.env.OPENROUTER_TIMEOUT_MS || 120000));
    let providerResponse;
    try {
      providerResponse = await fetch(`${REQUIRED_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL,
          'X-Title': 'AI Interior Design',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: 'You are an interior design advisor. Give practical, budget-aware, accessibility-conscious suggestions. Flag assumptions and any work requiring a qualified professional.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.25,
          max_tokens: 700,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const payload = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok) throw new Error(`OpenRouter request failed with status ${providerResponse.status}`);
    const advice = payload?.choices?.[0]?.message?.content?.trim();
    if (!advice) throw new Error('OpenRouter returned no design advice');
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO interior_ai_results(id,user_id,prompt,model,provider_receipt_id,result,usage)
       VALUES($1::uuid,$2,$3,$4,$5,$6,$7::jsonb)`,
      id, req.user.id, prompt, process.env.OPENROUTER_MODEL, payload.id || null, advice, JSON.stringify(payload.usage || {}),
    );
    return res.json({ id, advice, model: process.env.OPENROUTER_MODEL });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
