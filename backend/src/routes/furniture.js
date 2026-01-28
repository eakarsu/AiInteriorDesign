const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all furniture (catalog)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, style, minPrice, maxPrice, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (category) where.category = category;
    if (style) where.style = style;
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };

    const furniture = await prisma.furniture.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.furniture.count({ where });

    res.json({ furniture, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get furniture error:', error);
    res.status(500).json({ error: 'Failed to get furniture' });
  }
});

// Get single furniture item
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const furniture = await prisma.furniture.findUnique({
      where: { id: req.params.id },
      include: {
        design: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, type: true } }
      }
    });

    if (!furniture) {
      return res.status(404).json({ error: 'Furniture not found' });
    }

    res.json(furniture);
  } catch (error) {
    console.error('Get furniture error:', error);
    res.status(500).json({ error: 'Failed to get furniture' });
  }
});

// Create furniture
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { designId, roomId, name, category, style, color, material, price, dimensions, imageUrl, modelUrl, aiGenerated, storeUrl, storeName, sku, inStock } = req.body;

    const furniture = await prisma.furniture.create({
      data: {
        designId,
        roomId,
        name,
        category,
        style,
        color,
        material,
        price: price ? parseFloat(price) : null,
        dimensions,
        imageUrl,
        modelUrl,
        aiGenerated: aiGenerated || false,
        storeUrl,
        storeName,
        sku,
        inStock: inStock !== undefined ? inStock : true
      }
    });

    res.status(201).json(furniture);
  } catch (error) {
    console.error('Create furniture error:', error);
    res.status(500).json({ error: 'Failed to create furniture' });
  }
});

// Update furniture
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, category, style, color, material, price, dimensions, imageUrl, modelUrl, storeUrl, storeName, sku, inStock } = req.body;

    const furniture = await prisma.furniture.update({
      where: { id: req.params.id },
      data: {
        name,
        category,
        style,
        color,
        material,
        price: price ? parseFloat(price) : null,
        dimensions,
        imageUrl,
        modelUrl,
        storeUrl,
        storeName,
        sku,
        ...(inStock !== undefined && { inStock })
      }
    });

    res.json(furniture);
  } catch (error) {
    console.error('Update furniture error:', error);
    res.status(500).json({ error: 'Failed to update furniture' });
  }
});

// Delete furniture
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.furniture.delete({ where: { id: req.params.id } });
    res.json({ message: 'Furniture deleted successfully' });
  } catch (error) {
    console.error('Delete furniture error:', error);
    res.status(500).json({ error: 'Failed to delete furniture' });
  }
});

// Get furniture categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.furniture.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

module.exports = router;
