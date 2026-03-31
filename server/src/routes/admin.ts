import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { asyncHandler, validate, AppError } from '../lib/errors';
import { authenticate, requireRole } from '../middleware/auth';
import { getApiAnalytics } from '../services/analytics';

const router = Router();
router.use(authenticate);
router.use(requireRole('ADMIN'));

// ─── API Products CRUD ──────────────────────────────────────

const createApiSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  baseUrl: z.string().url(),
  basePath: z.string().startsWith('/'),
  version: z.string().optional(),
  documentation: z.string().optional(),
  openApiSpec: z.any().optional(),
  tags: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional(),
});

// GET /api/admin/apis
router.get(
  '/apis',
  asyncHandler(async (_req: Request, res: Response) => {
    const apis = await prisma.apiProduct.findMany({
      include: {
        _count: { select: { plans: true, usageLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ apis });
  })
);

// POST /api/admin/apis
router.post(
  '/apis',
  validate(createApiSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const api = await prisma.apiProduct.create({ data: req.body });
    res.status(201).json({ api });
  })
);

// GET /api/admin/apis/:id
router.get(
  '/apis/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const api = await prisma.apiProduct.findUnique({
      where: { id: req.params.id },
      include: { plans: true, endpoints: true },
    });
    if (!api) throw new AppError(404, 'API not found');
    res.json({ api });
  })
);

// PUT /api/admin/apis/:id
router.put(
  '/apis/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const api = await prisma.apiProduct.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ api });
  })
);

// DELETE /api/admin/apis/:id
router.delete(
  '/apis/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.apiProduct.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// ─── Plans CRUD ─────────────────────────────────────────────

const createPlanSchema = z.object({
  apiProductId: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  planType: z.enum(['FREE', 'TIERED', 'PAY_AS_YOU_GO', 'ENTERPRISE']).optional(),
  price: z.number().min(0),
  yearlyPrice: z.number().min(0).optional(),
  requestLimit: z.number().int(),
  rateLimit: z.number().int().min(1),
  burstLimit: z.number().int().optional(),
  overagePrice: z.number().min(0).optional(),
  features: z.any().optional(),
  sortOrder: z.number().int().optional(),
});

// GET /api/admin/plans
router.get(
  '/plans',
  asyncHandler(async (req: Request, res: Response) => {
    const where = req.query.apiId ? { apiProductId: req.query.apiId as string } : {};
    const plans = await prisma.plan.findMany({
      where,
      include: {
        apiProduct: { select: { name: true, slug: true } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ plans });
  })
);

// POST /api/admin/plans
router.post(
  '/plans',
  validate(createPlanSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await prisma.plan.create({ data: req.body });
    res.status(201).json({ plan });
  })
);

// PUT /api/admin/plans/:id
router.put(
  '/plans/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ plan });
  })
);

// DELETE /api/admin/plans/:id
router.delete(
  '/plans/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.plan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// ─── Endpoints CRUD ─────────────────────────────────────────

router.post(
  '/apis/:apiId/endpoints',
  asyncHandler(async (req: Request, res: Response) => {
    const endpoint = await prisma.apiEndpoint.create({
      data: { apiProductId: req.params.apiId, ...req.body },
    });
    res.status(201).json({ endpoint });
  })
);

router.delete(
  '/endpoints/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.apiEndpoint.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

// ─── Analytics ──────────────────────────────────────────────

router.get(
  '/analytics/:apiId',
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const analytics = await getApiAnalytics(req.params.apiId, Math.min(days, 90));
    res.json(analytics);
  })
);

// ─── Users Management ───────────────────────────────────────

router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { subscriptions: true, apiKeys: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  })
);

// ─── Dashboard Stats ────────────────────────────────────────

router.get(
  '/dashboard',
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalUsers,
      totalApis,
      totalSubscriptions,
      totalRevenue,
      recentSignups,
      recentLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'DEVELOPER' } }),
      prisma.apiProduct.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.user.findMany({
        where: { role: 'DEVELOPER' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.usageLog.count({
        where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalApis,
        totalSubscriptions,
        totalRevenue: totalRevenue._sum.amount || 0,
        requestsLast24h: recentLogs,
      },
      recentSignups,
    });
  })
);

// ─── Invoices ───────────────────────────────────────────────

router.get(
  '/invoices',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;

    const where = status ? { status: status as any } : {};

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  })
);

export default router;
