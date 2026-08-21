import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../src/app';
import { env } from '../src/config/env';

describe('Webhook & Health Endpoints', () => {
  const app = createApp();

  describe('GET /api/health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/webhooks/pancake', () => {
    const payload = {
      event: 'new_message',
      page_id: '123456789',
      platform: 'facebook',
      customer: {
        id: 'cust_999888',
        name: 'Somchai Jaidee',
        phone_number: '081-234-5678',
      },
      message: {
        id: 'msg_001',
        text: 'สนใจสั่งของครับ เบอร์ติดต่อ 089-999-8888',
      },
    };

    it('should reject webhook request without authentication with 401', async () => {
      if (!env.PANCAKE_WEBHOOK_SECRET) return;

      const res = await request(app)
        .post('/api/webhooks/pancake')
        .send(payload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should acknowledge incoming webhook with valid secret query parameter', async () => {
      const url = env.PANCAKE_WEBHOOK_SECRET
        ? `/api/webhooks/pancake?secret=${env.PANCAKE_WEBHOOK_SECRET}`
        : '/api/webhooks/pancake';

      const res = await request(app)
        .post(url)
        .send(payload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Webhook acknowledged');
    });

    it('should acknowledge incoming webhook with valid HMAC signature header', async () => {
      const secret = env.PANCAKE_WEBHOOK_SECRET || 'local_secret';
      const rawBody = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const res = await request(app)
        .post('/api/webhooks/pancake')
        .send(payload)
        .set('Content-Type', 'application/json')
        .set('x-pancake-signature', signature);

      if (env.PANCAKE_WEBHOOK_SECRET) {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });
});
