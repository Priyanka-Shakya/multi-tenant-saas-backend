import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

// GET /health
router.get('/', healthController);

export default router;