import { Request, Response, NextFunction } from 'express';
import { checkGlobalLimit, checkEndpointLimit, checkBurstLimit } from './rateLimit.service';
import { errorResponse } from '../../utils/response';

export const rateLimitMiddleware = (endpointLimit: number = 100) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.id;
      const apiKey = req.apiKey;

      if (!tenantId || !apiKey) {
        return next();
      }

      const endpoint = `${req.method}:${req.route?.path || req.path}`;

      // Teen tiers check karo
      const [global, endpoint_, burst] = await Promise.all([
        checkGlobalLimit(tenantId),
        checkEndpointLimit(tenantId, endpoint, endpointLimit),
        checkBurstLimit(apiKey),
      ]);

      // Headers set karo har response pe
      res.setHeader('X-RateLimit-Limit', global.limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, global.limit - global.current));
      res.setHeader('X-RateLimit-Reset', global.resetInSeconds);

      // Check karo kaunsa tier hit hua
      if (!global.allowed) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Global rate limit exceeded',
            details: {
              tier: 'global',
              limit: global.limit,
              current: global.current,
              resetInSeconds: global.resetInSeconds,
            },
          },
        });
      }

      if (!endpoint_.allowed) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Endpoint rate limit exceeded',
            details: {
              tier: 'endpoint',
              limit: endpoint_.limit,
              current: endpoint_.current,
              resetInSeconds: endpoint_.resetInSeconds,
            },
          },
        });
      }

      if (!burst.allowed) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Burst rate limit exceeded',
            details: {
              tier: 'burst',
              limit: burst.limit,
              current: burst.current,
              resetInSeconds: burst.resetInSeconds,
            },
          },
        });
      }

      next();
    } catch (error) {
      // Rate limit fail hone pe request allow karo
      next();
    }
  };
};