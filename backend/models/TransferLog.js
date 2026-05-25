import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const transferLogSchema = new mongoose.Schema(
  {
    transferId: { type: String, unique: true, default: () => `TRF-${uuidv4().split('-')[0].toUpperCase()}` },
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    foodItemName: { type: String, required: true },
    sourceStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    sourceStoreName: { type: String, required: true },
    destinationStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    destinationStoreName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, enum: ['Expiration Risk', 'Stock Optimization', 'Emergency Transfer'], default: 'Expiration Risk' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'In Transit', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvalTimestamp: { type: Date, default: null },
    estimatedArrival: { type: Date, default: null },
    actualArrival: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 500 },
    wastageAvoided: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

transferLogSchema.index({ status: 1 });
transferLogSchema.index({ createdAt: -1 });
transferLogSchema.index({ foodItemId: 1 });
transferLogSchema.index({ sourceStoreId: 1 });
transferLogSchema.index({ destinationStoreId: 1 });

export default mongoose.model('TransferLog', transferLogSchema);
