"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const prisma_1 = require("../db/prisma");
const logger_1 = require("../utils/logger");
const google_sheets_service_1 = require("./google-sheets.service");
class CustomerService {
    /**
     * Process parsed customer data:
     * STRICT PHONE RULE: Only create/update CRM lead once a valid phone number is detected!
     */
    static async processAndSaveCustomer(data) {
        await (0, prisma_1.ensureDatabaseSchema)();
        const { pancakeCustomerId, pageId, platform, leadSource, name, avatarUrl, profileUrl, gender, phoneNumbers, primaryPhone, interestedVehicle, assignedSales, receivedDate, receivedTime, assignedAdminName, assignedAdminId, tags, notes, lastContactAt, rawMessage, orderData, } = data;
        try {
            // 1. Find existing customer in database
            const existingCustomer = await prisma_1.prisma.customer.findUnique({
                where: { pancakeCustomerId },
                include: { phones: true },
            });
            // If customer has NO phone number in this payload AND does NOT have a phone in database:
            // Skip creating a CRM lead (do not count or display until customer provides a phone number!)
            if (phoneNumbers.length === 0 && !existingCustomer?.primaryPhone) {
                logger_1.logger.info({ pancakeCustomerId, customerName: name }, 'No phone number detected yet. Skipping lead creation until customer provides phone number.');
                return null;
            }
            let customerId;
            const jsonTags = JSON.stringify(tags);
            if (existingCustomer) {
                customerId = existingCustomer.id;
                // Merge tags
                let existingTagList = [];
                try {
                    existingTagList = JSON.parse(existingCustomer.tags || '[]');
                }
                catch {
                    existingTagList = [];
                }
                const mergedTags = Array.from(new Set([...existingTagList, ...tags]));
                // Determine updated primary phone & vehicle interest
                let updatedPrimaryPhone = existingCustomer.primaryPhone;
                if (!updatedPrimaryPhone && primaryPhone) {
                    updatedPrimaryPhone = primaryPhone;
                }
                const updatedVehicle = interestedVehicle || existingCustomer.interestedVehicle;
                const updatedSales = assignedSales || existingCustomer.assignedSales;
                // Update customer
                await prisma_1.prisma.customer.update({
                    where: { id: customerId },
                    data: {
                        name: name !== 'ลูกค้าใหม่' ? name : existingCustomer.name,
                        avatarUrl: avatarUrl || existingCustomer.avatarUrl,
                        profileUrl: profileUrl || existingCustomer.profileUrl,
                        gender: gender || existingCustomer.gender,
                        primaryPhone: updatedPrimaryPhone,
                        interestedVehicle: updatedVehicle,
                        assignedSales: updatedSales,
                        leadSource: leadSource || existingCustomer.leadSource,
                        assignedAdminName: assignedAdminName || existingCustomer.assignedAdminName,
                        assignedAdminId: assignedAdminId || existingCustomer.assignedAdminId,
                        tags: JSON.stringify(mergedTags),
                        notes: notes ? (existingCustomer.notes ? `${existingCustomer.notes}\n${notes}` : notes) : existingCustomer.notes,
                        lastContactAt: lastContactAt > existingCustomer.lastContactAt ? lastContactAt : existingCustomer.lastContactAt,
                        totalMessages: rawMessage ? { increment: 1 } : undefined,
                        totalOrders: orderData ? { increment: 1 } : undefined,
                        totalSpent: orderData ? { increment: orderData.totalAmount } : undefined,
                    },
                });
            }
            else {
                // Create new customer lead ONLY because they provided a phone number!
                const newCustomer = await prisma_1.prisma.customer.create({
                    data: {
                        pancakeCustomerId,
                        pageId,
                        platform,
                        leadSource: leadSource || 'FB เคพีศรีราชา',
                        name,
                        avatarUrl,
                        profileUrl,
                        gender,
                        primaryPhone,
                        interestedVehicle,
                        assignedSales,
                        receivedDate: receivedDate || `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
                        receivedTime: receivedTime || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                        assignedAdminName,
                        assignedAdminId,
                        tags: jsonTags,
                        notes,
                        firstContactAt: lastContactAt,
                        lastContactAt,
                        totalMessages: rawMessage ? 1 : 0,
                        totalOrders: orderData ? 1 : 0,
                        totalSpent: orderData ? orderData.totalAmount : 0,
                    },
                });
                customerId = newCustomer.id;
            }
            // 2. Save / Upsert extracted phone numbers
            for (let i = 0; i < phoneNumbers.length; i++) {
                const phone = phoneNumbers[i];
                const isPrimary = i === 0;
                await prisma_1.prisma.customerPhone.upsert({
                    where: {
                        customerId_phoneNumber: {
                            customerId,
                            phoneNumber: phone.normalized,
                        },
                    },
                    update: {
                        rawExtracted: phone.raw,
                        carrier: phone.carrier || null,
                    },
                    create: {
                        customerId,
                        phoneNumber: phone.normalized,
                        e164Format: phone.e164,
                        rawExtracted: phone.raw,
                        carrier: phone.carrier || null,
                        isPrimary,
                        sourceMessageId: rawMessage?.messageId || null,
                    },
                });
            }
            // 3. Save raw message log
            if (rawMessage && rawMessage.text) {
                if (rawMessage.messageId) {
                    await prisma_1.prisma.message.upsert({
                        where: { pancakeMessageId: rawMessage.messageId },
                        update: {
                            text: rawMessage.text,
                            extractedPhones: JSON.stringify(phoneNumbers.map((p) => p.normalized)),
                        },
                        create: {
                            pancakeMessageId: rawMessage.messageId,
                            conversationId: rawMessage.conversationId || `conv_${pancakeCustomerId}`,
                            customerId,
                            senderType: rawMessage.senderType,
                            text: rawMessage.text,
                            extractedPhones: JSON.stringify(phoneNumbers.map((p) => p.normalized)),
                            sentAt: rawMessage.sentAt,
                        },
                    });
                }
                else {
                    await prisma_1.prisma.message.create({
                        data: {
                            pancakeMessageId: null,
                            conversationId: rawMessage.conversationId || `conv_${pancakeCustomerId}`,
                            customerId,
                            senderType: rawMessage.senderType,
                            text: rawMessage.text,
                            extractedPhones: JSON.stringify(phoneNumbers.map((p) => p.normalized)),
                            sentAt: rawMessage.sentAt,
                        },
                    });
                }
            }
            // Fetch the updated complete customer object
            const fullCustomer = await prisma_1.prisma.customer.findUnique({
                where: { id: customerId },
                include: {
                    phones: true,
                    orders: { take: 5, orderBy: { createdAt: 'desc' } },
                },
            });
            // 4. Trigger Google Sheets Sync (Only sync customers with valid primaryPhone)
            if (fullCustomer && fullCustomer.primaryPhone) {
                google_sheets_service_1.GoogleSheetsService.syncCustomer(fullCustomer).catch((err) => {
                    logger_1.logger.error({ error: err.message, customerId }, 'Failed to sync customer to Google Sheets');
                });
            }
            return fullCustomer;
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, stack: error.stack, data }, 'Error in processAndSaveCustomer');
            throw error;
        }
    }
    /**
     * Delete a single customer
     */
    static async deleteCustomer(customerId) {
        await (0, prisma_1.ensureDatabaseSchema)();
        try {
            await prisma_1.prisma.customer.delete({
                where: { id: customerId },
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, customerId }, 'Error deleting customer');
            throw error;
        }
    }
    /**
     * Clear all customers & messages from database
     */
    static async clearAllCustomers() {
        await (0, prisma_1.ensureDatabaseSchema)();
        try {
            const deleteResult = await prisma_1.prisma.customer.deleteMany({});
            return deleteResult.count;
        }
        catch (error) {
            logger_1.logger.error({ error: error.message }, 'Error clearing all customers');
            throw error;
        }
    }
    /**
     * Delete a specific chat message
     */
    static async deleteMessage(messageId) {
        await (0, prisma_1.ensureDatabaseSchema)();
        try {
            await prisma_1.prisma.message.delete({
                where: { id: messageId },
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, messageId }, 'Error deleting message');
            throw error;
        }
    }
    /**
     * Update Salesperson & Interested Vehicle Assignment directly from CRM UI
     */
    static async updateSalesAssignment(customerId, updates) {
        await (0, prisma_1.ensureDatabaseSchema)();
        const updated = await prisma_1.prisma.customer.update({
            where: { id: customerId },
            data: {
                interestedVehicle: updates.interestedVehicle,
                assignedSales: updates.assignedSales,
                leadSource: updates.leadSource,
                leadStatus: updates.assignedSales ? 'ASSIGNED' : 'NEW',
            },
            include: { phones: true },
        });
        if (updated.primaryPhone) {
            google_sheets_service_1.GoogleSheetsService.syncCustomer(updated).catch((err) => {
                logger_1.logger.error({ error: err.message, customerId }, 'Failed syncing updated sales assignment to Sheets');
            });
        }
        return updated;
    }
    /**
     * Get paginated customer list (Defaults to only returning customers who provided phone numbers)
     */
    static async getCustomers(params) {
        await (0, prisma_1.ensureDatabaseSchema)();
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 20));
        const skip = (page - 1) * limit;
        // By default: Only show customers with verified phone numbers
        const where = {
            primaryPhone: { not: null },
        };
        if (params.hasPhone === false) {
            delete where.primaryPhone;
        }
        if (params.platform) {
            where.platform = params.platform.toUpperCase();
        }
        if (params.assignedSales) {
            where.assignedSales = params.assignedSales;
        }
        if (params.interestedVehicle) {
            where.interestedVehicle = params.interestedVehicle;
        }
        if (params.leadSource) {
            where.leadSource = params.leadSource;
        }
        if (params.search) {
            where.AND = [
                { primaryPhone: { not: null } },
                {
                    OR: [
                        { name: { contains: params.search } },
                        { primaryPhone: { contains: params.search } },
                        { pancakeCustomerId: { contains: params.search } },
                        { interestedVehicle: { contains: params.search } },
                        { assignedSales: { contains: params.search } },
                        { leadSource: { contains: params.search } },
                        { notes: { contains: params.search } },
                    ],
                },
            ];
        }
        try {
            const [total, customers] = await Promise.all([
                prisma_1.prisma.customer.count({ where }),
                prisma_1.prisma.customer.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { lastContactAt: 'desc' },
                    include: {
                        phones: true,
                        _count: { select: { messages: true, orders: true } },
                    },
                }),
            ]);
            return {
                data: customers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                },
            };
        }
        catch (err) {
            logger_1.logger.error({ error: err.message }, 'Error in getCustomers, returning empty');
            return {
                data: [],
                pagination: {
                    page: 1,
                    limit,
                    total: 0,
                    totalPages: 1,
                },
            };
        }
    }
    /**
     * Get CRM summary statistics (Ultra-fast in-memory aggregation)
     */
    static async getStats() {
        await (0, prisma_1.ensureDatabaseSchema)();
        try {
            const [totalWithPhones, totalMessages, totalOrders, customers] = await Promise.all([
                prisma_1.prisma.customer.count({ where: { primaryPhone: { not: null } } }),
                prisma_1.prisma.message.count(),
                prisma_1.prisma.order.count(),
                prisma_1.prisma.customer.findMany({
                    where: { primaryPhone: { not: null } },
                    select: { platform: true, interestedVehicle: true, assignedSales: true },
                }),
            ]);
            const platformBreakdown = {};
            const vehicleBreakdown = {};
            const salesBreakdown = {};
            for (const c of customers) {
                if (c.platform) {
                    platformBreakdown[c.platform] = (platformBreakdown[c.platform] || 0) + 1;
                }
                if (c.interestedVehicle) {
                    vehicleBreakdown[c.interestedVehicle] = (vehicleBreakdown[c.interestedVehicle] || 0) + 1;
                }
                if (c.assignedSales) {
                    salesBreakdown[c.assignedSales] = (salesBreakdown[c.assignedSales] || 0) + 1;
                }
            }
            return {
                totalCustomers: totalWithPhones,
                totalWithPhones,
                totalMessages,
                totalOrders,
                platformBreakdown,
                vehicleBreakdown,
                salesBreakdown,
            };
        }
        catch (err) {
            logger_1.logger.error({ error: err.message }, 'Error in getStats, returning empty');
            return {
                totalCustomers: 0,
                totalWithPhones: 0,
                totalMessages: 0,
                totalOrders: 0,
                platformBreakdown: {},
                vehicleBreakdown: {},
                salesBreakdown: {},
            };
        }
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map