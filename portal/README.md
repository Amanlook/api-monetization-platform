# Developer Portal (Client View)

The developer portal is a React-based web application that provides API consumers with a complete self-service interface for discovering, subscribing to, and managing API access.

## Overview

This is the client-facing portal where developers can:
- Browse and explore available APIs
- Subscribe to pricing plans
- Generate and manage API keys
- Monitor usage and analytics
- View billing history and invoices

## Features

### 🔍 API Discovery
- **API Catalog** — Browse all available APIs with search and filtering
- **API Details** — View endpoints, documentation, pricing plans, and sample code
- **Interactive Documentation** — Endpoint listings with HTTP method badges

### 🔑 API Key Management
- **Key Generation** — Create API keys for subscribed APIs
- **Key Security** — View prefix-only after creation (full key shown once)
- **Key Revocation** — Deactivate keys at any time
- **Multiple Keys** — Support for multiple active keys per subscription

### 📊 Usage Analytics
- **Real-time Metrics** — Track request counts and API performance
- **Historical Charts** — Daily usage trends with Recharts visualizations
- **Quota Monitoring** — Track usage against plan limits
- **Per-API Breakdown** — Separate analytics for each subscribed API

### 💳 Subscription & Billing
- **Plan Selection** — Subscribe to Free, Tiered, or Pay-As-You-Go plans
- **Active Subscriptions** — Manage and cancel subscriptions
- **Invoice History** — View detailed billing statements
- **Usage-based Billing** — Transparent overage charges and line items

### 🎨 User Experience
- **Modern UI** — Tailwind CSS with responsive design
- **Dark-themed Dashboard** — Clean, professional interface
- **Icon Library** — Lucide React icons throughout
- **Protected Routes** — JWT-based authentication with Zustand state management

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 |
| Language | TypeScript |
| Routing | React Router v6 |
| State Management | Zustand |
| HTTP Client | Axios |
| UI Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Build Tool | Vite |
| Dev Server | Vite Dev Server (Port 5173) |

## Pages & Routes

### Public Routes
- **`/`** — Landing page with hero and features
- **`/login`** — User authentication
- **`/register`** — New user registration
- **`/apis`** — API catalog (publicly accessible)
- **`/apis/:slug`** — Individual API details

### Protected Routes (Requires Authentication)
- **`/dashboard`** — User dashboard overview
- **`/dashboard/keys`** — API key management
- **`/dashboard/subscriptions`** — Active subscriptions
- **`/dashboard/usage`** — Usage analytics and charts
- **`/dashboard/billing`** — Invoice history

## Project Structure

```
portal/
├── src/
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles + Tailwind
│   ├── components/
│   │   └── Layout.tsx         # Dashboard layout with navbar
│   ├── pages/
│   │   ├── Landing.tsx        # Public landing page
│   │   ├── Login.tsx          # Authentication
│   │   ├── Register.tsx       # User signup
│   │   ├── ApiCatalog.tsx     # API browsing
│   │   ├── ApiDetail.tsx      # API documentation
│   │   ├── Dashboard.tsx      # User overview
│   │   ├── ApiKeys.tsx        # Key management
│   │   ├── Subscriptions.tsx  # Plan management
│   │   ├── Usage.tsx          # Analytics charts
│   │   └── Billing.tsx        # Invoice history
│   ├── lib/
│   │   └── api.ts             # Axios instance & API client
│   └── stores/
│       └── auth.ts            # Zustand auth store
├── index.html                 # Vite HTML template
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies
├── Dockerfile                # Production container
└── nginx.conf                # Production web server

```

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Backend API server running (default: http://localhost:3000)

### Installation

```bash
cd portal
npm install
```

### Environment Configuration

The portal connects to the API server. By default, it uses `http://localhost:3000`. To change this, update the base URL in `src/lib/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});
```

### Development Server

```bash
npm run dev
```

The portal will start at **http://localhost:5173**

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## API Integration

The portal communicates with the backend API server via Axios. All API calls are defined in `src/lib/api.ts`.

### Authentication Flow
1. User registers/logs in via `/auth/register` or `/auth/login`
2. Server returns JWT token and user data
3. Token stored in Zustand store and sent in subsequent requests
4. Protected routes check auth state before rendering

### Key API Endpoints Used
- `POST /auth/register` — User registration
- `POST /auth/login` — User login
- `GET /portal/apis` — List all APIs
- `GET /portal/apis/:id` — Get API details
- `POST /portal/subscriptions` — Subscribe to plan
- `GET /portal/subscriptions` — List user subscriptions
- `POST /portal/keys` — Generate API key
- `GET /portal/keys` — List user keys
- `GET /portal/usage/:apiId` — Get usage analytics
- `GET /portal/invoices` — Get billing history

## Docker Deployment

### Build Image

```bash
docker build -t api-portal .
```

### Run Container

```bash
docker run -p 80:80 api-portal
```

The Docker image uses nginx to serve the production build.

### Docker Compose

The portal is included in the root `docker-compose.yml`:

```bash
cd ..
docker-compose up portal
```

## Authentication State Management

The portal uses Zustand for global auth state:

```typescript
interface AuthStore {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

The store is persisted and rehydrated on page load.

## Styling Guidelines

- **Tailwind CSS** — Utility-first styling
- **Dark Theme** — Slate and blue color palette
- **Responsive Design** — Mobile-friendly layouts
- **Component Patterns** — Reusable button, card, and badge styles

Example button styles:
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click Me
</button>
```

## Development Tips

### Hot Module Replacement
Vite provides instant HMR. Save any file to see changes immediately.

### TypeScript Checks
```bash
npx tsc --noEmit
```

### Linting
Add ESLint to your workflow for code quality (not included by default).

### Debugging
Use React DevTools browser extension to inspect component state and props.

## Common Tasks

### Add a New Page
1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/Layout.tsx` (if protected)

### Add a New API Endpoint
1. Define the request in `src/lib/api.ts`
2. Call from component using `async/await`
3. Handle loading and error states

### Update Styling
- Modify `tailwind.config.js` for theme changes
- Update `src/index.css` for global styles
- Use Tailwind utilities in components

## Production Checklist

- [ ] Update API base URL to production server
- [ ] Build with `npm run build`
- [ ] Test production build with `npm run preview`
- [ ] Verify all routes work correctly
- [ ] Check responsive design on mobile
- [ ] Ensure error handling for failed API calls
- [ ] Configure CORS on backend for production domain

## Support

For backend API documentation, see the main project README at the root level.

For issues or questions, refer to the API Monetization Platform documentation.

## License

Part of the API Monetization Platform project.
