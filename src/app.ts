import express from 'express';
import tenantRoutes from './modules/tenant/tenant.routes';
import userRoutes from './modules/user/user.routes';
import apiKeyRoutes from './modules/apiKey/apiKey.routes';
import auditRoutes from './modules/audit/audit.routes';
import healthRoutes from './modules/health/health.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './modules/rateLimit/rateLimit.middleware';
import { internalMiddleware } from './middleware/internal.middleware';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// Public routes
app.use('/tenants', tenantRoutes);

// Protected routes
app.use('/api-keys', authMiddleware, rateLimitMiddleware(50), apiKeyRoutes);
app.use('/users', authMiddleware, rateLimitMiddleware(100), userRoutes);
app.use('/audit', authMiddleware, rateLimitMiddleware(100), auditRoutes);

// Internal routes
app.use('/health', internalMiddleware, healthRoutes);
app.use('/metrics', internalMiddleware, metricsRoutes);

export default app;



