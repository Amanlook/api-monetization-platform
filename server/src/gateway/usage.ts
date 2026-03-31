import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import redis from '../lib/redis';

/**
 * Log each proxied request for analytics & billing.
 * Runs asynchronously so it doesn't slow down the response.
 */
export function usageLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const meta = (req as any).gatewayMeta;

    if (!meta) {
      return next();
    }

    // Capture response finish
    res.on('finish', async () => {
      const responseTimeMs = Date.now() - startTime;

      try {
        // Write to DB
        await prisma.usageLog.create({
          data: {
            userId: meta.userId,
            apiProductId: meta.apiProductId,
            apiKeyId: meta.apiKeyId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            responseTimeMs,
            requestSize: parseInt(req.headers['content-length'] || '0', 10),
            responseSize: parseInt(res.getHeader('content-length') as string || '0', 10),
            ipAddress: (req.ip || req.socket.remoteAddress || '').substring(0, 45),
            userAgent: (req.headers['user-agent'] || '').substring(0, 512),
          },
        });

        // Increment subscription usage counter
        await prisma.subscription.update({
          where: { id: meta.subscriptionId },
          data: { requestsUsed: { increment: 1 } },
        });

        // Update real-time counters in Redis for dashboard
        const dateKey = new Date().toISOString().split('T')[0];
        const hourKey = new Date().getHours();

        const pipeline = redis.pipeline();
        pipeline.hincrby(`stats:${meta.apiProductId}:${dateKey}`, 'total', 1);
        pipeline.hincrby(`stats:${meta.apiProductId}:${dateKey}`, `h${hourKey}`, 1);
        pipeline.hincrby(`stats:${meta.apiProductId}:${dateKey}`, `status:${res.statusCode}`, 1);

        // Track response times for percentiles
        pipeline.lpush(`latency:${meta.apiProductId}:${dateKey}`, responseTimeMs.toString());
        pipeline.ltrim(`latency:${meta.apiProductId}:${dateKey}`, 0, 9999);

        // Set TTL on stats keys (7 days)
        pipeline.expire(`stats:${meta.apiProductId}:${dateKey}`, 7 * 24 * 3600);
        pipeline.expire(`latency:${meta.apiProductId}:${dateKey}`, 7 * 24 * 3600);

        await pipeline.exec();
      } catch (error) {
        console.error('Usage logging error:', error);
      }
    });

    next();
  };
}
