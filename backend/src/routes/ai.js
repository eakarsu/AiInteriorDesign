const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages, model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5') {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'AI Interior Design'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 10000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  return response.json();
}

// Strip markdown code blocks from AI responses
function stripCodeBlocks(content) {
  if (!content) return content;
  // Remove ```json ... ``` or ``` ... ``` wrappers
  return content.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
}

// Rate limiting for image generation
const imageRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimits = imageRateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > userLimits.resetAt) {
    userLimits.count = 0;
    userLimits.resetAt = now + RATE_LIMIT_WINDOW;
  }

  if (userLimits.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimits.count++;
  imageRateLimits.set(userId, userLimits);
  return true;
}

// Generate image using DALL-E 3 (OpenAI API directly)
async function generateImageDALLE(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('DALL-E: Attempting image generation...');
  console.log('DALL-E: API Key exists:', !!apiKey, apiKey ? `(starts with ${apiKey.substring(0, 10)}...)` : '');

  if (!apiKey) {
    console.log('DALL-E: No OPENAI_API_KEY configured');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data[0]?.url) {
        console.log('DALL-E: Image generated successfully');
        return data.data[0].url;
      }
    } else {
      const error = await response.json().catch(() => ({}));
      console.log('DALL-E error:', error.error?.message || response.statusText);
    }
  } catch (err) {
    console.log('DALL-E error:', err.message);
  }

  return null;
}

// Generate image using Replicate (Stable Diffusion XL)
async function generateImageReplicate(prompt) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.log('Replicate: No REPLICATE_API_TOKEN configured');
    return null;
  }

  try {
    // Start prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf',
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted, ugly, cartoon, anime, drawing',
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 25,
          guidance_scale: 7.5
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log('Replicate start error:', error.detail || response.statusText);
      return null;
    }

    const prediction = await response.json();
    let status = prediction.status;
    let result = prediction;

    // Poll for completion (max 60 seconds)
    const maxAttempts = 30;
    let attempts = 0;

    while ((status === 'starting' || status === 'processing') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${apiToken}` }
      });

      if (pollResponse.ok) {
        result = await pollResponse.json();
        status = result.status;
      } else {
        break;
      }
      attempts++;
    }

    if (status === 'succeeded' && result.output && result.output.length > 0) {
      console.log('Replicate: Image generated successfully');
      return result.output[0];
    } else {
      console.log('Replicate status:', status, result.error || '');
    }
  } catch (err) {
    console.log('Replicate error:', err.message);
  }

  return null;
}

// Main image generation function with fallback
async function generateImage(roomType, style, userId = null) {
  console.log('=== IMAGE GENERATION START ===');
  console.log('Room type:', roomType, 'Style:', style, 'User:', userId);

  const prompt = `Professional interior design photograph of a beautiful ${style || 'modern'} ${roomType || 'living room'}. High-end architectural photography, elegant designer furniture, natural lighting, photorealistic, 8k quality, award-winning interior design.`;

  // Check rate limit if userId provided
  if (userId && !checkRateLimit(userId)) {
    console.log('Image generation rate limited for user:', userId);
    return null;
  }

  // Try DALL-E 3 first (primary)
  let imageUrl = await generateImageDALLE(prompt);

  // Fallback to Replicate if DALL-E fails
  if (!imageUrl) {
    console.log('Falling back to Replicate...');
    imageUrl = await generateImageReplicate(prompt);
  }

  console.log('=== IMAGE GENERATION END ===');
  console.log('Result URL:', imageUrl ? imageUrl.substring(0, 50) + '...' : 'null');
  return imageUrl;
}

// Generate room design suggestions
router.post('/generate-design', authenticateToken, async (req, res) => {
  try {
    const { roomType, style, budget, preferences, dimensions } = req.body;

    const prompt = `You are an expert interior designer. Generate a detailed design suggestion for a ${roomType} with the following specifications:
- Style: ${style || 'modern'}
- Budget: ${budget ? `$${budget}` : 'flexible'}
- Preferences: ${preferences || 'none specified'}
- Dimensions: ${dimensions || 'standard size'}

Provide a JSON response with:
{
  "designName": "name for this design",
  "description": "overall design description",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "furnitureSuggestions": [
    {"name": "item name", "category": "category", "estimatedPrice": 100, "reason": "why this fits"}
  ],
  "layoutTips": ["tip1", "tip2", "tip3"],
  "materialRecommendations": ["material1", "material2"],
  "lightingAdvice": "lighting suggestions",
  "accentIdeas": ["idea1", "idea2"]
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior designer. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let designSuggestion;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      designSuggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      designSuggestion = { raw: content };
    }

    // Generate image for the design
    const imageUrl = await generateImage(roomType || 'Living Room', style || 'Modern Minimalist', req.user.id);
    if (imageUrl) {
      designSuggestion.imageUrl = imageUrl;
    }

    // Save generation to database
    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'design',
        prompt: JSON.stringify({ roomType, style, budget, preferences, dimensions }),
        result: JSON.stringify(designSuggestion),
        imageUrl: imageUrl,
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        tokens: aiResponse.usage?.total_tokens || 0
      }
    });

    res.json({ success: true, design: designSuggestion });
  } catch (error) {
    console.error('Generate design error:', error);
    res.status(500).json({ error: 'Failed to generate design', message: error.message });
  }
});

