import Store from '../models/Store.js';
import FoodItem from '../models/FoodItem.js';
import TransferLog from '../models/TransferLog.js';
import { lastNDays, formatDate } from '../utils/dateHelpers.js';

export const getWasteMetrics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [totalWaste, wasteByCategory, monthlyWaste] = await Promise.all([
      TransferLog.aggregate([
        { $match: { status: 'Completed', ...matchStage } },
        { $group: { _id: null, totalAvoided: { $sum: '$wastageAvoided' }, count: { $sum: 1 } } },
      ]),
      TransferLog.aggregate([
        { $match: { status: 'Completed', ...matchStage } },
        {
          $lookup: {
            from: 'fooditems',
            localField: 'foodItemId',
            foreignField: '_id',
            as: 'item',
          },
        },
        { $unwind: '$item' },
        {
          $group: {
            _id: '$item.category',
            wasteAvoided: { $sum: '$wastageAvoided' },
            transferCount: { $sum: 1 },
          },
        },
        { $sort: { wasteAvoided: -1 } },
      ]),
      TransferLog.aggregate([
        { $match: { status: 'Completed' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalAvoided: { $sum: '$wastageAvoided' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalWasteAvoided: totalWaste[0]?.totalAvoided || 0,
        totalCompletedTransfers: totalWaste[0]?.count || 0,
        wasteByCategory,
        monthlyTrend: monthlyWaste,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVelocityTrends = async (req, res, next) => {
  try {
    const { storeId, days = 14 } = req.query;
    const storeQuery = storeId ? { _id: storeId } : { isActive: true };

    const stores = await Store.find(storeQuery).populate('inventory.foodItemId').limit(5);
    const dates = lastNDays(parseInt(days)).map((d) => formatDate(d));

    const trendData = [];

    for (const store of stores) {
      const topItems = store.inventory
        .filter((i) => i.foodItemId?.isActive)
        .sort((a, b) => b.salesVelocity - a.salesVelocity)
        .slice(0, 3);

      for (const invItem of topItems) {
        const velocityByDate = {};
        for (const v of invItem.historicalVelocity || []) {
          velocityByDate[formatDate(v.date)] = v.velocity;
        }

        trendData.push({
          label: `${store.storeCode} - ${invItem.foodItemId.name}`,
          storeId: store._id,
          storeName: store.storeName,
          itemName: invItem.foodItemId.name,
          data: dates.map((date) => ({ date, velocity: velocityByDate[date] || 0 })),
        });
      }
    }

    res.json({ success: true, data: { dates, series: trendData } });
  } catch (error) {
    next(error);
  }
};

export const getCategoryAnalysis = async (req, res, next) => {
  try {
    const [inventoryByCategory, transfersByCategory] = await Promise.all([
      Store.aggregate([
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
        { $match: { 'item.isActive': true } },
        {
          $group: {
            _id: '$item.category',
            totalStock: { $sum: '$inventory.currentStock' },
            totalValue: { $sum: { $multiply: ['$inventory.currentStock', '$item.basePrice'] } },
            avgVelocity: { $avg: '$inventory.salesVelocity' },
          },
        },
        { $sort: { totalValue: -1 } },
      ]),
      TransferLog.aggregate([
        {
          $lookup: {
            from: 'fooditems',
            localField: 'foodItemId',
            foreignField: '_id',
            as: 'item',
          },
        },
        { $unwind: '$item' },
        {
          $group: {
            _id: '$item.category',
            transferCount: { $sum: 1 },
            wasteAvoided: { $sum: '$wastageAvoided' },
          },
        },
      ]),
    ]);

    res.json({ success: true, data: { inventoryByCategory, transfersByCategory } });
  } catch (error) {
    next(error);
  }
};

export const getStorePerformanceRanking = async (req, res, next) => {
  try {
    const stores = await Store.find({ isActive: true }).select('storeName storeCode transferEfficiency totalWasteValue');

    const performance = await Promise.all(
      stores.map(async (store) => {
        const transfers = await TransferLog.find({
          $or: [{ sourceStoreId: store._id }, { destinationStoreId: store._id }],
        });
        const completed = transfers.filter((t) => t.status === 'Completed');
        const efficiency = transfers.length > 0
          ? parseFloat(((completed.length / transfers.length) * 100).toFixed(1))
          : 0;
        const wasteAvoided = completed.reduce((s, t) => s + (t.wastageAvoided || 0), 0);

        return {
          storeId: store._id,
          storeName: store.storeName,
          storeCode: store.storeCode,
          totalTransfers: transfers.length,
          completedTransfers: completed.length,
          transferEfficiency: efficiency,
          wasteAvoided,
        };
      })
    );

    performance.sort((a, b) => b.transferEfficiency - a.transferEfficiency);
    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const { format = 'csv', type = 'transfers' } = req.query;

    const transfers = await TransferLog.find({ status: 'Completed' })
      .populate('foodItemId', 'name SKU category')
      .sort({ createdAt: -1 })
      .limit(1000);

    if (format === 'csv') {
      const headers = 'Transfer ID,Item Name,SKU,Category,Source,Destination,Quantity,Status,Waste Avoided,Date\n';
      const rows = transfers
        .map((t) =>
          [
            t.transferId,
            `"${t.foodItemName}"`,
            t.foodItemId?.SKU || '',
            t.foodItemId?.category || '',
            `"${t.sourceStoreName}"`,
            `"${t.destinationStoreName}"`,
            t.quantity,
            t.status,
            t.wastageAvoided.toFixed(2),
            new Date(t.createdAt).toLocaleDateString(),
          ].join(',')
        )
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transfers-report.csv');
      return res.send(headers + rows);
    }

    res.json({ success: true, data: transfers });
  } catch (error) {
    next(error);
  }
};
