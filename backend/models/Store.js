import mongoose from 'mongoose';

const historicalVelocitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  velocity: { type: Number, required: true },
});

const inventoryItemSchema = new mongoose.Schema({
  foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
  currentStock: { type: Number, default: 0, min: 0 },
  salesVelocity: { type: Number, default: 0 }, // units sold per day
  lastUpdated: { type: Date, default: Date.now },
  historicalVelocity: [historicalVelocitySchema],
});

const storeSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true, trim: true },
    storeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    location: {
      address: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zipCode: { type: String, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    contactInfo: {
      phone: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      managerName: { type: String, trim: true },
    },
    inventory: [inventoryItemSchema],
    totalWasteValue: { type: Number, default: 0 },
    transferEfficiency: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ storeCode: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ 'inventory.foodItemId': 1 });

export default mongoose.model('Store', storeSchema);
