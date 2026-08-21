const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      enum: [
        'Produce',
        'Dairy',
        'Bakery',
        'Meat',
        'Beverages',
        'Pantry',
        'General',
        'Other',
        'produce',
        'dairy',
        'bakery',
        'meat',
        'beverages',
        'pantry',
        'general',
        'other'
      ],
      default: 'General'
    },
    isOrganic: {
      type: Boolean,
      default: false
    },
    brand: {
      type: String,
      default: ''
    },
    purchased: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);