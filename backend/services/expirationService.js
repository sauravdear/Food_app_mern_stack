import Store from '../models/Store.js';
import FoodItem from '../models/FoodItem.js';
import AlertThreshold from '../models/AlertThreshold.js';
import { daysUntil, getExpirationUrgency } from '../utils/dateHelpers.js';
import { sendExpirationAlert } from './emailService.js';
import logger from '../utils/logger.js';

/**
 * Scan all active stores for items approaching expiration.
 * Returns a list of at-risk items with urgency metadata.
 */
export const scanExpiringItems = async (globalThresholdDays = 5) => {
  const stores = await Store.find({ isActive: true }).populate('inventory.foodItemId');
  const atRisk = [];

  for (const store of stores) {
    const threshold = await AlertThreshold.findOne({ storeId: store._id });
    const warningDays = threshold?.expirationWarningDays || globalThresholdDays;

    for (const invItem of store.inventory) {
      const foodItem = invItem.foodItemId;
      if (!foodItem || !foodItem.isActive) continue;

      const daysLeft = daysUntil(foodItem.expirationDate);
      if (daysLeft <= warningDays) {
        const urgency = getExpirationUrgency(daysLeft);
        atRisk.push({
          storeId: store._id,
          storeName: store.storeName,
          storeCode: store.storeCode,
          foodItemId: foodItem._id,
          foodItemName: foodItem.name,
          SKU: foodItem.SKU,
          category: foodItem.category,
          expirationDate: foodItem.expirationDate,
          daysLeft,
          urgency,
          currentStock: invItem.currentStock,
          salesVelocity: invItem.salesVelocity,
          basePrice: foodItem.basePrice,
          potentialLoss: parseFloat((invItem.currentStock * foodItem.basePrice).toFixed(2)),
        });
      }
    }
  }

  // Sort by urgency (most critical first)
  return atRisk.sort((a, b) => a.daysLeft - b.daysLeft);
};

/**
 * Send email notifications for critical expiring items.
 */
export const sendExpirationNotifications = async () => {
  try {
    const criticalItems = await scanExpiringItems(3);
    const storeGroups = {};

    for (const item of criticalItems) {
      if (!storeGroups[item.storeId]) {
        storeGroups[item.storeId] = { storeName: item.storeName, items: [] };
      }
      storeGroups[item.storeId].items.push(item);
    }

    for (const [storeId, group] of Object.entries(storeGroups)) {
      const threshold = await AlertThreshold.findOne({ storeId });
      if (threshold?.enableEmailAlerts && threshold?.notificationEmail) {
        await sendExpirationAlert(threshold.notificationEmail, group.storeName, group.items);
      }
    }

    logger.info(`Expiration scan: ${criticalItems.length} at-risk items found`);
    return criticalItems.length;
  } catch (error) {
    logger.error('Expiration notification error:', error);
    throw error;
  }
};

/**
 * Get expiration summary for dashboard gauge chart.
 */
export const getExpirationSummary = async () => {
  const allAtRisk = await scanExpiringItems(30);

  return {
    expiredOrToday: allAtRisk.filter((i) => i.daysLeft <= 0).length,
    oneTwodays: allAtRisk.filter((i) => i.daysLeft >= 1 && i.daysLeft <= 2).length,
    threeFiveDays: allAtRisk.filter((i) => i.daysLeft >= 3 && i.daysLeft <= 5).length,
    fivePlusDays: allAtRisk.filter((i) => i.daysLeft > 5).length,
    totalPotentialLoss: allAtRisk.reduce((s, i) => s + i.potentialLoss, 0),
  };
};
