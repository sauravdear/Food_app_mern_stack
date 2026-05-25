import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cron from 'node-cron';

import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import { bulkUpdateVelocities } from './services/velocityEngine.js';
import { sendExpirationNotifications } from './services/expirationService.js';

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
const allowedOrigins = [
  process.env.FRONTEND_URL?.trim(),
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin.trim())) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => logger.debug(`Socket disconnected: ${socket.id}`));

  // Join store-specific room
  socket.on('join:store', (storeId) => {
    socket.join(`store:${storeId}`);
    logger.debug(`Socket ${socket.id} joined store:${storeId}`);
  });
});

// Cron Jobs
cron.schedule('0 * * * *', async () => {
  logger.info('Running hourly velocity update...');
  await bulkUpdateVelocities().catch((e) => logger.error('Velocity cron error:', e));
});

cron.schedule('*/30 * * * *', async () => {
  logger.info('Running expiration scan...');
  await sendExpirationNotifications().catch((e) => logger.error('Expiration cron error:', e));
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();

export default app;
