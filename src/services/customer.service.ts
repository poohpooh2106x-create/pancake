import { prisma } from '../db/prisma';
import { ParsedCustomerData, CustomerStats } from '../types/customer.types';
import { logger } from '../utils/logger';
import { GoogleSheetsService } from './google-sheets.service';

export class CustomerService {
  /**
   * Process parsed customer data: Upsert customer profile, save phones, store message & order
   */
  public static async processAndSaveCustomer(data: ParsedCustomerData): Promise<any> {
    const {
      pancakeCustomerId,
      pageId,
      platform,
      leadSource,
      name,
      avatarUrl,
      profileUrl,
      gender,
      phoneNumbers,
      primaryPhone,
      interestedVehicle,
      assignedSales,
      receivedDate,
      receivedTime,
      assignedAdminName,
      assignedAdminId,
      tags,
      notes,
      lastContactAt,
      rawMessage,
      orderData,
    } = data;

    try {
      // 1. Find existing customer or prepare to create
      const existingCustomer = await prisma.customer.findUnique({
        where: { pancakeCustomerId },
        include: { phones: true },
      });

      let customerId: string;
      const jsonTags = JSON.stringify(tags);

      if (existingCustomer) {
        customerId = existingCustomer.id;

        // Merge tags
        let existingTagList: string[] = [];
        try {
          existingTagList = JSON.parse(existingCustomer.tags || '[]');
        } catch {
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
        await prisma.customer.update({
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
      } else {
        // Create new customer
        const newCustomer = await prisma.customer.create({
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

        await prisma.customerPhone.upsert({
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
          await prisma.message.upsert({
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
        } else {
          await prisma.message.create({
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
      const fullCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          phones: true,
          orders: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });

      // 4. Trigger Google Sheets Sync (Async / Non-blocking)
      if (fullCustomer) {
        GoogleSheetsService.syncCustomer(fullCustomer).catch((err) => {
          logger.error({ error: err.message, customerId }, 'Failed to sync customer to Google Sheets');
        });
      }

      return fullCustomer;
    } catch (error: any) {
      logger.error({ error: error.message, stack: error.stack, data }, 'Error in processAndSaveCustomer');
      throw error;
    }
  }

  /**
   * Delete a single customer and all associated relations
   */
  public static async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      await prisma.customer.delete({
        where: { id: customerId },
      });
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, customerId }, 'Error deleting customer');
      throw error;
    }
  }

  /**
   * Clear all customers & messages from database
   */
  public static async clearAllCustomers(): Promise<number> {
    try {
      const deleteResult = await prisma.customer.deleteMany({});
      return deleteResult.count;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error clearing all customers');
      throw error;
    }
  }

  /**
   * Delete a specific chat message
   */
  public static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await prisma.message.delete({
        where: { id: messageId },
      });
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, messageId }, 'Error deleting message');
      throw error;
    }
  }

  /**
   * Update Salesperson & Interested Vehicle Assignment directly from CRM UI
   */
  public static async updateSalesAssignment(
    customerId: string,
    updates: {
      interestedVehicle?: string;
      assignedSales?: string;
      leadSource?: string;
    }
  ) {
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        interestedVehicle: updates.interestedVehicle,
        assignedSales: updates.assignedSales,
        leadSource: updates.leadSource,
        leadStatus: updates.assignedSales ? 'ASSIGNED' : 'NEW',
      },
      include: { phones: true },
    });

    // Re-sync to Google Sheets with new sales info
    GoogleSheetsService.syncCustomer(updated).catch((err) => {
      logger.error({ error: err.message, customerId }, 'Failed syncing updated sales assignment to Sheets');
    });

    return updated;
  }

  /**
   * Get paginated customer list
   */
  public static async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
    hasPhone?: boolean;
    platform?: string;
    assignedSales?: string;
    interestedVehicle?: string;
    leadSource?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.platform) {
      where.platform = params.platform.toUpperCase();
    }

    if (params.hasPhone === true) {
      where.primaryPhone = { not: null };
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
      where.OR = [
        { name: { contains: params.search } },
        { primaryPhone: { contains: params.search } },
        { pancakeCustomerId: { contains: params.search } },
        { interestedVehicle: { contains: params.search } },
        { assignedSales: { contains: params.search } },
        { leadSource: { contains: params.search } },
        { notes: { contains: params.search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
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
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get CRM summary statistics
   */
  public static async getStats(): Promise<CustomerStats> {
    const [
      totalCustomers,
      totalWithPhones,
      totalMessages,
      totalOrders,
      platformCounts,
      vehicleCounts,
      salesCounts,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { primaryPhone: { not: null } } }),
      prisma.message.count(),
      prisma.order.count(),
      prisma.customer.groupBy({
        by: ['platform'],
        _count: { platform: true },
      }),
      prisma.customer.groupBy({
        by: ['interestedVehicle'],
        where: { interestedVehicle: { not: null } },
        _count: { interestedVehicle: true },
      }),
      prisma.customer.groupBy({
        by: ['assignedSales'],
        where: { assignedSales: { not: null } },
        _count: { assignedSales: true },
      }),
    ]);

    const platformBreakdown: Record<string, number> = {};
    for (const p of platformCounts) {
      platformBreakdown[p.platform] = p._count.platform;
    }

    const vehicleBreakdown: Record<string, number> = {};
    for (const v of vehicleCounts) {
      if (v.interestedVehicle) {
        vehicleBreakdown[v.interestedVehicle] = v._count.interestedVehicle;
      }
    }

    const salesBreakdown: Record<string, number> = {};
    for (const s of salesCounts) {
      if (s.assignedSales) {
        salesBreakdown[s.assignedSales] = s._count.assignedSales;
      }
    }

    return {
      totalCustomers,
      totalWithPhones,
      totalMessages,
      totalOrders,
      platformBreakdown,
      vehicleBreakdown,
      salesBreakdown,
    };
  }
}
