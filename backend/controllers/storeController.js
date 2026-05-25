import { validationResult } from 'express-validator';
import Store from '../models/Store.js';
import TransferLog from '../models/TransferLog.js';
import AlertThreshold from '../models/AlertThreshold.js';
import { daysUntil } from '../utils/dateHelpers.js';

export const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ isActive: true })
      .select('-inventory')
      .sort({ storeName: 1 });
    res.json({ success: true, data: stores });
  } catch (error) {
    next(error);
  }
};

export const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate('inventory.foodItemId');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const createStore = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const store = await Store.create(req.body);
    // Create default alert thresholds
    await AlertThreshold.create({ storeId: store._id });
    res.status(201).json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const getStorePerformance = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate('inventory.foodItemId');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const transfers = await TransferLog.find({
      $or: [{ sourceStoreId: store._id }, { destinationStoreId: store._id }],
    });

    const completedTransfers = transfers.filter((t) => t.status === 'Completed');
    const totalTransfers = transfers.length;
    const efficiency = totalTransfers > 0
      ? parseFloat(((completedTransfers.length / totalTransfers) * 100).toFixed(1))
      : 0;

    const wasteAvoided = completedTransfers.reduce((s, t) => s + (t.wastageAvoided || 0), 0);

    // Inventory health summary
    const inventoryHealth = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      healthy: 0,
    };

    let totalStockValue = 0;
    for (const inv of store.inventory) {
      if (!inv.foodItemId?.isActive) continue;
      const daysLeft = daysUntil(inv.foodItemId.expirationDate);
      inventoryHealth.total++;
      if (daysLeft <= 1) inventoryHealth.critical++;
      else if (daysLeft <= 3) inventoryHealth.high++;
      else if (daysLeft <= 7) inventoryHealth.medium++;
      else inventoryHealth.healthy++;
      totalStockValue += inv.currentStock * inv.foodItemId.basePrice;
    }

    res.json({
      success: true,
      data: {
        store: {
          _id: store._id,
          storeName: store.storeName,
          storeCode: store.storeCode,
          location: store.location,
          contactInfo: store.contactInfo,
        },
        metrics: {
          totalTransfers,
          completedTransfers: completedTransfers.length,
          transferEfficiency: efficiency,
          wasteAvoided,
          totalStockValue,
          inventoryHealth,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
