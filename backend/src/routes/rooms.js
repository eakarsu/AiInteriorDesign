const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all rooms for a design
router.get('/design/:designId', authenticateToken, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { designId: req.params.designId },
      include: {
        furniture: true,
        _count: { select: { furniture: true, arSessions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get single room
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        design: { select: { id: true, name: true, userId: true } },
        furniture: true,
        arSessions: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Create room
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { designId, name, type, width, height, length, thumbnail, floorPlan } = req.body;

    // Verify design ownership
    const design = await prisma.design.findUnique({ where: { id: designId } });
    if (!design || design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const room = await prisma.room.create({
      data: {
        designId,
        name,
        type,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        length: length ? parseFloat(length) : null,
        thumbnail,
        floorPlan
      },
      include: { furniture: true }
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update room
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, type, width, height, length, thumbnail, floorPlan } = req.body;

    const existing = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { design: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (existing.design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        name,
        type,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        length: length ? parseFloat(length) : null,
        thumbnail,
        floorPlan
      },
      include: { furniture: true }
    });

    res.json(room);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { design: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (existing.design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.room.delete({ where: { id: req.params.id } });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