// Generate color palette
router.post('/generate-palette', authenticateToken, async (req, res) => {
  try {
    const { mood, style, roomType, baseColor } = req.body;

    const prompt = `Generate a professional interior design color palette for:
- Mood: ${mood || 'calm and inviting'}
- Style: ${style || 'modern'}
- Room Type: ${roomType || 'living room'}
${baseColor ? `- Base Color: ${baseColor}` : ''}

Respond with JSON:
{
  "paletteName": "name",
  "colors": [
    {"hex": "#XXXXXX", "name": "color name", "usage": "where to use this color"}
  ],
  "mood": "overall mood description",
  "combinations": [
    {"primary": "#XXX", "accent": "#XXX", "description": "how to combine"}
  ]
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are a color theory expert for interior design. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let palette;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      palette = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      palette = { raw: content };
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'palette',
        prompt: JSON.stringify({ mood, style, roomType, baseColor }),
        result: JSON.stringify(palette),
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'
      }
    });

    res.json({ success: true, palette });
  } catch (error) {
    console.error('Generate palette error:', error);
    res.status(500).json({ error: 'Failed to generate palette', message: error.message });
  }
});

// Generate furniture recommendations
router.post('/recommend-furniture', authenticateToken, async (req, res) => {
  try {
    const { roomType, style, budget, existingFurniture, dimensions } = req.body;

    const prompt = `As a furniture expert, recommend furniture for:
- Room: ${roomType || 'living room'}
- Style: ${style || 'modern'}
- Budget: ${budget ? `$${budget}` : 'flexible'}
- Existing furniture: ${existingFurniture || 'none'}
- Room dimensions: ${dimensions || 'standard'}

Respond with JSON:
{
  "recommendations": [
    {
      "name": "furniture name",
      "category": "seating/table/storage/decor/lighting",
      "style": "style name",
      "estimatedPrice": 500,
      "dimensions": "W x D x H",
      "material": "primary material",
      "color": "recommended color",
      "reason": "why this piece works",
      "alternatives": ["alternative 1", "alternative 2"]
    }
  ],
  "layoutSuggestion": "how to arrange the furniture",
  "totalEstimatedCost": 5000
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are a furniture and interior design expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let recommendations;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      recommendations = { raw: content };
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'furniture',
        prompt: JSON.stringify({ roomType, style, budget, existingFurniture, dimensions }),
        result: JSON.stringify(recommendations),
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'
      }
    });

    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('Recommend furniture error:', error);
    res.status(500).json({ error: 'Failed to recommend furniture', message: error.message });
  }
});

