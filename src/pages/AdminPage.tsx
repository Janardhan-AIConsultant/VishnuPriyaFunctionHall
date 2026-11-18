import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  History,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  clearAdminSession,
  getStoredAdminInfo,
  getStoredAdminToken,
  isRemoteFastApiConfigured,
  venueApi,
} from "../lib/api";
import type { BookingRecord, BookingStatus } from "../types/venue";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const STATUS_FILTERS: Array<"ALL" | BookingStatus> = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
];

function StatusLabel({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    PENDING: "text-[#92400E] font-semibold",
    CONFIRMED: "text-[#166534] font-semibold",
    REJECTED: "text-[#991B1B] font-semibold",
    CANCELLED: "text-[#665851] font-semibold",
  };
  return <span className={`text-xs tracking-wide ${styles[status]}`}>{status}</span>;
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());
  const [adminInfo, setAdminInfo] = useState(() => getStoredAdminInfo());

  // Login form state
  const [email, setEmail] = useState("manager@vishnupriyafunctionhall.in");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Filters & modals
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailBooking, setDetailBooking] = useState<BookingRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BookingRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelTarget, setCancelTarget] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRecord | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("15:00");
  const [actionBusy, setActionBusy] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: venueApi.getAdminDashboard,
    enabled: Boolean(token),
  });

  const bookingsQuery = useQuery({
    queryKey: ["admin-bookings", statusFilter, searchQuery],
    queryFn: () => venueApi.getAdminBookings(statusFilter, searchQuery),
    enabled: Boolean(token),
  });

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: venueApi.getAdminNotifications,
    enabled: Boolean(token),
  });

  const syncQuery = useQuery({
    queryKey: ["admin-sync-status"],
    queryFn: venueApi.getAdminSyncStatus,
    enabled: Boolean(token),
  });

  function refreshAllAdminQueries() {
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sync-status"] });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const resp = await venueApi.adminLogin(email, password);
      setToken(resp.access_token);
      setAdminInfo({ email: resp.admin_email, name: resp.admin_name, role: resp.role });
      toast.success("Signed in to Vishnu Priya Management Console.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    clearAdminSession();
    setToken(null);
    setAdminInfo(null);
    toast.success("Signed out.");
  }

  async function handleApprove(booking: BookingRecord) {
    setActionBusy(true);
    try {
      await venueApi.approveBooking(booking.id);
      toast.success(
        `${booking.booking_reference} confirmed. Calendar synced & WhatsApp sent.`
      );
      refreshAllAdminQueries();
      setDetailBooking(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget) return;
    setActionBusy(true);
    try {
      await venueApi.rejectBooking(rejectTarget.id, rejectReason);
      toast.success(`${rejectTarget.booking_reference} rejected.`);
      setRejectTarget(null);
      setRejectReason("");
      refreshAllAdminQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelTarget) return;
    setActionBusy(true);
    try {
      await venueApi.cancelBooking(cancelTarget.id, cancelReason);
      toast.success(
        `${cancelTarget.booking_reference} cancelled and date ${cancelTarget.event_date} released.`
      );
      setCancelTarget(null);
      setCancelReason("");
      refreshAllAdminQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRescheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rescheduleTarget || !newDate) return;
    setActionBusy(true);
    try {
      await venueApi.rescheduleBooking(rescheduleTarget.id, newDate, newStart, newEnd);
      toast.success(
        `${rescheduleTarget.booking_reference} rescheduled to ${newDate}.`
      );
      setRescheduleTarget(null);
      refreshAllAdminQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed.");
    } finally {
      setActionBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-[#FBF8F3] py-16">
        <div className="mx-auto max-w-md px-4">
          <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-8 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E5DAC8] bg-[#F3ECE0] text-[#6B1426]">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="font-display text-3xl font-semibold text-[#231917]">
                Management Portal
              </h1>
              <p className="text-sm text-[#665851]">
                Authorized Vishnu Priya Function Hall administrators only.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrator Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loggingIn}>
                {loggingIn ? "Verifying..." : "Sign In"}
              </Button>
            </form>

            {!isRemoteFastApiConfigured() && (
              <div className="border-t border-[#E5DAC8] pt-4 text-xs text-[#665851] space-y-1">
                <p className="font-medium text-[#231917]">
                  Standalone Preview Mode Credentials
                </p>
                <p className="font-mono">manager@vishnupriyafunctionhall.in</p>
                <p className="font-mono">VishnuPriya@2026</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardQuery.data?.stats;
  const recentAudits = dashboardQuery.data?.recent_audits || [];
  const bookings = bookingsQuery.data || [];
  const notifications = notificationsQuery.data || [];
  const syncItems = syncQuery.data || [];

  return (
    <div className="bg-[#FBF8F3] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Bar Contract for Dashboard */}
        <div className="flex flex-col gap-4 border-b border-[#E5DAC8] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[#665851]">
              Management Console / {adminInfo?.role || "ADMIN"}
            </p>
            <h1 className="font-display text-3xl font-semibold text-[#231917]">
              Booking Operations & Audit
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshAllAdminQueries}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* 8-Metric Operational Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Requests", value: stats?.total_requests ?? 0 },
            { label: "Pending Review", value: stats?.pending_requests ?? 0 },
            { label: "Confirmed Bookings", value: stats?.confirmed_bookings ?? 0 },
            { label: "Upcoming Events", value: stats?.upcoming_events ?? 0 },
            { label: "Rejected", value: stats?.rejected_bookings ?? 0 },
            { label: "Cancelled", value: stats?.cancelled_bookings ?? 0 },
            {
              label: "WhatsApp Failures",
              value: stats?.whatsapp_notification_failures ?? 0,
            },
            {
              label: "Calendar Sync Failures",
              value: stats?.calendar_sync_failures ?? 0,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] px-5 py-4"
            >
              <p className="text-xs text-[#665851]">{metric.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-[#231917] tabular-nums">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings">
          <TabsList className="flex-wrap">
            <TabsTrigger value="bookings">Bookings Ledger</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="audit">Audit History</TabsTrigger>
            <TabsTrigger value="integrations">WhatsApp & Calendar Sync</TabsTrigger>
          </TabsList>

          {/* Bookings Management Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1 rounded-md border border-[#E5DAC8] bg-[#F3ECE0] p-1">
                {STATUS_FILTERS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`whitespace-nowrap shrink-0 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#FFFDF9] text-[#6B1426] shadow-xs"
                        : "text-[#665851] hover:text-[#231917]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#8E7F76]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reference, host, phone..."
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#E5DAC8] bg-[#FFFDF9]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E5DAC8] bg-[#F3ECE0]/60 text-xs text-[#665851]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Host & Contact</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Date & Hours</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DAC8]">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#665851]">
                        No bookings match the current filter.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FBF8F3] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[#6B1426] whitespace-nowrap">
                          {b.booking_reference}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#231917]">
                            {b.customer_name}
                          </div>
                          <div className="font-mono text-xs text-[#665851] tabular-nums">
                            {b.phone_number}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#231917]">{b.event_type}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#231917] tabular-nums whitespace-nowrap">
                          <div>{b.event_date}</div>
                          <div className="text-[#665851]">
                            {b.event_start_time}–{b.event_end_time}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusLabel status={b.booking_status} />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setDetailBooking(b)}
                            >
                              Details
                            </Button>
                            {b.booking_status === "PENDING" && (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={actionBusy}
                                  onClick={() => handleApprove(b)}
                                >
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={actionBusy}
                                  onClick={() => setRejectTarget(b)}
                                >
                                  <X className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </>
                            )}
                            {b.booking_status === "CONFIRMED" && (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={actionBusy}
                                  onClick={() => {
                                    setRescheduleTarget(b);
                                    setNewDate(b.event_date);
                                    setNewStart(b.event_start_time);
                                    setNewEnd(b.event_end_time);
                                  }}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionBusy}
                                  onClick={() => setCancelTarget(b)}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar">
            <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#6B1426]" />
                <h2 className="font-display text-2xl font-semibold text-[#231917]">
                  Schedule Timeline (Asia/Kolkata)
                </h2>
              </div>
              <div className="divide-y divide-[#E5DAC8]">
                {[...bookings]
                  .sort((a, b) => a.event_date.localeCompare(b.event_date))
                  .map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-28 font-mono text-sm font-semibold text-[#6B1426] tabular-nums">
                          {b.event_date}
                        </div>
                        <div>
                          <p className="font-medium text-[#231917]">
                            {b.event_type} — {b.customer_name}
                          </p>
                          <p className="font-mono text-xs text-[#665851] tabular-nums">
                            {b.event_start_time}–{b.event_end_time} · {b.booking_reference}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusLabel status={b.booking_status} />
                        <span className="font-mono text-xs text-[#665851]">
                          Calendar: {b.calendar_sync_status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Audit History Tab */}
          <TabsContent value="audit">
            <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#6B1426]" />
                <h2 className="font-display text-2xl font-semibold text-[#231917]">
                  Administrator Audit Logs
                </h2>
              </div>
              <div className="divide-y divide-[#E5DAC8]">
                {recentAudits.length === 0 ? (
                  <p className="py-6 text-sm text-[#665851]">No audit events recorded yet.</p>
                ) : (
                  recentAudits.map((log) => (
                    <div key={log.id} className="py-3.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[#6B1426]">
                          {log.action} · {log.booking_reference}
                        </span>
                        <span className="font-mono text-xs text-[#665851] tabular-nums">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-[#231917]">{log.details}</p>
                      <p className="mt-0.5 text-xs text-[#665851]">By {log.actor_email}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* WhatsApp & Calendar Sync Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#6B1426]" />
                <h2 className="font-display text-2xl font-semibold text-[#231917]">
                  WhatsApp Business Cloud Delivery Logs
                </h2>
              </div>
              <div className="divide-y divide-[#E5DAC8] text-sm">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#231917]">
                        {n.event_type} ·{" "}
                        <span className="font-mono text-xs text-[#6B1426]">
                          {n.booking_reference}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-[#665851] tabular-nums">
                        To {n.recipient_phone} · Msg ID: {n.whatsapp_message_id || "—"}
                      </p>
                    </div>
                    <div className="text-xs font-mono tabular-nums">
                      <span
                        className={
                          n.status === "SENT" ? "text-[#166534]" : "text-[#991B1B]"
                        }
                      >
                        {n.status}
                      </span>{" "}
                      · Retries: {n.retry_count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#231917]">
                Google Calendar Sync Status
              </h2>
              <div className="divide-y divide-[#E5DAC8] text-sm">
                {syncItems.map((item) => (
                  <div
                    key={item.booking_id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-[#6B1426]">
                        {item.booking_reference} ({item.event_date})
                      </p>
                      <p className="font-mono text-xs text-[#665851]">
                        Event ID: {item.google_calendar_event_id || "Not created"}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#231917]">
                      {item.calendar_sync_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Details Modal */}
        <Dialog
          open={Boolean(detailBooking)}
          onOpenChange={(open) => !open && setDetailBooking(null)}
        >
          <DialogContent>
            {detailBooking && (
              <>
                <DialogHeader>
                  <DialogTitle>{detailBooking.booking_reference}</DialogTitle>
                  <DialogDescription>
                    {detailBooking.event_type} · {detailBooking.event_date} (
                    {detailBooking.event_start_time}–{detailBooking.event_end_time} IST)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="text-[#665851]">Host:</span>{" "}
                    <strong>{detailBooking.customer_name}</strong>
                  </p>
                  <p>
                    <span className="text-[#665851]">Mobile:</span>{" "}
                    <span className="font-mono">{detailBooking.phone_number}</span>
                  </p>
                  <p>
                    <span className="text-[#665851]">Status:</span>{" "}
                    <StatusLabel status={detailBooking.booking_status} />
                  </p>
                  <p>
                    <span className="text-[#665851]">Requirements:</span>{" "}
                    {detailBooking.additional_requirements || "None provided."}
                  </p>
                  <p>
                    <span className="text-[#665851]">Google Calendar ID:</span>{" "}
                    <span className="font-mono text-xs">
                      {detailBooking.google_calendar_event_id || "Not synced"}
                    </span>
                  </p>
                  {detailBooking.rejection_reason && (
                    <p className="text-[#991B1B]">
                      Rejection Reason: {detailBooking.rejection_reason}
                    </p>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={Boolean(rejectTarget)}
          onOpenChange={(open) => !open && setRejectTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Booking Request</DialogTitle>
              <DialogDescription>
                Provide an optional reason for rejecting {rejectTarget?.booking_reference}.
                The customer will receive a WhatsApp notification.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g. Hall reserved for maintenance or conflicting inquiry)"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectTarget(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={actionBusy}>
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog
          open={Boolean(cancelTarget)}
          onOpenChange={(open) => !open && setCancelTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Confirmed Booking</DialogTitle>
              <DialogDescription>
                Cancelling {cancelTarget?.booking_reference} releases date{" "}
                {cancelTarget?.event_date}, cancels the Google Calendar event, and
                notifies the customer via WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Cancellation note for audit trail"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelTarget(null)}
                >
                  Keep Booking
                </Button>
                <Button type="submit" variant="destructive" disabled={actionBusy}>
                  Release Date & Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog
          open={Boolean(rescheduleTarget)}
          onOpenChange={(open) => !open && setRescheduleTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Booking</DialogTitle>
              <DialogDescription>
                Move {rescheduleTarget?.booking_reference} to a new available date in
                a PostgreSQL transaction and update Google Calendar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resched-date">New Event Date</Label>
                <Input
                  id="resched-date"
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="resched-start">Start Time (IST)</Label>
                  <Input
                    id="resched-start"
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resched-end">End Time (IST)</Label>
                  <Input
                    id="resched-end"
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRescheduleTarget(null)}
                >
                  Close
                </Button>
                <Button type="submit" disabled={actionBusy}>
                  Save Reschedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
