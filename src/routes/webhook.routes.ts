import { Router, Request, Response } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { pancakeAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/webhooks/pancake - Webhook Verification Challenge & Health Check for Pancake
router.get('/pancake', (req: Request, res: Response) => {
  const challenge = req.query['hub.challenge'] || req.query.challenge;
  if (challenge) {
    return res.status(200).send(challenge);
  }
  res.status(200).json({
    status: 'active',
    message: 'Pancake Webhook Endpoint is Live & Ready',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/webhooks/pancake - Inbound Webhook Event Listener
router.post('/pancake', pancakeAuthMiddleware, WebhookController.handlePancakeWebhook);

export default router;
