require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Comprehensive Category & Metadata Dictionary
const CATEGORY_MAP = {
  'Dairy & Alternatives': [
    'milk', 'doodh', 'दूध', 'curd', 'dahi', 'दही', 'paneer', 'पनीर', 'cheese', 'butter', 'makhan', 'मक्खन',
    'ghee', 'घी', 'yogurt', 'eggs', 'ande', 'अंडे', 'cream', 'malai', 'almond milk', 'soya milk', 'oat milk', 'tofu'
  ],
  'Produce': [
    'apple', 'apples', 'seb', 'सेब', 'banana', 'bananas', 'kela', 'केला', 'orange', 'oranges', 'santra', 'mango', 'mangoes', 'aam', 'आम',
    'watermelon', 'tarbooz', 'तरबूज', 'tomato', 'tomatoes', 'tamatar', 'टमाटर', 'potato', 'potatoes', 'aalu', 'आलू',
    'onion', 'onions', 'pyaz', 'प्याज', 'spinach', 'palak', 'पालक', 'carrot', 'carrots', 'gajar', 'गाजर', 'peas', 'matar', 'मटर',
    'lemon', 'lemons', 'nimbu', 'नींबू', 'ginger', 'adrak', 'अदरक', 'garlic', 'lehsun', 'लहसुन', 'coriander', 'dhaniya',
    'cucumber', 'kheera', 'chilli', 'mirchi', 'berries', 'grapes', 'angoor', 'bhutta', 'corn'
  ],
  'Bakery': [
    'bread', 'ब्रेड', 'brown bread', 'white bread', 'pav', 'पाव', 'bun', 'buns', 'croissant', 'cake',
    'muffin', 'toast', 'rusk', 'bagel', 'pita', 'naan', 'kulcha'
  ],
  'Pantry': [
    'rice', 'chawal', 'चावल', 'flour', 'atta', 'आटा', 'maida', 'besan', 'dal', 'दाल', 'pulses',
    'oil', 'tel', 'तेल', 'mustard oil', 'olive oil', 'sugar', 'cheeni', 'चीनी', 'salt', 'namak', 'नमक',
    'spices', 'masala', 'haldi', 'turmeric', 'pasta', 'noodles', 'maggi', 'मैगी', 'oats', 'poha',
    'sooji', 'suji', 'jaggery', 'gur', 'गुड़', 'sauce', 'ketchup', 'pickle', 'achar'
  ],
  'Beverages': [
    'tea', 'chai', 'चाय', 'coffee', 'कॉफी', 'green tea', 'juice', 'cold drink', 'coke', 'pepsi',
    'soda', 'water', 'paani', 'पानी', 'energy drink', 'squash', 'syrup'
  ],
  'Household': [
    'soap', 'sabun', 'साबुन', 'shampoo', 'toothpaste', 'टूथपेस्ट', 'toothbrush', 'detergent', 'surf',
    'dishwash', 'vim', 'scrubber', 'tissue', 'paper towel', 'foil', 'cleaner', 'harpic', 'sanitizer'
  ],
  'Meat & Seafood': [
    'chicken', 'mutton', 'fish', 'machhli', 'मछली', 'prawns', 'meat', 'egg'
  ]
};

const DEFAULT_PRICES = {
  'milk': 32, 'doodh': 32, 'bread': 45, 'eggs': 80, 'ande': 80, 'butter': 58, 'paneer': 90,
  'tomato': 40, 'tamatar': 40, 'potato': 30, 'aalu': 30, 'onion': 35, 'pyaz': 35, 'apple': 140, 'apples': 140, 'seb': 140,
  'banana': 50, 'kela': 50, 'watermelon': 80, 'tarbooz': 80, 'rice': 60, 'chawal': 60, 'atta': 220,
  'dal': 120, 'oil': 140, 'tel': 140, 'sugar': 45, 'salt': 25, 'tea': 130, 'chai': 130, 'coffee': 180,
  'soap': 35, 'toothpaste': 65, 'maggi': 14
};

function detectCategory(itemName) {
  const clean = itemName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => clean.includes(k))) {
      return category;
    }
  }
  return 'Other';
}

function detectPrice(itemName) {
  const clean = itemName.toLowerCase();
  for (const [key, price] of Object.entries(DEFAULT_PRICES)) {
    if (clean.includes(key)) {
      return price;
    }
  }
  return 50;
}

const NUM_WORDS = {
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'छह': 6,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6
};

// Conversational and connector phrases to strip
const FILLER_PATTERNS = [
  /\b(i need|i want|we need|we want|get me|give me|bring me|pick up|can you get|can you add|please add|please get|please)\b/gi,
  /\b(to my list|to the list|to list|in my list|in the cart|to my cart|to cart|from my list|from list)\b/gi,
  /\b(add karo|daal do|lao|le aao|mujhe|mujhko|hume|humko|chahiye|डालो|जोड़ो|ले आओ|चाहिए|मुझे|हमको)\b/gi,
  /\b(add|buy|put|purchase|get|order|remove|delete)\b/gi,
  /\b(some|a few|few|any|the|a|an)\b/gi,
  /\b(of|for|with|about|around|ka|ki|ke|wala|wali|wale|का|की|के|वाला|वाली|वाले)\b/gi
];

