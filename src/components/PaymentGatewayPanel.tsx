import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { venueApi } from "../lib/api";
import type {
  PaymentInitiateResponse,
  PaymentMethod,
  PaymentRecord,
} from "../types/venue";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface PaymentGatewayPanelProps {
  bookingReference: string;
  defaultAmountInr?: number;
}

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  title: string;
  subtitle: string;
}> = [
  {
    id: "PHONEPE",
    title: "PhonePe",
    subtitle: "Instant PhonePe UPI / PG",
  },
  {
    id: "GOOGLE_PAY",
    title: "Google Pay",
    subtitle: "GPay UPI Intent",
  },
  {
    id: "WHATSAPP_UPI",
    title: "Pay from WhatsApp",
    subtitle: "WhatsApp UPI & Receipt",
  },
];

export function PaymentGatewayPanel({
  bookingReference,
  defaultAmountInr = 15000,
}: PaymentGatewayPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>("PHONEPE");
  const [amountInr, setAmountInr] = useState<number>(defaultAmountInr);
  const [initiating, setInitiating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [intent, setIntent] = useState<PaymentInitiateResponse | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [paidRecord, setPaidRecord] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    let active = true;
    venueApi
      .getBookingPayments(bookingReference)
      .then((records) => {
        if (!active) return;
        const success = records.find((r) => r.payment_status === "SUCCESS");
        if (success) {
          setPaidRecord(success);
        }
      })
      .catch(() => {
        // Ignore silent fetch errors
      });
    return () => {
      active = false;
    };
  }, [bookingReference]);

  async function handleInitiate() {
    setInitiating(true);
    try {
      const res = await venueApi.initiatePayment({
        booking_reference: bookingReference,
        amount_inr: amountInr,
        payment_method: method,
      });
      setIntent(res);
      setUtrInput(`UTR${Date.now().toString().slice(-8)}`);
      toast.success("Payment session ready. Complete payment using your chosen app.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not initiate payment."
      );
    } finally {
      setInitiating(false);
    }
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!intent || !utrInput.trim()) return;
    setConfirming(true);
    try {
      const confirmed = await venueApi.confirmPayment(
        intent.merchant_transaction_id,
        utrInput.trim()
      );
      setPaidRecord(confirmed);
      toast.success("Payment successful! Receipt & WhatsApp confirmation sent.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not verify payment."
      );
    } finally {
      setConfirming(false);
    }
  }

  if (paidRecord && paidRecord.payment_status === "SUCCESS") {
    return (
      <div className="rounded-lg border border-[#166534]/35 bg-[#F0FDF4] p-6 space-y-3 text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#166534] text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Payment Successful
            </p>
            <h3 className="font-display text-2xl font-semibold text-[#14532D]">
              Advance Payment Confirmed
            </h3>
            <p className="mt-1 text-sm text-[#166534]">
              {paidRecord.confirmation_message ||
                `Payment successful! Rs. ${paidRecord.amount_inr.toLocaleString(
                  "en-IN"
                )} received for ${paidRecord.booking_reference}.`}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 border-t border-[#166534]/20 pt-3 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-[#166534]/80">Booking Reference</dt>
            <dd className="font-mono font-semibold text-[#14532D]">
              {paidRecord.booking_reference}
            </dd>
          </div>
          <div>
            <dt className="text-[#166534]/80">Gateway / App</dt>
            <dd className="font-semibold text-[#14532D]">
              {paidRecord.payment_method.replace("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-[#166534]/80">UTR / Transaction Ref</dt>
            <dd className="font-mono font-semibold text-[#14532D]">
              {paidRecord.provider_transaction_id || paidRecord.merchant_transaction_id}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#E5DAC8] bg-[#FBF8F3] p-6 space-y-5 text-left">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#6B1426]">
            Advance Payment Gateway (PhonePe · Google Pay · WhatsApp)
          </p>
          <h3 className="font-display text-2xl font-semibold text-[#231917]">
            Pay Booking Advance for{" "}
            <span className="font-mono text-[#6B1426]">{bookingReference}</span>
          </h3>
        </div>
        <Wallet className="h-5 w-5 text-[#B58938] shrink-0" />
      </div>

      {/* Method Selection */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PAYMENT_OPTIONS.map((opt) => {
          const selected = method === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setMethod(opt.id);
                setIntent(null);
              }}
              aria-pressed={selected}
              className={`rounded-md border p-3.5 text-left transition-colors cursor-pointer ${
                selected
                  ? "border-[#6B1426] bg-[#FFFDF9] ring-1 ring-[#6B1426]"
                  : "border-[#D8CBB8] bg-[#FFFDF9]/70 hover:border-[#B58938]"
              }`}
            >
              <p className="text-sm font-semibold text-[#231917]">{opt.title}</p>
              <p className="mt-0.5 text-xs text-[#665851]">{opt.subtitle}</p>
            </button>
          );
        })}
      </div>

      {!intent ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5 sm:w-56">
            <Label htmlFor="advance-amount-inr">Advance Amount (INR)</Label>
            <Input
              id="advance-amount-inr"
              type="number"
              min={500}
              max={500000}
              step={500}
              value={amountInr}
              onChange={(e) => setAmountInr(Number(e.target.value) || 15000)}
              className="font-mono"
            />
          </div>
          <Button
            type="button"
            onClick={handleInitiate}
            disabled={initiating || amountInr < 100}
          >
            <Smartphone className="h-4 w-4" />
            <span>
              {initiating
                ? "Preparing Gateway..."
                : `Pay Rs. ${amountInr.toLocaleString("en-IN")} via ${
                    PAYMENT_OPTIONS.find((o) => o.id === method)?.title
                  }`}
            </span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-md border border-[#D8CBB8] bg-[#FFFDF9] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DAC8] pb-3 text-xs">
            <div>
              <span className="text-[#665851]">Merchant Receiver: </span>
              <strong className="text-[#231917]">{intent.merchant_name}</strong>{" "}
              <span className="font-mono text-[#6B1426]">
                ({intent.merchant_phone_masked})
              </span>
            </div>
            <div className="font-mono text-[#231917]">
              Txn: <strong>{intent.merchant_transaction_id}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {intent.phonepe_checkout_url ? (
              <Button asChild size="sm">
                <a
                  href={intent.phonepe_checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open PhonePe Checkout <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            ) : (
              <Button asChild size="sm">
                <a href={intent.phonepe_intent_url}>
                  Pay with PhonePe <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}

            <Button asChild variant="outline" size="sm">
              <a href={intent.googlepay_intent_url}>
                Pay with Google Pay <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-[#1E6B47]/40 text-[#1E6B47] hover:bg-[#1E6B47]/5"
            >
              <a
                href={intent.whatsapp_pay_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Pay from WhatsApp
              </a>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(intent.merchant_upi_id);
                toast.success(`Copied UPI ID: ${intent.merchant_upi_id}`);
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy UPI ({intent.merchant_upi_id})
            </Button>
          </div>

          <form
            onSubmit={handleConfirmPayment}
            className="grid gap-3 border-t border-[#E5DAC8] pt-4 sm:grid-cols-12 sm:items-end"
          >
            <div className="space-y-1.5 sm:col-span-7">
              <Label htmlFor="utr-reference">
                UPI / PhonePe / GPay UTR Reference Number
              </Label>
              <Input
                id="utr-reference"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                placeholder="Enter 12-digit UTR or payment ref"
                className="font-mono"
                required
              />
            </div>
            <div className="sm:col-span-5">
              <Button
                type="submit"
                className="w-full"
                disabled={confirming || !utrInput.trim()}
              >
                {confirming ? "Verifying..." : "Confirm Payment & Get Receipt"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
