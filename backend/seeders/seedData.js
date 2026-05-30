import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import FoodItem from '../models/FoodItem.js';
import Store from '../models/Store.js';
import TransferLog from '../models/TransferLog.js';
import AlertThreshold from '../models/AlertThreshold.js';
import { bcryptSaltRounds } from '../config/auth.js';

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const rand = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const generateVelocityHistory = (baseVelocity, days = 30) =>
  Array.from({ length: days }, (_, i) => ({
    date: daysAgo(days - i),
    velocity: parseFloat((baseVelocity * (0.75 + Math.random() * 0.5)).toFixed(2)),
  }));

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    FoodItem.deleteMany({}),
    Store.deleteMany({}),
    TransferLog.deleteMany({}),
    AlertThreshold.deleteMany({}),
  ]);

  // ------------------------------------------------------------------ STORES
  console.log('Seeding stores...');
  const storesData = [
    {
      storeName: 'Downtown Fresh Market',
      storeCode: 'DFM001',
      location: { address: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', coordinates: { lat: 40.7128, lng: -74.006 } },
      contactInfo: { phone: '212-555-0101', email: 'dfm001@freshmarket.com', managerName: 'Sarah Johnson' },
      totalWasteValue: 1240.50,
      transferEfficiency: 91,
    },
    {
      storeName: 'Midtown Grocery Hub',
      storeCode: 'MGH002',
      location: { address: '456 Park Ave', city: 'New York', state: 'NY', zipCode: '10022', coordinates: { lat: 40.7549, lng: -73.9840 } },
      contactInfo: { phone: '212-555-0202', email: 'mgh002@freshmarket.com', managerName: 'Michael Chen' },
      totalWasteValue: 870.25,
      transferEfficiency: 85,
    },
    {
      storeName: 'Brooklyn Food Center',
      storeCode: 'BFC003',
      location: { address: '789 Atlantic Ave', city: 'Brooklyn', state: 'NY', zipCode: '11217', coordinates: { lat: 40.6892, lng: -73.9442 } },
      contactInfo: { phone: '718-555-0303', email: 'bfc003@freshmarket.com', managerName: 'Emily Rodriguez' },
      totalWasteValue: 2100.00,
      transferEfficiency: 73,
    },
    {
      storeName: 'Queens Mega Mart',
      storeCode: 'QMM004',
      location: { address: '321 Queens Blvd', city: 'Queens', state: 'NY', zipCode: '11432', coordinates: { lat: 40.7282, lng: -73.7949 } },
      contactInfo: { phone: '718-555-0404', email: 'qmm004@freshmarket.com', managerName: 'David Kim' },
      totalWasteValue: 560.80,
      transferEfficiency: 88,
    },
    {
      storeName: 'Bronx Community Store',
      storeCode: 'BCS005',
      location: { address: '654 Grand Concourse', city: 'Bronx', state: 'NY', zipCode: '10451', coordinates: { lat: 40.8448, lng: -73.9252 } },
      contactInfo: { phone: '718-555-0505', email: 'bcs005@freshmarket.com', managerName: 'Lisa Martinez' },
      totalWasteValue: 1780.60,
      transferEfficiency: 67,
    },
  ];

  const stores = await Store.create(storesData);

  // ------------------------------------------------------------------ FOOD ITEMS
  console.log('Seeding food items...');
  const foodItemsData = [
    // Dairy
    { name: 'Organic Whole Milk 1L',    SKU: 'DAIRY001', category: 'Dairy',   batchNumber: 'B2025-001', expirationDate: daysFromNow(2),  basePrice: 5.99,  unitType: 'liters',  minimumStockThreshold: 20, storageTemperature: { min: 1, max: 4 } },
    { name: 'Greek Yogurt 500g',         SKU: 'DAIRY002', category: 'Dairy',   batchNumber: 'B2025-002', expirationDate: daysFromNow(4),  basePrice: 3.49,  unitType: 'pieces',  minimumStockThreshold: 15, storageTemperature: { min: 1, max: 4 } },
    { name: 'Cheddar Cheese Block 500g', SKU: 'DAIRY003', category: 'Dairy',   batchNumber: 'B2025-003', expirationDate: daysFromNow(12), basePrice: 7.99,  unitType: 'kg',      minimumStockThreshold: 10 },
    { name: 'Mozzarella Fresh 250g',     SKU: 'DAIRY004', category: 'Dairy',   batchNumber: 'B2025-004', expirationDate: daysFromNow(5),  basePrice: 4.79,  unitType: 'pieces',  minimumStockThreshold: 12, storageTemperature: { min: 1, max: 4 } },
    // Meat
    { name: 'Chicken Breast 1kg',        SKU: 'MEAT001',  category: 'Meat',    batchNumber: 'B2025-005', expirationDate: daysFromNow(1),  basePrice: 12.99, unitType: 'kg',      minimumStockThreshold: 10, storageTemperature: { min: 0, max: 4 } },
    { name: 'Ground Beef 500g',          SKU: 'MEAT002',  category: 'Meat',    batchNumber: 'B2025-006', expirationDate: daysFromNow(3),  basePrice: 8.99,  unitType: 'pieces',  minimumStockThreshold: 15, storageTemperature: { min: 0, max: 4 } },
    { name: 'Pork Ribs 800g',            SKU: 'MEAT003',  category: 'Meat',    batchNumber: 'B2025-007', expirationDate: daysFromNow(5),  basePrice: 11.49, unitType: 'pieces',  minimumStockThreshold: 8 },
    { name: 'Turkey Slices 300g',        SKU: 'MEAT004',  category: 'Meat',    batchNumber: 'B2025-008', expirationDate: daysFromNow(6),  basePrice: 6.99,  unitType: 'packets', minimumStockThreshold: 10, storageTemperature: { min: 0, max: 4 } },
    // Produce
    { name: 'Organic Spinach 200g',      SKU: 'PROD001',  category: 'Produce', batchNumber: 'B2025-009', expirationDate: daysFromNow(2),  basePrice: 2.99,  unitType: 'pieces',  minimumStockThreshold: 25, storageTemperature: { min: 1, max: 7 } },
    { name: 'Fresh Strawberries 400g',   SKU: 'PROD002',  category: 'Produce', batchNumber: 'B2025-010', expirationDate: daysFromNow(3),  basePrice: 4.99,  unitType: 'pieces',  minimumStockThreshold: 20 },
    { name: 'Cherry Tomatoes 500g',      SKU: 'PROD003',  category: 'Produce', batchNumber: 'B2025-011', expirationDate: daysFromNow(7),  basePrice: 3.29,  unitType: 'pieces',  minimumStockThreshold: 15 },
    { name: 'Baby Carrots 500g',         SKU: 'PROD004',  category: 'Produce', batchNumber: 'B2025-012', expirationDate: daysFromNow(10), basePrice: 2.49,  unitType: 'packets', minimumStockThreshold: 18 },
    // Bakery
    { name: 'Sourdough Bread Loaf',      SKU: 'BAK001',   category: 'Bakery',  batchNumber: 'B2025-013', expirationDate: daysFromNow(2),  basePrice: 4.49,  unitType: 'pieces',  minimumStockThreshold: 10, storageTemperature: { min: 15, max: 25 } },
    { name: 'Croissants 6pk',            SKU: 'BAK002',   category: 'Bakery',  batchNumber: 'B2025-014', expirationDate: daysFromNow(1),  basePrice: 6.99,  unitType: 'packets', minimumStockThreshold: 12 },
    { name: 'Whole Grain Muffins 4pk',   SKU: 'BAK003',   category: 'Bakery',  batchNumber: 'B2025-015', expirationDate: daysFromNow(4),  basePrice: 5.29,  unitType: 'packets', minimumStockThreshold: 8 },
    { name: 'Blueberry Scones 4pk',      SKU: 'BAK004',   category: 'Bakery',  batchNumber: 'B2025-016', expirationDate: daysFromNow(3),  basePrice: 5.99,  unitType: 'packets', minimumStockThreshold: 8 },
    // Seafood
    { name: 'Atlantic Salmon 400g',      SKU: 'SEA001',   category: 'Seafood', batchNumber: 'B2025-017', expirationDate: daysFromNow(2),  basePrice: 18.99, unitType: 'pieces',  minimumStockThreshold: 8,  storageTemperature: { min: 0, max: 4 } },
    { name: 'Shrimp 500g Cooked',        SKU: 'SEA002',   category: 'Seafood', batchNumber: 'B2025-018', expirationDate: daysFromNow(4),  basePrice: 14.99, unitType: 'pieces',  minimumStockThreshold: 10 },
    // Prepared
    { name: 'Caesar Salad Kit',          SKU: 'PREP001',  category: 'Prepared',batchNumber: 'B2025-019', expirationDate: daysFromNow(3),  basePrice: 7.49,  unitType: 'pieces',  minimumStockThreshold: 15 },
    { name: 'Chicken Tikka Masala 400g', SKU: 'PREP002',  category: 'Prepared',batchNumber: 'B2025-020', expirationDate: daysFromNow(6),  basePrice: 9.99,  unitType: 'pieces',  minimumStockThreshold: 10 },
    { name: 'Veggie Pasta Bake 350g',    SKU: 'PREP003',  category: 'Prepared',batchNumber: 'B2025-021', expirationDate: daysFromNow(5),  basePrice: 8.49,  unitType: 'pieces',  minimumStockThreshold: 12 },
  ];

  const fi = await FoodItem.create(foodItemsData);

  // ------------------------------------------------------------------ INVENTORIES
  console.log('Populating store inventories...');

  // Downtown Fresh Market — fast-moving, some near-critical stock
  stores[0].inventory = [
    { foodItemId: fi[0]._id,  currentStock: 14,  salesVelocity: 8.2,  historicalVelocity: generateVelocityHistory(8.2),  lastUpdated: new Date() },
    { foodItemId: fi[1]._id,  currentStock: 22,  salesVelocity: 5.4,  historicalVelocity: generateVelocityHistory(5.4),  lastUpdated: new Date() },
    { foodItemId: fi[4]._id,  currentStock: 7,   salesVelocity: 6.5,  historicalVelocity: generateVelocityHistory(6.5),  lastUpdated: new Date() },
    { foodItemId: fi[5]._id,  currentStock: 18,  salesVelocity: 4.8,  historicalVelocity: generateVelocityHistory(4.8),  lastUpdated: new Date() },
    { foodItemId: fi[8]._id,  currentStock: 11,  salesVelocity: 9.1,  historicalVelocity: generateVelocityHistory(9.1),  lastUpdated: new Date() },
    { foodItemId: fi[9]._id,  currentStock: 16,  salesVelocity: 7.6,  historicalVelocity: generateVelocityHistory(7.6),  lastUpdated: new Date() },
    { foodItemId: fi[12]._id, currentStock: 5,   salesVelocity: 7.3,  historicalVelocity: generateVelocityHistory(7.3),  lastUpdated: new Date() },
    { foodItemId: fi[13]._id, currentStock: 9,   salesVelocity: 6.1,  historicalVelocity: generateVelocityHistory(6.1),  lastUpdated: new Date() },
    { foodItemId: fi[16]._id, currentStock: 6,   salesVelocity: 5.8,  historicalVelocity: generateVelocityHistory(5.8),  lastUpdated: new Date() },
    { foodItemId: fi[18]._id, currentStock: 13,  salesVelocity: 6.0,  historicalVelocity: generateVelocityHistory(6.0),  lastUpdated: new Date() },
    { foodItemId: fi[19]._id, currentStock: 20,  salesVelocity: 4.2,  historicalVelocity: generateVelocityHistory(4.2),  lastUpdated: new Date() },
    { foodItemId: fi[20]._id, currentStock: 17,  salesVelocity: 3.9,  historicalVelocity: generateVelocityHistory(3.9),  lastUpdated: new Date() },
  ];

  // Midtown Grocery Hub — medium velocity, balanced stock
  stores[1].inventory = [
    { foodItemId: fi[1]._id,  currentStock: 38,  salesVelocity: 2.1,  historicalVelocity: generateVelocityHistory(2.1),  lastUpdated: new Date() },
    { foodItemId: fi[2]._id,  currentStock: 25,  salesVelocity: 3.4,  historicalVelocity: generateVelocityHistory(3.4),  lastUpdated: new Date() },
    { foodItemId: fi[3]._id,  currentStock: 30,  salesVelocity: 2.8,  historicalVelocity: generateVelocityHistory(2.8),  lastUpdated: new Date() },
    { foodItemId: fi[5]._id,  currentStock: 22,  salesVelocity: 1.8,  historicalVelocity: generateVelocityHistory(1.8),  lastUpdated: new Date() },
    { foodItemId: fi[6]._id,  currentStock: 28,  salesVelocity: 2.5,  historicalVelocity: generateVelocityHistory(2.5),  lastUpdated: new Date() },
    { foodItemId: fi[9]._id,  currentStock: 20,  salesVelocity: 3.2,  historicalVelocity: generateVelocityHistory(3.2),  lastUpdated: new Date() },
    { foodItemId: fi[10]._id, currentStock: 34,  salesVelocity: 2.9,  historicalVelocity: generateVelocityHistory(2.9),  lastUpdated: new Date() },
    { foodItemId: fi[11]._id, currentStock: 45,  salesVelocity: 1.6,  historicalVelocity: generateVelocityHistory(1.6),  lastUpdated: new Date() },
    { foodItemId: fi[14]._id, currentStock: 18,  salesVelocity: 2.5,  historicalVelocity: generateVelocityHistory(2.5),  lastUpdated: new Date() },
    { foodItemId: fi[17]._id, currentStock: 14,  salesVelocity: 2.9,  historicalVelocity: generateVelocityHistory(2.9),  lastUpdated: new Date() },
    { foodItemId: fi[19]._id, currentStock: 22,  salesVelocity: 2.3,  historicalVelocity: generateVelocityHistory(2.3),  lastUpdated: new Date() },
    { foodItemId: fi[20]._id, currentStock: 19,  salesVelocity: 2.7,  historicalVelocity: generateVelocityHistory(2.7),  lastUpdated: new Date() },
  ];

  // Brooklyn Food Center — slow-moving, significant excess (redistribution source)
  stores[2].inventory = [
    { foodItemId: fi[0]._id,  currentStock: 65,  salesVelocity: 0.8,  historicalVelocity: generateVelocityHistory(0.8),  lastUpdated: new Date() },
    { foodItemId: fi[2]._id,  currentStock: 42,  salesVelocity: 1.3,  historicalVelocity: generateVelocityHistory(1.3),  lastUpdated: new Date() },
    { foodItemId: fi[4]._id,  currentStock: 50,  salesVelocity: 0.5,  historicalVelocity: generateVelocityHistory(0.5),  lastUpdated: new Date() },
    { foodItemId: fi[7]._id,  currentStock: 38,  salesVelocity: 0.9,  historicalVelocity: generateVelocityHistory(0.9),  lastUpdated: new Date() },
    { foodItemId: fi[8]._id,  currentStock: 55,  salesVelocity: 1.1,  historicalVelocity: generateVelocityHistory(1.1),  lastUpdated: new Date() },
    { foodItemId: fi[10]._id, currentStock: 48,  salesVelocity: 0.7,  historicalVelocity: generateVelocityHistory(0.7),  lastUpdated: new Date() },
    { foodItemId: fi[12]._id, currentStock: 44,  salesVelocity: 0.6,  historicalVelocity: generateVelocityHistory(0.6),  lastUpdated: new Date() },
    { foodItemId: fi[13]._id, currentStock: 36,  salesVelocity: 0.8,  historicalVelocity: generateVelocityHistory(0.8),  lastUpdated: new Date() },
    { foodItemId: fi[15]._id, currentStock: 32,  salesVelocity: 1.0,  historicalVelocity: generateVelocityHistory(1.0),  lastUpdated: new Date() },
    { foodItemId: fi[18]._id, currentStock: 28,  salesVelocity: 0.7,  historicalVelocity: generateVelocityHistory(0.7),  lastUpdated: new Date() },
  ];

  // Queens Mega Mart — mixed: high on some, low on others
  stores[3].inventory = [
    { foodItemId: fi[3]._id,  currentStock: 27,  salesVelocity: 3.1,  historicalVelocity: generateVelocityHistory(3.1),  lastUpdated: new Date() },
    { foodItemId: fi[5]._id,  currentStock: 35,  salesVelocity: 0.6,  historicalVelocity: generateVelocityHistory(0.6),  lastUpdated: new Date() },
    { foodItemId: fi[6]._id,  currentStock: 8,   salesVelocity: 4.5,  historicalVelocity: generateVelocityHistory(4.5),  lastUpdated: new Date() },
    { foodItemId: fi[9]._id,  currentStock: 32,  salesVelocity: 4.2,  historicalVelocity: generateVelocityHistory(4.2),  lastUpdated: new Date() },
    { foodItemId: fi[11]._id, currentStock: 40,  salesVelocity: 1.4,  historicalVelocity: generateVelocityHistory(1.4),  lastUpdated: new Date() },
    { foodItemId: fi[14]._id, currentStock: 12,  salesVelocity: 2.8,  historicalVelocity: generateVelocityHistory(2.8),  lastUpdated: new Date() },
    { foodItemId: fi[15]._id, currentStock: 9,   salesVelocity: 3.6,  historicalVelocity: generateVelocityHistory(3.6),  lastUpdated: new Date() },
    { foodItemId: fi[17]._id, currentStock: 11,  salesVelocity: 3.3,  historicalVelocity: generateVelocityHistory(3.3),  lastUpdated: new Date() },
    { foodItemId: fi[19]._id, currentStock: 24,  salesVelocity: 2.6,  historicalVelocity: generateVelocityHistory(2.6),  lastUpdated: new Date() },
    { foodItemId: fi[20]._id, currentStock: 18,  salesVelocity: 3.0,  historicalVelocity: generateVelocityHistory(3.0),  lastUpdated: new Date() },
  ];

  // Bronx Community Store — mostly slow, high excess seafood & prepared
  stores[4].inventory = [
    { foodItemId: fi[1]._id,  currentStock: 52,  salesVelocity: 0.6,  historicalVelocity: generateVelocityHistory(0.6),  lastUpdated: new Date() },
    { foodItemId: fi[4]._id,  currentStock: 44,  salesVelocity: 0.5,  historicalVelocity: generateVelocityHistory(0.5),  lastUpdated: new Date() },
    { foodItemId: fi[7]._id,  currentStock: 46,  salesVelocity: 0.7,  historicalVelocity: generateVelocityHistory(0.7),  lastUpdated: new Date() },
    { foodItemId: fi[10]._id, currentStock: 39,  salesVelocity: 0.9,  historicalVelocity: generateVelocityHistory(0.9),  lastUpdated: new Date() },
    { foodItemId: fi[16]._id, currentStock: 58,  salesVelocity: 0.4,  historicalVelocity: generateVelocityHistory(0.4),  lastUpdated: new Date() },
    { foodItemId: fi[17]._id, currentStock: 50,  salesVelocity: 0.6,  historicalVelocity: generateVelocityHistory(0.6),  lastUpdated: new Date() },
    { foodItemId: fi[18]._id, currentStock: 42,  salesVelocity: 0.8,  historicalVelocity: generateVelocityHistory(0.8),  lastUpdated: new Date() },
    { foodItemId: fi[9]._id,  currentStock: 45,  salesVelocity: 1.0,  historicalVelocity: generateVelocityHistory(1.0),  lastUpdated: new Date() },
    { foodItemId: fi[20]._id, currentStock: 30,  salesVelocity: 0.7,  historicalVelocity: generateVelocityHistory(0.7),  lastUpdated: new Date() },
  ];

  await Promise.all(stores.map((s) => s.save()));

  // ------------------------------------------------------------------ ALERT THRESHOLDS
  console.log('Seeding alert thresholds...');
  await AlertThreshold.create(
    stores.map((s) => ({
      storeId: s._id,
      expirationWarningDays: 3,
      lowVelocityThreshold: 0.5,
      highVelocityThreshold: 5,
      minStockBuffer: 10,
      autoApproveThreshold: 20,
      notificationEmail: s.contactInfo.email,
      enableEmailAlerts: true,
    }))
  );

  // ------------------------------------------------------------------ USERS
  console.log('Seeding users...');
  const hashedPassword = await bcrypt.hash('Admin@123', bcryptSaltRounds);

  const users = await User.create([
    { fullName: 'System Admin',      email: 'admin@freshmarket.com',    password: hashedPassword, role: 'admin',            isActive: true },
    { fullName: 'Sarah Johnson',     email: 'sarah@freshmarket.com',    password: hashedPassword, role: 'store_manager',    assignedStoreId: stores[0]._id, isActive: true },
    { fullName: 'Michael Chen',      email: 'michael@freshmarket.com',  password: hashedPassword, role: 'store_manager',    assignedStoreId: stores[1]._id, isActive: true },
    { fullName: 'Emily Rodriguez',   email: 'emily@freshmarket.com',    password: hashedPassword, role: 'store_manager',    assignedStoreId: stores[2]._id, isActive: true },
    { fullName: 'David Kim',         email: 'david@freshmarket.com',    password: hashedPassword, role: 'store_manager',    assignedStoreId: stores[3]._id, isActive: true },
    { fullName: 'Lisa Martinez',     email: 'lisa@freshmarket.com',     password: hashedPassword, role: 'store_manager',    assignedStoreId: stores[4]._id, isActive: true },
    { fullName: 'Regional Manager',  email: 'regional@freshmarket.com', password: hashedPassword, role: 'regional_manager', isActive: true },
    { fullName: 'Staff Member',      email: 'staff@freshmarket.com',    password: hashedPassword, role: 'staff',            assignedStoreId: stores[0]._id, isActive: true },
  ]);

  const admin = users[0];
  const regional = users[6];

  // ------------------------------------------------------------------ TRANSFERS (30 days of history)
  console.log('Seeding transfer logs...');

  const transfersData = [
    // --- Completed (older, good for analytics charts)
    {
      foodItemId: fi[0]._id, foodItemName: fi[0].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 25, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: users[2]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(28), estimatedArrival: daysAgo(27), actualArrival: daysAgo(27),
      wastageAvoided: 25 * fi[0].basePrice, unitPrice: fi[0].basePrice,
      notes: 'High expiry risk at Brooklyn, Downtown running low',
      createdAt: daysAgo(29),
    },
    {
      foodItemId: fi[4]._id, foodItemName: fi[4].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 30, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: users[4]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(26), estimatedArrival: daysAgo(25), actualArrival: daysAgo(25),
      wastageAvoided: 30 * fi[4].basePrice, unitPrice: fi[4].basePrice,
      createdAt: daysAgo(27),
    },
    {
      foodItemId: fi[8]._id, foodItemName: fi[8].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[3]._id, destinationStoreName: stores[3].storeName,
      quantity: 20, reason: 'Stock Optimization', status: 'Completed',
      requestedBy: admin._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(23), estimatedArrival: daysAgo(22), actualArrival: daysAgo(22),
      wastageAvoided: 20 * fi[8].basePrice, unitPrice: fi[8].basePrice,
      createdAt: daysAgo(24),
    },
    {
      foodItemId: fi[16]._id, foodItemName: fi[16].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[1]._id, destinationStoreName: stores[1].storeName,
      quantity: 12, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: users[4]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(21), estimatedArrival: daysAgo(20), actualArrival: daysAgo(20),
      wastageAvoided: 12 * fi[16].basePrice, unitPrice: fi[16].basePrice,
      createdAt: daysAgo(22),
    },
    {
      foodItemId: fi[12]._id, foodItemName: fi[12].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 18, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: users[2]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(19), estimatedArrival: daysAgo(18), actualArrival: daysAgo(18),
      wastageAvoided: 18 * fi[12].basePrice, unitPrice: fi[12].basePrice,
      createdAt: daysAgo(20),
    },
    {
      foodItemId: fi[1]._id, foodItemName: fi[1].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[3]._id, destinationStoreName: stores[3].storeName,
      quantity: 22, reason: 'Stock Optimization', status: 'Completed',
      requestedBy: users[5]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(17), estimatedArrival: daysAgo(16), actualArrival: daysAgo(16),
      wastageAvoided: 22 * fi[1].basePrice, unitPrice: fi[1].basePrice,
      createdAt: daysAgo(18),
    },
    {
      foodItemId: fi[5]._id, foodItemName: fi[5].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 15, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: users[2]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(15), estimatedArrival: daysAgo(14), actualArrival: daysAgo(14),
      wastageAvoided: 15 * fi[5].basePrice, unitPrice: fi[5].basePrice,
      createdAt: daysAgo(16),
    },
    {
      foodItemId: fi[7]._id, foodItemName: fi[7].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[1]._id, destinationStoreName: stores[1].storeName,
      quantity: 20, reason: 'Emergency Transfer', status: 'Completed',
      requestedBy: users[1]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(13), estimatedArrival: daysAgo(12), actualArrival: daysAgo(12),
      wastageAvoided: 20 * fi[7].basePrice, unitPrice: fi[7].basePrice,
      notes: 'Downtown ran out of Turkey during weekend rush',
      createdAt: daysAgo(14),
    },
    {
      foodItemId: fi[10]._id, foodItemName: fi[10].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[3]._id, destinationStoreName: stores[3].storeName,
      quantity: 25, reason: 'Stock Optimization', status: 'Completed',
      requestedBy: users[2]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(11), estimatedArrival: daysAgo(10), actualArrival: daysAgo(10),
      wastageAvoided: 25 * fi[10].basePrice, unitPrice: fi[10].basePrice,
      createdAt: daysAgo(12),
    },
    {
      foodItemId: fi[17]._id, foodItemName: fi[17].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 14, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: users[5]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(9), estimatedArrival: daysAgo(8), actualArrival: daysAgo(8),
      wastageAvoided: 14 * fi[17].basePrice, unitPrice: fi[17].basePrice,
      createdAt: daysAgo(10),
    },
    {
      foodItemId: fi[13]._id, foodItemName: fi[13].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[1]._id, destinationStoreName: stores[1].storeName,
      quantity: 16, reason: 'Stock Optimization', status: 'Completed',
      requestedBy: users[2]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(7), estimatedArrival: daysAgo(6), actualArrival: daysAgo(6),
      wastageAvoided: 16 * fi[13].basePrice, unitPrice: fi[13].basePrice,
      createdAt: daysAgo(8),
    },
    {
      foodItemId: fi[18]._id, foodItemName: fi[18].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[3]._id, destinationStoreName: stores[3].storeName,
      quantity: 10, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: users[5]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(5), estimatedArrival: daysAgo(4), actualArrival: daysAgo(4),
      wastageAvoided: 10 * fi[18].basePrice, unitPrice: fi[18].basePrice,
      createdAt: daysAgo(6),
    },
    // --- In Transit
    {
      foodItemId: fi[4]._id, foodItemName: fi[4].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[1]._id, destinationStoreName: stores[1].storeName,
      quantity: 18, reason: 'Expiration Risk', status: 'In Transit',
      requestedBy: users[5]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(3), estimatedArrival: daysFromNow(1),
      wastageAvoided: 18 * fi[4].basePrice, unitPrice: fi[4].basePrice,
      createdAt: daysAgo(4),
    },
    {
      foodItemId: fi[16]._id, foodItemName: fi[16].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 10, reason: 'Expiration Risk', status: 'In Transit',
      requestedBy: users[2]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(2), estimatedArrival: daysFromNow(1),
      wastageAvoided: 10 * fi[16].basePrice, unitPrice: fi[16].basePrice,
      createdAt: daysAgo(3),
    },
    {
      foodItemId: fi[0]._id, foodItemName: fi[0].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[3]._id, destinationStoreName: stores[3].storeName,
      quantity: 20, reason: 'Stock Optimization', status: 'In Transit',
      requestedBy: users[5]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(2), estimatedArrival: daysFromNow(2),
      wastageAvoided: 20 * fi[0].basePrice, unitPrice: fi[0].basePrice,
      createdAt: daysAgo(3),
    },
    // --- Approved (awaiting dispatch)
    {
      foodItemId: fi[8]._id, foodItemName: fi[8].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 15, reason: 'Expiration Risk', status: 'Approved',
      requestedBy: users[2]._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(1),
      wastageAvoided: 15 * fi[8].basePrice, unitPrice: fi[8].basePrice,
      createdAt: daysAgo(2),
    },
    {
      foodItemId: fi[17]._id, foodItemName: fi[17].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[1]._id, destinationStoreName: stores[1].storeName,
      quantity: 12, reason: 'Stock Optimization', status: 'Approved',
      requestedBy: users[5]._id, approvedBy: regional._id,
      approvalTimestamp: daysAgo(1),
      wastageAvoided: 12 * fi[17].basePrice, unitPrice: fi[17].basePrice,
      createdAt: daysAgo(1),
    },
    // --- Pending (newly raised)
    {
      foodItemId: fi[1]._id, foodItemName: fi[1].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[3]._id, destinationStoreName: stores[3].storeName,
      quantity: 20, reason: 'Stock Optimization', status: 'Pending',
      requestedBy: users[2]._id,
      wastageAvoided: 20 * fi[1].basePrice, unitPrice: fi[1].basePrice,
      createdAt: daysAgo(1),
    },
    {
      foodItemId: fi[10]._id, foodItemName: fi[10].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 14, reason: 'Expiration Risk', status: 'Pending',
      requestedBy: users[5]._id,
      wastageAvoided: 14 * fi[10].basePrice, unitPrice: fi[10].basePrice,
      createdAt: new Date(),
    },
    {
      foodItemId: fi[7]._id, foodItemName: fi[7].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[1]._id, destinationStoreName: stores[1].storeName,
      quantity: 18, reason: 'Emergency Transfer', status: 'Pending',
      requestedBy: admin._id,
      wastageAvoided: 18 * fi[7].basePrice, unitPrice: fi[7].basePrice,
      notes: 'Midtown out of Turkey slices, Brooklyn overstocked',
      createdAt: new Date(),
    },
    // --- Cancelled (for realistic mix)
    {
      foodItemId: fi[15]._id, foodItemName: fi[15].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 8, reason: 'Stock Optimization', status: 'Cancelled',
      requestedBy: users[2]._id,
      wastageAvoided: 0, unitPrice: fi[15].basePrice,
      notes: 'Cancelled - destination restocked from supplier',
      createdAt: daysAgo(15),
    },
  ];

  await TransferLog.create(transfersData);

  // ------------------------------------------------------------------ DONE
  const totalWastageAvoided = transfersData
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.wastageAvoided, 0);

  console.log('\nSeed complete!');
  console.log(`  Stores:    ${stores.length}`);
  console.log(`  Food items: ${fi.length}`);
  console.log(`  Transfers:  ${transfersData.length} (12 Completed, 3 In Transit, 2 Approved, 3 Pending, 1 Cancelled)`);
  console.log(`  Wastage avoided (completed): $${totalWastageAvoided.toFixed(2)}`);
  console.log('\nLogin credentials (all use password: Admin@123)');
  console.log('  Admin:    admin@freshmarket.com');
  console.log('  Manager:  sarah@freshmarket.com  (Downtown)');
  console.log('  Regional: regional@freshmarket.com');
  console.log('  Staff:    staff@freshmarket.com');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
