import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { EVENT_CATEGORIES } from "../data/venueData";
import { venueApi } from "../lib/api";
import type { AvailabilityResponse, PublicBookingSummary } from "../types/venue";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PaymentGatewayPanel } from "../components/PaymentGatewayPanel";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const bookingSchema = z.object({
  event_date: z.string().min(10, "Please select an event date."),
  customer_name: z.string().min(2, "Please enter your full name.").max(120),
  phone_number: z
    .string()
    .regex(
      /^(\+91[\s-]?)?[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number (e.g. +91 98480 12345)."
    ),
  event_type: z.string().min(2, "Please select an event type."),
  event_start_time: z.string().min(4, "Select start time."),
  event_end_time: z.string().min(4, "Select end time."),
  additional_requirements: z.string().max(600).optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookNowPage() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") || "";
  const initialEvent = searchParams.get("event") || "";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRequest, setConfirmedRequest] = useState<PublicBookingSummary | null>(
    null
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      event_date: initialDate,
      customer_name: "",
      phone_number: "",
      event_type: initialEvent || EVENT_CATEGORIES[0].title,
      event_start_time: "09:00",
      event_end_time: "15:00",
      additional_requirements: "",
    },
  });

  const watchedDate = form.watch("event_date");
  const watchedValues = form.watch();

  async function handleCheckStep1() {
    const validDate = await form.trigger("event_date");
    if (!validDate) return;
    setCheckingAvail(true);
    try {
      const res = await venueApi.checkAvailability(watchedDate);
      setAvailability(res);
      if (res.available) {
        toast.success("Date is available for booking requests.");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to check availability.");
    } finally {
      setCheckingAvail(false);
    }
  }

  async function handleProceedToReview() {
    const valid = await form.trigger([
      "customer_name",
      "phone_number",
      "event_type",
      "event_start_time",
      "event_end_time",
      "additional_requirements",
    ]);
    if (valid) {
      setStep(3);
    }
  }

  async function handleFinalSubmit(values: BookingFormValues) {
    setSubmitting(true);
    try {
      const summary = await venueApi.createBooking(values);
      setConfirmedRequest(summary);
      setStep(4);
      toast.success(`Request ${summary.booking_reference} submitted (PENDING approval).`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not submit booking request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#FBF8F3] py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-2 mb-8">
          <p className="text-xs font-medium text-[#6B1426]">
            Reservation Request Workflow
          </p>
          <h1
            className="font-display font-semibold text-[#231917]"
            style={{ fontSize: "clamp(2.25rem, 3.6vw, 3.1rem)" }}
          >
            Book Vishnu Priya Function Hall
          </h1>
          <p className="text-sm text-[#665851]">
            Submit your celebration details in 3 guided stages. All initial requests
            receive a <strong className="text-[#231917]">PENDING</strong> status until
            reviewed and confirmed by management.
          </p>
        </div>

        {/* Clean editorial step progress bar */}
        <div className="mb-8 grid grid-cols-4 gap-2 border-b border-[#E5DAC8] pb-4 text-xs">
          {[
            { num: 1, label: "01. Date & Check" },
            { num: 2, label: "02. Guest & Event" },
            { num: 3, label: "03. Review" },
            { num: 4, label: "04. Reference" },
          ].map((s) => (
            <div
              key={s.num}
              className={`font-medium pb-1 ${
                step === s.num
                  ? "text-[#6B1426] border-b-2 border-[#6B1426]"
                  : step > s.num
                  ? "text-[#231917]"
                  : "text-[#8E7F76]"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8">
          {/* Step 1: Select Date & Check Availability */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#231917]">
                  Step 1 & 2: Select Event Date & Verify Availability
                </h2>
                <p className="mt-1 text-sm text-[#665851]">
                  Choose your preferred date in Eluru (Asia/Kolkata) and confirm it is
                  not already exclusively reserved.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-event-date">Event Date</Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="book-event-date"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    {...form.register("event_date", {
                      onChange: () => setAvailability(null),
                    })}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCheckStep1}
                    disabled={checkingAvail || !watchedDate}
                  >
                    <CalendarCheck className="h-4 w-4 text-[#6B1426]" />
                    <span>{checkingAvail ? "Checking..." : "Check Availability"}</span>
                  </Button>
                </div>
                {form.formState.errors.event_date && (
                  <p className="text-xs text-[#991B1B]">
                    {form.formState.errors.event_date.message}
                  </p>
                )}
              </div>

              {availability && (
                <div
                  className={`rounded-md border p-4 text-sm ${
                    availability.available
                      ? "border-[#166534]/30 bg-[#F0FDF4] text-[#166534]"
                      : "border-[#991B1B]/30 bg-[#FEF2F2] text-[#991B1B]"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {availability.available ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>
                      {availability.date} · {availability.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs opacity-90">{availability.message}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  disabled={!availability?.available}
                  onClick={() => setStep(2)}
                >
                  Continue to Guest Details <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Enter Full Name, Mobile Number, Event Type, Optional Requirements */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#231917]">
                  Step 3–6: Host & Celebration Details
                </h2>
                <p className="mt-1 text-sm text-[#665851]">
                  Selected Date:{" "}
                  <strong className="font-mono text-[#231917] tabular-nums">
                    {watchedValues.event_date}
                  </strong>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Full Name</Label>
                  <Input
                    id="customer_name"
                    placeholder="e.g. Venkata Ramana Rao"
                    {...form.register("customer_name")}
                  />
                  {form.formState.errors.customer_name && (
                    <p className="text-xs text-[#991B1B]">
                      {form.formState.errors.customer_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Mobile Number (WhatsApp)</Label>
                  <Input
                    id="phone_number"
                    placeholder="+91 98480 12345"
                    {...form.register("phone_number")}
                  />
                  {form.formState.errors.phone_number && (
                    <p className="text-xs text-[#991B1B]">
                      {form.formState.errors.phone_number.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label>Event Type</Label>
                  <Select
                    value={watchedValues.event_type}
                    onValueChange={(val) => form.setValue("event_type", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((ev) => (
                        <SelectItem key={ev.id} value={ev.title}>
                          {ev.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.event_type && (
                    <p className="text-xs text-[#991B1B]">
                      {form.formState.errors.event_type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_start_time">Start Time (IST)</Label>
                  <Input
                    id="event_start_time"
                    type="time"
                    {...form.register("event_start_time")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_end_time">End Time (IST)</Label>
                  <Input
                    id="event_end_time"
                    type="time"
                    {...form.register("event_end_time")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_requirements">
                  Optional Requirements (Decor, Dining Setup, Suite Timing)
                </Label>
                <Textarea
                  id="additional_requirements"
                  placeholder="Approximate guest count (up to 200), bridal/groom room access time, dining format, or audio needs..."
                  {...form.register("additional_requirements")}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={handleProceedToReview}>
                  Review Booking Details <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <form onSubmit={form.handleSubmit(handleFinalSubmit)} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#231917]">
                  Step 7 & 8: Review & Confirm Request
                </h2>
                <p className="mt-1 text-sm text-[#665851]">
                  Please confirm your details below. Submitting places a{" "}
                  <strong className="text-[#231917]">PENDING</strong> request for
                  management review.
                </p>
              </div>

              <dl className="divide-y divide-[#E5DAC8] rounded-md border border-[#E5DAC8] bg-[#FBF8F3] text-sm">
                {[
                  { label: "Event Date", value: watchedValues.event_date, mono: true },
                  {
                    label: "Event Hours (IST)",
                    value: `${watchedValues.event_start_time} – ${watchedValues.event_end_time}`,
                    mono: true,
                  },
                  { label: "Event Type", value: watchedValues.event_type },
                  { label: "Host Full Name", value: watchedValues.customer_name },
                  { label: "Mobile Number", value: watchedValues.phone_number, mono: true },
                  {
                    label: "Additional Requirements",
                    value: watchedValues.additional_requirements || "None specified",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <dt className="text-[#665851]">{row.label}</dt>
                    <dd
                      className={`font-medium text-[#231917] ${
                        row.mono ? "font-mono tabular-nums" : ""
                      }`}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="rounded-md border border-[#B58938]/40 bg-[#FFF8EB] p-4 text-xs leading-relaxed text-[#6E4F14]">
                Important: A pending booking request is not a confirmed booking. Your
                date is exclusively reserved only after Vishnu Priya Function Hall
                management approves the request and sends a WhatsApp confirmation.
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" /> Edit Details
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting Request..." : "Confirm Booking Request"}
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Booking Reference Received (PENDING) */}
          {step === 4 && confirmedRequest && (
            <div className="space-y-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-full border border-[#B58938] bg-[#FFF8EB] text-[#6B1426]">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B1426]">
                    Booking Request Received · Status: {confirmedRequest.booking_status}
                  </p>
                  <h2 className="font-display text-3xl font-semibold text-[#231917]">
                    Reference:{" "}
                    <span className="font-mono text-[#6B1426]">
                      {confirmedRequest.booking_reference}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="rounded-md border border-[#E5DAC8] bg-[#FBF8F3] p-5 text-sm text-[#231917] space-y-2">
                <p className="font-medium">{confirmedRequest.status_message}</p>
                <p className="text-xs text-[#665851]">
                  Event: {confirmedRequest.event_type} on{" "}
                  <span className="font-mono tabular-nums">
                    {confirmedRequest.event_date}
                  </span>{" "}
                  ({confirmedRequest.event_start_time}–{confirmedRequest.event_end_time} IST)
                </p>
              </div>

              <PaymentGatewayPanel bookingReference={confirmedRequest.booking_reference} />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild>
                  <Link to="/availability">Track Status by Reference</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setAvailability(null);
                    setConfirmedRequest(null);
                    setStep(1);
                  }}
                >
                  Submit Another Request
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
