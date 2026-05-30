/**
 * ONE-TIME SEED ENDPOINT — remove this file and its server.js import after seeding.
 * Trigger: POST /api/admin/seed  with header  x-seed-secret: <SEED_SECRET env var>
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FoodItem from '../models/FoodItem.js';
import Store from '../models/Store.js';
import TransferLog from '../models/TransferLog.js';
import AlertThreshold from '../models/AlertThreshold.js';
import { bcryptSaltRounds } from '../config/auth.js';

const router = express.Router();

const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const daysAgo    = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const genVelocity = (base, days = 30) =>
  Array.from({ length: days }, (_, i) => ({
    date: daysAgo(days - i),
    velocity: parseFloat((base * (0.75 + Math.random() * 0.5)).toFixed(2)),
  }));

router.post('/', async (req, res) => {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await Promise.all([
      User.deleteMany({}), FoodItem.deleteMany({}),
      Store.deleteMany({}), TransferLog.deleteMany({}),
      AlertThreshold.deleteMany({}),
    ]);

    // ---------- stores
    const storesData = [
      { storeName: 'Downtown Fresh Market', storeCode: 'DFM001', location: { address: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', coordinates: { lat: 40.7128, lng: -74.006 } }, contactInfo: { phone: '212-555-0101', email: 'dfm001@freshmarket.com', managerName: 'Sarah Johnson' }, totalWasteValue: 1240.50, transferEfficiency: 91 },
      { storeName: 'Midtown Grocery Hub',   storeCode: 'MGH002', location: { address: '456 Park Ave', city: 'New York', state: 'NY', zipCode: '10022', coordinates: { lat: 40.7549, lng: -73.9840 } }, contactInfo: { phone: '212-555-0202', email: 'mgh002@freshmarket.com', managerName: 'Michael Chen'  }, totalWasteValue: 870.25,  transferEfficiency: 85 },
      { storeName: 'Brooklyn Food Center',  storeCode: 'BFC003', location: { address: '789 Atlantic Ave', city: 'Brooklyn', state: 'NY', zipCode: '11217', coordinates: { lat: 40.6892, lng: -73.9442 } }, contactInfo: { phone: '718-555-0303', email: 'bfc003@freshmarket.com', managerName: 'Emily Rodriguez' }, totalWasteValue: 2100.00, transferEfficiency: 73 },
      { storeName: 'Queens Mega Mart',      storeCode: 'QMM004', location: { address: '321 Queens Blvd', city: 'Queens', state: 'NY', zipCode: '11432', coordinates: { lat: 40.7282, lng: -73.7949 } }, contactInfo: { phone: '718-555-0404', email: 'qmm004@freshmarket.com', managerName: 'David Kim'       }, totalWasteValue: 560.80,  transferEfficiency: 88 },
      { storeName: 'Bronx Community Store', storeCode: 'BCS005', location: { address: '654 Grand Concourse', city: 'Bronx', state: 'NY', zipCode: '10451', coordinates: { lat: 40.8448, lng: -73.9252 } }, contactInfo: { phone: '718-555-0505', email: 'bcs005@freshmarket.com', managerName: 'Lisa Martinez'   }, totalWasteValue: 1780.60, transferEfficiency: 67 },
    ];
    const stores = await Store.create(storesData);

    // ---------- food items
    const fiData = [
      { name: 'Organic Whole Milk 1L',    SKU: 'DAIRY001', category: 'Dairy',    batchNumber: 'B2025-001', expirationDate: daysFromNow(2),  basePrice: 5.99,  unitType: 'liters',  minimumStockThreshold: 20, storageTemperature: { min: 1, max: 4  } },
      { name: 'Greek Yogurt 500g',         SKU: 'DAIRY002', category: 'Dairy',    batchNumber: 'B2025-002', expirationDate: daysFromNow(4),  basePrice: 3.49,  unitType: 'pieces',  minimumStockThreshold: 15, storageTemperature: { min: 1, max: 4  } },
      { name: 'Cheddar Cheese Block 500g', SKU: 'DAIRY003', category: 'Dairy',    batchNumber: 'B2025-003', expirationDate: daysFromNow(12), basePrice: 7.99,  unitType: 'kg',      minimumStockThreshold: 10 },
      { name: 'Mozzarella Fresh 250g',     SKU: 'DAIRY004', category: 'Dairy',    batchNumber: 'B2025-004', expirationDate: daysFromNow(5),  basePrice: 4.79,  unitType: 'pieces',  minimumStockThreshold: 12, storageTemperature: { min: 1, max: 4  } },
      { name: 'Chicken Breast 1kg',        SKU: 'MEAT001',  category: 'Meat',     batchNumber: 'B2025-005', expirationDate: daysFromNow(1),  basePrice: 12.99, unitType: 'kg',      minimumStockThreshold: 10, storageTemperature: { min: 0, max: 4  } },
      { name: 'Ground Beef 500g',          SKU: 'MEAT002',  category: 'Meat',     batchNumber: 'B2025-006', expirationDate: daysFromNow(3),  basePrice: 8.99,  unitType: 'pieces',  minimumStockThreshold: 15, storageTemperature: { min: 0, max: 4  } },
      { name: 'Pork Ribs 800g',            SKU: 'MEAT003',  category: 'Meat',     batchNumber: 'B2025-007', expirationDate: daysFromNow(5),  basePrice: 11.49, unitType: 'pieces',  minimumStockThreshold: 8  },
      { name: 'Turkey Slices 300g',        SKU: 'MEAT004',  category: 'Meat',     batchNumber: 'B2025-008', expirationDate: daysFromNow(6),  basePrice: 6.99,  unitType: 'packets', minimumStockThreshold: 10, storageTemperature: { min: 0, max: 4  } },
      { name: 'Organic Spinach 200g',      SKU: 'PROD001',  category: 'Produce',  batchNumber: 'B2025-009', expirationDate: daysFromNow(2),  basePrice: 2.99,  unitType: 'pieces',  minimumStockThreshold: 25, storageTemperature: { min: 1, max: 7  } },
      { name: 'Fresh Strawberries 400g',   SKU: 'PROD002',  category: 'Produce',  batchNumber: 'B2025-010', expirationDate: daysFromNow(3),  basePrice: 4.99,  unitType: 'pieces',  minimumStockThreshold: 20 },
      { name: 'Cherry Tomatoes 500g',      SKU: 'PROD003',  category: 'Produce',  batchNumber: 'B2025-011', expirationDate: daysFromNow(7),  basePrice: 3.29,  unitType: 'pieces',  minimumStockThreshold: 15 },
      { name: 'Baby Carrots 500g',         SKU: 'PROD004',  category: 'Produce',  batchNumber: 'B2025-012', expirationDate: daysFromNow(10), basePrice: 2.49,  unitType: 'packets', minimumStockThreshold: 18 },
      { name: 'Sourdough Bread Loaf',      SKU: 'BAK001',   category: 'Bakery',   batchNumber: 'B2025-013', expirationDate: daysFromNow(2),  basePrice: 4.49,  unitType: 'pieces',  minimumStockThreshold: 10, storageTemperature: { min: 15, max: 25 } },
      { name: 'Croissants 6pk',            SKU: 'BAK002',   category: 'Bakery',   batchNumber: 'B2025-014', expirationDate: daysFromNow(1),  basePrice: 6.99,  unitType: 'packets', minimumStockThreshold: 12 },
      { name: 'Whole Grain Muffins 4pk',   SKU: 'BAK003',   category: 'Bakery',   batchNumber: 'B2025-015', expirationDate: daysFromNow(4),  basePrice: 5.29,  unitType: 'packets', minimumStockThreshold: 8  },
      { name: 'Blueberry Scones 4pk',      SKU: 'BAK004',   category: 'Bakery',   batchNumber: 'B2025-016', expirationDate: daysFromNow(3),  basePrice: 5.99,  unitType: 'packets', minimumStockThreshold: 8  },
      { name: 'Atlantic Salmon 400g',      SKU: 'SEA001',   category: 'Seafood',  batchNumber: 'B2025-017', expirationDate: daysFromNow(2),  basePrice: 18.99, unitType: 'pieces',  minimumStockThreshold: 8,  storageTemperature: { min: 0, max: 4  } },
      { name: 'Shrimp 500g Cooked',        SKU: 'SEA002',   category: 'Seafood',  batchNumber: 'B2025-018', expirationDate: daysFromNow(4),  basePrice: 14.99, unitType: 'pieces',  minimumStockThreshold: 10 },
      { name: 'Caesar Salad Kit',          SKU: 'PREP001',  category: 'Prepared', batchNumber: 'B2025-019', expirationDate: daysFromNow(3),  basePrice: 7.49,  unitType: 'pieces',  minimumStockThreshold: 15 },
      { name: 'Chicken Tikka Masala 400g', SKU: 'PREP002',  category: 'Prepared', batchNumber: 'B2025-020', expirationDate: daysFromNow(6),  basePrice: 9.99,  unitType: 'pieces',  minimumStockThreshold: 10 },
      { name: 'Veggie Pasta Bake 350g',    SKU: 'PREP003',  category: 'Prepared', batchNumber: 'B2025-021', expirationDate: daysFromNow(5),  basePrice: 8.49,  unitType: 'pieces',  minimumStockThreshold: 12 },
    ];
    const fi = await FoodItem.create(fiData);

    // ---------- inventories
    stores[0].inventory = [
      { foodItemId: fi[0]._id,  currentStock: 14, salesVelocity: 8.2, historicalVelocity: genVelocity(8.2), lastUpdated: new Date() },
      { foodItemId: fi[1]._id,  currentStock: 22, salesVelocity: 5.4, historicalVelocity: genVelocity(5.4), lastUpdated: new Date() },
      { foodItemId: fi[4]._id,  currentStock: 7,  salesVelocity: 6.5, historicalVelocity: genVelocity(6.5), lastUpdated: new Date() },
      { foodItemId: fi[5]._id,  currentStock: 18, salesVelocity: 4.8, historicalVelocity: genVelocity(4.8), lastUpdated: new Date() },
      { foodItemId: fi[8]._id,  currentStock: 11, salesVelocity: 9.1, historicalVelocity: genVelocity(9.1), lastUpdated: new Date() },
      { foodItemId: fi[9]._id,  currentStock: 16, salesVelocity: 7.6, historicalVelocity: genVelocity(7.6), lastUpdated: new Date() },
      { foodItemId: fi[12]._id, currentStock: 5,  salesVelocity: 7.3, historicalVelocity: genVelocity(7.3), lastUpdated: new Date() },
      { foodItemId: fi[13]._id, currentStock: 9,  salesVelocity: 6.1, historicalVelocity: genVelocity(6.1), lastUpdated: new Date() },
      { foodItemId: fi[16]._id, currentStock: 6,  salesVelocity: 5.8, historicalVelocity: genVelocity(5.8), lastUpdated: new Date() },
      { foodItemId: fi[18]._id, currentStock: 13, salesVelocity: 6.0, historicalVelocity: genVelocity(6.0), lastUpdated: new Date() },
      { foodItemId: fi[19]._id, currentStock: 20, salesVelocity: 4.2, historicalVelocity: genVelocity(4.2), lastUpdated: new Date() },
      { foodItemId: fi[20]._id, currentStock: 17, salesVelocity: 3.9, historicalVelocity: genVelocity(3.9), lastUpdated: new Date() },
    ];
    stores[1].inventory = [
      { foodItemId: fi[1]._id,  currentStock: 38, salesVelocity: 2.1, historicalVelocity: genVelocity(2.1), lastUpdated: new Date() },
      { foodItemId: fi[2]._id,  currentStock: 25, salesVelocity: 3.4, historicalVelocity: genVelocity(3.4), lastUpdated: new Date() },
      { foodItemId: fi[3]._id,  currentStock: 30, salesVelocity: 2.8, historicalVelocity: genVelocity(2.8), lastUpdated: new Date() },
      { foodItemId: fi[5]._id,  currentStock: 22, salesVelocity: 1.8, historicalVelocity: genVelocity(1.8), lastUpdated: new Date() },
      { foodItemId: fi[6]._id,  currentStock: 28, salesVelocity: 2.5, historicalVelocity: genVelocity(2.5), lastUpdated: new Date() },
      { foodItemId: fi[9]._id,  currentStock: 20, salesVelocity: 3.2, historicalVelocity: genVelocity(3.2), lastUpdated: new Date() },
      { foodItemId: fi[10]._id, currentStock: 34, salesVelocity: 2.9, historicalVelocity: genVelocity(2.9), lastUpdated: new Date() },
      { foodItemId: fi[11]._id, currentStock: 45, salesVelocity: 1.6, historicalVelocity: genVelocity(1.6), lastUpdated: new Date() },
      { foodItemId: fi[14]._id, currentStock: 18, salesVelocity: 2.5, historicalVelocity: genVelocity(2.5), lastUpdated: new Date() },
      { foodItemId: fi[17]._id, currentStock: 14, salesVelocity: 2.9, historicalVelocity: genVelocity(2.9), lastUpdated: new Date() },
      { foodItemId: fi[19]._id, currentStock: 22, salesVelocity: 2.3, historicalVelocity: genVelocity(2.3), lastUpdated: new Date() },
      { foodItemId: fi[20]._id, currentStock: 19, salesVelocity: 2.7, historicalVelocity: genVelocity(2.7), lastUpdated: new Date() },
    ];
    stores[2].inventory = [
      { foodItemId: fi[0]._id,  currentStock: 65, salesVelocity: 0.8, historicalVelocity: genVelocity(0.8), lastUpdated: new Date() },
      { foodItemId: fi[2]._id,  currentStock: 42, salesVelocity: 1.3, historicalVelocity: genVelocity(1.3), lastUpdated: new Date() },
      { foodItemId: fi[4]._id,  currentStock: 50, salesVelocity: 0.5, historicalVelocity: genVelocity(0.5), lastUpdated: new Date() },
      { foodItemId: fi[7]._id,  currentStock: 38, salesVelocity: 0.9, historicalVelocity: genVelocity(0.9), lastUpdated: new Date() },
      { foodItemId: fi[8]._id,  currentStock: 55, salesVelocity: 1.1, historicalVelocity: genVelocity(1.1), lastUpdated: new Date() },
      { foodItemId: fi[10]._id, currentStock: 48, salesVelocity: 0.7, historicalVelocity: genVelocity(0.7), lastUpdated: new Date() },
      { foodItemId: fi[12]._id, currentStock: 44, salesVelocity: 0.6, historicalVelocity: genVelocity(0.6), lastUpdated: new Date() },
      { foodItemId: fi[13]._id, currentStock: 36, salesVelocity: 0.8, historicalVelocity: genVelocity(0.8), lastUpdated: new Date() },
      { foodItemId: fi[15]._id, currentStock: 32, salesVelocity: 1.0, historicalVelocity: genVelocity(1.0), lastUpdated: new Date() },
      { foodItemId: fi[18]._id, currentStock: 28, salesVelocity: 0.7, historicalVelocity: genVelocity(0.7), lastUpdated: new Date() },
    ];
    stores[3].inventory = [
      { foodItemId: fi[3]._id,  currentStock: 27, salesVelocity: 3.1, historicalVelocity: genVelocity(3.1), lastUpdated: new Date() },
      { foodItemId: fi[5]._id,  currentStock: 35, salesVelocity: 0.6, historicalVelocity: genVelocity(0.6), lastUpdated: new Date() },
      { foodItemId: fi[6]._id,  currentStock: 8,  salesVelocity: 4.5, historicalVelocity: genVelocity(4.5), lastUpdated: new Date() },
      { foodItemId: fi[9]._id,  currentStock: 32, salesVelocity: 4.2, historicalVelocity: genVelocity(4.2), lastUpdated: new Date() },
      { foodItemId: fi[11]._id, currentStock: 40, salesVelocity: 1.4, historicalVelocity: genVelocity(1.4), lastUpdated: new Date() },
      { foodItemId: fi[14]._id, currentStock: 12, salesVelocity: 2.8, historicalVelocity: genVelocity(2.8), lastUpdated: new Date() },
      { foodItemId: fi[15]._id, currentStock: 9,  salesVelocity: 3.6, historicalVelocity: genVelocity(3.6), lastUpdated: new Date() },
      { foodItemId: fi[17]._id, currentStock: 11, salesVelocity: 3.3, historicalVelocity: genVelocity(3.3), lastUpdated: new Date() },
      { foodItemId: fi[19]._id, currentStock: 24, salesVelocity: 2.6, historicalVelocity: genVelocity(2.6), lastUpdated: new Date() },
      { foodItemId: fi[20]._id, currentStock: 18, salesVelocity: 3.0, historicalVelocity: genVelocity(3.0), lastUpdated: new Date() },
    ];
    stores[4].inventory = [
      { foodItemId: fi[1]._id,  currentStock: 52, salesVelocity: 0.6, historicalVelocity: genVelocity(0.6), lastUpdated: new Date() },
      { foodItemId: fi[4]._id,  currentStock: 44, salesVelocity: 0.5, historicalVelocity: genVelocity(0.5), lastUpdated: new Date() },
      { foodItemId: fi[7]._id,  currentStock: 46, salesVelocity: 0.7, historicalVelocity: genVelocity(0.7), lastUpdated: new Date() },
      { foodItemId: fi[10]._id, currentStock: 39, salesVelocity: 0.9, historicalVelocity: genVelocity(0.9), lastUpdated: new Date() },
      { foodItemId: fi[16]._id, currentStock: 58, salesVelocity: 0.4, historicalVelocity: genVelocity(0.4), lastUpdated: new Date() },
      { foodItemId: fi[17]._id, currentStock: 50, salesVelocity: 0.6, historicalVelocity: genVelocity(0.6), lastUpdated: new Date() },
      { foodItemId: fi[18]._id, currentStock: 42, salesVelocity: 0.8, historicalVelocity: genVelocity(0.8), lastUpdated: new Date() },
      { foodItemId: fi[9]._id,  currentStock: 45, salesVelocity: 1.0, historicalVelocity: genVelocity(1.0), lastUpdated: new Date() },
      { foodItemId: fi[20]._id, currentStock: 30, salesVelocity: 0.7, historicalVelocity: genVelocity(0.7), lastUpdated: new Date() },
    ];
    await Promise.all(stores.map((s) => s.save()));

    // ---------- alert thresholds
    await AlertThreshold.create(stores.map((s) => ({
      storeId: s._id, expirationWarningDays: 3, lowVelocityThreshold: 0.5,
      highVelocityThreshold: 5, minStockBuffer: 10, autoApproveThreshold: 20,
      notificationEmail: s.contactInfo.email, enableEmailAlerts: true,
    })));

    // ---------- users
    const hp = await bcrypt.hash('Admin@123', bcryptSaltRounds);
    const users = await User.create([
      { fullName: 'System Admin',     email: 'admin@freshmarket.com',    password: hp, role: 'admin' },
      { fullName: 'Sarah Johnson',    email: 'sarah@freshmarket.com',    password: hp, role: 'store_manager',   assignedStoreId: stores[0]._id },
      { fullName: 'Michael Chen',     email: 'michael@freshmarket.com',  password: hp, role: 'store_manager',   assignedStoreId: stores[1]._id },
      { fullName: 'Emily Rodriguez',  email: 'emily@freshmarket.com',    password: hp, role: 'store_manager',   assignedStoreId: stores[2]._id },
      { fullName: 'David Kim',        email: 'david@freshmarket.com',    password: hp, role: 'store_manager',   assignedStoreId: stores[3]._id },
      { fullName: 'Lisa Martinez',    email: 'lisa@freshmarket.com',     password: hp, role: 'store_manager',   assignedStoreId: stores[4]._id },
      { fullName: 'Regional Manager', email: 'regional@freshmarket.com', password: hp, role: 'regional_manager' },
      { fullName: 'Staff Member',     email: 'staff@freshmarket.com',    password: hp, role: 'staff',           assignedStoreId: stores[0]._id },
    ]);
    const [admin, , , , , , regional] = users;

    // ---------- transfers
    const T = (fIdx, srcIdx, dstIdx, qty, reason, status, reqIdx, appIdx, daysOldCreated, daysOldApproved, daysOldArrival, daysUntilETA, notes = '') => ({
      foodItemId: fi[fIdx]._id, foodItemName: fi[fIdx].name,
      sourceStoreId: stores[srcIdx]._id, sourceStoreName: stores[srcIdx].storeName,
      destinationStoreId: stores[dstIdx]._id, destinationStoreName: stores[dstIdx].storeName,
      quantity: qty, reason, status,
      requestedBy: users[reqIdx]._id,
      ...(appIdx != null ? { approvedBy: users[appIdx]._id, approvalTimestamp: daysAgo(daysOldApproved) } : {}),
      ...(daysOldArrival != null ? { actualArrival: daysAgo(daysOldArrival) } : {}),
      ...(daysUntilETA != null ? { estimatedArrival: daysFromNow(daysUntilETA) } : {}),
      wastageAvoided: status === 'Cancelled' ? 0 : qty * fi[fIdx].basePrice,
      unitPrice: fi[fIdx].basePrice,
      ...(notes ? { notes } : {}),
      createdAt: daysAgo(daysOldCreated),
    });

    await TransferLog.create([
      // Completed - 30-day spread for chart data
      T(0,  2, 0, 25, 'Expiration Risk',   'Completed', 3, 6,  29, 28, 27, null, 'High expiry risk at Brooklyn, Downtown running low'),
      T(4,  4, 0, 30, 'Expiration Risk',   'Completed', 5, 0,  27, 26, 25, null),
      T(8,  2, 3, 20, 'Stock Optimization','Completed', 3, 6,  24, 23, 22, null),
      T(16, 4, 1, 12, 'Expiration Risk',   'Completed', 5, 6,  22, 21, 20, null),
      T(12, 2, 0, 18, 'Expiration Risk',   'Completed', 3, 0,  20, 19, 18, null),
      T(1,  4, 3, 22, 'Stock Optimization','Completed', 5, 6,  18, 17, 16, null),
      T(5,  2, 0, 15, 'Expiration Risk',   'Completed', 3, 0,  16, 15, 14, null),
      T(7,  4, 1, 20, 'Emergency Transfer','Completed', 1, 0,  14, 13, 12, null, 'Downtown ran out of Turkey during weekend rush'),
      T(10, 2, 3, 25, 'Stock Optimization','Completed', 3, 6,  12, 11, 10, null),
      T(17, 4, 0, 14, 'Expiration Risk',   'Completed', 5, 0,  10,  9,  8, null),
      T(13, 2, 1, 16, 'Stock Optimization','Completed', 3, 6,   8,  7,  6, null),
      T(18, 4, 3, 10, 'Expiration Risk',   'Completed', 5, 0,   6,  5,  4, null),
      // In Transit
      T(4,  4, 1, 18, 'Expiration Risk',   'In Transit', 5, 6, 4, 3, null, 1),
      T(16, 2, 0, 10, 'Expiration Risk',   'In Transit', 3, 0, 3, 2, null, 1),
      T(0,  4, 3, 20, 'Stock Optimization','In Transit', 5, 6, 3, 2, null, 2),
      // Approved
      T(8,  2, 0, 15, 'Expiration Risk',   'Approved',  3, 0,  2, 1, null, null),
      T(17, 4, 1, 12, 'Stock Optimization','Approved',  5, 6,  1, 1, null, null),
      // Pending
      T(1,  2, 3, 20, 'Stock Optimization','Pending',   3, null, 1, null, null, null),
      T(10, 4, 0, 14, 'Expiration Risk',   'Pending',   5, null, 0, null, null, null),
      T(7,  2, 1, 18, 'Emergency Transfer','Pending',   0, null, 0, null, null, null, 'Midtown out of Turkey slices, Brooklyn overstocked'),
      // Cancelled
      T(15, 2, 0,  8, 'Stock Optimization','Cancelled', 3, null, 15, null, null, null, 'Cancelled - destination restocked from supplier'),
    ]);

    const completedCount = 12;
    const totalWastage = [25*fi[0].basePrice, 30*fi[4].basePrice, 20*fi[8].basePrice, 12*fi[16].basePrice,
      18*fi[12].basePrice, 22*fi[1].basePrice, 15*fi[5].basePrice, 20*fi[7].basePrice,
      25*fi[10].basePrice, 14*fi[17].basePrice, 16*fi[13].basePrice, 10*fi[18].basePrice].reduce((a,b) => a+b, 0);

    return res.json({
      ok: true,
      summary: {
        stores: stores.length,
        foodItems: fi.length,
        users: users.length,
        transfers: 21,
        transfersCompleted: completedCount,
        wastageAvoided: `$${totalWastage.toFixed(2)}`,
      },
      credentials: {
        admin: 'admin@freshmarket.com / Admin@123',
        manager: 'sarah@freshmarket.com / Admin@123',
        regional: 'regional@freshmarket.com / Admin@123',
        staff: 'staff@freshmarket.com / Admin@123',
      },
    });
  } catch (err) {
    console.error('Seed endpoint error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
