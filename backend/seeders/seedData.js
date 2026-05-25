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

const generateVelocityHistory = (baseVelocity, days = 14) =>
  Array.from({ length: days }, (_, i) => ({
    date: daysAgo(days - i),
    velocity: parseFloat((baseVelocity * (0.7 + Math.random() * 0.6)).toFixed(2)),
  }));

async function seed() {
  await connectDB();

  console.log('🌱 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    FoodItem.deleteMany({}),
    Store.deleteMany({}),
    TransferLog.deleteMany({}),
    AlertThreshold.deleteMany({}),
  ]);

  console.log('👤 Seeding users...');
  const hashedPassword = await bcrypt.hash('Admin@123', bcryptSaltRounds);

  // Stores created first so we can reference IDs
  console.log('🏪 Seeding stores...');
  const storesData = [
    {
      storeName: 'Downtown Fresh Market',
      storeCode: 'DFM001',
      location: {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: { lat: 40.7128, lng: -74.006 },
      },
      contactInfo: { phone: '212-555-0101', email: 'dfm001@freshmarket.com', managerName: 'Sarah Johnson' },
    },
    {
      storeName: 'Midtown Grocery Hub',
      storeCode: 'MGH002',
      location: {
        address: '456 Park Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10022',
        coordinates: { lat: 40.7549, lng: -73.9840 },
      },
      contactInfo: { phone: '212-555-0202', email: 'mgh002@freshmarket.com', managerName: 'Michael Chen' },
    },
    {
      storeName: 'Brooklyn Food Center',
      storeCode: 'BFC003',
      location: {
        address: '789 Atlantic Ave',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11217',
        coordinates: { lat: 40.6892, lng: -73.9442 },
      },
      contactInfo: { phone: '718-555-0303', email: 'bfc003@freshmarket.com', managerName: 'Emily Rodriguez' },
    },
    {
      storeName: 'Queens Mega Mart',
      storeCode: 'QMM004',
      location: {
        address: '321 Queens Blvd',
        city: 'Queens',
        state: 'NY',
        zipCode: '11432',
        coordinates: { lat: 40.7282, lng: -73.7949 },
      },
      contactInfo: { phone: '718-555-0404', email: 'qmm004@freshmarket.com', managerName: 'David Kim' },
    },
    {
      storeName: 'Bronx Community Store',
      storeCode: 'BCS005',
      location: {
        address: '654 Grand Concourse',
        city: 'Bronx',
        state: 'NY',
        zipCode: '10451',
        coordinates: { lat: 40.8448, lng: -73.9252 },
      },
      contactInfo: { phone: '718-555-0505', email: 'bcs005@freshmarket.com', managerName: 'Lisa Martinez' },
    },
  ];

  const stores = await Store.create(storesData);

  console.log('🍎 Seeding food items...');
  const foodItemsData = [
    { name: 'Organic Whole Milk', SKU: 'DAIRY001', category: 'Dairy', batchNumber: 'B2024-001', expirationDate: daysFromNow(2), basePrice: 5.99, unitType: 'liters', minimumStockThreshold: 20, storageTemperature: { min: 1, max: 4 } },
    { name: 'Greek Yogurt 500g', SKU: 'DAIRY002', category: 'Dairy', batchNumber: 'B2024-002', expirationDate: daysFromNow(4), basePrice: 3.49, unitType: 'pieces', minimumStockThreshold: 15, storageTemperature: { min: 1, max: 4 } },
    { name: 'Cheddar Cheese Block', SKU: 'DAIRY003', category: 'Dairy', batchNumber: 'B2024-003', expirationDate: daysFromNow(8), basePrice: 7.99, unitType: 'kg', minimumStockThreshold: 10 },
    { name: 'Chicken Breast 1kg', SKU: 'MEAT001', category: 'Meat', batchNumber: 'B2024-004', expirationDate: daysFromNow(1), basePrice: 12.99, unitType: 'kg', minimumStockThreshold: 10, storageTemperature: { min: 0, max: 4 } },
    { name: 'Ground Beef 500g', SKU: 'MEAT002', category: 'Meat', batchNumber: 'B2024-005', expirationDate: daysFromNow(3), basePrice: 8.99, unitType: 'pieces', minimumStockThreshold: 15, storageTemperature: { min: 0, max: 4 } },
    { name: 'Pork Ribs 800g', SKU: 'MEAT003', category: 'Meat', batchNumber: 'B2024-006', expirationDate: daysFromNow(5), basePrice: 11.49, unitType: 'pieces', minimumStockThreshold: 8 },
    { name: 'Organic Spinach 200g', SKU: 'PROD001', category: 'Produce', batchNumber: 'B2024-007', expirationDate: daysFromNow(2), basePrice: 2.99, unitType: 'pieces', minimumStockThreshold: 25, storageTemperature: { min: 1, max: 7 } },
    { name: 'Fresh Strawberries 400g', SKU: 'PROD002', category: 'Produce', batchNumber: 'B2024-008', expirationDate: daysFromNow(3), basePrice: 4.99, unitType: 'pieces', minimumStockThreshold: 20 },
    { name: 'Cherry Tomatoes 500g', SKU: 'PROD003', category: 'Produce', batchNumber: 'B2024-009', expirationDate: daysFromNow(6), basePrice: 3.29, unitType: 'pieces', minimumStockThreshold: 15 },
    { name: 'Sourdough Bread', SKU: 'BAK001', category: 'Bakery', batchNumber: 'B2024-010', expirationDate: daysFromNow(2), basePrice: 4.49, unitType: 'pieces', minimumStockThreshold: 10, storageTemperature: { min: 15, max: 25 } },
    { name: 'Croissants 6pk', SKU: 'BAK002', category: 'Bakery', batchNumber: 'B2024-011', expirationDate: daysFromNow(1), basePrice: 6.99, unitType: 'packets', minimumStockThreshold: 12 },
    { name: 'Whole Grain Muffins 4pk', SKU: 'BAK003', category: 'Bakery', batchNumber: 'B2024-012', expirationDate: daysFromNow(4), basePrice: 5.29, unitType: 'packets', minimumStockThreshold: 8 },
    { name: 'Atlantic Salmon 400g', SKU: 'SEA001', category: 'Seafood', batchNumber: 'B2024-013', expirationDate: daysFromNow(2), basePrice: 18.99, unitType: 'pieces', minimumStockThreshold: 8, storageTemperature: { min: 0, max: 4 } },
    { name: 'Shrimp 500g Cooked', SKU: 'SEA002', category: 'Seafood', batchNumber: 'B2024-014', expirationDate: daysFromNow(4), basePrice: 14.99, unitType: 'pieces', minimumStockThreshold: 10 },
    { name: 'Caesar Salad Kit', SKU: 'PREP001', category: 'Prepared', batchNumber: 'B2024-015', expirationDate: daysFromNow(3), basePrice: 7.49, unitType: 'pieces', minimumStockThreshold: 15 },
    { name: 'Chicken Tikka Masala 400g', SKU: 'PREP002', category: 'Prepared', batchNumber: 'B2024-016', expirationDate: daysFromNow(5), basePrice: 9.99, unitType: 'pieces', minimumStockThreshold: 10 },
  ];

  const foodItems = await FoodItem.create(foodItemsData);

  console.log('📦 Populating store inventories...');
  // Downtown (fast seller)
  stores[0].inventory = [
    { foodItemId: foodItems[0]._id, currentStock: 15, salesVelocity: 8.2, historicalVelocity: generateVelocityHistory(8.2), lastUpdated: new Date() },
    { foodItemId: foodItems[3]._id, currentStock: 8, salesVelocity: 6.5, historicalVelocity: generateVelocityHistory(6.5), lastUpdated: new Date() },
    { foodItemId: foodItems[6]._id, currentStock: 12, salesVelocity: 9.1, historicalVelocity: generateVelocityHistory(9.1), lastUpdated: new Date() },
    { foodItemId: foodItems[9]._id, currentStock: 6, salesVelocity: 7.3, historicalVelocity: generateVelocityHistory(7.3), lastUpdated: new Date() },
    { foodItemId: foodItems[12]._id, currentStock: 4, salesVelocity: 5.8, historicalVelocity: generateVelocityHistory(5.8), lastUpdated: new Date() },
    { foodItemId: foodItems[14]._id, currentStock: 10, salesVelocity: 6.0, historicalVelocity: generateVelocityHistory(6.0), lastUpdated: new Date() },
  ];

  // Midtown (medium seller)
  stores[1].inventory = [
    { foodItemId: foodItems[1]._id, currentStock: 35, salesVelocity: 2.1, historicalVelocity: generateVelocityHistory(2.1), lastUpdated: new Date() },
    { foodItemId: foodItems[4]._id, currentStock: 28, salesVelocity: 1.8, historicalVelocity: generateVelocityHistory(1.8), lastUpdated: new Date() },
    { foodItemId: foodItems[7]._id, currentStock: 22, salesVelocity: 3.2, historicalVelocity: generateVelocityHistory(3.2), lastUpdated: new Date() },
    { foodItemId: foodItems[10]._id, currentStock: 18, salesVelocity: 2.5, historicalVelocity: generateVelocityHistory(2.5), lastUpdated: new Date() },
    { foodItemId: foodItems[13]._id, currentStock: 15, salesVelocity: 2.9, historicalVelocity: generateVelocityHistory(2.9), lastUpdated: new Date() },
    { foodItemId: foodItems[15]._id, currentStock: 20, salesVelocity: 2.3, historicalVelocity: generateVelocityHistory(2.3), lastUpdated: new Date() },
  ];

  // Brooklyn (slow seller - excess stock)
  stores[2].inventory = [
    { foodItemId: foodItems[0]._id, currentStock: 60, salesVelocity: 0.8, historicalVelocity: generateVelocityHistory(0.8), lastUpdated: new Date() },
    { foodItemId: foodItems[3]._id, currentStock: 45, salesVelocity: 0.5, historicalVelocity: generateVelocityHistory(0.5), lastUpdated: new Date() },
    { foodItemId: foodItems[6]._id, currentStock: 50, salesVelocity: 1.1, historicalVelocity: generateVelocityHistory(1.1), lastUpdated: new Date() },
    { foodItemId: foodItems[9]._id, currentStock: 40, salesVelocity: 0.7, historicalVelocity: generateVelocityHistory(0.7), lastUpdated: new Date() },
    { foodItemId: foodItems[2]._id, currentStock: 30, salesVelocity: 1.3, historicalVelocity: generateVelocityHistory(1.3), lastUpdated: new Date() },
  ];

  // Queens (mixed)
  stores[3].inventory = [
    { foodItemId: foodItems[5]._id, currentStock: 25, salesVelocity: 3.1, historicalVelocity: generateVelocityHistory(3.1), lastUpdated: new Date() },
    { foodItemId: foodItems[8]._id, currentStock: 30, salesVelocity: 4.2, historicalVelocity: generateVelocityHistory(4.2), lastUpdated: new Date() },
    { foodItemId: foodItems[11]._id, currentStock: 15, salesVelocity: 2.8, historicalVelocity: generateVelocityHistory(2.8), lastUpdated: new Date() },
    { foodItemId: foodItems[1]._id, currentStock: 40, salesVelocity: 0.9, historicalVelocity: generateVelocityHistory(0.9), lastUpdated: new Date() },
    { foodItemId: foodItems[4]._id, currentStock: 35, salesVelocity: 0.6, historicalVelocity: generateVelocityHistory(0.6), lastUpdated: new Date() },
  ];

  // Bronx (slow seller)
  stores[4].inventory = [
    { foodItemId: foodItems[12]._id, currentStock: 55, salesVelocity: 0.4, historicalVelocity: generateVelocityHistory(0.4), lastUpdated: new Date() },
    { foodItemId: foodItems[13]._id, currentStock: 48, salesVelocity: 0.6, historicalVelocity: generateVelocityHistory(0.6), lastUpdated: new Date() },
    { foodItemId: foodItems[14]._id, currentStock: 38, salesVelocity: 0.8, historicalVelocity: generateVelocityHistory(0.8), lastUpdated: new Date() },
    { foodItemId: foodItems[7]._id, currentStock: 42, salesVelocity: 1.0, historicalVelocity: generateVelocityHistory(1.0), lastUpdated: new Date() },
    { foodItemId: foodItems[15]._id, currentStock: 28, salesVelocity: 0.7, historicalVelocity: generateVelocityHistory(0.7), lastUpdated: new Date() },
  ];

  await Promise.all(stores.map((s) => s.save()));

  console.log('🚨 Seeding alert thresholds...');
  await AlertThreshold.create(
    stores.map((s) => ({
      storeId: s._id,
      expirationWarningDays: 3,
      lowVelocityThreshold: 0.5,
      highVelocityThreshold: 5,
      minStockBuffer: 10,
      autoApproveThreshold: 20,
      notificationEmail: s.contactInfo.email,
    }))
  );

  console.log('👥 Seeding users...');
  await User.create([
    { fullName: 'System Admin', email: 'admin@freshmarket.com', password: hashedPassword, role: 'admin', isActive: true },
    { fullName: 'Sarah Johnson', email: 'sarah@freshmarket.com', password: hashedPassword, role: 'store_manager', assignedStoreId: stores[0]._id, isActive: true },
    { fullName: 'Michael Chen', email: 'michael@freshmarket.com', password: hashedPassword, role: 'store_manager', assignedStoreId: stores[1]._id, isActive: true },
    { fullName: 'Regional Manager', email: 'regional@freshmarket.com', password: hashedPassword, role: 'regional_manager', isActive: true },
    { fullName: 'Staff Member', email: 'staff@freshmarket.com', password: hashedPassword, role: 'staff', assignedStoreId: stores[0]._id, isActive: true },
  ]);

  console.log('📋 Seeding transfer logs...');
  const admin = await User.findOne({ role: 'admin' });
  await TransferLog.create([
    {
      foodItemId: foodItems[0]._id, foodItemName: foodItems[0].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 20, reason: 'Expiration Risk', status: 'Completed',
      requestedBy: admin._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(5), actualArrival: daysAgo(4),
      wastageAvoided: 20 * foodItems[0].basePrice, unitPrice: foodItems[0].basePrice,
      createdAt: daysAgo(6),
    },
    {
      foodItemId: foodItems[3]._id, foodItemName: foodItems[3].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[1]._id, destinationStoreName: stores[1].storeName,
      quantity: 15, reason: 'Expiration Risk', status: 'Approved',
      requestedBy: admin._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(1),
      wastageAvoided: 15 * foodItems[3].basePrice, unitPrice: foodItems[3].basePrice,
      createdAt: daysAgo(2),
    },
    {
      foodItemId: foodItems[6]._id, foodItemName: foodItems[6].name,
      sourceStoreId: stores[2]._id, sourceStoreName: stores[2].storeName,
      destinationStoreId: stores[3]._id, destinationStoreName: stores[3].storeName,
      quantity: 10, reason: 'Stock Optimization', status: 'Pending',
      requestedBy: admin._id,
      wastageAvoided: 10 * foodItems[6].basePrice, unitPrice: foodItems[6].basePrice,
      createdAt: daysAgo(1),
    },
    {
      foodItemId: foodItems[12]._id, foodItemName: foodItems[12].name,
      sourceStoreId: stores[4]._id, sourceStoreName: stores[4].storeName,
      destinationStoreId: stores[0]._id, destinationStoreName: stores[0].storeName,
      quantity: 8, reason: 'Expiration Risk', status: 'In Transit',
      requestedBy: admin._id, approvedBy: admin._id,
      approvalTimestamp: daysAgo(2), estimatedArrival: daysFromNow(1),
      wastageAvoided: 8 * foodItems[12].basePrice, unitPrice: foodItems[12].basePrice,
      createdAt: daysAgo(3),
    },
  ]);

  console.log('✅ Seed complete!\n');
  console.log('📧 Login credentials:');
  console.log('   Admin:    admin@freshmarket.com / Admin@123');
  console.log('   Manager:  sarah@freshmarket.com / Admin@123');
  console.log('   Regional: regional@freshmarket.com / Admin@123');
  console.log('   Staff:    staff@freshmarket.com / Admin@123');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
