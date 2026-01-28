const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get subscription plans
router.get('/plans', async (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      designsPerMonth: 5,
      features: [
        'Basic AI design suggestions',
        '5 designs per month',
        'Standard color palettes',
        'Community support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19.99,
      designsPerMonth: 50,
      features: [
        'Advanced AI design generation',
        '50 designs per month',
        'Custom color palettes',
        'AR visualization',
        'Priority support',
        'Export designs'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49.99,
      designsPerMonth: -1,
      features: [
        'Unlimited AI generations',
        'Unlimited designs',
        'Team collaboration',
        'Custom AI training',
        'API access',
        'Dedicated support',
        'White-label options'
      ]
    }
  ];

  res.json(plans);
});

// Get user's current subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return res.json({
        plan: 'free',
        status: 'active',
        designsLeft: 5,
        price: 0
      });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Subscribe to a plan
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;

    const planDetails = {
      free: { price: 0, designsLeft: 5 },
      pro: { price: 19.99, designsLeft: 50 },
      enterprise: { price: 49.99, designsLeft: -1 }
    };

    if (!planDetails[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Deactivate current subscriptions
    await prisma.subscription.updateMany({
      where: { userId: req.user.id, status: 'active' },
      data: { status: 'cancelled' }
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        plan,
        status: 'active',
        designsLeft: planDetails[plan].designsLeft,
        price: planDetails[plan].price,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'active' }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription' });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled' }
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Use a design credit
router.post('/use-credit', authenticateToken, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'active' }
    });

    if (!subscription) {
      return res.status(403).json({ error: 'No active subscription' });
    }

    if (subscription.designsLeft === 0) {
      return res.status(403).json({ error: 'No design credits left' });
    }

    if (subscription.designsLeft > 0) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { designsLeft: { decrement: 1 } }
      });
    }

    res.json({ success: true, designsLeft: subscription.designsLeft - 1 });
  } catch (error) {
    console.error('Use credit error:', error);
    res.status(500).json({ error: 'Failed to use credit' });
  }
});

// Get subscription history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get subscription history' });
  }
});

module.exports = router;
