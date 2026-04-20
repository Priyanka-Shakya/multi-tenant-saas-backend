import { Router } from 'express';
import { metricsController } from './matrics.controller';

const router = Router();

// GET /metrics
router.get('/', metricsController);

export default router;