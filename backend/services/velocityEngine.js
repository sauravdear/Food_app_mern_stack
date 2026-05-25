import Store from '../models/Store.js';
import logger from '../utils/logger.js';

/**
 * Weighted moving average: today 40%, last 3 days avg 35%, last 7 days avg 25%
 */
export const calculateWeightedVelocity = (velocityHistory) => {
  if (!velocityHistory || velocityHistory.length === 0) return 0;

  const sorted = [...velocityHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  const today = sorted[0]?.velocity || 0;
  const last3 = sorted.slice(0, 3).map((v) => v.velocity);
  const last7 = sorted.slice(0, 7).map((v) => v.velocity);

  const avg3 = last3.reduce((s, v) => s + v, 0) / (last3.length || 1);
  const avg7 = last7.reduce((s, v) => s + v, 0) / (last7.length || 1);

  return parseFloat((today * 0.4 + avg3 * 0.35 + avg7 * 0.25).toFixed(4));
};

/**
 * Update velocity for a specific store's inventory item.
 */
export const updateItemVelocity = async (storeId, foodItemId, dailySales) => {
  const store = await Store.findById(storeId);
  if (!store) throw new Error('Store not found');

  const invItem = store.inventory.find((i) => i.foodItemId.toString() === foodItemId.toString());
  if (!invItem) throw new Error('Item not found in store inventory');

  // Push today's velocity
  invItem.historicalVelocity.push({ date: new Date(), velocity: dailySales });

  // Keep only last 30 days
  if (invItem.historicalVelocity.length > 30) {
    invItem.historicalVelocity = invItem.historicalVelocity.slice(-30);
  }

  invItem.salesVelocity = calculateWeightedVelocity(invItem.historicalVelocity);
  invItem.lastUpdated = new Date();

  await store.save();
  return invItem.salesVelocity;
};

/**
 * Detect velocity anomalies (sudden change > 50%).
 */
export const detectVelocityAnomaly = (currentVelocity, historicalVelocity) => {
  if (!historicalVelocity || historicalVelocity.length < 3) return null;

  const recent = historicalVelocity.slice(-7);
  const avg = recent.reduce((s, v) => s + v.velocity, 0) / recent.length;

  if (avg === 0) return null;
  const changePct = Math.abs((currentVelocity - avg) / avg) * 100;

  if (changePct > 50) {
    return {
      type: currentVelocity > avg ? 'spike' : 'drop',
      changePercent: changePct.toFixed(1),
      average: avg.toFixed(2),
      current: currentVelocity.toFixed(2),
    };
  }
  return null;
};

/**
 * Bulk update all store velocities (called by cron job).
 */
export const bulkUpdateVelocities = async () => {
  try {
    const stores = await Store.find({ isActive: true });
    let updated = 0;

    for (const store of stores) {
      for (const invItem of store.inventory) {
        if (invItem.historicalVelocity.length > 0) {
          invItem.salesVelocity = calculateWeightedVelocity(invItem.historicalVelocity);
          invItem.lastUpdated = new Date();
          updated++;
        }
      }
      await store.save();
    }

    logger.info(`Velocity update complete: ${updated} items updated across ${stores.length} stores`);
    return { storesUpdated: stores.length, itemsUpdated: updated };
  } catch (error) {
    logger.error('Bulk velocity update failed:', error);
    throw error;
  }
};
