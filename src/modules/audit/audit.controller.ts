import { Request, Response } from 'express';
import { getAuditLogs, verifyAuditChain } from './audit.service';
import { successResponse, errorResponse } from '../../utils/response';

// GET /audit
export const getAuditLogsController = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return errorResponse(res, 'UNAUTHORIZED', 'Tenant not found', 401);
    }

    const { userId, action, resourceType, startDate, endDate, cursor, limit } = req.query;

    const result = await getAuditLogs({
      tenantId,
      userId: userId as string,
      action: action as string,
      resourceType: resourceType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      cursor: cursor as string,
      limit: limit ? parseInt(limit as string) : 10,
    });

    return successResponse(res, result);

  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
  }
};

// GET /audit/verify
export const verifyAuditChainController = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return errorResponse(res, 'UNAUTHORIZED', 'Tenant not found', 401);
    }

    const result = await verifyAuditChain(tenantId);

    return successResponse(res, result);

  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
  }
};