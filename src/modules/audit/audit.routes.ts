import { Router } from 'express';
import { getAuditLogsController, verifyAuditChainController } from './audit.controller';

const router = Router();

// GET /audit - Audit logs lao with filters
router.get('/', getAuditLogsController);

// GET /audit/verify - Chain verify karo
router.get('/verify', verifyAuditChainController);

export default router;