// Analyze room from description
router.post('/analyze-room', authenticateToken, async (req, res) => {
  try {
    const { description, currentIssues, goals } = req.body;

    const prompt = `Analyze this room and provide improvement suggestions:
- Description: ${description}
- Current Issues: ${currentIssues || 'none specified'}
- Goals: ${goals || 'general improvement'}

Respond with JSON:
{
  "analysis": {
    "currentState": "assessment of current room",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"]
  },
  "improvements": [
    {
      "area": "what to improve",
      "suggestion": "detailed suggestion",
      "priority": "high/medium/low",
      "estimatedCost": "$X - $Y",
      "difficulty": "easy/moderate/challenging"
    }
  ],
  "quickWins": ["quick improvement 1", "quick improvement 2"],
  "longTermGoals": ["goal 1", "goal 2"]
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an interior design consultant. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let analysis;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      analysis = { raw: content };
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'analysis',
        prompt: JSON.stringify({ description, currentIssues, goals }),
        result: JSON.stringify(analysis),
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'
      }
    });

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Analyze room error:', error);
    res.status(500).json({ error: 'Failed to analyze room', message: error.message });
  }
});

// Generate style guide
router.post('/generate-style-guide', authenticateToken, async (req, res) => {
  try {
    const { style, preferences, homeType } = req.body;

    const prompt = `Create a comprehensive interior design style guide for:
- Style: ${style || 'modern minimalist'}
- Preferences: ${preferences || 'clean and functional'}
- Home Type: ${homeType || 'apartment'}

Respond with JSON:
{
  "styleName": "name",
  "overview": "style description",
  "keyElements": ["element1", "element2"],
  "colorScheme": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3", "#hex4"],
    "accents": ["#hex5", "#hex6"]
  },
  "materials": [
    {"name": "material", "usage": "where to use", "alternatives": ["alt1"]}
  ],
  "furnitureStyles": ["style1", "style2"],
  "patterns": ["pattern1", "pattern2"],
  "lighting": {
    "natural": "advice",
    "artificial": ["type1", "type2"]
  },
  "doAndDont": {
    "do": ["tip1", "tip2"],
    "dont": ["avoid1", "avoid2"]
  },
  "inspirationKeywords": ["keyword1", "keyword2"]
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an interior design style expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let styleGuide;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      styleGuide = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      styleGuide = { raw: content };
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'style-guide',
        prompt: JSON.stringify({ style, preferences, homeType }),
        result: JSON.stringify(styleGuide),
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'
      }
    });

    res.json({ success: true, styleGuide });
  } catch (error) {
    console.error('Generate style guide error:', error);
    res.status(500).json({ error: 'Failed to generate style guide', message: error.message });
  }
});

