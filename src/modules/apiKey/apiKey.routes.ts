import { Router } from 'express';
import { createApiKeyController } from './apiKey.controller';
import { requireRole } from '../../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// POST /api-keys - Sirf OWNER API key bana sakta hai
router.post('/', requireRole([Role.OWNER]), createApiKeyController);

export default router;