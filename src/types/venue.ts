export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export type CalendarSyncStatus = "NOT_SYNCED" | "SYNCED" | "FAILED" | "CANCELLED";

export type NotificationStatus = "SENT" | "FAILED" | "PENDING" | "SKIPPED";

export interface BusinessInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  seating_capacity: string;
  operating_hours: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FacilityItem {
  id: string;
  number: string;
  title: string;
  category: "Hall & Dining" | "Comfort & Power" | "Suites & Security";
  summary: string;
  specification: string;
  image_url: string;
}

export interface EventCategory {
  id: string;
  title: string;
  group: "Family Celebrations" | "Corporate & Cultural";
  guest_range: string;
  description: string;
  recommended_setup: string;
  image_url: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  category: "Function Hall" | "Dining" | "Ceremony" | "Suites" | "Corporate";
  caption: string;
  image_url: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface AvailabilityResponse {
  date: string;
  available: boolean;
  status: "AVAILABLE" | "RESERVED" | "PAST_DATE";
  message: string;
  pending_requests_count: number;
}

export interface BookingCreatePayload {
  customer_name: string;
  phone_number: string;
  event_type: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  additional_requirements?: string;
}

export interface PublicBookingSummary {
  booking_reference: string;
  event_type: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  booking_status: BookingStatus;
  status_message: string;
  created_at: string;
}

export interface BookingRecord {
  id: string;
  booking_reference: string;
  customer_name: string;
  phone_number: string;
  event_type: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  additional_requirements: string | null;
  booking_status: BookingStatus;
  rejection_reason: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  google_calendar_event_id: string | null;
  calendar_sync_status: CalendarSyncStatus;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_requests: number;
  pending_requests: number;
  confirmed_bookings: number;
  rejected_bookings: number;
  cancelled_bookings: number;
  upcoming_events: number;
  whatsapp_notification_failures: number;
  calendar_sync_failures: number;
}

export interface AuditLogEntry {
  id: string;
  booking_id: string;
  booking_reference: string;
  actor_id: string;
  actor_email: string;
  action: string;
  details: string;
  created_at: string;
}

export interface NotificationLogEntry {
  id: string;
  booking_id: string;
  booking_reference: string;
  recipient_phone: string;
  event_type: string;
  channel: "WHATSAPP";
  whatsapp_message_id: string | null;
  status: NotificationStatus;
  retry_count: number;
  error_message: string | null;
  created_at: string;
}

export interface SyncStatusItem {
  booking_id: string;
  booking_reference: string;
  event_date: string;
  booking_status: BookingStatus;
  google_calendar_event_id: string | null;
  calendar_sync_status: CalendarSyncStatus;
  last_error: string | null;
  updated_at: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  admin_email: string;
  admin_name: string;
  role: string;
}

export interface ChatMessageItem {
  role: "user" | "assistant";
  content: string;
  booking_reference?: string;
  timestamp: string;
}

export interface ChatbotApiResponse {
  reply: string;
  provider: string;
  booking_reference?: string | null;
  availability_checked_date?: string | null;
  availability_result?: boolean | null;
}

export type PaymentMethod = "PHONEPE" | "GOOGLE_PAY" | "WHATSAPP_UPI";

export type PaymentStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED";

export interface PaymentInitiatePayload {
  booking_reference: string;
  amount_inr: number;
  payment_method: PaymentMethod;
}

export interface PaymentInitiateResponse {
  merchant_transaction_id: string;
  booking_reference: string;
  amount_inr: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  merchant_name: string;
  merchant_phone_masked: string;
  merchant_upi_id: string;
  upi_intent_url: string;
  phonepe_intent_url: string;
  googlepay_intent_url: string;
  whatsapp_pay_url: string;
  phonepe_checkout_url?: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  merchant_transaction_id: string;
  booking_reference: string;
  amount_inr: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  provider_transaction_id: string | null;
  upi_intent_url: string;
  whatsapp_pay_url: string;
  confirmation_message: string | null;
  paid_at: string | null;
  created_at: string;
}
