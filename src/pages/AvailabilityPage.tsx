import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Search, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { venueApi } from "../lib/api";
import type { AvailabilityResponse, PublicBookingSummary } from "../types/venue";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PaymentGatewayPanel } from "../components/PaymentGatewayPanel";

export function AvailabilityPage() {
  const [date, setDate] = useState("");
  const [checkingDate, setCheckingDate] = useState(false);
  const [dateResult, setDateResult] = useState<AvailabilityResponse | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const [refInput, setRefInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [refResult, setRefResult] = useState<PublicBookingSummary | null>(null);
  const [refError, setRefError] = useState<string | null>(null);

  async function handleCheckDate(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setCheckingDate(true);
    setDateError(null);
    try {
      const res = await venueApi.checkAvailability(date);
      setDateResult(res);
    } catch (err) {
      setDateError(err instanceof Error ? err.message : "Could not check availability.");
    } finally {
      setCheckingDate(false);
    }
  }

  async function handleLookupReference(e: React.FormEvent) {
    e.preventDefault();
    if (!refInput.trim()) return;
    setLookingUp(true);
    setRefError(null);
    setRefResult(null);
    try {
      const res = await venueApi.lookupBooking(refInput.trim());
      setRefResult(res);
    } catch (err) {
      setRefError(err instanceof Error ? err.message : "Booking reference not found.");
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <div className="bg-[#FBF8F3] py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#6B1426]">
            Live Calendar & Request Tracker
          </p>
          <h1
            className="font-display font-semibold text-[#231917]"
            style={{ fontSize: "clamp(2.25rem, 3.6vw, 3.25rem)" }}
          >
            Check Availability
          </h1>
          <p className="text-base text-[#665851]">
            Vishnu Priya Function Hall confirms one exclusive celebration per date.
            Verify open dates or check the current status of an existing booking reference.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Date Availability Checker */}
          <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#231917]">
                Check Event Date
              </h2>
              <p className="mt-1 text-sm text-[#665851]">
                Checks confirmed reservations in PostgreSQL and Google Calendar (IST).
              </p>
            </div>

            <form onSubmit={handleCheckDate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avail-date">Preferred Celebration Date</Label>
                <Input
                  id="avail-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={checkingDate || !date}>
                <CalendarCheck className="h-4 w-4" />
                <span>{checkingDate ? "Checking Date..." : "Check Availability"}</span>
              </Button>
            </form>

            {dateError && (
              <div className="rounded-md border border-[#DC2626]/30 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
                {dateError}
              </div>
            )}

            {dateResult && (
              <div className="rounded-md border border-[#E5DAC8] bg-[#FBF8F3] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  {dateResult.available ? (
                    <CheckCircle2 className="h-5 w-5 text-[#166534] shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[#991B1B] shrink-0" />
                  )}
                  <span className="font-mono text-sm font-medium text-[#231917] tabular-nums">
                    {dateResult.date} · {dateResult.status}
                  </span>
                </div>
                <p className="text-sm text-[#665851]">{dateResult.message}</p>
                {dateResult.available && (
                  <Button asChild size="sm" className="mt-1">
                    <Link to={`/book?date=${dateResult.date}`}>
                      Request This Date <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Booking Reference Tracker */}
          <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#231917]">
                Track Booking Status
              </h2>
              <p className="mt-1 text-sm text-[#665851]">
                Enter your booking reference (for example <span className="font-mono">VPFH-2026-1048</span>)
                to view approval status.
              </p>
            </div>

            <form onSubmit={handleLookupReference} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ref-lookup">Booking Reference Code</Label>
                <Input
                  id="ref-lookup"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  placeholder="VPFH-2026-1048"
                  className="font-mono uppercase"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={lookingUp || !refInput.trim()}
              >
                <Search className="h-4 w-4" />
                <span>{lookingUp ? "Looking up..." : "Check Reference"}</span>
              </Button>
            </form>

            {refError && (
              <div className="rounded-md border border-[#DC2626]/30 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
                {refError}
              </div>
            )}

            {refResult && (
              <div className="rounded-md border border-[#E5DAC8] bg-[#FBF8F3] p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-[#6B1426]">
                    {refResult.booking_reference}
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-[#231917]">
                    Status: {refResult.booking_status}
                  </span>
                </div>
                <p className="text-sm text-[#231917]">
                  {refResult.event_type} ·{" "}
                  <span className="font-mono tabular-nums">{refResult.event_date}</span> (
                  <span className="font-mono tabular-nums">
                    {refResult.event_start_time}–{refResult.event_end_time}
                  </span>
                  )
                </p>
                <p className="text-xs leading-relaxed text-[#665851]">
                  {refResult.status_message}
                </p>
                {(refResult.booking_status === "PENDING" ||
                  refResult.booking_status === "CONFIRMED") && (
                  <div className="pt-3">
                    <PaymentGatewayPanel bookingReference={refResult.booking_reference} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
