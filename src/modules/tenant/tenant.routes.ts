import { Router } from 'express';
import { createTenantController, getAllTenantsController } from './tenant.controller';

const router = Router();

// POST /tenants - Naya tenant banao
router.post('/', createTenantController);

// GET /tenants - Saare tenants lao
router.get('/', getAllTenantsController);

export default router;