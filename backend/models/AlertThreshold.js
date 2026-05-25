import mongoose from 'mongoose';

const alertThresholdSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', unique: true, required: true },
    expirationWarningDays: { type: Number, default: 3, min: 1 },
    lowVelocityThreshold: { type: Number, default: 0.5, min: 0 },
    highVelocityThreshold: { type: Number, default: 5, min: 0 },
    minStockBuffer: { type: Number, default: 10, min: 0 },
    autoApproveThreshold: { type: Number, default: 20, min: 0 },
    notificationEmail: { type: String, lowercase: true, trim: true },
    enableEmailAlerts: { type: Boolean, default: true },
    enableSMSAlerts: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('AlertThreshold', alertThresholdSchema);
