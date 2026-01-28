const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all AR sessions for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;

    const sessions = await prisma.aRSession.findMany({
      where,
      include: {
        room: { select: { id: true, name: true, type: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.aRSession.count({ where });

    res.json({ sessions, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get AR sessions error:', error);
    res.status(500).json({ error: 'Failed to get AR sessions' });
  }
});

// Get single AR session
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const session = await prisma.aRSession.findUnique({
      where: { id: req.params.id },
      include: {
        room: {
          include: {
            furniture: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get AR session error:', error);
    res.status(500).json({ error: 'Failed to get AR session' });
  }
});

// Create AR session
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { roomId, name, sceneData } = req.body;

    const session = await prisma.aRSession.create({
      data: {
        userId: req.user.id,
        roomId,
        name: name || `AR Session ${new Date().toLocaleDateString()}`,
        sceneData: sceneData ? JSON.stringify(sceneData) : null,
        status: 'active'
      },
      include: {
        room: { select: { id: true, name: true, type: true } }
      }
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create AR session error:', error);
    res.status(500).json({ error: 'Failed to create AR session' });
  }
});

// Update AR session
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, sceneData, thumbnail, status } = req.body;

    const existing = await prisma.aRSession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    const session = await prisma.aRSession.update({
      where: { id: req.params.id },
      data: {
        name,
        sceneData: sceneData ? JSON.stringify(sceneData) : undefined,
        thumbnail,
        status
      },
      include: {
        room: { select: { id: true, name: true, type: true } }
      }
    });

    res.json(session);
  } catch (error) {
    console.error('Update AR session error:', error);
    res.status(500).json({ error: 'Failed to update AR session' });
  }
});

// Delete AR session
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await prisma.aRSession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    await prisma.aRSession.delete({ where: { id: req.params.id } });

    res.json({ message: 'AR session deleted successfully' });
  } catch (error) {
    console.error('Delete AR session error:', error);
    res.status(500).json({ error: 'Failed to delete AR session' });
  }
});

// Save AR scene snapshot
router.post('/:id/snapshot', authenticateToken, async (req, res) => {
  try {
    const { sceneData, thumbnail } = req.body;

    const existing = await prisma.aRSession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    const session = await prisma.aRSession.update({
      where: { id: req.params.id },
      data: {
        sceneData: JSON.stringify(sceneData),
        thumbnail
      }
    });

    res.json({ success: true, session });
  } catch (error) {
    console.error('Save snapshot error:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// Get AR-ready furniture (with 3D models)
router.get('/furniture/ar-ready', authenticateToken, async (req, res) => {
  try {
    const furniture = await prisma.furniture.findMany({
      where: {
        modelUrl: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(furniture);
  } catch (error) {
    console.error('Get AR furniture error:', error);
    res.status(500).json({ error: 'Failed to get AR furniture' });
  }
});

module.exports = router;
