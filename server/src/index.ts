import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './lib/errors';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import portalRoutes from './routes/portal';
import { createGateway } from './gateway';
import { startCronJobs } from './cron';

async function main() {
  // ─── Main API Server ─────────────────────────────────────
  const app = express();

  app.use(cors({
    origin: [config.frontendUrl, config.adminUrl],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('short'));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-server', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/portal', portalRoutes);

  // Error handling
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`API Server running on port ${config.port}`);
  });

  // ─── API Gateway ──────────────────────────────────────────
  const gateway = createGateway();
  gateway.listen(config.gatewayPort, () => {
    console.log(`API Gateway running on port ${config.gatewayPort}`);
  });

  // ─── Cron Jobs ────────────────────────────────────────────
  startCronJobs();
}

main().catch(console.error);
