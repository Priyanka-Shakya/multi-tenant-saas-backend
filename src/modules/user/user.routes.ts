import { Router } from 'express';
import { createUserController, getUsersController } from './user.controller';
import { requireRole } from '../../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// GET /users - OWNER aur MEMBER dono dekh sakte hain
router.get('/', getUsersController);

// POST /users - Sirf OWNER user bana sakta hai
router.post('/', requireRole([Role.OWNER]), createUserController);

export default router;