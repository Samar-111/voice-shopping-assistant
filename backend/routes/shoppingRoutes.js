const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { parseVoiceIntent } = require('../services/nlpService');
const { getSmartSuggestions } = require('../services/recommendationService');


router.get('/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});


router.get('/smart-suggestions', async (req, res) => {
  try {
    const suggestions = await getSmartSuggestions();
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve suggestions' });
  }
});


router.post('/voice-command', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'Transcript required' });

  try {
    const intent = await parseVoiceIntent(transcript);
    let activeFilter = null;

    if (intent.action === 'ADD') {
      for (const itemData of intent.items) {
        let existing = await Item.findOne({ name: itemData.name, purchased: false });
        if (existing) {
          existing.quantity += (itemData.quantity || 1);
          if (itemData.price) existing.price = itemData.price;
          await existing.save();
        } else {
          await Item.create(itemData);
        }
      }
    } else if (intent.action === 'REMOVE') {
      for (const itemData of intent.items) {
        await Item.deleteMany({ name: new RegExp(itemData.name, 'i') });
      }
    } else if (intent.action === 'SEARCH') {
      activeFilter = intent.searchFilter;
    }

    let items;
    if (activeFilter) {
      const query = {};
      if (activeFilter.query) query.name = new RegExp(activeFilter.query, 'i');
      if (activeFilter.maxPrice) query.price = { $lte: activeFilter.maxPrice };
      if (activeFilter.isOrganic !== null && activeFilter.isOrganic !== undefined) {
        query.isOrganic = activeFilter.isOrganic;
      }
      items = await Item.find(query).sort({ createdAt: -1 });
    } else {
      items = await Item.find().sort({ createdAt: -1 });
    }

    const suggestions = await getSmartSuggestions();

    
    let speech = intent.speechResponse || 'List updated.';
    if (suggestions.depletionAlerts && suggestions.depletionAlerts.length > 0 && intent.action === 'ADD') {
      const topAlert = suggestions.depletionAlerts[0];
      speech += ` By the way, ${topAlert.message.toLowerCase()}`;
    }

    res.json({
      intent,
      activeFilter,
      items,
      suggestions,
      speechResponse: speech
    });
  } catch (error) {
    console.error('Voice Command Error:', error);
    res.status(500).json({ error: 'Voice processing failed' });
  }
});


router.put('/items/:id/toggle', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.purchased = !item.purchased;

    if (item.purchased) {
      const now = new Date();
      item.purchasedAt = now;
      item.purchaseCount = (item.purchaseCount || 0) + 1;
      if (!Array.isArray(item.purchaseHistory)) item.purchaseHistory = [];
      item.purchaseHistory.push(now);
    }

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});


router.delete('/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item purged' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;