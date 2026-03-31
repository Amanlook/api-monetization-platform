# API Monetization Platform

A complete end-to-end platform to monetize, manage, and scale APIs with built-in billing, rate limiting, analytics, and developer portals.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients / SDKs                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼──────────┐   ┌─────────▼──────────┐
    │   API Gateway       │   │   API Server        │
    │   (Port 3001)       │   │   (Port 3000)       │
    │                     │   │                     │
    │ • Auth (API Key)    │   │ • Auth (JWT)        │
    │ • Rate Limiting     │   │ • Admin Routes      │
    │ • Usage Logging     │   │ • Portal Routes     │
    │ • Proxy to Upstream │   │ • Billing Engine    │
    └────────┬────────────┘   │ • Analytics         │
             │                │ • Cron Jobs         │
             │                └──────┬──────────────┘
             │                       │
    ┌────────▼──────────────────────▼───────────────┐
    │              PostgreSQL + Redis                 │
    └─────────────────────────────────────────────────┘
              │                         │
    ┌─────────▼──────────┐   ┌─────────▼──────────┐
    │  Developer Portal   │   │  Admin Dashboard    │
    │  (Port 5173)        │   │  (Port 5174)        │
    │                     │   │                     │
    │ • API Catalog       │   │ • API Management    │
    │ • API Key Mgmt      │   │ • Plan Management   │
    │ • Subscriptions     │   │ • User Management   │
    │ • Usage Analytics   │   │ • Analytics         │
    │ • Billing History   │   │ • Invoice Mgmt      │
    └─────────────────────┘   └─────────────────────┘
```

## Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Backend     | Node.js, Express, TypeScript                  |
| Database    | PostgreSQL + Prisma ORM                       |
| Cache       | Redis (rate limiting, real-time stats)         |
| Frontend    | React 18, TypeScript, Tailwind CSS, Recharts  |
| Auth        | JWT (server), API Keys (gateway)              |
| Gateway     | Express + http-proxy-middleware               |
| Build       | Vite, tsc                                     |
| Deploy      | Docker, Docker Compose, nginx                 |

## Features

### API Gateway
- **API Key Authentication** — SHA-256 hashed keys with prefix-based lookup
- **Rate Limiting** — Redis sliding window (per-minute, per-user, per-API)
- **Request Proxying** — Dynamic routing to upstream services
- **Usage Logging** — Every request logged for billing & analytics
- **Quota Enforcement** — Monthly request limits with optional overage billing

### Billing Engine
- **Flexible Plans** — Free, Tiered, Pay-As-You-Go, Enterprise
- **Automated Invoicing** — Cron-based invoice generation at period end
- **Overage Billing** — Per-request charges when quota is exceeded
- **Invoice Line Items** — Detailed breakdowns per billing period

### Analytics
- **Real-time Dashboards** — Redis-backed counters for live metrics
- **Historical Analytics** — PostgreSQL aggregations with daily/hourly breakdowns
- **Per-API Metrics** — Requests, latency (avg/p95/p99), error rates, unique users
- **Top Endpoints & Users** — Ranked usage breakdowns

### Developer Portal
- **API Catalog** — Browse, search, and filter available APIs
- **Interactive Docs** — Endpoint listings with method badges + markdown docs
- **API Key Management** — Generate, revoke, and track key usage
- **Subscription Management** — Subscribe to plans, track usage, cancel
- **Usage Analytics** — Charts showing daily request volume and latency
- **Billing Dashboard** — Invoice history, spending summaries

### Admin Dashboard
- **API Product CRUD** — Create/edit APIs, configure upstream targets
- **Plan Management** — Create pricing tiers with limits and overage pricing
- **User Management** — Paginated list with subscription and key counts
- **Analytics** — Per-API charts: requests, latency, top users, endpoints
- **Invoice Management** — Filter by status, view line items

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- (or Docker + Docker Compose)

### Option 1: Docker Compose (Recommended)

```bash
# Clone and start everything
cd api-monetization-platform
docker-compose up -d

# Run migrations and seed
docker-compose exec server npx prisma migrate deploy
docker-compose exec server npx tsx src/seed.ts
```

### Option 2: Local Development

```bash
# 1. Start PostgreSQL and Redis
# (Use Docker, Homebrew, or your preferred method)
docker-compose up -d postgres redis

