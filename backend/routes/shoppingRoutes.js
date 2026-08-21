const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


const EXPANDED_STAPLES = [
  
  { name: 'Milk', price: 60, unit: 'packet', category: 'Dairy', interval: '2 days' },
  { name: 'Eggs', price: 85, unit: 'dozen', category: 'Dairy', interval: '5 days' },
  { name: 'Butter', price: 58, unit: 'pack', category: 'Dairy', interval: '7 days' },
  { name: 'Curd / Dahi', price: 35, unit: 'packet', category: 'Dairy', interval: '3 days' },
  { name: 'Paneer', price: 110, unit: '200g', category: 'Dairy', interval: '4 days' },
  { name: 'Cheese Slices', price: 140, unit: 'pack', category: 'Dairy', interval: '10 days' },
  { name: 'Bread', price: 45, unit: 'loaf', category: 'Bakery', interval: '3 days' },
  { name: 'Oats', price: 120, unit: 'pack', category: 'Pantry', interval: '14 days' },

  
  { name: 'Sunflower Cooking Oil', price: 160, unit: 'liter', category: 'Pantry', interval: '15 days' },
  { name: 'Atta (Wheat Flour)', price: 210, unit: '5kg', category: 'Pantry', interval: '20 days' },
  { name: 'Basmati Rice', price: 130, unit: 'kg', category: 'Pantry', interval: '14 days' },
  { name: 'Toor Dal', price: 155, unit: 'kg', category: 'Pantry', interval: '10 days' },
  { name: 'Moong Dal', price: 140, unit: 'kg', category: 'Pantry', interval: '12 days' },
  { name: 'Tata Salt', price: 28, unit: 'kg', category: 'Pantry', interval: '30 days' },
  { name: 'Sugar', price: 46, unit: 'kg', category: 'Pantry', interval: '18 days' },
  { name: 'Turmeric Powder (Haldi)', price: 38, unit: '100g', category: 'Pantry', interval: '25 days' },
  { name: 'Red Chilli Powder', price: 55, unit: '100g', category: 'Pantry', interval: '25 days' },
  { name: 'Garam Masala', price: 75, unit: '100g', category: 'Pantry', interval: '30 days' },
  { name: 'Desi Ghee', price: 340, unit: '500ml', category: 'Pantry', interval: '20 days' },

 
  { name: 'Onions', price: 35, unit: 'kg', category: 'Produce', interval: '5 days' },
  { name: 'Potatoes', price: 30, unit: 'kg', category: 'Produce', interval: '6 days' },
  { name: 'Tomatoes', price: 40, unit: 'kg', category: 'Produce', interval: '4 days' },
  { name: 'Ginger & Garlic', price: 45, unit: 'pack', category: 'Produce', interval: '7 days' },
  { name: 'Green Chillies & Lemon', price: 20, unit: 'pack', category: 'Produce', interval: '4 days' },
  { name: 'Bananas', price: 50, unit: 'dozen', category: 'Produce', interval: '3 days' },
  { name: 'Apples', price: 160, unit: 'kg', category: 'Produce', interval: '6 days' },

  
  { name: 'Tea Leaves (Chai Patti)', price: 140, unit: '250g', category: 'Beverages', interval: '14 days' },
  { name: 'Instant Coffee', price: 190, unit: 'jar', category: 'Beverages', interval: '20 days' },
  { name: 'Green Tea', price: 180, unit: 'box', category: 'Beverages', interval: '15 days' },
  { name: 'Almonds / Dry Fruits', price: 220, unit: '200g', category: 'Pantry', interval: '20 days' },
  { name: 'Biscuits / Cookies', price: 40, unit: 'pack', category: 'Bakery', interval: '5 days' },

 
  { name: 'Dishwash Gel', price: 95, unit: 'bottle', category: 'General', interval: '15 days' },
  { name: 'Laundry Detergent', price: 190, unit: 'kg', category: 'General', interval: '20 days' },
  { name: 'Handwash Refill', price: 85, unit: 'pouch', category: 'General', interval: '18 days' },
  { name: 'Garbage Bags', price: 90, unit: 'roll', category: 'General', interval: '25 days' },
  { name: 'Toilet Paper / Tissues', price: 110, unit: 'pack', category: 'General', interval: '14 days' }
];


const generateSmartSuggestions = async () => {
  const allItems = await Item.find().sort({ updatedAt: -1 });

  
  const availableStaples = EXPANDED_STAPLES.filter(staple => {
    return !allItems.some(
      item => !item.purchased && item.name.toLowerCase().includes(staple.name.toLowerCase())
    );
  });

  
  const shuffled = [...availableStaples];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

 
  const depletionAlerts = shuffled.slice(0, 4).map(item => ({
    name: item.name,
    price: item.price,
    unit: item.unit,
    category: item.category,
    message: `Restock Cycle: Depleting soon (~${item.interval} consumption average)`
  }));

  
  const seasonalHarvestPool = [
    { name: 'Fresh Alphonso Mangoes', price: 180, category: 'Produce' },
    { name: 'Sweet Corn', price: 30, category: 'Produce' },
    { name: 'Green Cucumbers', price: 25, category: 'Produce' },
    { name: 'Fresh Mint & Coriander', price: 20, category: 'Produce' },
    { name: 'Watermelon', price: 55, category: 'Produce' },
    { name: 'Organic Pomegranates', price: 140, category: 'Produce' },
    { name: 'Fresh Tender Coconut', price: 60, category: 'Beverages' }
  ];

  return {
    season: 'Fresh Seasonal Harvest',
    seasonalItems: seasonalHarvestPool.slice(0, 4),
    depletionAlerts
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
   - "price": Realistic Indian retail price in INR ₹ per unit (e.g. Milk: 30-60, Bread: 40-50, Apples: 120-180, Eggs: 70-90, Paneer: 90-120, Rice: 80, Oil: 150). Always estimate a non-zero realistic price if not stated.
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