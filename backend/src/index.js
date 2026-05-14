const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const designRoutes = require('./routes/designs');
const roomRoutes = require('./routes/rooms');
const furnitureRoutes = require('./routes/furniture');
const paletteRoutes = require('./routes/palettes');
const styleRoutes = require('./routes/styles');
const aiRoutes = require('./routes/ai');
const arRoutes = require('./routes/ar');
const subscriptionRoutes = require('./routes/subscriptions');
const materialRoutes = require('./routes/materials');
const inspirationRoutes = require('./routes/inspirations');
const shoppingRoutes = require('./routes/shopping');
const exportRoutes = require('./routes/export');
// Apply pass 5 — additive
const projectManagementRoutes = require('./routes/projectManagement');
const marketplaceRoutes = require('./routes/marketplace');
const integrationRoutes = require('./routes/integrations');

// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_trend_forecaster_endpoint = require('../routes/gap-no-trend-forecaster-endpoint');
const route_gap_no_room_layout_optimizer = require('../routes/gap-no-room-layout-optimizer');
const route_gap_no_accessibility_recommender = require('../routes/gap-no-accessibility-recommender');
const route_gap_no_sustainability_scoring_ai = require('../routes/gap-no-sustainability-scoring-ai');
const route_gap_live_vendorcontractor_integrations_still = require('../routes/gap-live-vendorcontractor-integrations-still');
const route_gap_no_native_ar_mobile_app_only = require('../routes/gap-no-native-ar-mobile-app-only');
const route_gap_no_3d_model_library_expansion_beyond = require('../routes/gap-no-3d-model-library-expansion-beyond');
const route_gap_no_notifications_module_0_references = require('../routes/gap-no-notifications-module-0-references');
const route_gap_no_webhook_surface = require('../routes/gap-no-webhook-surface');
const route_gap_no_file_upload_pipeline_for_floor = require('../routes/gap-no-file-upload-pipeline-for-floor');
const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/furniture', furnitureRoutes);
app.use('/api/palettes', paletteRoutes);
app.use('/api/styles', styleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/inspirations', inspirationRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/export', exportRoutes);
// Apply pass 5
app.use('/api/project-management', projectManagementRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/sustainability', require('./routes/sustainabilityScoring'));
app.use('/api/room-layout', require('./routes/roomLayoutOptimizer'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    
app.use('/api/gap-no-trend-forecaster-endpoint', route_gap_no_trend_forecaster_endpoint);
app.use('/api/gap-no-room-layout-optimizer', route_gap_no_room_layout_optimizer);
app.use('/api/gap-no-accessibility-recommender', route_gap_no_accessibility_recommender);
app.use('/api/gap-no-sustainability-scoring-ai', route_gap_no_sustainability_scoring_ai);
app.use('/api/gap-live-vendorcontractor-integrations-still', route_gap_live_vendorcontractor_integrations_still);
app.use('/api/gap-no-native-ar-mobile-app-only', route_gap_no_native_ar_mobile_app_only);
app.use('/api/gap-no-3d-model-library-expansion-beyond', route_gap_no_3d_model_library_expansion_beyond);
app.use('/api/gap-no-notifications-module-0-references', route_gap_no_notifications_module_0_references);
app.use('/api/gap-no-webhook-surface', route_gap_no_webhook_surface);
app.use('/api/gap-no-file-upload-pipeline-for-floor', route_gap_no_file_upload_pipeline_for_floor);

app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
