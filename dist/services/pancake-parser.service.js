"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PancakeParserService = void 0;
const phone_extractor_util_1 = require("../utils/phone-extractor.util");
const vehicle_extractor_util_1 = require("../utils/vehicle-extractor.util");
const logger_1 = require("../utils/logger");
class PancakeParserService {
    /**
     * Determine communication platform / channel source
     */
    static detectPlatform(payload) {
        const rawPlatform = String(payload.platform ||
            payload.data?.platform ||
            payload.channel ||
            payload.data?.channel ||
            payload.source ||
            '').toUpperCase();
        if (rawPlatform.includes('LINE'))
            return 'LINE';
        if (rawPlatform.includes('TIKTOK'))
            return 'WEB';
        if (rawPlatform.includes('FB') || rawPlatform.includes('FACEBOOK') || rawPlatform.includes('PAGE'))
            return 'FACEBOOK';
        if (rawPlatform.includes('IG') || rawPlatform.includes('INSTAGRAM'))
            return 'INSTAGRAM';
        if (rawPlatform.includes('WHATSAPP'))
            return 'WHATSAPP';
        if (rawPlatform.includes('WEB'))
            return 'WEB';
        return 'FACEBOOK';
    }
    /**
     * Determine human-readable Lead Source / Sheet Tab Name
     */
    static detectLeadSource(payload) {
        const pageName = String(payload.page_name ||
            payload.data?.page_name ||
            payload.shop_name ||
            payload.page?.name ||
            '').trim();
        if (pageName)
            return pageName;
        const platform = this.detectPlatform(payload);
        if (platform === 'LINE')
            return 'LOA เคพี';
        if (platform === 'FACEBOOK')
            return 'FB เคพีศรีราชา';
        return 'FB เคพีศรีราชา';
    }
    /**
     * Recursively extract all strings from any object to find phone numbers & vehicle interests
     */
    static extractAllStrings(obj, collected = []) {
        if (!obj)
            return collected;
        if (typeof obj === 'string') {
            collected.push(obj);
        }
        else if (typeof obj === 'number') {
            collected.push(String(obj));
        }
        else if (Array.isArray(obj)) {
            for (const item of obj) {
                this.extractAllStrings(item, collected);
            }
        }
        else if (typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                this.extractAllStrings(obj[key], collected);
            }
        }
        return collected;
    }
    /**
     * Parse inbound webhook payload and extract comprehensive customer and vehicle data
     */
    static parseWebhookPayload(payload) {
        try {
            if (!payload)
                return null;
            // Handle wrapper objects (e.g. { data: {...} } or { event: "...", data: {...} })
            const root = payload.data || payload;
            const platform = this.detectPlatform(payload);
            const leadSource = this.detectLeadSource(payload);
            // Extract raw sub-objects
            const rawCustomer = root.customer || payload.customer || {};
            const rawMessage = root.message || payload.message || {};
            const rawOrder = root.order || payload.order || {};
            const rawConversation = root.conversation || payload.conversation || {};
            const fields = root.fields || payload.fields || {};
            // Recursively search for phone numbers in the entire payload
            const allStrings = this.extractAllStrings(payload);
            const phoneSet = new Map();
            for (const str of allStrings) {
                const extracted = (0, phone_extractor_util_1.extractThaiPhoneNumbers)(str);
                for (const item of extracted) {
                    phoneSet.set(item.normalized, item);
                }
            }
            const extractedPhones = Array.from(phoneSet.values());
            const primaryPhone = extractedPhones.length > 0 ? extractedPhones[0].normalized : undefined;
            // Determine Pancake Customer ID
            let customerId = String(fields.id ||
                fields.PartnerRecordID ||
                rawCustomer.id ||
                rawCustomer.psid ||
                rawCustomer.customer_id ||
                rawMessage.from?.id ||
                rawMessage.sender_id ||
                rawConversation.customer_id ||
                rawOrder.customer_id ||
                rawOrder.customer?.id ||
                payload.customer_id ||
                root.id ||
                payload.id ||
                '').trim();
            // Fallback Customer ID if missing
            if (!customerId) {
                if (primaryPhone) {
                    customerId = `cust_${primaryPhone}`;
                }
                else {
                    customerId = `cust_pancake_${Date.now()}`;
                }
            }
            // Determine Page ID
            const pageId = String(payload.page_id ||
                root.page_id ||
                rawCustomer.page_id ||
                rawConversation.page_id ||
                'DEFAULT_PAGE').trim();
            // Customer Name
            const customerName = String(fields.NAME ||
                fields.name ||
                rawCustomer.name ||
                rawMessage.from?.name ||
                rawOrder.customer_name ||
                rawOrder.customer?.name ||
                rawOrder.shipping_address?.recipient_name ||
                root.customer_name ||
                root.buyer_name ||
                root.NAME ||
                root.name ||
                'ลูกค้าใหม่').trim();
            // Combine all message / text fields to extract vehicle interest
            const messageText = String(rawMessage.text ||
                rawMessage.message ||
                root.text ||
                root.message ||
                root.note ||
                rawCustomer.notes ||
                allStrings.join(' '));
            // Extract Interested Vehicle automatically from message text
            const interestedVehicle = (0, vehicle_extractor_util_1.extractInterestedVehicle)(messageText) || undefined;
            // Extract Date & Time formatted for Google Sheets (D/M/YYYY and HH:mm)
            const now = new Date();
            const eventDate = rawMessage.inserted_at || rawMessage.created_at || root.created_at
                ? new Date(rawMessage.inserted_at || rawMessage.created_at || root.created_at)
                : now;
            const receivedDate = `${eventDate.getDate()}/${eventDate.getMonth() + 1}/${eventDate.getFullYear()}`;
            const hours = String(eventDate.getHours()).padStart(2, '0');
            const minutes = String(eventDate.getMinutes()).padStart(2, '0');
            const receivedTime = `${hours}:${minutes}`;
            // Extract Tags
            const tags = [];
            const rawTags = rawCustomer.tags || rawConversation.tags || root.tags || [];
            if (Array.isArray(rawTags)) {
                for (const tag of rawTags) {
                    if (typeof tag === 'string') {
                        tags.push(tag.trim());
                    }
                    else if (tag && typeof tag.name === 'string') {
                        tags.push(tag.name.trim());
                    }
                }
            }
            // Message Object
            const isFromPage = rawMessage.sender_type === 'page' ||
                rawMessage.sender_type === 'user' ||
                rawMessage.from?.id === pageId;
            const parsedMessage = {
                messageId: rawMessage.message_id || rawMessage.id || `msg_${Date.now()}`,
                conversationId: rawConversation.id || rawMessage.conversation_id || `conv_${customerId}`,
                senderType: isFromPage ? 'ADMIN' : 'CUSTOMER',
                text: rawMessage.text || rawMessage.message || messageText.substring(0, 500),
                sentAt: eventDate,
            };
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
                assignedAdminName: undefined,
                assignedAdminId: undefined,
                tags,
                notes: rawCustomer.notes,
                lastContactAt: eventDate,
                rawMessage: parsedMessage,
            };
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, stack: error.stack }, 'Error in parseWebhookPayload');
            return null;
        }
    }
}
exports.PancakeParserService = PancakeParserService;
//# sourceMappingURL=pancake-parser.service.js.map