const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getItemsHandler = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', details: error.message });
  }
};

router.get('/', getItemsHandler);
router.get('/items', getItemsHandler);

router.get('/smart-suggestions', async (req, res) => {
  res.status(200).json({
    season: 'Summer',
    seasonalItems: [
      { name: 'Watermelon', price: 40 },
      { name: 'Mangoes', price: 120 },
      { name: 'Cucumber', price: 25 },
      { name: 'Mint Leaves', price: 15 }
    ],
    depletionAlerts: [
      { name: 'Milk', price: 60, category: 'Dairy', message: 'Usual restock interval: 2 days' }
    ]
  });
});

const voiceHandler = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'No voice transcript provided' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const systemPrompt = `
You are Nexus Cart, an intelligent voice-shopping assistant.
Parse the user voice transcript and output ONLY a raw JSON object (no backticks, no markdown):
{
  "action": "add" | "delete" | "toggle" | "clear_completed" | "unknown",
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "category": "Produce" | "Dairy" | "Bakery" | "Meat" | "Beverages" | "Pantry" | "General"
    }
  ],
  "feedback": "Short friendly confirmation message"
}

User transcript: "${transcript}"
`;

    const aiResult = await model.generateContent(systemPrompt);
    const rawText = aiResult.response.text().trim();
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.action === 'add' && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        await Item.create({
          name: item.name,
          quantity: item.quantity || 1,
          category: item.category || 'General',
          purchased: false
        });
      }
    } else if (parsed.action === 'delete' && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        await Item.deleteMany({ name: new RegExp(`^${item.name}$`, 'i') });
      }
    } else if (parsed.action === 'clear_completed') {
      await Item.deleteMany({ purchased: true });
    }

    const updatedList = await Item.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      feedback: parsed.feedback || 'Nexus Cart updated.',
      items: updatedList
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({ error: 'Voice processing failed', details: error.message });
  }
};

router.post('/voice', voiceHandler);
router.post('/voice-command', voiceHandler);


router.put('/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;