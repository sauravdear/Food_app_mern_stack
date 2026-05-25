import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem.js';
import Store from '../models/Store.js';
import TransferLog from '../models/TransferLog.js';
import { generateRecommendations } from '../services/recommendationEngine.js';
import { scanExpiringItems, getExpirationSummary } from '../services/expirationService.js';
import { updateItemVelocity } from '../services/velocityEngine.js';
import { daysUntil } from '../utils/dateHelpers.js';
import logger from '../utils/logger.js';

export const getInventoryOverview = async (req, res, next) => {
  try {
    const [totalItems, expiringToday, pendingTransfers, completedTransfers] = await Promise.all([
      FoodItem.countDocuments({ isActive: true }),
      FoodItem.countDocuments({
        isActive: true,
        expirationDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      }),
      TransferLog.countDocuments({ status: 'Pending' }),
      TransferLog.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, totalWastageAvoided: { $sum: '$wastageAvoided' } } },
      ]),
    ]);

    const totalInventoryValue = await Store.aggregate([
      { $unwind: '$inventory' },
      {
        $lookup: {
          from: 'fooditems',
          localField: 'inventory.foodItemId',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: '$item' },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$inventory.currentStock', '$item.basePrice'] } },
        },
      },
    ]);

    const expirationSummary = await getExpirationSummary();

    res.json({
      success: true,
      data: {
        totalItems,
        expiringToday,
        pendingTransfers,
        wasteAvoided: completedTransfers[0]?.totalWastageAvoided || 0,
        totalInventoryValue: totalInventoryValue[0]?.total || 0,
        expirationSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransferRecommendations = async (req, res, next) => {
  try {
    const {
      thresholdDays = 5,
      storeId = null,
      category = null,
    } = req.query;

    const recommendations = await generateRecommendations({
      thresholdDays: parseInt(thresholdDays),
      storeId,
      category,
    });

    res.json({ success: true, count: recommendations.length, data: recommendations });
  } catch (error) {
    next(error);
  }
};

export const getExpiringItems = async (req, res, next) => {
  try {
    const { days = 7, storeId, category } = req.query;
    let items = await scanExpiringItems(parseInt(days));

    if (storeId) items = items.filter((i) => i.storeId.toString() === storeId);
    if (category) items = items.filter((i) => i.category === category);

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

export const getStoreInventory = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.storeId).populate('inventory.foodItemId');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const inventory = store.inventory
      .filter((i) => i.foodItemId?.isActive)
      .map((i) => ({
        foodItemId: i.foodItemId._id,
        name: i.foodItemId.name,
        SKU: i.foodItemId.SKU,
        category: i.foodItemId.category,
        batchNumber: i.foodItemId.batchNumber,
        expirationDate: i.foodItemId.expirationDate,
        daysLeft: daysUntil(i.foodItemId.expirationDate),
        basePrice: i.foodItemId.basePrice,
        unitType: i.foodItemId.unitType,
        currentStock: i.currentStock,
        salesVelocity: i.salesVelocity,
        lastUpdated: i.lastUpdated,
        minimumStockThreshold: i.foodItemId.minimumStockThreshold,
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

export const createFoodItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const item = await FoodItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { storeId, foodItemId, currentStock } = req.body;
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const invItem = store.inventory.find((i) => i.foodItemId.toString() === foodItemId);
    if (invItem) {
      invItem.currentStock = currentStock;
      invItem.lastUpdated = new Date();
    } else {
      store.inventory.push({ foodItemId, currentStock, lastUpdated: new Date() });
    }

    await store.save();
    res.json({ success: true, message: 'Stock updated' });
  } catch (error) {
    next(error);
  }
};

export const updateVelocity = async (req, res, next) => {
  try {
    const { storeId, dailySales } = req.body;
    const velocity = await updateItemVelocity(storeId, req.params.id, dailySales);
    res.json({ success: true, data: { velocity } });
  } catch (error) {
    next(error);
  }
};

export const batchUploadInventory = async (req, res, next) => {
  try {
    const { items } = req.body; // expects array of { storeId, foodItemId, currentStock }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    let updated = 0;
    for (const { storeId, foodItemId, currentStock } of items) {
      const store = await Store.findById(storeId);
      if (!store) continue;

      const invItem = store.inventory.find((i) => i.foodItemId.toString() === foodItemId);
      if (invItem) {
        invItem.currentStock = currentStock;
        invItem.lastUpdated = new Date();
      } else {
        store.inventory.push({ foodItemId, currentStock, lastUpdated: new Date() });
      }
      await store.save();
      updated++;
    }

    res.json({ success: true, message: `${updated} items updated` });
  } catch (error) {
    next(error);
  }
};

export const getAllFoodItems = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { SKU: { $regex: search, $options: 'i' } },
      { batchNumber: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      FoodItem.find(query).sort({ expirationDate: 1 }).skip(skip).limit(parseInt(limit)),
      FoodItem.countDocuments(query),
    ]);

    res.json({ success: true, data: items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

export const updateFoodItem = async (req, res, next) => {
  try {
    const item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Food item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteFoodItem = async (req, res, next) => {
  try {
    await FoodItem.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Food item deactivated' });
  } catch (error) {
    next(error);
  }
};
