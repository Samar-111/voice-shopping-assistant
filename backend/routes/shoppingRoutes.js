const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


const generateSmartSuggestions = async () => {
  const allItems = await Item.find().sort({ updatedAt: -1 }).limit(20);
  
  
  const purchasedItems = allItems.filter(i => i.purchased);
  const depletionAlerts = [];

  const commonStaples = [
    { name: 'Milk', price: 60, unit: 'packet', category: 'Dairy', interval: '2 days' },
    { name: 'Eggs', price: 80, unit: 'dozen', category: 'Dairy', interval: '5 days' },
    { name: 'Bread', price: 45, unit: 'loaf', category: 'Bakery', interval: '3 days' },
    { name: 'Bananas', price: 50, unit: 'dozen', category: 'Produce', interval: '4 days' },
    { name: 'Onions', price: 35, unit: 'kg', category: 'Produce', interval: '7 days' }
  ];

  commonStaples.forEach(staple => {
    const isAlreadyInCart = allItems.some(i => !i.purchased && i.name.toLowerCase().includes(staple.name.toLowerCase()));
    if (!isAlreadyInCart) {
      depletionAlerts.push({
        name: staple.name,
        price: staple.price,
        unit: staple.unit,
        category: staple.category,
        message: `Depletion Cycle: Restock ${staple.name} (${staple.interval} consumption avg)`
      });
    }
  });

  return {
    season: 'Monsoon / Summer',
    seasonalItems: [
      { name: 'Fresh Alphonso Mangoes', price: 180, category: 'Produce' },
      { name: 'Sweet Corn', price: 30, category: 'Produce' },
      { name: 'Green Cucumbers', price: 25, category: 'Produce' },
      { name: 'Fresh Mint & Coriander', price: 20, category: 'Produce' },
      { name: 'Watermelon', price: 50, category: 'Produce' }
    ],
    depletionAlerts: depletionAlerts.slice(0, 3)
  };
};


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
  try {
    const suggestions = await generateSmartSuggestions();
    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const voiceHandler = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'No voice transcript provided' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const systemPrompt = `
You are Nexus Cart, a voice-powered shopping logistics AI.
Analyze the user's spoken input and return ONLY a valid raw JSON object (NO markdown backticks, NO markdown formatting).

User Spoken Command: "${transcript}"

Task Requirements:
1. Identify action: "add" | "delete" | "toggle" | "clear_completed" | "filter" | "unknown"
2. For each item:
   - "name": Clean item title (e.g., "Amul Toned Milk", "Organic Bananas", "Eggs")
   - "quantity": Number (default 1)
   - "unit": e.g., "packet", "bottle", "kg", "dozen", "g", "box", "liter", "loaf"
   - "price": Reasonable estimated Indian retail price in INR ₹ per unit (e.g. Milk: 30-60, Bread: 40-50, Apples: 120-180, Eggs: 70-90, Paneer: 90-120, Rice: 80, Oil: 150). Always estimate a non-zero realistic price if not stated.
   - "category": Must be one of: "Produce", "Dairy", "Bakery", "Meat", "Beverages", "Pantry", "General"
   - "isOrganic": true if user says organic/bio/natural, else false
   - "brand": brand name if specified (e.g. "Amul", "Mother Dairy", "Tata", "Nestle")
   - "substitutes": Array of 2 smart alternatives (e.g., for "Butter" -> ["Ghee", "Peanut Butter"])
3. "feedback": A brief futuristic voice confirmation from Nexus Cart.

Output JSON Structure:
{
  "action": "add",
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "unit": "packets",
      "price": 32,
      "category": "Dairy",
      "isOrganic": false,
      "brand": "Amul",
      "substitutes": ["Oat Milk", "Almond Milk"]
    }
  ],
  "feedback": "Added 2 packets of Amul Milk (₹64) to Dairy matrix."
}
`;

    const aiResult = await model.generateContent(systemPrompt);
    const rawText = aiResult.response.text().trim();
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    let foundSubstitutes = [];

    if (parsed.action === 'add' && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        if (Array.isArray(item.substitutes)) {
          foundSubstitutes.push(...item.substitutes);
        }

        // Smart Item Merging: check if unpurchased item already exists
        const existing = await Item.findOne({
          name: new RegExp(`^${item.name.trim()}$`, 'i'),
          purchased: false
        });

        if (existing) {
          existing.quantity += (item.quantity || 1);
          if (item.price && !existing.price) existing.price = item.price;
          if (item.unit && !existing.unit) existing.unit = item.unit;
          await existing.save();
        } else {
          await Item.create({
            name: item.name.trim(),
            quantity: item.quantity || 1,
            unit: item.unit || '',
            price: typeof item.price === 'number' ? item.price : 40,
            category: item.category || 'General',
            isOrganic: Boolean(item.isOrganic),
            brand: item.brand || '',
            purchased: false
          });
        }
      }
    } else if (parsed.action === 'delete' && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        await Item.deleteMany({ name: new RegExp(item.name.trim(), 'i') });
      }
    } else if (parsed.action === 'toggle' && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        const found = await Item.findOne({ name: new RegExp(item.name.trim(), 'i') });
        if (found) {
          found.purchased = !found.purchased;
          await found.save();
        }
      }
    } else if (parsed.action === 'clear_completed') {
      await Item.deleteMany({ purchased: true });
    }

    const updatedList = await Item.find().sort({ createdAt: -1 });
    const suggestions = await generateSmartSuggestions();

    res.status(200).json({
      success: true,
      feedback: parsed.feedback || 'Shopping matrix synchronized.',
      speechResponse: parsed.feedback || 'Shopping matrix synchronized.',
      items: updatedList,
      suggestions,
      intent: {
        items: parsed.items || [],
        substitutes: foundSubstitutes
      }
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