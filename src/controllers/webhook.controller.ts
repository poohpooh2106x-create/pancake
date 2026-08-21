import { Request, Response } from 'express';
import { PancakeWebhookPayload } from '../types/pancake.types';
import { PancakeParserService } from '../services/pancake-parser.service';
import { CustomerService } from '../services/customer.service';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export class WebhookController {
  /**
   * Handle Inbound Webhooks from Pancake POS / Pancake Chat
   * URL: POST /api/webhooks/pancake
   */
  public static async handlePancakeWebhook(req: Request, res: Response) {
    const startTime = Date.now();
    const payload = req.body as PancakeWebhookPayload;

    const eventType = payload.event || payload.type || 'unknown_event';
    const pageId = String(payload.page_id || payload.data?.page_id || '');

    // 1. Immediately Acknowledge Webhook receipt with HTTP 200 to prevent Pancake timeout/retries
    res.status(200).json({
      success: true,
      message: 'Webhook acknowledged',
      received_at: new Date().toISOString(),
    });

    // 2. Asynchronous Event Processing in background
    setImmediate(async () => {
      let status = 'SUCCESS';
      let errorMessage: string | null = null;

      try {
        logger.info(
          { eventType, pageId, payloadKeys: Object.keys(payload) },
          'Processing inbound Pancake webhook'
        );

        // Parse customer & phone details
        const parsedData = PancakeParserService.parseWebhookPayload(payload);

        if (!parsedData) {
          status = 'SKIPPED';
          logger.warn({ eventType }, 'Webhook payload contained no actionable customer info');
        } else {
          // Persist to database & trigger Google Sheets sync
          const customer = await CustomerService.processAndSaveCustomer(parsedData);
          logger.info(
            {
              customerId: customer.pancakeCustomerId,
              primaryPhone: customer.primaryPhone,
              totalPhones: customer.phones?.length,
              platform: customer.platform,
            },
            'Successfully extracted & synced customer data from webhook'
          );
        }
      } catch (error: any) {
        status = 'FAILED';
        errorMessage = error.message;
        logger.error(
          { error: error.message, stack: error.stack, eventType },
          'Error processing Pancake webhook in background'
        );
      } finally {
        // Record Webhook Event Audit Log
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
    });
  }
}
