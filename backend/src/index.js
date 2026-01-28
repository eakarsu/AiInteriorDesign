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
