import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    SKU: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: {
      type: String,
      required: true,
      enum: ['Dairy', 'Meat', 'Produce', 'Bakery', 'Seafood', 'Prepared'],
    },
    batchNumber: { type: String, required: true, trim: true },
    expirationDate: { type: Date, required: true, index: true },
    basePrice: { type: Number, required: true, min: 0 },
    unitType: { type: String, enum: ['kg', 'pieces', 'liters', 'packets'], required: true },
    minimumStockThreshold: { type: Number, default: 10, min: 0 },
    storageTemperature: {
      min: { type: Number },
      max: { type: Number },
    },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for batch tracking
foodItemSchema.index({ SKU: 1, batchNumber: 1 });
foodItemSchema.index({ category: 1 });
foodItemSchema.index({ expirationDate: 1, isActive: 1 });

export default mongoose.model('FoodItem', foodItemSchema);
