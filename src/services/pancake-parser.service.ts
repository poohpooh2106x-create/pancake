import {
  PancakeWebhookPayload,
  PancakePlatform,
  PancakeCustomerPayload,
  PancakeMessagePayload,
  PancakeOrderPayload,
} from '../types/pancake.types';
import { ParsedCustomerData, ExtractedPhoneNumber } from '../types/customer.types';
import { extractThaiPhoneNumbers } from '../utils/phone-extractor.util';
import { extractInterestedVehicle } from '../utils/vehicle-extractor.util';
import { logger } from '../utils/logger';

export class PancakeParserService {
  /**
   * Determine communication platform / channel source
   */
  public static detectPlatform(payload: PancakeWebhookPayload): PancakePlatform {
    const rawPlatform = (
      payload.platform ||
      payload.data?.platform ||
      payload.channel ||
      payload.data?.channel ||
      ''
    ).toUpperCase();

    if (rawPlatform.includes('LINE')) return 'LINE';
    if (rawPlatform.includes('TIKTOK')) return 'WEB';
    if (rawPlatform.includes('FB') || rawPlatform.includes('FACEBOOK') || rawPlatform.includes('PAGE'))
      return 'FACEBOOK';
    if (rawPlatform.includes('IG') || rawPlatform.includes('INSTAGRAM')) return 'INSTAGRAM';
    if (rawPlatform.includes('WHATSAPP')) return 'WHATSAPP';
    if (rawPlatform.includes('WEB')) return 'WEB';

    return 'FACEBOOK';
  }

  /**
   * Determine human-readable Lead Source / Sheet Tab Name
   */
  public static detectLeadSource(payload: PancakeWebhookPayload): string {
    const pageName = (payload.page_name || payload.data?.page_name || '').trim();
    if (pageName) return pageName;

    const platform = this.detectPlatform(payload);
    if (platform === 'LINE') return 'LOA เคพี';
    if (platform === 'FACEBOOK') return 'FB เคพีศรีราชา';
    return 'FB เคพีศรีราชา';
  }

