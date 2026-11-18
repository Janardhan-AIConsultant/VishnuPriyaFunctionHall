import { MapPin, Phone, Clock, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BUSINESS_INFO,
  FAQS,
  buildWhatsAppHref,
  formatWhatsAppDisplay,
  normalizeWhatsAppDigits,
} from "../data/venueData";
import { venueApi } from "../lib/api";
import { VenueMap } from "../components/VenueMap";
import { Button } from "../components/ui/button";

export function ContactPage() {
  const { data: businessInfo } = useQuery({
    queryKey: ["business"],
    queryFn: venueApi.getBusiness,
    staleTime: 60_000,
  });
  const activeWhatsApp = normalizeWhatsAppDigits(
    businessInfo?.whatsapp_number || BUSINESS_INFO.whatsapp_number
  );

  return (
    <div className="bg-[#FBF8F3] py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#6B1426]">
            Eluru Venue Desk
          </p>
          <h1
            className="font-display font-semibold text-[#231917]"
            style={{ fontSize: "clamp(2.25rem, 3.6vw, 3.25rem)" }}
          >
            Contact Us
          </h1>
          <p className="text-base text-[#665851]">
            Speak with our management team to arrange a personal tour of Vishnu Priya
            Function Hall in Tilak Colony, Santosh Nagar, Eluru.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 space-y-5">
              <div className="flex items-start gap-3.5">
                <MapPin className="h-5 w-5 text-[#6B1426] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#231917]">
                    Venue Address
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#665851]">
                    {BUSINESS_INFO.address}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5DAC8] pt-5 flex items-start gap-3.5">
                <Phone className="h-5 w-5 text-[#6B1426] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#231917]">
                    Telephone & WhatsApp
                  </h2>
                  <a
                    href="tel:+917599996956"
                    className="mt-1 block text-sm font-medium text-[#6B1426] hover:underline"
                  >
                    Desk Phone: {BUSINESS_INFO.phone}
                  </a>
                  <p className="mt-1 text-sm text-[#665851]">
                    WhatsApp:{" "}
                    <span className="font-mono font-medium text-[#231917]">
                      {formatWhatsAppDisplay(activeWhatsApp)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5DAC8] pt-5 flex items-start gap-3.5">
                <Clock className="h-5 w-5 text-[#6B1426] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#231917]">
                    Viewing & Event Hours
                  </h2>
                  <p className="mt-1 text-sm text-[#665851]">
                    {BUSINESS_INFO.operating_hours} · Daily venue tours by call
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E5DAC8] pt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/book">Submit Booking Request</Link>
                </Button>
                {activeWhatsApp && (
                  <Button asChild variant="outline">
                    <a
                      href={buildWhatsAppHref(activeWhatsApp)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp Desk</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <VenueMap />
          </div>
        </div>

        <div className="border-t border-[#E5DAC8] pt-12">
          <h2 className="font-display text-3xl font-semibold text-[#231917] mb-6">
            Common Inquiries
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {FAQS.map((faq) => (
              <div
                key={faq.id}
                className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6"
              >
                <h3 className="font-display text-xl font-semibold text-[#231917]">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#665851]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