// Get AI generation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { type, limit = 20, offset = 0 } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;

    const generations = await prisma.aIGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.aIGeneration.count({ where });

    res.json({ generations, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Get single generation
router.get('/history/:id', authenticateToken, async (req, res) => {
  try {
    const generation = await prisma.aIGeneration.findUnique({
      where: { id: req.params.id }
    });

    if (!generation || generation.userId !== req.user.id) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json(generation);
  } catch (error) {
    console.error('Get generation error:', error);
    res.status(500).json({ error: 'Failed to get generation' });
  }
});

// AI Style Matcher - Match user preferences to interior design styles
router.post('/match-style', authenticateToken, async (req, res) => {
  try {
    const { preferences, lifestyle, colorPreferences, spaceType, budgetRange } = req.body;

    const prompt = `As an expert interior design style consultant, analyze these user preferences and match them to the best interior design styles:

User Profile:
- General Preferences: ${preferences || 'Not specified'}
- Lifestyle: ${lifestyle || 'Not specified'}
- Color Preferences: ${colorPreferences || 'No specific preference'}
- Space Type: ${spaceType || 'General living space'}
- Budget Range: ${budgetRange || 'Flexible'}

Provide a detailed style matching analysis in JSON format:
{
  "primaryMatch": {
    "styleName": "best matching style name",
    "matchScore": 95,
    "description": "why this style matches perfectly",
    "keyCharacteristics": ["char1", "char2", "char3"],
    "recommendedColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
    "typicalMaterials": ["material1", "material2"],
    "priceRange": "$X,XXX - $XX,XXX"
  },
  "alternativeMatches": [
    {
      "styleName": "alternative style",
      "matchScore": 85,
      "whyItFits": "reason",
      "keyDifference": "what makes it different"
    }
  ],
  "styleBlendSuggestion": {
    "combination": "Style A + Style B",
    "description": "how to blend styles effectively",
    "ratio": "70/30 blend recommendation"
  },
  "personalizedTips": ["tip1", "tip2", "tip3"],
  "avoidStyles": [
    {
      "styleName": "style to avoid",
      "reason": "why it doesn't match"
    }
  ]
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior design style consultant. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let styleMatch;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      styleMatch = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      styleMatch = { raw: content };
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'style-match',
        prompt: JSON.stringify({ preferences, lifestyle, colorPreferences, spaceType, budgetRange }),
        result: JSON.stringify(styleMatch),
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        tokens: aiResponse.usage?.total_tokens || 0
      }
    });

    res.json({ success: true, styleMatch });
  } catch (error) {
    console.error('Style match error:', error);
    res.status(500).json({ error: 'Failed to match style', message: error.message });
  }
});

// AI Budget Planner - Create detailed budget breakdown for interior design
router.post('/plan-budget', authenticateToken, async (req, res) => {
  try {
    const { totalBudget, roomType, style, priorities, existingItems, timeline } = req.body;

    const prompt = `As an expert interior design budget planner, create a comprehensive budget plan:

Project Details:
- Total Budget: $${totalBudget || 10000}
- Room Type: ${roomType || 'Living Room'}
- Desired Style: ${style || 'Modern'}
- Priorities: ${priorities || 'Quality furniture, good lighting'}
- Existing Items to Keep: ${existingItems || 'None specified'}
- Timeline: ${timeline || 'Flexible'}

Create a detailed budget breakdown in JSON format:
{
  "budgetSummary": {
    "totalBudget": ${totalBudget || 10000},
    "recommendedSpend": X,
    "contingencyFund": X,
    "potentialSavings": X
  },
  "categoryBreakdown": [
    {
      "category": "Furniture",
      "allocation": 5000,
      "percentage": 50,
      "priority": "high",
      "items": [
        {
          "item": "Sofa",
          "budgetRange": "$1,500 - $2,500",
          "recommendedBrand": "brand suggestion",
          "savingTip": "how to save money"
        }
      ]
    },
    {
      "category": "Lighting",
      "allocation": 1000,
      "percentage": 10,
      "priority": "medium",
      "items": []
    }
  ],
  "phaseTimeline": [
    {
      "phase": 1,
      "name": "Essential Furniture",
      "budget": 4000,
      "duration": "Month 1-2",
      "items": ["item1", "item2"]
    }
  ],
  "savingStrategies": [
    {
      "strategy": "strategy name",
      "potentialSavings": "$500-1000",
      "implementation": "how to implement"
    }
  ],
  "splurgeVsSave": {
    "worthSplurging": ["item1 - reason", "item2 - reason"],
    "okayToSave": ["item1 - reason", "item2 - reason"]
  },
  "hiddenCosts": ["cost1", "cost2"],
  "budgetWarnings": ["warning1", "warning2"]
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior design budget planner. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let budgetPlan;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      budgetPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      budgetPlan = { raw: content };
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'budget-plan',
        prompt: JSON.stringify({ totalBudget, roomType, style, priorities, existingItems, timeline }),
        result: JSON.stringify(budgetPlan),
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        tokens: aiResponse.usage?.total_tokens || 0
      }
    });

    res.json({ success: true, budgetPlan });
  } catch (error) {
    console.error('Budget plan error:', error);
    res.status(500).json({ error: 'Failed to create budget plan', message: error.message });
  }
});

