import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

interface RateLimitInfo {
  userId: string;
  planId: string;
  rateLimit: number;
  requestLimit: number;
  requestsUsed: number;
  subscriptionId: string;
  apiProductId: string;
}

/**
 * Authenticate API requests via API key and enforce rate limits.
 * Uses Redis sliding window for per-minute rate limiting.
 */
export async function gatewayAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: { message: 'Missing X-API-Key header', code: 'API_KEY_REQUIRED' } });
  }

  // Look up key by prefix (first 8 chars), then verify
  const keyPrefix = apiKey.substring(0, 8);

  // Check cache first
  const cacheKey = `apikey:${keyPrefix}`;
  let cachedData = await redis.get(cacheKey);
  let keyData: any;

  if (cachedData) {
    keyData = JSON.parse(cachedData);
  } else {
    const dbKey = await prisma.apiKey.findFirst({
      where: { keyPrefix, isActive: true },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: { include: { apiProduct: true } } },
            },
          },
        },
      },
    });

    if (!dbKey) {
      return res.status(401).json({ error: { message: 'Invalid API key', code: 'INVALID_API_KEY' } });
    }

    // Verify the full key via bcrypt-compatible check
    // For performance, we store a SHA256 hash and compare
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    if (hash !== dbKey.keyHash) {
      return res.status(401).json({ error: { message: 'Invalid API key', code: 'INVALID_API_KEY' } });
    }

    keyData = {
      keyId: dbKey.id,
      userId: dbKey.userId,
      userName: dbKey.user.name,
      subscriptions: dbKey.user.subscriptions.map((s) => ({
        id: s.id,
        planId: s.planId,
        rateLimit: s.plan.rateLimit,
        requestLimit: s.plan.requestLimit,
        requestsUsed: s.requestsUsed,
        apiProductId: s.plan.apiProductId,
        apiSlug: s.plan.apiProduct.slug,
        basePath: s.plan.apiProduct.basePath,
        baseUrl: s.plan.apiProduct.baseUrl,
        overagePrice: s.plan.overagePrice,
      })),
    };

    // Cache for 60 seconds
    await redis.setex(cacheKey, 60, JSON.stringify(keyData));

    // Update last used
    await prisma.apiKey.update({
      where: { id: dbKey.id },
      data: { lastUsedAt: new Date() },
    });
  }

  // Match request path to a subscription
  const requestPath = req.path;
  const subscription = keyData.subscriptions.find((s: any) =>
    requestPath.startsWith(s.basePath)
  );

  if (!subscription) {
    return res.status(403).json({
      error: { message: 'No active subscription for this API', code: 'NO_SUBSCRIPTION' },
    });
  }

  // Rate limiting (sliding window in Redis)
  const rateLimitKey = `ratelimit:${keyData.userId}:${subscription.apiProductId}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  const multi = redis.multi();
  multi.zremrangebyscore(rateLimitKey, 0, now - windowMs);
  multi.zadd(rateLimitKey, now, `${now}:${Math.random()}`);
  multi.zcard(rateLimitKey);
  multi.expire(rateLimitKey, 120);
  const results = await multi.exec();

  const requestCount = results?.[2]?.[1] as number || 0;

  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': String(subscription.rateLimit),
    'X-RateLimit-Remaining': String(Math.max(0, subscription.rateLimit - requestCount)),
    'X-RateLimit-Reset': String(Math.ceil((now + windowMs) / 1000)),
  });

  if (requestCount > subscription.rateLimit) {
    return res.status(429).json({
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60,
      },
    });
  }

  // Check monthly quota
  if (subscription.requestLimit !== -1 && subscription.requestsUsed >= subscription.requestLimit) {
    if (!subscription.overagePrice) {
      return res.status(429).json({
        error: {
          message: 'Monthly request quota exceeded',
          code: 'QUOTA_EXCEEDED',
        },
      });
    }
    // Allow overage but flag it
    (req as any).isOverage = true;
  }

  // Attach metadata for usage logging
  (req as any).gatewayMeta = {
    userId: keyData.userId,
    apiKeyId: keyData.keyId,
    subscriptionId: subscription.id,
    apiProductId: subscription.apiProductId,
    targetUrl: subscription.baseUrl,
    basePath: subscription.basePath,
  };

  next();
}
