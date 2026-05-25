import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import TransferLog from '../models/TransferLog.js';
import Store from '../models/Store.js';
import FoodItem from '../models/FoodItem.js';
import AlertThreshold from '../models/AlertThreshold.js';
import { sendTransferNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';

export const createTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { foodItemId, sourceStoreId, destinationStoreId, quantity, notes, reason } = req.body;

    if (sourceStoreId === destinationStoreId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Source and destination cannot be the same' });
    }

    const [sourceStore, destStore, foodItem] = await Promise.all([
      Store.findById(sourceStoreId).session(session),
      Store.findById(destinationStoreId).session(session),
      FoodItem.findById(foodItemId).session(session),
    ]);

    if (!sourceStore || !destStore) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!foodItem) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    const sourceInv = sourceStore.inventory.find((i) => i.foodItemId.toString() === foodItemId);
    if (!sourceInv || sourceInv.currentStock < quantity) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Insufficient stock at source store' });
    }

    // Deduct from source
    sourceInv.currentStock -= quantity;
    sourceInv.lastUpdated = new Date();

    // Add to destination
    const destInv = destStore.inventory.find((i) => i.foodItemId.toString() === foodItemId);
    if (destInv) {
      destInv.currentStock += quantity;
      destInv.lastUpdated = new Date();
    } else {
      destStore.inventory.push({ foodItemId, currentStock: quantity, lastUpdated: new Date() });
    }

    // Check auto-approve threshold
    const threshold = await AlertThreshold.findOne({ storeId: sourceStoreId }).session(session);
    const autoApprove = threshold && quantity <= threshold.autoApproveThreshold;

    const wastageAvoided = parseFloat((quantity * foodItem.basePrice).toFixed(2));

    const [transfer] = await TransferLog.create(
      [
        {
          foodItemId,
          foodItemName: foodItem.name,
          sourceStoreId,
          sourceStoreName: sourceStore.storeName,
          destinationStoreId,
          destinationStoreName: destStore.storeName,
          quantity,
          reason: reason || 'Expiration Risk',
          status: autoApprove ? 'Approved' : 'Pending',
          requestedBy: req.user._id,
          approvedBy: autoApprove ? req.user._id : null,
          approvalTimestamp: autoApprove ? new Date() : null,
          notes,
          wastageAvoided,
          unitPrice: foodItem.basePrice,
        },
      ],
      { session }
    );

    await sourceStore.save({ session });
    await destStore.save({ session });
    await session.commitTransaction();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('transfer:created', { transfer: transfer.toObject() });
    }

    // Send email notification (non-blocking)
    sendTransferNotification(
      req.user.email,
      transfer.toObject(),
      'created'
    ).catch((err) => logger.warn('Transfer email failed:', err));

    logger.info(`Transfer created: ${transfer.transferId}`);
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const approveTransfer = async (req, res, next) => {
  try {
    const transfer = await TransferLog.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a ${transfer.status} transfer` });
    }

    transfer.status = 'Approved';
    transfer.approvedBy = req.user._id;
    transfer.approvalTimestamp = new Date();
    transfer.estimatedArrival = req.body.estimatedArrival || null;
    await transfer.save();

    const io = req.app.get('io');
    if (io) io.emit('transfer:approved', { transferId: transfer._id, status: 'Approved' });

    res.json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

export const updateTransferStatus = async (req, res, next) => {
  try {
    const { status, actualArrival } = req.body;
    const validTransitions = {
      Pending: ['Approved', 'Cancelled'],
      Approved: ['In Transit', 'Cancelled'],
      'In Transit': ['Completed', 'Cancelled'],
    };

    const transfer = await TransferLog.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });

    const allowed = validTransitions[transfer.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot transition from ${transfer.status} to ${status}` });
    }

    transfer.status = status;
    if (status === 'Completed' && actualArrival) transfer.actualArrival = actualArrival;
    await transfer.save();

    const io = req.app.get('io');
    if (io) io.emit('transfer:statusUpdate', { transferId: transfer._id, status });

    res.json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

export const getTransfers = async (req, res, next) => {
  try {
    const { status, storeId, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (storeId) query.$or = [{ sourceStoreId: storeId }, { destinationStoreId: storeId }];
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transfers, total] = await Promise.all([
      TransferLog.find(query)
        .populate('requestedBy', 'fullName email')
        .populate('approvedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TransferLog.countDocuments(query),
    ]);

    res.json({ success: true, data: transfers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

export const getTransferById = async (req, res, next) => {
  try {
    const transfer = await TransferLog.findById(req.params.id)
      .populate('requestedBy', 'fullName email role')
      .populate('approvedBy', 'fullName email role')
      .populate('foodItemId')
      .populate('sourceStoreId', 'storeName storeCode location')
      .populate('destinationStoreId', 'storeName storeCode location');

    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

export const getTransferAnalytics = async (req, res, next) => {
  try {
    const [statusBreakdown, monthlyTrend, topItems] = await Promise.all([
      TransferLog.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$wastageAvoided' } } },
      ]),
      TransferLog.aggregate([
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
            wastageAvoided: { $sum: '$wastageAvoided' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
      TransferLog.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: '$foodItemName', totalQuantity: { $sum: '$quantity' }, totalValue: { $sum: '$wastageAvoided' } } },
        { $sort: { totalValue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({ success: true, data: { statusBreakdown, monthlyTrend, topItems } });
  } catch (error) {
    next(error);
  }
};
