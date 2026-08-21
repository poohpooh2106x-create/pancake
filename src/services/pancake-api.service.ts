import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { PancakeParserService } from './pancake-parser.service';
import { CustomerService } from './customer.service';

export class PancakeApiService {
  private static client: AxiosInstance = axios.create({
    baseURL: env.PANCAKE_API_BASE_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Fetch conversations from Pancake API for a specific page
   */
  public static async fetchConversations(pageId: string, pageNumber: number = 1, pageSize: number = 50) {
    if (!env.PANCAKE_API_ACCESS_TOKEN) {
      logger.warn('Pancake API Access Token is not configured');
      return [];
    }

    try {
      const response = await this.client.get(`/pages/${pageId}/conversations`, {
        params: {
          access_token: env.PANCAKE_API_ACCESS_TOKEN,
          page_number: pageNumber,
          page_size: pageSize,
        },
      });

      return response.data?.conversations || response.data?.data || [];
    } catch (error: any) {
      logger.error({ error: error.message, pageId }, 'Failed to fetch conversations from Pancake API');
      return [];
    }
  }

  /**
   * Fetch historical messages for a specific conversation
   */
  public static async fetchMessages(pageId: string, conversationId: string) {
    if (!env.PANCAKE_API_ACCESS_TOKEN) return [];

    try {
      const response = await this.client.get(
        `/pages/${pageId}/conversations/${conversationId}/messages`,
        {
          params: {
            access_token: env.PANCAKE_API_ACCESS_TOKEN,
          },
        }
      );

      return response.data?.messages || response.data?.data || [];
    } catch (error: any) {
      logger.error({ error: error.message, conversationId }, 'Failed to fetch conversation messages');
      return [];
    }
  }

  /**
   * Polling routine: sync latest conversations for all configured pages
   */
  public static async syncPageConversations(pageId: string): Promise<number> {
    logger.info({ pageId }, 'Starting Pancake historical conversation polling sync...');

    const conversations = await this.fetchConversations(pageId, 1, 30);
    let processedCount = 0;

    for (const conv of conversations) {
      try {
        const payload = {
          event: 'conversation_updated',
          page_id: pageId,
          data: {
            conversation: conv,
            customer: conv.customer,
            message: conv.recent_message || conv.last_message,
          },
        };

        const parsed = PancakeParserService.parseWebhookPayload(payload);
        if (parsed) {
          await CustomerService.processAndSaveCustomer(parsed);
          processedCount++;
        }
      } catch (err: any) {
        logger.warn({ error: err.message, convId: conv.id }, 'Error processing historical conversation');
      }
    }

    logger.info({ pageId, processedCount }, 'Completed Pancake polling sync');
    return processedCount;
  }
}
