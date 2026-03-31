import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { gatewayAuth } from './auth';
import { usageLogger } from './usage';
import prisma from '../lib/prisma';
import { config } from '../config';

export function createGateway() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
  });

  // Gateway authentication + rate limiting
  app.use(gatewayAuth);

  // Usage logging
  app.use(usageLogger());

  // Dynamic proxy - routes requests to the appropriate upstream
  app.use('/', (req, res, next) => {
    const meta = (req as any).gatewayMeta;
    if (!meta?.targetUrl) {
      return res.status(502).json({ error: { message: 'No upstream target configured' } });
    }

    // Strip the basePath from the request before forwarding
    const targetPath = req.originalUrl.replace(meta.basePath, '') || '/';

    const proxy = createProxyMiddleware({
      target: meta.targetUrl,
      changeOrigin: true,
      pathRewrite: { [`^${meta.basePath}`]: '' },
      on: {
        proxyReq: (proxyReq) => {
          // Add metadata headers for the upstream
          proxyReq.setHeader('X-Forwarded-User', meta.userId);
          proxyReq.setHeader('X-Request-Id', crypto.randomUUID());
        },
        error: (err, _req, res) => {
          console.error('Proxy error:', err.message);
          (res as express.Response).status(502).json({
            error: { message: 'Upstream service unavailable', code: 'UPSTREAM_ERROR' },
          });
        },
      },
    });

    proxy(req, res, next);
  });

  return app;
}