  /**
   * Parse inbound webhook payload and extract comprehensive customer and vehicle data
   */
  public static parseWebhookPayload(payload: PancakeWebhookPayload): ParsedCustomerData | null {
    try {
      const platform = this.detectPlatform(payload);
      const leadSource = this.detectLeadSource(payload);

      // Extract raw sub-objects
      const rawCustomer: PancakeCustomerPayload =
        payload.customer || payload.data?.customer || {};
      const rawMessage: PancakeMessagePayload =
        payload.message || payload.data?.message || {};
      const rawOrder: PancakeOrderPayload =
        payload.order || payload.data?.order || {};
      const rawConversation = payload.data?.conversation || {};

      // Determine Pancake Customer ID
      const customerId = String(
        rawCustomer.id ||
        rawCustomer.psid ||
        rawMessage.from?.id ||
        rawConversation.customer_id ||
        rawOrder.customer_id ||
        rawOrder.customer?.id ||
        ''
      ).trim();

      if (!customerId) {
        logger.warn({ payload }, 'Unable to resolve Customer ID from Pancake payload');
        return null;
      }

      // Determine Page ID
      const pageId = String(
        payload.page_id ||
        rawCustomer.page_id ||
        rawConversation.page_id ||
        payload.data?.page_id ||
        'DEFAULT_PAGE'
      ).trim();

      // Customer Name
      const customerName = String(
        rawCustomer.name ||
        rawMessage.from?.name ||
        rawOrder.customer_name ||
        rawOrder.customer?.name ||
        rawOrder.shipping_address?.recipient_name ||
        'ลูกค้าใหม่'
      ).trim();

      // Extracted Phone Numbers Collection
      const phoneSet = new Map<string, ExtractedPhoneNumber>();

      const addPhoneIfValid = (rawStr?: string) => {
        if (!rawStr) return;
        const extracted = extractThaiPhoneNumbers(rawStr);
        for (const item of extracted) {
          phoneSet.set(item.normalized, item);
        }
      };

      // 1. Check Customer phone properties
      if (rawCustomer.phone_number) addPhoneIfValid(rawCustomer.phone_number);
      if (Array.isArray(rawCustomer.phone_numbers)) {
        rawCustomer.phone_numbers.forEach(addPhoneIfValid);
      }

      // 2. Check Order phone properties
      if (rawOrder.customer_phone) addPhoneIfValid(rawOrder.customer_phone);
      if (rawOrder.shipping_address?.phone_number) {
        addPhoneIfValid(rawOrder.shipping_address.phone_number);
      }

      // 3. Scan Message Text for Phone Numbers & Vehicle Interests
      const messageText = rawMessage.text || rawMessage.message || '';
      if (messageText) {
        addPhoneIfValid(messageText);
      }

      // 4. Scan Notes
      if (rawCustomer.notes) {
        addPhoneIfValid(rawCustomer.notes);
      }

      const extractedPhones = Array.from(phoneSet.values());
      const primaryPhone = extractedPhones.length > 0 ? extractedPhones[0].normalized : undefined;

      // Extract Interested Vehicle automatically from message text
      const interestedVehicle =
        extractInterestedVehicle(messageText) ||
        extractInterestedVehicle(rawCustomer.notes) ||
        undefined;

      // Extract Date & Time formatted for Google Sheets (D/M/YYYY and HH:mm)
      const now = new Date();
      const eventDate = rawMessage.inserted_at || rawMessage.created_at
        ? new Date(rawMessage.inserted_at || rawMessage.created_at!)
        : now;

      const receivedDate = `${eventDate.getDate()}/${eventDate.getMonth() + 1}/${eventDate.getFullYear()}`;
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const minutes = String(eventDate.getMinutes()).padStart(2, '0');
      const receivedTime = `${hours}:${minutes}`;

      // Extract Tags
      const tags: string[] = [];
      const rawTags = rawCustomer.tags || rawConversation.tags || [];
      if (Array.isArray(rawTags)) {
        for (const tag of rawTags) {
          if (typeof tag === 'string') {
            tags.push(tag.trim());
          } else if (tag && typeof tag.name === 'string') {
            tags.push(tag.name.trim());
          }
        }
      }

      // Extract Assigned Staff
      let assignedAdminName: string | undefined;
      let assignedAdminId: string | undefined;
      const assignedUsers = rawConversation.assigned_users;
      if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
        assignedAdminName = assignedUsers[0].name;
        assignedAdminId = String(assignedUsers[0].id);
      }

      // Message Object
      let parsedMessage: ParsedCustomerData['rawMessage'] | undefined;
      if (messageText || rawMessage.id || rawMessage.message_id) {
        const isFromPage =
          rawMessage.sender_type === 'page' ||
          rawMessage.sender_type === 'user' ||
          rawMessage.from?.id === payload.page_id;

        parsedMessage = {
          messageId: rawMessage.message_id || rawMessage.id,
          conversationId: rawConversation.id || rawMessage.conversation_id || `conv_${customerId}`,
          senderType: isFromPage ? 'ADMIN' : 'CUSTOMER',
          text: messageText,
          sentAt: eventDate,
        };
      }

      return {
        pancakeCustomerId: customerId,
        pageId,
        platform,
        leadSource,
        name: customerName,
        avatarUrl: rawCustomer.avatar_url || rawMessage.from?.avatar_url,
        profileUrl: rawCustomer.profile_url,
        gender: rawCustomer.gender,
        phoneNumbers: extractedPhones,
        primaryPhone,
        interestedVehicle,
        receivedDate,
        receivedTime,
        assignedAdminName,
        assignedAdminId,
        tags,
        notes: rawCustomer.notes,
        lastContactAt: eventDate,
        rawMessage: parsedMessage,
      };
    } catch (error: any) {
      logger.error({ error: error.message, stack: error.stack }, 'Error in parseWebhookPayload');
      return null;
    }
  }
}
