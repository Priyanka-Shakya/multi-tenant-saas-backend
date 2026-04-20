import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { Role, User } from '@prisma/client';
import db from '../config/db';
import { compareValue } from '../utils/hash';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export const requireRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.id;
      const rawKey = req.apiKey;

      if (!tenantId || !rawKey) {
        return errorResponse(res, 'UNAUTHORIZED', 'Unauthorized', 401);
      }

      // Saari active keys lao
      const apiKeys = await db.apiKey.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        include: {
          user: true,
        },
      });

      // Raw key se match karo
      let matchedUser = null;
      for (const apiKey of apiKeys) {
        const isMatch = await compareValue(rawKey, apiKey.keyHash);
        if (isMatch) {
          matchedUser = apiKey.user;
          break;
        }
      }

      if (!matchedUser) {
        return errorResponse(res, 'UNAUTHORIZED', 'API key not found', 401);
      }

      // Role check karo
      if (!allowedRoles.includes(matchedUser.role)) {
        return errorResponse(
          res,
          'FORBIDDEN',
          'You do not have permission to perform this action',
          403
        );
      }

      req.user = matchedUser;
      next();

    } catch (error) {
      return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
    }
  };
};