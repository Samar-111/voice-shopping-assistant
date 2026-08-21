const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, default: null },
  size: { type: String, default: null },
  price: { type: Number, default: null },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'item' },
  category: { 
    type: String, 
    enum: ['Produce', 'Dairy & Alternatives', 'Bakery', 'Pantry', 'Meat & Seafood', 'Beverages', 'Household', 'Other'],
    default: 'Other' 
  },
  isOrganic: { type: Boolean, default: false },
  purchased: { type: Boolean, default: false },
  purchasedAt: { type: Date, default: null },
  purchaseCount: { type: Number, default: 0 },
  purchaseHistory: [{ type: Date }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', ItemSchema);