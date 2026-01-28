const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all shopping lists for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const lists = await prisma.shoppingList.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            furniture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals for each list
    const listsWithTotals = lists.map(list => ({
      ...list,
      itemCount: list.items.length,
      purchasedCount: list.items.filter(item => item.purchased).length,
      totalPrice: list.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
    }));

    res.json(listsWithTotals);
  } catch (error) {
    console.error('Get shopping lists error:', error);
    res.status(500).json({ error: 'Failed to get shopping lists' });
  }
});

// Get single shopping list with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.shoppingList.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            furniture: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (list.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Calculate summary
    const summary = {
      itemCount: list.items.length,
      purchasedCount: list.items.filter(item => item.purchased).length,
      totalPrice: list.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
      purchasedTotal: list.items
        .filter(item => item.purchased)
        .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
      byStore: {}
    };

    // Group by store
    list.items.forEach(item => {
      const store = item.storeName || 'Other';
      if (!summary.byStore[store]) {
        summary.byStore[store] = { items: 0, total: 0 };
      }
      summary.byStore[store].items++;
      summary.byStore[store].total += (item.price || 0) * item.quantity;
    });

    res.json({ ...list, summary });
  } catch (error) {
    console.error('Get shopping list error:', error);
    res.status(500).json({ error: 'Failed to get shopping list' });
  }
});

// Create shopping list from design
router.post('/from-design/:designId', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const designId = req.params.designId;

    // Verify design ownership
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        furniture: true
      }
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    if (design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Calculate total price
    const totalPrice = design.furniture.reduce((sum, f) => sum + (f.price || 0), 0);

    // Create shopping list with items from design furniture
    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: req.user.id,
        designId: designId,
        name: name || `${design.name} Shopping List`,
        description: description || `Shopping list for ${design.name}`,
        totalPrice,
        items: {
          create: design.furniture.map(f => ({
            furnitureId: f.id,
            name: f.name,
            price: f.price,
            quantity: 1,
            storeUrl: f.storeUrl,
            storeName: f.storeName,
            imageUrl: f.imageUrl
          }))
        }
      },
      include: {
        items: {
          include: {
            furniture: true
          }
        }
      }
    });

    res.status(201).json(shoppingList);
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

// Create empty shopping list
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: req.user.id,
        name: name || 'My Shopping List',
        description
      },
      include: {
        items: true
      }
    });

    res.status(201).json(shoppingList);
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

// Add item to shopping list
router.post('/:listId/items', authenticateToken, async (req, res) => {
  try {
    const { furnitureId, name, price, quantity, storeUrl, storeName, imageUrl, notes } = req.body;

    // Verify list ownership
    const list = await prisma.shoppingList.findUnique({
      where: { id: req.params.listId }
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (list.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Create item
    const item = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: req.params.listId,
        furnitureId,
        name,
        price,
        quantity: quantity || 1,
        storeUrl,
        storeName,
        imageUrl,
        notes
      },
      include: {
        furniture: true
      }
    });

    // Update list total
    await updateListTotal(req.params.listId);

    res.status(201).json(item);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update shopping list item
router.patch('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { purchased, quantity, notes, price } = req.body;

    // Get item and verify ownership
    const item = await prisma.shoppingListItem.findUnique({
      where: { id: req.params.itemId },
      include: {
        shoppingList: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.shoppingList.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update item
    const updatedItem = await prisma.shoppingListItem.update({
      where: { id: req.params.itemId },
      data: {
        ...(purchased !== undefined && { purchased }),
        ...(quantity !== undefined && { quantity }),
        ...(notes !== undefined && { notes }),
        ...(price !== undefined && { price })
      },
      include: {
        furniture: true
      }
    });

    // Update list total
    await updateListTotal(item.shoppingListId);

    res.json(updatedItem);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item from shopping list
router.delete('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    // Get item and verify ownership
    const item = await prisma.shoppingListItem.findUnique({
      where: { id: req.params.itemId },
      include: {
        shoppingList: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.shoppingList.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.shoppingListItem.delete({
      where: { id: req.params.itemId }
    });

    // Update list total
    await updateListTotal(item.shoppingListId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Delete shopping list
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.shoppingList.findUnique({
      where: { id: req.params.id }
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (list.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.shoppingList.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete shopping list error:', error);
    res.status(500).json({ error: 'Failed to delete shopping list' });
  }
});

// Update shopping list
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const list = await prisma.shoppingList.findUnique({
      where: { id: req.params.id }
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (list.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedList = await prisma.shoppingList.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status })
      },
      include: {
        items: {
          include: {
            furniture: true
          }
        }
      }
    });

    res.json(updatedList);
  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({ error: 'Failed to update shopping list' });
  }
});

// Helper function to update list total
async function updateListTotal(listId) {
  const items = await prisma.shoppingListItem.findMany({
    where: { shoppingListId: listId }
  });

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { totalPrice }
  });
}

module.exports = router;
