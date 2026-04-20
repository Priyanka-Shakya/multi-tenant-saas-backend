import { Request, Response } from 'express';
import { createTenant, getAllTenants } from './tenant.service';
import { successResponse, errorResponse } from '../../utils/response';

// POST /tenants
export const createTenantController = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Name is required', 400);
    }

    const tenant = await createTenant(name);
    return successResponse(res, tenant, 201);

  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
  }
};

// GET /tenants
export const getAllTenantsController = async (req: Request, res: Response) => {
  try {
    const tenants = await getAllTenants();
    return successResponse(res, tenants);

  } catch (error) {
    return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
  }
};