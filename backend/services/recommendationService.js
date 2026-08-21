const Item = require('../models/Item');

const SEASONAL_CATALOG = {
  Spring: [
    { name: 'Fresh Asparagus', category: 'Produce', price: 120 },
    { name: 'Organic Strawberries', category: 'Produce', isOrganic: true, price: 180 },
    { name: 'Baby Spinach (Palak)', category: 'Produce', isOrganic: true, price: 30 }
  ],
  Summer: [
    { name: 'Watermelon (Tarbooz)', category: 'Produce', price: 80 },
    { name: 'Alphonso Mangoes', category: 'Produce', price: 350 },
    { name: 'Sweet Corn (Bhutta)', category: 'Produce', price: 25 },
    { name: 'Fresh Blueberries', category: 'Produce', isOrganic: true, price: 220 }
  ],
  Autumn: [
    { name: 'Shimla Apples', category: 'Produce', isOrganic: true, price: 160 },
    { name: 'Custard Apple (Sitaphal)', category: 'Produce', price: 90 },
    { name: 'Masala Chai Blend', category: 'Beverages', price: 140 }
  ],
  Winter: [
    { name: 'Nagpur Oranges', category: 'Produce', price: 70 },
    { name: 'Pomegranate (Anar)', category: 'Produce', price: 140 },
    { name: 'Red Delhi Carrots', category: 'Produce', isOrganic: true, price: 45 }
  ]
};


const STAPLE_ROTATION_POOL = [
  { keywords: ['bread', 'pav', 'bun'], name: 'Brown Bread', category: 'Bakery', price: 45, message: "It looks like you're running low on bread." },
  { keywords: ['milk', 'doodh'], name: 'Fresh Milk', category: 'Dairy & Alternatives', price: 32, message: "It looks like you're running low on milk." },
  { keywords: ['egg', 'ande'], name: 'Farm Eggs (6 pcs)', category: 'Dairy & Alternatives', price: 50, message: "It looks like you're running low on eggs." },
  { keywords: ['butter', 'makhan'], name: 'Butter', category: 'Dairy & Alternatives', price: 58, message: "You might need butter for the week." },
  { keywords: ['tomato', 'tamatar'], name: 'Fresh Tomatoes (1 kg)', category: 'Produce', price: 40, message: "Running low on fresh tomatoes." },
  { keywords: ['onion', 'pyaz'], name: 'Onions (1 kg)', category: 'Produce', price: 35, message: "Time to restock onions." },
  { keywords: ['potato', 'aalu'], name: 'Potatoes (1 kg)', category: 'Produce', price: 30, message: "Running low on daily potatoes." },
  { keywords: ['tea', 'chai'], name: 'Chai Tea Leaves', category: 'Beverages', price: 130, message: "It looks like tea supplies are low." },
  { keywords: ['coffee'], name: 'Instant Coffee', category: 'Beverages', price: 180, message: "Time to restock your coffee jar." },
  { keywords: ['rice', 'chawal'], name: 'Basmati Rice (1 kg)', category: 'Pantry', price: 90, message: "Pantry check: you may need rice." },
  { keywords: ['atta', 'flour'], name: 'Wheat Atta (5 kg)', category: 'Pantry', price: 220, message: "Running low on wheat flour / atta." },
  { keywords: ['oil', 'tel'], name: 'Cooking Oil (1 L)', category: 'Pantry', price: 140, message: "Time to restock cooking oil." },
  { keywords: ['banana', 'kela'], name: 'Bananas (1 dozen)', category: 'Produce', price: 50, message: "Grab fresh bananas for quick snacks." },
  { keywords: ['sugar', 'cheeni'], name: 'Sugar (1 kg)', category: 'Pantry', price: 45, message: "Pantry alert: running low on sugar." }
];

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

function isItemInList(stapleKeywords, activeNames) {
  return activeNames.some(activeName => {
    const lowerActive = activeName.toLowerCase();
    return stapleKeywords.some(kw => lowerActive.includes(kw));
  });
}

async function getSmartSuggestions() {
  const currentSeason = getCurrentSeason();
  const seasonalItems = SEASONAL_CATALOG[currentSeason] || [];

 
  const activeItems = await Item.find({ purchased: false });
  const activeNames = activeItems.map(i => i.name.toLowerCase().trim());

  const purchasedItems = await Item.find({ purchased: true }).sort({ purchasedAt: -1 });

  const now = Date.now();
  const depletionAlerts = [];
  const processedKeys = new Set();

 
  for (const item of purchasedItems) {
    const cleanName = item.name.toLowerCase().trim();
    if (activeNames.some(act => act.includes(cleanName) || cleanName.includes(act))) continue;

    const daysSince = item.purchasedAt 
      ? (now - new Date(item.purchasedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 5;

    if (daysSince >= 2 && !processedKeys.has(cleanName)) {
      processedKeys.add(cleanName);
      depletionAlerts.push({
        _id: item._id,
        name: item.name,
        category: item.category,
        price: item.price || 50,
        message: `It looks like you're running low on ${item.name}.`,
        daysAgo: Math.round(daysSince),
        purchaseCount: item.purchaseCount || 1
      });
    }
  }

 
  for (const staple of STAPLE_ROTATION_POOL) {
    if (depletionAlerts.length >= 3) break;

   
    if (!isItemInList(staple.keywords, activeNames) && !processedKeys.has(staple.name.toLowerCase())) {
      processedKeys.add(staple.name.toLowerCase());
      depletionAlerts.push({
        name: staple.name,
        category: staple.category,
        price: staple.price,
        message: staple.message,
        daysAgo: 3,
        purchaseCount: 0
      });
    }
  }

  return {
    season: currentSeason,
    seasonalItems,
    depletionAlerts: depletionAlerts.slice(0, 3)
  };
}

module.exports = { getSmartSuggestions };