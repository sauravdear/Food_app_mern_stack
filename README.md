# 🥬 FoodFlow — Perishable Food Stock Redistribution System

A production-ready full-stack application that helps grocery chains minimize food waste by intelligently redistributing perishable items from slow-selling stores to fast-selling stores before expiration.

---

## Tech Stack

| Layer       | Technologies                                              |
|-------------|-----------------------------------------------------------|
| Backend     | Node.js, Express, MongoDB (Mongoose), Socket.io           |
| Frontend    | React 18, Vite, Tailwind CSS, Recharts                    |
| Auth        | JWT (access + refresh tokens), bcryptjs                   |
| Real-time   | Socket.io                                                 |
| Scheduling  | node-cron (velocity updates, expiration scans)            |
| Email       | Nodemailer                                                |
| Docker      | Docker + Docker Compose                                   |
| i18n        | i18next (English + Spanish)                               |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- MongoDB 6+ running on localhost:27017

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your values (MongoDB URI, JWT secrets, SMTP settings)
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This creates 5 stores, 16 food items, 5 users, and sample transfer logs.

**Demo credentials:**
| Role             | Email                        | Password    |
|-----------------|------------------------------|-------------|
| Admin           | admin@freshmarket.com        | Admin@123   |
| Store Manager   | sarah@freshmarket.com        | Admin@123   |
| Regional Mgr    | regional@freshmarket.com     | Admin@123   |
| Staff           | staff@freshmarket.com        | Admin@123   |

### 4. Run the application

```bash
# Terminal 1 - Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## Docker Deployment

```bash
# Copy and configure environment
cp backend/.env.example .env  # add JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Build and run all services
docker compose up -d

# Seed the database (one-time)
docker compose exec backend npm run seed

# View logs
docker compose logs -f backend
```

Access at: `http://localhost`

---

## Architecture

```
food-app-updated/
├── backend/
│   ├── config/           # DB connection, JWT config
│   ├── middleware/        # Auth, role-based access, error handling
│   ├── models/           # Mongoose schemas
│   │   ├── User.js
│   │   ├── FoodItem.js
│   │   ├── Store.js
│   │   ├── TransferLog.js
│   │   └── AlertThreshold.js
│   ├── services/
│   │   ├── velocityEngine.js      # Weighted moving average (40/35/25)
│   │   ├── expirationService.js   # Expiration scanning & alerts
│   │   ├── recommendationEngine.js # Haversine + scoring algorithm
│   │   └── emailService.js        # Nodemailer templates
│   ├── controllers/      # Business logic
│   ├── routes/           # API endpoints
│   ├── seeders/          # Sample data
│   └── server.js         # Express + Socket.io bootstrap
└── frontend/
    ├── src/
    │   ├── api/           # Axios with auto-refresh interceptor
    │   ├── components/    # Reusable UI components + charts
    │   ├── context/       # AuthContext + SocketContext
    │   ├── hooks/         # useInventory, useOverview, useRecommendations
    │   ├── pages/         # Route-level components
    │   └── utils/         # Formatters, constants, i18n
    └── tailwind.config.js
```

---

## API Reference

### Authentication
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/register          | Register new user        |
| POST   | /api/auth/login             | Login (returns JWT)      |
| POST   | /api/auth/refresh-token     | Refresh access token     |
| POST   | /api/auth/logout            | Invalidate refresh token |
| POST   | /api/auth/forgot-password   | Send reset email         |
| PUT    | /api/auth/reset-password    | Reset with token         |

### Inventory
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/inventory/overview           | Dashboard KPI summary          |
| GET    | /api/inventory/recommendations    | AI transfer recommendations    |
| GET    | /api/inventory/expiring           | Items expiring soon            |
| GET    | /api/inventory/store/:storeId     | Store-specific inventory       |
| POST   | /api/inventory/items              | Add food item                  |
| POST   | /api/inventory/update-stock       | Update stock levels            |
| POST   | /api/inventory/batch-upload       | Bulk stock update (JSON array) |

### Transfers
| Method | Endpoint                    | Description                         |
|--------|-----------------------------|-------------------------------------|
| POST   | /api/transfers              | Create transfer (with transaction)  |
| GET    | /api/transfers              | List transfers (paginated)          |
| PUT    | /api/transfers/:id/approve  | Approve pending transfer            |
| PUT    | /api/transfers/:id/status   | Update status                       |
| GET    | /api/transfers/analytics    | Aggregated transfer metrics         |

### Analytics
| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | /api/analytics/waste           | Waste metrics            |
| GET    | /api/analytics/velocity-trends | Time-series velocity     |
| GET    | /api/analytics/categories      | Category breakdown       |
| GET    | /api/analytics/store-performance | Store ranking          |
| GET    | /api/analytics/export          | Export as CSV            |

---

## Key Algorithms

### Velocity Engine
Weighted moving average for sales velocity:
```
velocity = (todaySales × 0.40) + (avg_last_3_days × 0.35) + (avg_last_7_days × 0.25)
```

### Recommendation Engine
1. Scan items expiring within threshold (default 5 days)
2. Classify stores by velocity tier (fast vs slow sellers)
3. Calculate excess: `excess = currentStock - (velocity × daysUntilExpiry)`
4. Calculate demand at fast stores
5. Score each transfer: `urgency (×15) + value score - distance penalty`
6. Return sorted, actionable recommendations

### Transfer Scoring
```
score = urgencyScore + valueScore - distancePenalty
where:
  urgencyScore = max(0, 10 - daysLeft) × 15
  valueScore   = min(quantity × price × 0.5, 50)
  penalty      = min(distanceKm × 0.3, 10)
```

---

## Security Features
- JWT access (24h) + refresh (7d) token pattern
- bcrypt password hashing (salt rounds: 12)
- Rate limiting on auth endpoints (5 req / 15 min)
- Helmet.js HTTP security headers
- Express MongoDB sanitize (NoSQL injection prevention)
- CORS restricted to frontend origin
- Role-based access control (Admin > Regional Manager > Store Manager > Staff)
- MongoDB transactions for atomic transfer operations

---

## Real-time Events (Socket.io)
| Event                   | Trigger                             |
|-------------------------|-------------------------------------|
| `transfer:created`      | New transfer created                |
| `transfer:approved`     | Manager approves transfer           |
| `transfer:statusUpdate` | Any status change                   |

---

## Cron Jobs
| Schedule  | Job                          |
|-----------|------------------------------|
| Every 1h  | Bulk velocity recalculation  |
| Every 30m | Expiration scan + alerts     |

---

## Dark Mode & i18n
- Dark/Light mode toggle persisted to `localStorage`
- English and Spanish supported via `i18next`
- Toggle language in the Navbar (🌐 button)
