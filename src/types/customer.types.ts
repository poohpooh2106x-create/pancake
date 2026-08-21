import { PancakePlatform } from './pancake.types';

export interface ExtractedPhoneNumber {
  raw: string;
  normalized: string; // 10-digit standard: 0812345678 or 9-digit landline: 021234567
  e164: string;       // +66812345678
  isMobile: boolean;
  carrier?: 'AIS' | 'TRUE_DTAC' | 'NT' | 'UNKNOWN';
}

export interface ParsedCustomerData {
  pancakeCustomerId: string;
  pageId: string;
  platform: PancakePlatform;
  leadSource?: string;
  name: string;
  avatarUrl?: string;
  profileUrl?: string;
  gender?: string;
  phoneNumbers: ExtractedPhoneNumber[];
  primaryPhone?: string;
  interestedVehicle?: string;
  assignedSales?: string;
  receivedDate?: string;
  receivedTime?: string;
  assignedAdminName?: string;
  assignedAdminId?: string;
  tags: string[];
  notes?: string;
  lastContactAt: Date;
  rawMessage?: {
    messageId?: string;
    conversationId?: string;
    senderType: 'CUSTOMER' | 'ADMIN' | 'BOT';
    text: string;
    sentAt: Date;
  };
  orderData?: {
    orderId: string;
    status: string;
    totalAmount: number;
    recipientName?: string;
    recipientPhone?: string;
    shippingAddress?: string;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  totalWithPhones: number;
  totalMessages: number;
  totalOrders: number;
  platformBreakdown: Record<string, number>;
  vehicleBreakdown?: Record<string, number>;
  salesBreakdown?: Record<string, number>;
}
