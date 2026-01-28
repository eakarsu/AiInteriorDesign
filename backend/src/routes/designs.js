const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all designs (with optional auth for public designs)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, style, roomType, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (req.user) {
      where.userId = req.user.id;
    } else {
      where.status = 'published';
    }

    if (status && req.user) where.status = status;
    if (style) where.style = style;
    if (roomType) where.roomType = roomType;

    const designs = await prisma.design.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        rooms: { take: 3 },
        _count: { select: { rooms: true, furniture: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.design.count({ where });

    res.json({ designs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ error: 'Failed to get designs' });
  }
});

// Get single design
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const design = await prisma.design.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        rooms: {
          include: {
            furniture: true
          }
        },
        furniture: true,
        palettes: true
      }
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json(design);
  } catch (error) {
    console.error('Get design error:', error);
    res.status(500).json({ error: 'Failed to get design' });
  }
});

// Create design
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, style, roomType, budget, thumbnail } = req.body;

    const design = await prisma.design.create({
      data: {
        userId: req.user.id,
        name,
        description,
        style,
        roomType,
        budget: budget ? parseFloat(budget) : null,
        thumbnail
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.status(201).json(design);
  } catch (error) {
    console.error('Create design error:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

// Update design
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, style, roomType, budget, thumbnail, status } = req.body;

    const existing = await prisma.design.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Design not found' });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const design = await prisma.design.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        style,
        roomType,
        budget: budget ? parseFloat(budget) : null,
        thumbnail,
        status
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        rooms: true
      }
    });

    res.json(design);
  } catch (error) {
    console.error('Update design error:', error);
    res.status(500).json({ error: 'Failed to update design' });
  }
});

// Delete design
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await prisma.design.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Design not found' });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.design.delete({ where: { id: req.params.id } });

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Delete design error:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

module.exports = router;
