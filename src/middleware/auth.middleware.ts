import { Request, Response, NextFunction } from 'express';
import { verifyApiKey } from '../modules/apiKey/apiKey.service';
import { errorResponse } from '../utils/response';
import { Tenant } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    tenant?: Tenant;
    apiKey?: string;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawKey = req.headers['x-api-key'] as string;

    if (!rawKey) {
      return errorResponse(res, 'UNAUTHORIZED', 'API key is required', 401);
    }

    const apiKey = await verifyApiKey(rawKey);

    if (!apiKey) {
      return errorResponse(res, 'UNAUTHORIZED', 'Invalid or expired API key', 401);
    }

    req.tenant = apiKey.tenant;
    req.apiKey = rawKey;

    next();
  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
  }
};