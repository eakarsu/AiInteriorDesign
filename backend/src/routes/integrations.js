/*
 * routes/integrations.js — Apply pass 5 (NEEDS-CREDS stubs)
 *
 * Contractor / vendor integrations. 503 with explicit env-var hints.
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

function noKey(res, provider, vars) {
  return res.status(503).json({
    error: `${provider} integration unavailable: credentials not configured`,
    required_env: vars,
    provider_status: 'not_configured',
  });
}

router.post('/contractor-marketplace/quote', authenticateToken, (_req, res) => {
  if (!process.env.CONTRACTOR_PROVIDER_API_KEY) {
    return noKey(res, 'Contractor marketplace', ['CONTRACTOR_PROVIDER', 'CONTRACTOR_PROVIDER_API_KEY']);
  }
  res.status(501).json({ error: 'Contractor quote scaffolded but not implemented' });
});

router.post('/vendor-catalog/search', authenticateToken, (_req, res) => {
  if (!process.env.VENDOR_CATALOG_API_KEY) {
    return noKey(res, 'Vendor catalog', ['VENDOR_CATALOG_PROVIDER', 'VENDOR_CATALOG_API_KEY']);
  }
  res.status(501).json({ error: 'Vendor catalog search scaffolded but not implemented' });
});

router.post('/payments/checkout', authenticateToken, (_req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return noKey(res, 'Payments', ['STRIPE_SECRET_KEY']);
  }
  res.status(501).json({ error: 'Checkout scaffolded but not implemented' });
});

router.get('/status', authenticateToken, (_req, res) => {
  res.json({
    contractor_marketplace: !!process.env.CONTRACTOR_PROVIDER_API_KEY,
    vendor_catalog: !!process.env.VENDOR_CATALOG_API_KEY,
    payments: !!process.env.STRIPE_SECRET_KEY,
  });
});

module.exports = router;