# 2. Set up the server
cd server
cp .env.example .env    # Edit with your DB/Redis URLs
npm install
npx prisma migrate dev  # Run migrations
npx prisma db seed      # Seed sample data

# 3. Start the server
npm run dev

# 4. Start the developer portal (new terminal)
cd portal
npm install
npm run dev

# 5. Start the admin dashboard (new terminal)
cd admin
npm install
npm run dev
```

### Access Points

| Service           | URL                         |
|-------------------|-----------------------------|
| API Server        | http://localhost:3000        |
| API Gateway       | http://localhost:3001        |
| Developer Portal  | http://localhost:5173        |
| Admin Dashboard   | http://localhost:5174        |
| Prisma Studio     | `cd server && npx prisma studio` |

### Default Credentials

| Role      | Email                   | Password      |
|-----------|-------------------------|---------------|
| Admin     | admin@apiplatform.com   | admin123456   |
| Developer | dev@example.com         | developer123  |

## API Reference

### Authentication
```bash
# Register
POST /api/auth/register
{ "email": "...", "password": "...", "name": "..." }

# Login
POST /api/auth/login
{ "email": "...", "password": "..." }

# → Returns { user, token }
```

### Gateway Usage
```bash
# Make API calls through the gateway
curl -H "X-API-Key: amp_your_key_here" \
  http://localhost:3001/weather/current?lat=40.7&lon=-74.0
```

### Portal Endpoints
```
GET    /api/portal/apis              # List APIs
GET    /api/portal/apis/:slug        # API details
POST   /api/portal/keys              # Create API key
GET    /api/portal/subscriptions     # List subscriptions
POST   /api/portal/subscriptions     # Subscribe to plan
GET    /api/portal/usage             # Usage analytics
GET    /api/portal/billing           # Billing summary
```

### Admin Endpoints
```
GET    /api/admin/dashboard          # Dashboard stats
CRUD   /api/admin/apis               # API products
CRUD   /api/admin/plans              # Pricing plans
GET    /api/admin/users              # User management
GET    /api/admin/analytics/:apiId   # API analytics
GET    /api/admin/invoices           # Invoice management
```

## Database Schema

Key entities:
- **User** — Developers and admins with JWT auth
- **ApiProduct** — APIs available for monetization
- **Plan** — Pricing tiers per API (Free/Tiered/PayAsYouGo/Enterprise)
- **ApiKey** — SHA-256 hashed keys for gateway auth
- **Subscription** — User-Plan relationship with quota tracking
- **UsageLog** — Per-request logging for billing & analytics
- **Invoice** — Automated billing with line items
- **AnalyticsAggregation** — Hourly/daily rollups for dashboards

## Project Structure

```
api-monetization-platform/
├── server/                 # Backend API + Gateway
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── src/
│       ├── config.ts        # Environment config
│       ├── index.ts         # Entry point
│       ├── cron.ts          # Scheduled jobs
│       ├── gateway/         # API Gateway
│       │   ├── index.ts     # Gateway server
│       │   ├── auth.ts      # Key auth + rate limiting
│       │   └── usage.ts     # Request logging
│       ├── middleware/
│       │   └── auth.ts      # JWT auth middleware
│       ├── routes/
│       │   ├── auth.ts      # Register/login
│       │   ├── admin.ts     # Admin CRUD + analytics
│       │   └── portal.ts    # Developer portal
│       ├── services/
│       │   ├── billing.ts   # Invoice generation
│       │   └── analytics.ts # Analytics queries
│       └── lib/
│           ├── prisma.ts    # DB client
│           ├── redis.ts     # Cache client
│           └── errors.ts    # Error handling
├── portal/                  # Developer Portal (React)
│   └── src/
│       ├── pages/           # All page components
│       ├── stores/          # Zustand stores
│       └── lib/             # API client
├── admin/                   # Admin Dashboard (React)
│   └── src/
│       ├── pages/           # Admin page components
│       └── lib/             # API client
├── docker-compose.yml
└── README.md
```

## License

MIT
