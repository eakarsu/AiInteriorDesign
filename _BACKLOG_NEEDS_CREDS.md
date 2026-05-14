# Backlog — credentials required

503-stubbed in `backend/src/routes/integrations.js`:

| Endpoint | Required env var(s) |
|----------|---------------------|
| `POST /api/integrations/contractor-marketplace/quote` | `CONTRACTOR_PROVIDER`, `CONTRACTOR_PROVIDER_API_KEY` |
| `POST /api/integrations/vendor-catalog/search` | `VENDOR_CATALOG_PROVIDER`, `VENDOR_CATALOG_API_KEY` |
| `POST /api/integrations/payments/checkout` | `STRIPE_SECRET_KEY` |

`GET /api/integrations/status` exposes config booleans for the dashboard.
