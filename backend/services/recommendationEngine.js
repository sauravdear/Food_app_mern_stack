import Store from '../models/Store.js';
import FoodItem from '../models/FoodItem.js';
import AlertThreshold from '../models/AlertThreshold.js';
import { daysUntil } from '../utils/dateHelpers.js';
import logger from '../utils/logger.js';

/**
 * Calculate Haversine distance between two lat/lng coordinates (in km).
 */
const haversineDistance = (coords1, coords2) => {
  if (!coords1?.lat || !coords2?.lat) return 9999;
  const R = 6371;
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLon = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coords1.lat * Math.PI) / 180) *
      Math.cos((coords2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Score a recommendation: higher = more urgent action needed.
 * Factors: urgency (days left), quantity value, distance penalty.
 */
const scoreRecommendation = (rec) => {
  const urgencyScore = Math.max(0, 10 - rec.daysUntilExpiry) * 15;
  const valueScore = Math.min(rec.quantity * rec.unitPrice * 0.5, 50);
  const distancePenalty = Math.min(rec.distanceKm * 0.3, 10);
  return urgencyScore + valueScore - distancePenalty;
};

/**
 * Core recommendation algorithm.
 * Returns sorted, actionable transfer recommendations.
 */
export const generateRecommendations = async ({
  thresholdDays = 5,
  storeId = null,
  category = null,
} = {}) => {
  try {
    const storeQuery = { isActive: true };
    if (storeId) storeQuery._id = storeId;

    const stores = await Store.find(storeQuery).populate({
      path: 'inventory.foodItemId',
      match: { isActive: true },
    });

    const recommendations = [];
    const now = new Date();

    // Group inventory by food item across all stores
    const itemMap = new Map();

    for (const store of stores) {
      for (const invItem of store.inventory) {
        const foodItem = invItem.foodItemId;
        if (!foodItem) continue;
        if (category && foodItem.category !== category) continue;

        const daysLeft = daysUntil(foodItem.expirationDate);
        if (daysLeft > thresholdDays || daysLeft <= 0) continue;

        const key = foodItem._id.toString();
        if (!itemMap.has(key)) {
          itemMap.set(key, { foodItem, stores: [] });
        }

        itemMap.get(key).stores.push({
          store,
          currentStock: invItem.currentStock,
          salesVelocity: invItem.salesVelocity,
          daysLeft,
        });
      }
    }

    // For each at-risk item, find transfer opportunities
    for (const [, { foodItem, stores: storeEntries }] of itemMap) {
      // Classify stores by velocity tier
      const avgVelocity =
        storeEntries.reduce((s, e) => s + e.salesVelocity, 0) / storeEntries.length;

      const slowStores = storeEntries.filter((e) => e.salesVelocity < avgVelocity * 0.8);
      const fastStores = storeEntries.filter((e) => e.salesVelocity >= avgVelocity * 0.8);

      for (const source of slowStores) {
        const daysLeft = source.daysLeft;

        // Excess stock: what won't sell before expiry
        const willSell = Math.floor(source.salesVelocity * daysLeft);
        const excess = source.currentStock - willSell;
        if (excess <= 0) continue;

        // Find best destination (highest velocity, closest)
        const candidates = fastStores
          .filter((d) => d.store._id.toString() !== source.store._id.toString())
          .map((dest) => {
            const destDemand = Math.ceil(dest.salesVelocity * 7) - dest.currentStock;
            const transferQty = Math.min(excess, Math.max(1, destDemand));
            const distance = haversineDistance(
              source.store.location.coordinates,
              dest.store.location.coordinates
            );

            const rec = {
              foodItemId: foodItem._id,
              foodItemName: foodItem.name,
              SKU: foodItem.SKU,
              category: foodItem.category,
              expirationDate: foodItem.expirationDate,
              daysUntilExpiry: daysLeft,
              sourceStoreId: source.store._id,
              sourceStoreName: source.store.storeName,
              sourceStoreCode: source.store.storeCode,
              sourceVelocity: source.salesVelocity,
              destinationStoreId: dest.store._id,
              destinationStoreName: dest.store.storeName,
              destinationStoreCode: dest.store.storeCode,
              destinationVelocity: dest.salesVelocity,
              quantity: transferQty,
              unitPrice: foodItem.basePrice,
              potentialWastageAvoided: parseFloat((transferQty * foodItem.basePrice).toFixed(2)),
              distanceKm: parseFloat(distance.toFixed(1)),
              urgency: daysLeft <= 1 ? 'critical' : daysLeft <= 3 ? 'high' : 'medium',
            };
            rec.score = scoreRecommendation(rec);
            return rec;
          });

        if (candidates.length > 0) {
          // Take the best destination for this source
          candidates.sort((a, b) => b.score - a.score);
          recommendations.push(candidates[0]);
        }
      }
    }

    recommendations.sort((a, b) => b.score - a.score);
    logger.debug(`Generated ${recommendations.length} transfer recommendations`);
    return recommendations;
  } catch (error) {
    logger.error('Recommendation engine error:', error);
    throw error;
  }
};