function cleanRawText(text) {
  let cleaned = text;
  FILLER_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });

  return cleaned
    .replace(/\b(packets?|kilos?|kg|litres?|liters?|dozens?|bottles?|किलो|पैकेट|लीटर|दर्जन|बोतल)\b/gi, ' ')
    .replace(/\b(one|two|three|four|five|एक|दो|तीन|चार|पांच|\d+)\b/gi, ' ')
    .replace(/\b(organic|ऑर्गेनिक)\b/gi, ' ')
    .replace(/^\s*(of|for|with|ka|ki|ke)\s+/gi, '')
    .replace(/\s+(of|for|with|ka|ki|ke)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fallbackSmartParser(transcript) {
  const text = transcript.trim().toLowerCase();

  // Search Action
  if (text.includes('search') || text.includes('find') || text.includes('ढूंढो') || text.includes('khojo')) {
    let query = text.replace(/(search for|search|find me|find|ढूंढो|khojo)/gi, '').trim();
    return {
      action: 'SEARCH',
      searchFilter: { query, maxPrice: null, minPrice: null, isOrganic: null, category: null },
      items: [],
      speechResponse: `Searching for ${query}`
    };
  }

  // Remove Action
  if (text.includes('remove') || text.includes('delete') || text.includes('हटाओ') || text.includes('hatao')) {
    const clean = cleanRawText(text) || 'item';
    return {
      action: 'REMOVE',
      searchFilter: null,
      items: [{ name: clean, quantity: 1, unit: 'item', category: 'Other', isOrganic: false, substitutes: [] }],
      speechResponse: `Removed ${clean} from your shopping list.`
    };
  }

  // Quantity Extraction
  let quantity = 1;
  const numMatch = text.match(/\d+/);
  if (numMatch) {
    quantity = parseInt(numMatch[0]);
  } else {
    for (const [word, val] of Object.entries(NUM_WORDS)) {
      if (text.includes(word)) {
        quantity = val;
        break;
      }
    }
  }

  // Unit Extraction
  let unit = 'item';
  if (text.includes('किलो') || text.includes('kg') || text.includes('kilo')) unit = 'kg';
  else if (text.includes('पैकेट') || text.includes('packet') || text.includes('packets')) unit = 'packet';
  else if (text.includes('लीटर') || text.includes('litre') || text.includes('litres') || text.includes('liter') || text.includes('liters')) unit = 'litre';
  else if (text.includes('दर्जन') || text.includes('dozen')) unit = 'dozen';
  else if (text.includes('bottle') || text.includes('bottles') || text.includes('बोतल')) unit = 'bottle';

  // Clean Name
  const cleanName = cleanRawText(text) || 'item';
  const category = detectCategory(cleanName);
  const price = detectPrice(cleanName);
  const isOrganic = text.includes('organic') || text.includes('ऑर्गेनिक');

  return {
    action: 'ADD',
    searchFilter: null,
    items: [
      {
        name: cleanName,
        brand: null,
        size: null,
        price: price,
        quantity: quantity,
        unit: unit,
        category: category,
        isOrganic: isOrganic,
        substitutes: category === 'Dairy & Alternatives' ? ['oat milk', 'almond milk', 'soya milk'] : []
      }
    ],
    speechResponse: `Added ${quantity} ${unit} of ${cleanName} under ${category}.`
  };
}

const SYSTEM_PROMPT = `
You are the AI engine of an Indian voice shopping assistant. Understand English, Hindi, and Hinglish.

Extract the CLEAN item name without prepositions or conversational words:
- "I need 5 litres of milk" -> name: "milk", quantity: 5, unit: "litre", category: "Dairy & Alternatives"
- "Add 2 packets of brown bread" -> name: "brown bread", quantity: 2, unit: "packet", category: "Bakery"
- "Mujhe 1 kilo tamatar chahiye" -> name: "tamatar", quantity: 1, unit: "kg", category: "Produce"

Assign each item to ONE of these categories:
- 'Dairy & Alternatives' (milk, cheese, paneer, curd, butter, ghee, eggs, almond milk)
- 'Produce' (fruits, vegetables, herbs, watermelon, apples, potatoes, tomatoes)
- 'Bakery' (bread, pav, buns, cakes, toasts)
- 'Pantry' (rice, atta, dal, oil, sugar, salt, spices, pasta, maggi)
- 'Beverages' (tea, chai, coffee, juice, cold drinks, water)
- 'Household' (soap, shampoo, toothpaste, detergent, cleaners)
- 'Meat & Seafood' (chicken, fish, meat)
- 'Other'

Return valid JSON:
{
  "action": "ADD" | "REMOVE" | "SEARCH" | "RESET_SEARCH" | "SUGGEST",
  "searchFilter": { "query": null, "brand": null, "maxPrice": null, "minPrice": null, "isOrganic": null, "category": null },
  "items": [
    {
      "name": "string",
      "brand": null,
      "size": null,
      "price": number,
      "quantity": number,
      "unit": "string",
      "category": "string",
      "isOrganic": boolean,
      "substitutes": ["string"]
    }
  ],
  "speechResponse": "string"
}
`;

async function parseVoiceIntent(transcript) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && !apiKey.includes('YourActual') && apiKey.startsWith('AIzaSy')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      });

      const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nVoice Command: "${transcript}"`);
      const parsed = JSON.parse(result.response.text());
      if (parsed && parsed.items && parsed.items.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn("Gemini call failed, using fallback parser:", err.message);
    }
  }

  return fallbackSmartParser(transcript);
}

module.exports = { parseVoiceIntent };