// AI Before/After Visualizer - Generate transformation suggestions
router.post('/visualize-transformation', authenticateToken, async (req, res) => {
  try {
    const { currentState, desiredStyle, budget, constraints, mustKeep } = req.body;

    const prompt = `As an expert interior design transformation specialist, analyze the current room and create a detailed before/after transformation plan:

Current Room State:
${currentState || 'Standard living room with basic furniture'}

Desired Style: ${desiredStyle || 'Modern Minimalist'}
Budget: $${budget || 15000}
Constraints: ${constraints || 'None specified'}
Items to Keep: ${mustKeep || 'None specified'}

Create a comprehensive transformation plan in JSON format:
{
  "transformationOverview": {
    "title": "Transformation Title",
    "tagline": "Brief inspiring description",
    "transformationScore": 85,
    "estimatedBudget": ${budget || 15000},
    "timelineWeeks": 4
  },
  "beforeAnalysis": {
    "currentStyle": "identified current style",
    "strengths": ["strength1", "strength2"],
    "painPoints": ["issue1", "issue2"],
    "potentialScore": 40
  },
  "afterVision": {
    "targetStyle": "${desiredStyle || 'Modern Minimalist'}",
    "keyImprovements": ["improvement1", "improvement2", "improvement3"],
    "moodDescription": "how the space will feel",
    "targetScore": 90
  },
  "transformationSteps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "What to do",
      "category": "Furniture/Decor/Lighting/Color",
      "impact": "high/medium/low",
      "cost": 1000,
      "beforeState": "current condition",
      "afterState": "transformed condition"
    }
  ],
  "colorTransformation": {
    "before": ["#current1", "#current2"],
    "after": ["#new1", "#new2", "#new3", "#new4", "#new5"],
    "transitionTips": "how to transition colors"
  },
  "furnitureChanges": {
    "remove": [{"item": "item to remove", "reason": "why"}],
    "keep": [{"item": "item to keep", "modification": "any modifications"}],
    "add": [{"item": "new item", "purpose": "why needed", "budget": 500}]
  },
  "lightingPlan": {
    "current": "current lighting assessment",
    "proposed": "proposed lighting changes",
    "fixtures": [{"type": "fixture type", "location": "where", "impact": "what it achieves"}]
  },
  "impactMetrics": {
    "aestheticImprovement": 75,
    "functionalityGain": 60,
    "comfortIncrease": 80,
    "valueAdd": 40
  },
  "quickWins": ["quick win 1", "quick win 2", "quick win 3"],
  "biggestImpactChanges": ["change 1", "change 2"]
}`;

    const aiResponse = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior design transformation specialist. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const content = stripCodeBlocks(aiResponse.choices[0].message.content);
    let transformation;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      transformation = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      transformation = { raw: content };
    }

    // Generate before and after images
    const beforeImagePrompt = `Interior design photograph of ${currentState || 'a standard outdated living room'}, needs renovation, realistic photo`;
    const afterImagePrompt = `Professional interior design photograph of a beautiful ${desiredStyle || 'Modern Minimalist'} room, high-end architectural photography, elegant designer furniture, natural lighting, photorealistic, 8k quality, award-winning interior design`;

    let beforeImageUrl = null;
    let afterImageUrl = null;

    // Generate after image (main transformation result)
    afterImageUrl = await generateImage(currentState || 'Living Room', desiredStyle || 'Modern Minimalist', req.user.id);

    if (afterImageUrl) {
      transformation.afterImageUrl = afterImageUrl;
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'transformation',
        prompt: JSON.stringify({ currentState, desiredStyle, budget, constraints, mustKeep }),
        result: JSON.stringify(transformation),
        imageUrl: afterImageUrl,
        status: 'completed',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        tokens: aiResponse.usage?.total_tokens || 0
      }
    });

    res.json({ success: true, transformation });
  } catch (error) {
    console.error('Transformation error:', error);
    res.status(500).json({ error: 'Failed to visualize transformation', message: error.message });
  }
});

// Generate image for a design
router.post('/generate-image', authenticateToken, async (req, res) => {
  try {
    const { style, roomType } = req.body;

    const imageUrl = await generateImage(roomType || 'Living Room', style || 'Modern Minimalist', req.user.id);

    if (!imageUrl) {
      return res.json({
        success: false,
        error: 'Image generation unavailable. Please ensure OPENAI_API_KEY or REPLICATE_API_TOKEN is configured in your environment variables. You may also have exceeded the rate limit (5 images per minute).'
      });
    }

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'image',
        prompt: `${style || 'modern'} ${roomType || 'living room'}`,
        result: JSON.stringify({ imageUrl }),
        imageUrl,
        status: 'completed',
        model: 'openai/dall-e-3'
      }
    });

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ error: 'Failed to generate image', message: error.message });
  }
});

module.exports = router;
