import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/response';
import db from '../../config/db';
import redis from '../../config/redis';
import { emailQueue } from '../email/email.queue';

export const healthController = async (req: Request, res: Response) => {
  try {
    // Database check
    let dbStatus = 'healthy';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    // Redis check
    let redisStatus = 'healthy';
    try {
      await redis.ping();
    } catch {
      redisStatus = 'unhealthy';
    }

    // Queue depth check
    let queueDepth = { pending: 0, failed: 0 };
    try {
      const waiting = await emailQueue.getWaitingCount();
      const failed = await emailQueue.getFailedCount();
      queueDepth = { pending: waiting, failed };
    } catch {
      queueDepth = { pending: -1, failed: -1 };
    }

    return successResponse(res, {
      status: 'healthy',
      database: dbStatus,
      redis: redisStatus,
      queue: queueDepth,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Health check failed', 500, error);
  }
};