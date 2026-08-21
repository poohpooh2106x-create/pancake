/**
 * Type definitions for Pancake Chat / Pancake POS Webhook Payloads and Open API Responses
 */

export type PancakePlatform = 'FACEBOOK' | 'LINE' | 'INSTAGRAM' | 'WHATSAPP' | 'WEB' | 'OTHER';

export type PancakeWebhookEventType =
  | 'new_message'
  | 'customer_updated'
  | 'order_created'
  | 'conversation_updated'
  | 'ping'
  | string;

export interface PancakeCustomerPayload {
  id?: string | number;
  psid?: string;
  name?: string;
  avatar_url?: string;
  profile_url?: string;
  gender?: string;
  phone_number?: string;
  phone_numbers?: string[];
  tags?: Array<{ id: string | number; name: string; color?: string } | string>;
  notes?: string;
  page_id?: string | number;
  inserted_at?: string;
  updated_at?: string;
}

export interface PancakeMessagePayload {
  id?: string;
  message_id?: string;
  conversation_id?: string;
  sender_type?: 'customer' | 'page' | 'bot' | 'user';
  from?: {
    id?: string | number;
    name?: string;
    avatar_url?: string;
  };
  to?: {
    id?: string | number;
    name?: string;
  };
  text?: string;
  message?: string;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
  inserted_at?: string;
  created_at?: string;
}

export interface PancakeOrderPayload {
  id?: string | number;
  order_id?: string | number;
  code?: string;
  status?: string;
  total_amount?: number;
  total_price?: number;
  customer?: PancakeCustomerPayload;
  customer_id?: string | number;
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: {
    full_address?: string;
    address?: string;
    province?: string;
    district?: string;
    post_code?: string;
    phone_number?: string;
    recipient_name?: string;
  };
  inserted_at?: string;
  updated_at?: string;
}

export interface PancakeWebhookPayload {
  event?: PancakeWebhookEventType;
  type?: PancakeWebhookEventType;
  page_id?: string | number;
  page_name?: string;
  platform?: string;
  timestamp?: number | string;
  data?: {
    customer?: PancakeCustomerPayload;
    message?: PancakeMessagePayload;
    order?: PancakeOrderPayload;
    conversation?: {
      id?: string;
      page_id?: string | number;
      customer_id?: string | number;
      assigned_users?: Array<{ id: string | number; name: string }>;
      tags?: Array<{ id: string | number; name: string }>;
      updated_at?: string;
    };
    [key: string]: any;
  };
  // Some Pancake webhook formats place fields directly on root
  customer?: PancakeCustomerPayload;
  message?: PancakeMessagePayload;
  order?: PancakeOrderPayload;
  [key: string]: any;
}
