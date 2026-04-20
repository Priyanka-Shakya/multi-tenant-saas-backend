import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { errorResponse } from '../utils/response';

export const internalMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-internal-key'] as string;

  if (!apiKey) {
    return errorResponse(res, 'UNAUTHORIZED', 'Internal API key is required', 401);
  }

  if (apiKey !== env.INTERNAL_API_KEY) {
    return errorResponse(res, 'UNAUTHORIZED', 'Invalid internal API key', 401);
  }

  next();
};