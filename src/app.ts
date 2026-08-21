import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import webhookRoutes from './routes/webhook.routes';
import customerRoutes from './routes/customer.routes';
import healthRoutes from './routes/health.routes';
import { requestLoggerMiddleware } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { AuthenticatedWebhookRequest } from './middleware/auth.middleware';

export function createApp(): Application {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow CDN scripts (Tailwind, Lucide, Chart.js)
    })
  );
  app.use(cors());

  // Body Parsing with Raw Buffer Retention for HMAC Verification
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: AuthenticatedWebhookRequest, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request Logging
  app.use(requestLoggerMiddleware);

  // Serve Static Frontend Assets (Web Dashboard)
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));

  // REST API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/customers', customerRoutes);

  // Single Page App Fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) {
        // Fallback for root API info if static folder is not present
        res.json({
          name: 'Pancake Customer Data Extraction & Management API',
          status: 'running',
          endpoints: {
            webhook: 'POST /api/webhooks/pancake',
            customers: 'GET /api/customers',
            stats: 'GET /api/customers/stats',
            health: 'GET /api/health',
          },
        });
      }
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
