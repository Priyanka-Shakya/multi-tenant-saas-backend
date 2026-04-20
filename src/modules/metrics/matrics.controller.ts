import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/response';
import db from '../../config/db';

export const metricsController = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string;

    if (!tenantId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'tenantId is required', 400);
    }

    // Current billing period — current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Total audit logs (requests) count
    const totalRequests = await db.auditLog.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    });

    // Requests by action type
    const requestsByAction = await db.auditLog.groupBy({
      by: ['action'],
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
      _count: { action: true },
    });

    // Email delivery stats
    const totalEmails = await db.emailLog.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    });

    const sentEmails = await db.emailLog.count({
      where: {
        tenantId,
        status: 'sent',
        createdAt: { gte: startOfMonth },
      },
    });

    const emailSuccessRate = totalEmails > 0
      ? ((sentEmails / totalEmails) * 100).toFixed(2)
      : '0.00';

    return successResponse(res, {
      tenantId,
      billingPeriod: {
        start: startOfMonth.toISOString(),
        end: new Date().toISOString(),
      },
      totalRequests,
      requestsByAction: requestsByAction.map((r) => ({
        action: r.action,
        count: r._count.action,
      })),
      email: {
        total: totalEmails,
        sent: sentEmails,
        successRate: `${emailSuccessRate}%`,
      },
    });

  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
  }
};