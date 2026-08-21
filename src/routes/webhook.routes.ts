import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { pancakeAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/webhooks/pancake
router.post('/pancake', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);

export default router;
