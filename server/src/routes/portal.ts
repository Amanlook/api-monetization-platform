import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import { asyncHandler, validate, AppError } from '../lib/errors';
import { authenticate } from '../middleware/auth';
import { getDeveloperAnalytics } from '../services/analytics';
import { getUserBillingSummary } from '../services/billing';

const router = Router();

// ─── Public: Browse APIs ────────────────────────────────────

// GET /api/portal/apis - List all active APIs
router.get(
  '/apis',
  asyncHandler(async (req: Request, res: Response) => {
    const tag = req.query.tag as string;
    const search = req.query.search as string;

    const where: any = { status: 'ACTIVE' };
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const apis = await prisma.apiProduct.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        version: true,
        tags: true,
        logoUrl: true,
        plans: {
          where: { isActive: true },
          select: { id: true, name: true, price: true, requestLimit: true, rateLimit: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ apis });
  })
);

// GET /api/portal/apis/:slug - API details + docs
router.get(
  '/apis/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const api = await prisma.apiProduct.findUnique({
      where: { slug: req.params.slug },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        endpoints: {
          where: { isPublic: true },
          orderBy: { path: 'asc' },
        },
      },
    });

    if (!api || api.status === 'RETIRED') {
      throw new AppError(404, 'API not found');
    }

    res.json({ api });
  })
);

// ─── Authenticated Routes ───────────────────────────────────

router.use(authenticate);

// ─── API Key Management ─────────────────────────────────────

// GET /api/portal/keys
router.get(
  '/keys',
  asyncHandler(async (req: Request, res: Response) => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.userId },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ keys });
  })
);

// POST /api/portal/keys - Generate a new API key
router.post(
  '/keys',
  validate(z.object({ name: z.string().min(1).max(100).optional() })),
  asyncHandler(async (req: Request, res: Response) => {
    // Generate a secure API key
    const rawKey = `amp_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 8);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: req.user!.userId,
        keyHash,
        keyPrefix,
        name: req.body.name || 'Default',
      },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        createdAt: true,
      },
    });

    // Return the raw key only once - it can't be retrieved later
    res.status(201).json({
      key: {
        ...apiKey,
        rawKey, // Only shown once!
      },
      warning: 'Save this API key now. It cannot be retrieved later.',
    });
  })
);

// DELETE /api/portal/keys/:id
router.delete(
  '/keys/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const key = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!key) throw new AppError(404, 'API key not found');

    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    // Invalidate cache
    await redis.del(`apikey:${key.keyPrefix}`);

    res.json({ success: true });
  })
);

// ─── Subscriptions ──────────────────────────────────────────

// GET /api/portal/subscriptions
router.get(
  '/subscriptions',
  asyncHandler(async (req: Request, res: Response) => {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user!.userId },
      include: {
        plan: {
          include: {
            apiProduct: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ subscriptions: subs });
  })
);

// POST /api/portal/subscriptions - Subscribe to a plan
router.post(
  '/subscriptions',
  validate(z.object({ planId: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { planId } = req.body;
    const userId = req.user!.userId;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { apiProduct: true },
    });

    if (!plan || !plan.isActive) {
      throw new AppError(404, 'Plan not found or inactive');
    }

    // Check for existing subscription to this plan's API
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        plan: { apiProductId: plan.apiProductId },
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
    });

    if (existing) {
      throw new AppError(409, 'Already subscribed to this API. Upgrade your plan instead.');
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: plan.planType === 'FREE' ? 'ACTIVE' : 'ACTIVE',
        currentPeriodEnd: periodEnd,
      },
      include: {
        plan: {
          include: { apiProduct: { select: { name: true, slug: true } } },
        },
      },
    });

    res.status(201).json({ subscription });
  })
);

// DELETE /api/portal/subscriptions/:id - Cancel subscription
router.delete(
  '/subscriptions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const sub = await prisma.subscription.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!sub) throw new AppError(404, 'Subscription not found');

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    res.json({ success: true, message: 'Subscription cancelled' });
  })
);

// ─── Usage & Analytics ──────────────────────────────────────

// GET /api/portal/usage
router.get(
  '/usage',
  asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);
    const analytics = await getDeveloperAnalytics(req.user!.userId, days);
    res.json(analytics);
  })
);

// ─── Billing ────────────────────────────────────────────────

// GET /api/portal/billing
router.get(
  '/billing',
  asyncHandler(async (req: Request, res: Response) => {
    const billing = await getUserBillingSummary(req.user!.userId);
    res.json(billing);
  })
);

// ─── Webhooks ───────────────────────────────────────────────

router.get(
  '/webhooks',
  asyncHandler(async (req: Request, res: Response) => {
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { userId: req.user!.userId },
    });
    res.json({ webhooks });
  })
);

router.post(
  '/webhooks',
  validate(
    z.object({
      url: z.string().url(),
      events: z.array(z.string()).min(1),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const webhook = await prisma.webhookEndpoint.create({
      data: {
        userId: req.user!.userId,
        url: req.body.url,
        events: req.body.events,
        secret,
      },
    });
    res.status(201).json({ webhook });
  })
);

router.delete(
  '/webhooks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.webhookEndpoint.deleteMany({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    res.json({ success: true });
  })
);

export default router;
