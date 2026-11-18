import {
  BUSINESS_INFO,
  EVENT_CATEGORIES,
  FACILITIES,
  FAQS,
  GALLERY_IMAGES,
  buildWhatsAppHref,
  normalizeWhatsAppDigits,
} from "../data/venueData";
import type {
  AdminLoginResponse,
  AuditLogEntry,
  AvailabilityResponse,
  BookingCreatePayload,
  BookingRecord,
  BusinessInfo,
  ChatbotApiResponse,
  ChatMessageItem,
  DashboardStats,
  EventCategory,
  FacilityItem,
  GalleryImage,
  NotificationLogEntry,
  PaymentInitiatePayload,
  PaymentInitiateResponse,
  PaymentRecord,
  PublicBookingSummary,
  SyncStatusItem,
} from "../types/venue";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export const isRemoteFastApiConfigured = (): boolean => Boolean(API_BASE);

const TOKEN_STORAGE_KEY = "vp_admin_token";
const ADMIN_INFO_KEY = "vp_admin_info";
const PREVIEW_BOOKINGS_KEY = "vp_preview_bookings_v1";
const PREVIEW_AUDITS_KEY = "vp_preview_audits_v1";
const PREVIEW_NOTIFS_KEY = "vp_preview_notifs_v1";
const PREVIEW_PAYMENTS_KEY = "vp_preview_payments_v1";

export function getStoredAdminToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredAdminInfo(): { email: string; name: string; role: string } | null {
  const raw = localStorage.getItem(ADMIN_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_INFO_KEY);
}

function futureDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function seedPreviewStore(): {
  bookings: BookingRecord[];
  audits: AuditLogEntry[];
  notifs: NotificationLogEntry[];
} {
  const existingBookings = localStorage.getItem(PREVIEW_BOOKINGS_KEY);
  if (existingBookings) {
    return {
      bookings: JSON.parse(existingBookings),
      audits: JSON.parse(localStorage.getItem(PREVIEW_AUDITS_KEY) || "[]"),
      notifs: JSON.parse(localStorage.getItem(PREVIEW_NOTIFS_KEY) || "[]"),
    };
  }

  const nowIso = new Date().toISOString();
  const d1 = futureDateISO(12);
  const d2 = futureDateISO(18);
  const d3 = futureDateISO(25);
  const d4 = futureDateISO(32);

  const bookings: BookingRecord[] = [
    {
      id: "8c90f6f2-4a2b-4d4a-91d1-100000000001",
      booking_reference: "VPFH-2026-1042",
      customer_name: "Srinivas Rao & Padmavathi",
      phone_number: "+91 98480 11234",
      event_type: "Engagements",
      event_date: d1,
      event_start_time: "09:00",
      event_end_time: "15:00",
      additional_requirements: "Traditional floral arch and separate banana-leaf dining for 180 guests.",
      booking_status: "CONFIRMED",
      rejection_reason: null,
      approved_by: "admin-001",
      rejected_by: null,
      approved_at: nowIso,
      rejected_at: null,
      google_calendar_event_id: "gcal_vpfh_1042_eluru",
      calendar_sync_status: "SYNCED",
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "8c90f6f2-4a2b-4d4a-91d1-100000000002",
      booking_reference: "VPFH-2026-1048",
      customer_name: "Lakshmi Narayana",
      phone_number: "+91 94401 55678",
      event_type: "Half-Saree Functions",
      event_date: d2,
      event_start_time: "10:00",
      event_end_time: "16:00",
      additional_requirements: "Requesting bridal suite access from 7:30 AM and lift assistance for grandparents.",
      booking_status: "PENDING",
      rejection_reason: null,
      approved_by: null,
      rejected_by: null,
      approved_at: null,
      rejected_at: null,
      google_calendar_event_id: null,
      calendar_sync_status: "NOT_SYNCED",
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "8c90f6f2-4a2b-4d4a-91d1-100000000003",
      booking_reference: "VPFH-2026-1051",
      customer_name: "Godavari AgroTech Ltd.",
      phone_number: "+91 99123 77890",
      event_type: "Product Launches",
      event_date: d3,
      event_start_time: "14:00",
      event_end_time: "20:00",
      additional_requirements: "Theater seating for 160 dealers with podium audio and evening dinner.",
      booking_status: "PENDING",
      rejection_reason: null,
      approved_by: null,
      rejected_by: null,
      approved_at: null,
      rejected_at: null,
      google_calendar_event_id: null,
      calendar_sync_status: "NOT_SYNCED",
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: "8c90f6f2-4a2b-4d4a-91d1-100000000004",
      booking_reference: "VPFH-2026-1035",
      customer_name: "Kiran Kumar Varma",
      phone_number: "+91 97015 33445",
      event_type: "Small Weddings",
      event_date: d4,
      event_start_time: "07:00",
      event_end_time: "14:00",
      additional_requirements: "Muhurtham at 9:15 AM; both bridal and groom rooms required.",
      booking_status: "CONFIRMED",
      rejection_reason: null,
      approved_by: "admin-001",
      rejected_by: null,
      approved_at: nowIso,
      rejected_at: null,
      google_calendar_event_id: "gcal_vpfh_1035_eluru",
      calendar_sync_status: "SYNCED",
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  const audits: AuditLogEntry[] = [
    {
      id: "aud-1",
      booking_id: bookings[0].id,
      booking_reference: bookings[0].booking_reference,
      actor_id: "admin-001",
      actor_email: "manager@vishnupriyafunctionhall.in",
      action: "BOOKING_APPROVED",
      details: `Date ${d1} locked in PostgreSQL transaction; Google Calendar event synced.`,
      created_at: nowIso,
    },
    {
      id: "aud-2",
      booking_id: bookings[3].id,
      booking_reference: bookings[3].booking_reference,
      actor_id: "admin-001",
      actor_email: "manager@vishnupriyafunctionhall.in",
      action: "BOOKING_APPROVED",
      details: `Date ${d4} locked in PostgreSQL transaction; WhatsApp confirmation delivered.`,
      created_at: nowIso,
    },
  ];

  const notifs: NotificationLogEntry[] = [
    {
      id: "not-1",
      booking_id: bookings[0].id,
      booking_reference: bookings[0].booking_reference,
      recipient_phone: bookings[0].phone_number,
      event_type: "BOOKING_CONFIRMED",
      channel: "WHATSAPP",
      whatsapp_message_id: "wamid.HBgMOTE5ODQ4MDExMjM0",
      status: "SENT",
      retry_count: 0,
      error_message: null,
      created_at: nowIso,
    },
    {
      id: "not-2",
      booking_id: bookings[1].id,
      booking_reference: bookings[1].booking_reference,
      recipient_phone: bookings[1].phone_number,
      event_type: "BOOKING_RECEIVED",
      channel: "WHATSAPP",
      whatsapp_message_id: "wamid.HBgMOTE5NDQwMTU1Njc4",
      status: "SENT",
      retry_count: 0,
      error_message: null,
      created_at: nowIso,
    },
  ];

  localStorage.setItem(PREVIEW_BOOKINGS_KEY, JSON.stringify(bookings));
  localStorage.setItem(PREVIEW_AUDITS_KEY, JSON.stringify(audits));
  localStorage.setItem(PREVIEW_NOTIFS_KEY, JSON.stringify(notifs));
  return { bookings, audits, notifs };
}

function savePreviewStore(
  bookings: BookingRecord[],
  audits: AuditLogEntry[],
  notifs: NotificationLogEntry[]
) {
  localStorage.setItem(PREVIEW_BOOKINGS_KEY, JSON.stringify(bookings));
  localStorage.setItem(PREVIEW_AUDITS_KEY, JSON.stringify(audits));
  localStorage.setItem(PREVIEW_NOTIFS_KEY, JSON.stringify(notifs));
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      detail = errBody.detail || errBody.message || detail;
    } catch {
      // ignore json parse failure
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

function generateReference(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VPFH-${year}-${num}`;
}

export const venueApi = {
  async getBusiness(): Promise<BusinessInfo> {
    if (API_BASE) return apiFetch<BusinessInfo>("/business");
    return BUSINESS_INFO;
  },

  async getFacilities(): Promise<FacilityItem[]> {
    if (API_BASE) return apiFetch<FacilityItem[]>("/facilities");
    return FACILITIES;
  },

  async getEvents(): Promise<EventCategory[]> {
    if (API_BASE) return apiFetch<EventCategory[]>("/events");
    return EVENT_CATEGORIES;
  },

  async getGallery(): Promise<GalleryImage[]> {
    if (API_BASE) return apiFetch<GalleryImage[]>("/gallery");
    return GALLERY_IMAGES;
  },

  async checkAvailability(date: string): Promise<AvailabilityResponse> {
    if (API_BASE) return apiFetch<AvailabilityResponse>(`/availability/${encodeURIComponent(date)}`);
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return {
        date,
        available: false,
        status: "PAST_DATE",
        message: "Selected date is in the past. Please choose an upcoming celebration date.",
        pending_requests_count: 0,
      };
    }
    const { bookings } = seedPreviewStore();
    const confirmed = bookings.some(
      (b) => b.event_date === date && b.booking_status === "CONFIRMED"
    );
    const pendingCount = bookings.filter(
      (b) => b.event_date === date && b.booking_status === "PENDING"
    ).length;

    if (confirmed) {
      return {
        date,
        available: false,
        status: "RESERVED",
        message: "This date is already confirmed for another celebration.",
        pending_requests_count: pendingCount,
      };
    }
    return {
      date,
      available: true,
      status: "AVAILABLE",
      message:
        pendingCount > 0
          ? `Available for request (${pendingCount} unapproved inquiry currently in queue).`
          : "This date is open for booking requests.",
      pending_requests_count: pendingCount,
    };
  },

  async createBooking(payload: BookingCreatePayload): Promise<PublicBookingSummary> {
    if (API_BASE) {
      return apiFetch<PublicBookingSummary>("/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    const { bookings, audits, notifs } = seedPreviewStore();
    const confirmedOnDate = bookings.some(
      (b) => b.event_date === payload.event_date && b.booking_status === "CONFIRMED"
    );
    if (confirmedOnDate) {
      throw new Error("Selected date is already confirmed and locked for another event.");
    }
    const nowIso = new Date().toISOString();
    const id = crypto.randomUUID();
    const ref = generateReference();
    const newBooking: BookingRecord = {
      id,
      booking_reference: ref,
      customer_name: payload.customer_name,
      phone_number: payload.phone_number,
      event_type: payload.event_type,
      event_date: payload.event_date,
      event_start_time: payload.event_start_time,
      event_end_time: payload.event_end_time,
      additional_requirements: payload.additional_requirements || null,
      booking_status: "PENDING",
      rejection_reason: null,
      approved_by: null,
      rejected_by: null,
      approved_at: null,
      rejected_at: null,
      google_calendar_event_id: null,
      calendar_sync_status: "NOT_SYNCED",
      created_at: nowIso,
      updated_at: nowIso,
    };
    bookings.unshift(newBooking);
    notifs.unshift({
      id: `not-${Date.now()}`,
      booking_id: id,
      booking_reference: ref,
      recipient_phone: payload.phone_number,
      event_type: "BOOKING_RECEIVED",
      channel: "WHATSAPP",
      whatsapp_message_id: `wamid.preview.${Date.now()}`,
      status: "SENT",
      retry_count: 0,
      error_message: null,
      created_at: nowIso,
    });
    savePreviewStore(bookings, audits, notifs);
    return {
      booking_reference: ref,
      event_type: newBooking.event_type,
      event_date: newBooking.event_date,
      event_start_time: newBooking.event_start_time,
      event_end_time: newBooking.event_end_time,
      booking_status: "PENDING",
      status_message:
        "Your booking request has been received and is awaiting management approval. A pending booking is not a confirmed booking.",
      created_at: nowIso,
    };
  },

  async lookupBooking(reference: string): Promise<PublicBookingSummary> {
    if (API_BASE) {
      return apiFetch<PublicBookingSummary>(`/bookings/${encodeURIComponent(reference)}`);
    }
    const { bookings } = seedPreviewStore();
    const match = bookings.find(
      (b) => b.booking_reference.toUpperCase() === reference.trim().toUpperCase()
    );
    if (!match) {
      throw new Error("No booking request found for that reference code.");
    }
    const statusMessages: Record<BookingRecord["booking_status"], string> = {
      PENDING: "Awaiting management review. Pending requests do not reserve the date.",
      CONFIRMED: "Confirmed by Vishnu Priya Function Hall management.",
      REJECTED: "This request could not be accommodated by management.",
      CANCELLED: "This booking has been cancelled and the date released.",
    };
    return {
      booking_reference: match.booking_reference,
      event_type: match.event_type,
      event_date: match.event_date,
      event_start_time: match.event_start_time,
      event_end_time: match.event_end_time,
      booking_status: match.booking_status,
      status_message: statusMessages[match.booking_status],
      created_at: match.created_at,
    };
  },

  async sendChatMessage(
    message: string,
    history: ChatMessageItem[]
  ): Promise<ChatbotApiResponse> {
    if (API_BASE) {
      return apiFetch<ChatbotApiResponse>("/chatbot/message", {
        method: "POST",
        body: JSON.stringify({
          message,
          history: history.map((h) => ({ role: h.role, content: h.content })),
        }),
      });
    }

    // Standalone preview fallback implementing safe guardrail + tool behavior
    const lower = message.toLowerCase();
    const injectionPatterns = [
      "ignore previous instructions",
      "approve my booking",
      "system prompt",
      "drop table",
      "select * from",
      "override admin",
    ];
    if (injectionPatterns.some((p) => lower.includes(p))) {
      return {
        reply:
          "I can only assist with Vishnu Priya Function Hall venue details, availability checks, and submitting PENDING booking requests. Management handles all approvals and cancellations directly.",
        provider: "grok-guardrail-preview",
      };
    }

    const dateMatch = message.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (dateMatch) {
      const avail = await this.checkAvailability(dateMatch[1]);
      return {
        reply: `${avail.date}: ${avail.message} Would you like to submit a booking request on our Book Now page or share your full name, 10-digit mobile number, and event type here?`,
        provider: "grok-preview-tool",
        availability_checked_date: avail.date,
        availability_result: avail.available,
      };
    }

    if (lower.includes("address") || lower.includes("location") || lower.includes("where") || lower.includes("eluru")) {
      return {
        reply: `Vishnu Priya Function Hall is located at ${BUSINESS_INFO.address}. You can also call or WhatsApp our desk at ${BUSINESS_INFO.phone}.`,
        provider: "grok-preview-tool",
      };
    }

    if (lower.includes("facility") || lower.includes("facilities") || lower.includes("capacity") || lower.includes("ac") || lower.includes("parking") || lower.includes("room")) {
      return {
        reply:
          "Our venue seats 150–200 guests in a separate A/C Function Hall with an adjacent separate A/C Dining Hall, passenger lift, 24/7 electricity with generator backup, spacious parking, dedicated groom and bridal rooms, and 24/7 CCTV surveillance.",
        provider: "grok-preview-tool",
      };
    }

    if (lower.includes("event") || lower.includes("wedding") || lower.includes("birthday") || lower.includes("corporate") || lower.includes("half-saree")) {
      return {
        reply:
          "We host Small Weddings, Engagements, Half-Saree Functions, Baby Showers, Birthdays, Corporate Parties, Meetings, Product Launches, Cultural Programs, Exhibitions, and Fundraisers.",
        provider: "grok-preview-tool",
      };
    }

    if (lower.includes("price") || lower.includes("cost") || lower.includes("rate") || lower.includes("tariff")) {
      return {
        reply:
          "Tariffs vary by event date, duration, and dining/decor requirements. Please share your preferred date to check availability, or contact management directly at +91 75999 96956 for a tailored quote.",
        provider: "grok-preview-tool",
      };
    }

    const faqMatch = FAQS.find((f) =>
      f.question
        .toLowerCase()
        .split(" ")
        .some((w) => w.length > 4 && lower.includes(w))
    );
    if (faqMatch) {
      return { reply: faqMatch.answer, provider: "grok-preview-tool" };
    }

    return {
      reply:
        "Namaskaram! Welcome to Vishnu Priya Function Hall, Eluru. Ask me about our 150–200 guest A/C function & dining halls, facilities, event types, location in Tilak Colony, or share a date (YYYY-MM-DD) to check availability.",
      provider: "grok-preview-tool",
    };
  },

  async adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
    if (API_BASE) {
      const data = await apiFetch<AdminLoginResponse>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      localStorage.setItem(
        ADMIN_INFO_KEY,
        JSON.stringify({ email: data.admin_email, name: data.admin_name, role: data.role })
      );
      return data;
    }

    if (
      email.trim().toLowerCase() === "manager@vishnupriyafunctionhall.in" &&
      password === "VishnuPriya@2026"
    ) {
      const resp: AdminLoginResponse = {
        access_token: "preview-jwt-token",
        token_type: "bearer",
        admin_email: "manager@vishnupriyafunctionhall.in",
        admin_name: "Hall Management Desk",
        role: "SUPER_ADMIN",
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, resp.access_token);
      localStorage.setItem(
        ADMIN_INFO_KEY,
        JSON.stringify({ email: resp.admin_email, name: resp.admin_name, role: resp.role })
      );
      return resp;
    }
    throw new Error("Invalid administrator email or password.");
  },

  async getAdminDashboard(): Promise<{ stats: DashboardStats; recent_audits: AuditLogEntry[] }> {
    if (API_BASE) {
      return apiFetch<{ stats: DashboardStats; recent_audits: AuditLogEntry[] }>("/admin/dashboard");
    }
    const { bookings, audits, notifs } = seedPreviewStore();
    const today = new Date().toISOString().slice(0, 10);
    const stats: DashboardStats = {
      total_requests: bookings.length,
      pending_requests: bookings.filter((b) => b.booking_status === "PENDING").length,
      confirmed_bookings: bookings.filter((b) => b.booking_status === "CONFIRMED").length,
      rejected_bookings: bookings.filter((b) => b.booking_status === "REJECTED").length,
      cancelled_bookings: bookings.filter((b) => b.booking_status === "CANCELLED").length,
      upcoming_events: bookings.filter(
        (b) => b.booking_status === "CONFIRMED" && b.event_date >= today
      ).length,
      whatsapp_notification_failures: notifs.filter((n) => n.status === "FAILED").length,
      calendar_sync_failures: bookings.filter((b) => b.calendar_sync_status === "FAILED").length,
    };
    return { stats, recent_audits: audits };
  },

  async getAdminBookings(statusFilter?: string, search?: string): Promise<BookingRecord[]> {
    if (API_BASE) {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("q", search);
      const qs = params.toString();
      return apiFetch<BookingRecord[]>(`/admin/bookings${qs ? `?${qs}` : ""}`);
    }
    const { bookings } = seedPreviewStore();
    return bookings.filter((b) => {
      const matchesStatus = !statusFilter || statusFilter === "ALL" || b.booking_status === statusFilter;
      const q = (search || "").trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.booking_reference.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.phone_number.toLowerCase().includes(q) ||
        b.event_type.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  },

  async approveBooking(id: string): Promise<BookingRecord> {
    if (API_BASE) {
      return apiFetch<BookingRecord>(`/admin/bookings/${id}/approve`, { method: "POST" });
    }
    const { bookings, audits, notifs } = seedPreviewStore();
    const target = bookings.find((b) => b.id === id);
    if (!target) throw new Error("Booking not found.");
    if (target.booking_status !== "PENDING") {
      throw new Error("Only PENDING bookings can be approved.");
    }
    const conflict = bookings.find(
      (b) => b.id !== id && b.event_date === target.event_date && b.booking_status === "CONFIRMED"
    );
    if (conflict) {
      throw new Error(
        `Date ${target.event_date} is already reserved by ${conflict.booking_reference}.`
      );
    }
    const nowIso = new Date().toISOString();
    target.booking_status = "CONFIRMED";
    target.approved_by = "admin-001";
    target.approved_at = nowIso;
    target.google_calendar_event_id = `gcal_${target.booking_reference.toLowerCase()}`;
    target.calendar_sync_status = "SYNCED";
    target.updated_at = nowIso;

    audits.unshift({
      id: `aud-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      actor_id: "admin-001",
      actor_email: "manager@vishnupriyafunctionhall.in",
      action: "BOOKING_APPROVED",
      details: `Confirmed for ${target.event_date}; Google Calendar event created; WhatsApp confirmation sent.`,
      created_at: nowIso,
    });
    notifs.unshift({
      id: `not-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      recipient_phone: target.phone_number,
      event_type: "BOOKING_CONFIRMED",
      channel: "WHATSAPP",
      whatsapp_message_id: `wamid.confirm.${Date.now()}`,
      status: "SENT",
      retry_count: 0,
      error_message: null,
      created_at: nowIso,
    });
    savePreviewStore(bookings, audits, notifs);
    return target;
  },

  async rejectBooking(id: string, reason?: string): Promise<BookingRecord> {
    if (API_BASE) {
      return apiFetch<BookingRecord>(`/admin/bookings/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejection_reason: reason || null }),
      });
    }
    const { bookings, audits, notifs } = seedPreviewStore();
    const target = bookings.find((b) => b.id === id);
    if (!target) throw new Error("Booking not found.");
    const nowIso = new Date().toISOString();
    target.booking_status = "REJECTED";
    target.rejection_reason = reason || "Date unavailable upon management schedule review.";
    target.rejected_by = "admin-001";
    target.rejected_at = nowIso;
    target.updated_at = nowIso;

    audits.unshift({
      id: `aud-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      actor_id: "admin-001",
      actor_email: "manager@vishnupriyafunctionhall.in",
      action: "BOOKING_REJECTED",
      details: target.rejection_reason,
      created_at: nowIso,
    });
    notifs.unshift({
      id: `not-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      recipient_phone: target.phone_number,
      event_type: "BOOKING_REJECTED",
      channel: "WHATSAPP",
      whatsapp_message_id: `wamid.reject.${Date.now()}`,
      status: "SENT",
      retry_count: 0,
      error_message: null,
      created_at: nowIso,
    });
    savePreviewStore(bookings, audits, notifs);
    return target;
  },

  async cancelBooking(id: string, reason?: string): Promise<BookingRecord> {
    if (API_BASE) {
      return apiFetch<BookingRecord>(`/admin/bookings/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || null }),
      });
    }
    const { bookings, audits, notifs } = seedPreviewStore();
    const target = bookings.find((b) => b.id === id);
    if (!target) throw new Error("Booking not found.");
    const nowIso = new Date().toISOString();
    target.booking_status = "CANCELLED";
    target.calendar_sync_status = target.google_calendar_event_id ? "CANCELLED" : "NOT_SYNCED";
    target.updated_at = nowIso;

    audits.unshift({
      id: `aud-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      actor_id: "admin-001",
      actor_email: "manager@vishnupriyafunctionhall.in",
      action: "BOOKING_CANCELLED",
      details: reason || `Date ${target.event_date} released and Google Calendar event cancelled.`,
      created_at: nowIso,
    });
    notifs.unshift({
      id: `not-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      recipient_phone: target.phone_number,
      event_type: "BOOKING_CANCELLED",
      channel: "WHATSAPP",
      whatsapp_message_id: `wamid.cancel.${Date.now()}`,
      status: "SENT",
      retry_count: 0,
      error_message: null,
      created_at: nowIso,
    });
    savePreviewStore(bookings, audits, notifs);
    return target;
  },

  async rescheduleBooking(
    id: string,
    newDate: string,
    startTime: string,
    endTime: string
  ): Promise<BookingRecord> {
    if (API_BASE) {
      return apiFetch<BookingRecord>(`/admin/bookings/${id}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          new_event_date: newDate,
          new_start_time: startTime,
          new_end_time: endTime,
        }),
      });
    }
    const { bookings, audits, notifs } = seedPreviewStore();
    const target = bookings.find((b) => b.id === id);
    if (!target) throw new Error("Booking not found.");
    const conflict = bookings.find(
      (b) => b.id !== id && b.event_date === newDate && b.booking_status === "CONFIRMED"
    );
    if (conflict) {
      throw new Error(`New date ${newDate} is already reserved by ${conflict.booking_reference}.`);
    }
    const oldDate = target.event_date;
    const nowIso = new Date().toISOString();
    target.event_date = newDate;
    target.event_start_time = startTime;
    target.event_end_time = endTime;
    target.updated_at = nowIso;

    audits.unshift({
      id: `aud-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      actor_id: "admin-001",
      actor_email: "manager@vishnupriyafunctionhall.in",
      action: "BOOKING_RESCHEDULED",
      details: `Moved from ${oldDate} to ${newDate} (${startTime}-${endTime}); calendar updated.`,
      created_at: nowIso,
    });
    notifs.unshift({
      id: `not-${Date.now()}`,
      booking_id: target.id,
      booking_reference: target.booking_reference,
      recipient_phone: target.phone_number,
      event_type: "BOOKING_RESCHEDULED",
      channel: "WHATSAPP",
      whatsapp_message_id: `wamid.resched.${Date.now()}`,
      status: "SENT",
      retry_count: 0,
      error_message: null,
      created_at: nowIso,
    });
    savePreviewStore(bookings, audits, notifs);
    return target;
  },

  async getAdminNotifications(): Promise<NotificationLogEntry[]> {
    if (API_BASE) return apiFetch<NotificationLogEntry[]>("/admin/notifications");
    return seedPreviewStore().notifs;
  },

  async getAdminSyncStatus(): Promise<SyncStatusItem[]> {
    if (API_BASE) return apiFetch<SyncStatusItem[]>("/admin/sync-status");
    const { bookings } = seedPreviewStore();
    return bookings
      .filter((b) => b.booking_status === "CONFIRMED" || b.calendar_sync_status !== "NOT_SYNCED")
      .map((b) => ({
        booking_id: b.id,
        booking_reference: b.booking_reference,
        event_date: b.event_date,
        booking_status: b.booking_status,
        google_calendar_event_id: b.google_calendar_event_id,
        calendar_sync_status: b.calendar_sync_status,
        last_error: null,
        updated_at: b.updated_at,
      }));
  },

  async initiatePayment(payload: PaymentInitiatePayload): Promise<PaymentInitiateResponse> {
    if (API_BASE) {
      return apiFetch<PaymentInitiateResponse>("/payments/initiate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    const { bookings } = seedPreviewStore();
    const match = bookings.find(
      (b) => b.booking_reference.toUpperCase() === payload.booking_reference.trim().toUpperCase()
    );
    if (!match) {
      throw new Error("Booking reference not found.");
    }
    if (match.booking_status === "REJECTED" || match.booking_status === "CANCELLED") {
      throw new Error(`Cannot accept payment for a ${match.booking_status} booking.`);
    }

    const txnId = `VPFH-PAY-${Date.now().toString(36).toUpperCase()}`;
    const merchantUpi = "vishnupriya.eluru@ybl";
    const merchantName = BUSINESS_INFO.name;
    const params = new URLSearchParams({
      pa: merchantUpi,
      pn: merchantName,
      tr: txnId,
      tn: `Advance for ${match.booking_reference}`,
      am: payload.amount_inr.toFixed(2),
      cu: "INR",
    }).toString();

    const upiIntent = `upi://pay?${params}`;
    const phonepeIntent = `phonepe://pay?${params}`;
    const googlepayIntent = `tez://upi/pay?${params}`;
    const envWa = normalizeWhatsAppDigits(
      import.meta.env.VITE_WHATSAPP_NUMBER || BUSINESS_INFO.whatsapp_number
    );
    const waText = `Namaskaram ${merchantName}! Paying Rs. ${payload.amount_inr.toLocaleString(
      "en-IN"
    )} advance via ${payload.payment_method} for booking ${match.booking_reference}. Txn Ref: ${txnId}`;
    const whatsappPayUrl = envWa
      ? buildWhatsAppHref(envWa, waText)
      : `https://wa.me/?text=${encodeURIComponent(waText)}`;
    const nowIso = new Date().toISOString();

    const existing: PaymentRecord[] = JSON.parse(
      localStorage.getItem(PREVIEW_PAYMENTS_KEY) || "[]"
    );
    const record: PaymentRecord = {
      id: `pay-${Date.now()}`,
      merchant_transaction_id: txnId,
      booking_reference: match.booking_reference,
      amount_inr: payload.amount_inr,
      payment_method: payload.payment_method,
      payment_status: "INITIATED",
      provider_transaction_id: null,
      upi_intent_url: upiIntent,
      whatsapp_pay_url: whatsappPayUrl,
      confirmation_message: null,
      paid_at: null,
      created_at: nowIso,
    };
    existing.unshift(record);
    localStorage.setItem(PREVIEW_PAYMENTS_KEY, JSON.stringify(existing));

    return {
      merchant_transaction_id: txnId,
      booking_reference: match.booking_reference,
      amount_inr: payload.amount_inr,
      payment_method: payload.payment_method,
      payment_status: "INITIATED",
      merchant_name: merchantName,
      merchant_phone_masked: "Configured via backend .env",
      merchant_upi_id: merchantUpi,
      upi_intent_url: upiIntent,
      phonepe_intent_url: phonepeIntent,
      googlepay_intent_url: googlepayIntent,
      whatsapp_pay_url: whatsappPayUrl,
      phonepe_checkout_url: null,
      created_at: nowIso,
    };
  },

  async confirmPayment(
    merchantTransactionId: string,
    providerTransactionId: string
  ): Promise<PaymentRecord> {
    if (API_BASE) {
      return apiFetch<PaymentRecord>(
        `/payments/${encodeURIComponent(merchantTransactionId)}/confirm`,
        {
          method: "POST",
          body: JSON.stringify({ provider_transaction_id: providerTransactionId }),
        }
      );
    }

    const payments: PaymentRecord[] = JSON.parse(
      localStorage.getItem(PREVIEW_PAYMENTS_KEY) || "[]"
    );
    const target = payments.find(
      (p) => p.merchant_transaction_id === merchantTransactionId
    );
    if (!target) {
      throw new Error("Payment transaction not found.");
    }

    const nowIso = new Date().toISOString();
    const confirmationText = `Payment successful! Rs. ${target.amount_inr.toLocaleString(
      "en-IN"
    )} received via ${target.payment_method} for booking ${
      target.booking_reference
    } (Ref: ${providerTransactionId}).`;

    target.payment_status = "SUCCESS";
    target.provider_transaction_id = providerTransactionId;
    target.confirmation_message = confirmationText;
    target.paid_at = nowIso;
    localStorage.setItem(PREVIEW_PAYMENTS_KEY, JSON.stringify(payments));

    const { bookings, audits, notifs } = seedPreviewStore();
    const booking = bookings.find((b) => b.booking_reference === target.booking_reference);
    if (booking) {
      audits.unshift({
        id: `aud-${Date.now()}`,
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        actor_id: "payment-gateway",
        actor_email: "payment-gateway@vishnupriyafunctionhall.in",
        action: "PAYMENT_CONFIRMED",
        details: confirmationText,
        created_at: nowIso,
      });
      notifs.unshift({
        id: `not-${Date.now()}`,
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        recipient_phone: booking.phone_number,
        event_type: "PAYMENT_SUCCESS",
        channel: "WHATSAPP",
        whatsapp_message_id: `wamid.pay.${Date.now()}`,
        status: "SENT",
        retry_count: 0,
        error_message: null,
        created_at: nowIso,
      });
      savePreviewStore(bookings, audits, notifs);
    }
    return target;
  },

  async getBookingPayments(bookingReference: string): Promise<PaymentRecord[]> {
    if (API_BASE) {
      return apiFetch<PaymentRecord[]>(
        `/payments/booking/${encodeURIComponent(bookingReference)}`
      );
    }
    const payments: PaymentRecord[] = JSON.parse(
      localStorage.getItem(PREVIEW_PAYMENTS_KEY) || "[]"
    );
    return payments.filter(
      (p) => p.booking_reference.toUpperCase() === bookingReference.trim().toUpperCase()
    );
  },
};
