import { Request, Response } from 'express';
import { PancakeWebhookPayload } from '../types/pancake.types';
import { PancakeParserService } from '../services/pancake-parser.service';
import { CustomerService } from '../services/customer.service';
import { prisma, ensureDatabaseSchema } from '../db/prisma';
import { logger } from '../utils/logger';

export class WebhookController {
  /**
   * Handle Inbound Webhooks from Pancake POS / Pancake Chat
   * URL: POST /api/webhooks/pancake
   */
  public static async handlePancakeWebhook(req: Request, res: Response) {
    await ensureDatabaseSchema();
    const startTime = Date.now();
    const payload = req.body as PancakeWebhookPayload;

    const eventType = payload.event || payload.type || 'pancake_event';
    const pageId = String(payload.page_id || payload.data?.page_id || '');

    let status = 'SUCCESS';
    let errorMessage: string | null = null;
    let customer: any = null;

    try {
      logger.info(
        { eventType, pageId, payloadKeys: Object.keys(payload || {}) },
        'Processing inbound Pancake webhook'
      );

      // 1. Parse customer & phone details
      const parsedData = PancakeParserService.parseWebhookPayload(payload);

      if (!parsedData) {
        status = 'SKIPPED';
        logger.warn({ eventType }, 'Webhook payload contained no actionable customer info');
      } else {
        // 2. Persist to database & trigger Google Sheets sync
        customer = await CustomerService.processAndSaveCustomer(parsedData);
        if (customer) {
          logger.info(
            {
              customerId: customer.pancakeCustomerId,
              primaryPhone: customer.primaryPhone,
              platform: customer.platform,
            },
            'Successfully extracted & synced customer data from webhook'
          );
        }
      }
    } catch (error: any) {
      status = 'FAILED';
      errorMessage = error.message;
      logger.error(
        { error: error.message, stack: error.stack, eventType },
        'Error processing Pancake webhook'
      );
    } finally {
      // 3. Record Webhook Event Audit Log
      const processingTimeMs = Date.now() - startTime;
      try {
        await prisma.webhookEventLog.create({
          data: {
            eventType,
            pageId: pageId || null,
            payload: JSON.stringify(payload),
            status,
            errorMessage,
            processingTimeMs,
          },
        });
      } catch (dbErr: any) {
        logger.error({ error: dbErr.message }, 'Failed to record webhook event log to database');
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      customerId: customer?.pancakeCustomerId || null,
      received_at: new Date().toISOString(),
    });
  }
}
