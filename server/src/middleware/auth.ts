import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid authorization header', 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token', 'TOKEN_INVALID');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated', 'UNAUTHORIZED');
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    next();
  };
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}
