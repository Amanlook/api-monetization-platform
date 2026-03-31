import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AppError, asyncHandler, validate } from '../lib/errors';
import { generateToken, authenticate } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  company: z.string().max(255).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, company } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, company },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
      },
      token,
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({ user });
  })
);

export default router;
