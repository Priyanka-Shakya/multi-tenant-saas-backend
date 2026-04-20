import { Request, Response } from 'express';
import { createApiKey } from './apiKey.service';
import { successResponse, errorResponse } from '../../utils/response';

// POST /api-keys
export const createApiKeyController = async (req: Request, res: Response) => {
  try {
    // tenantId ab req.tenant se aayega
    const tenantId = req.tenant?.id;
    const { userId } = req.body;

    if (!tenantId || !userId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'userId is required', 400);
    }

    const apiKey = await createApiKey(tenantId, userId);

    return successResponse(res, {
      id: apiKey.id,
      rawKey: apiKey.rawKey,
      tenantId: apiKey.tenantId,
      createdAt: apiKey.createdAt,
      message: 'Save this key — it will never be shown again!'
    }, 201);

  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
  }
};