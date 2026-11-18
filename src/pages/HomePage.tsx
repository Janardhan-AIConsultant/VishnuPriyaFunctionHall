import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, MapPin, Phone } from "lucide-react";
import {
  BUSINESS_INFO,
  EVENT_CATEGORIES,
  FACILITIES,
  FAQS,
  VENUE_IMAGES,
} from "../data/venueData";
import { venueApi } from "../lib/api";
import type { AvailabilityResponse } from "../types/venue";
import { VenueImage } from "../components/VenueImage";
import {
  BookingProcessInfographic,
  VenueFloorInfographic,
} from "../components/VenueInfographics";
import { VenueMap } from "../components/VenueMap";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function HomePage() {
  const navigate = useNavigate();
  const [quickDate, setQuickDate] = useState("");
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);

  async function handleQuickCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!quickDate) return;
    setChecking(true);
    try {
      const res = await venueApi.checkAvailability(quickDate);
      setAvailability(res);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="bg-[#FBF8F3]">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-7 sm:p-10 lg:col-span-6"
          >
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-wider text-[#6B1426]">
                Tilak Colony, Santosh Nagar · Eluru
              </p>
              <h1
                className="font-display font-semibold tracking-tight text-[#231917] leading-[1.06]"
                style={{
                  fontSize: "clamp(2.25rem, 4vw, 3.6rem)",
                  textWrap: "balance",
                }}
              >
                Where Eluru’s cherished celebrations gather in timeless grace.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#665851]">
                Vishnu Priya Function Hall offers an intimate, fully air-conditioned
                celebration hall and separate A/C dining wing designed for 150 to
                200 guests—crafted for weddings, engagements, half-saree ceremonies,
                and corporate milestones.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/book">
                    Request a Date <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/availability">Check Availability</Link>
                </Button>
              </div>

              {/* Quick inline availability strip */}
              <form
                onSubmit={handleQuickCheck}
                className="border-t border-[#E5DAC8] pt-5"
              >
                <label
                  htmlFor="home-quick-date"
                  className="block text-xs font-medium text-[#665851] mb-2"
                >
                  Quick Date Check (IST)
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="home-quick-date"
                    type="date"
                    value={quickDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="sm:flex-1"
                  />
                  <Button type="submit" variant="secondary" disabled={checking || !quickDate}>
                    <CalendarCheck className="h-4 w-4 text-[#6B1426]" />
                    <span>{checking ? "Checking..." : "Check Date"}</span>
                  </Button>
                </div>
                {availability && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E5DAC8] bg-[#FBF8F3] px-3.5 py-2.5 text-sm">
                    <span className="text-[#231917]">
                      <strong className="font-mono tabular-nums">{availability.date}</strong>{" "}
                      — {availability.message}
                    </span>
                    {availability.available && (
                      <button
                        type="button"
                        onClick={() => navigate(`/book?date=${availability.date}`)}
                        className="text-xs font-semibold text-[#6B1426] underline cursor-pointer"
                      >
                        Proceed to Book
                      </button>
                    )}
                  </div>
                )}
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-lg border border-[#E5DAC8] lg:col-span-6"
          >
            <VenueImage
              src={VENUE_IMAGES.heroHall}
              alt="Vishnu Priya Function Hall grand air-conditioned interior in Eluru"
              title="Main A/C Celebration Hall"
              className="h-72 w-full sm:h-96 lg:h-full"
            />
          </motion.div>
        </div>

        {/* Full-Width 4-Column Venue Key Strip below Hero Split */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Seating Capacity", value: "150 – 200 Guests" },
            { label: "Climate Control", value: "Separate A/C Hall & Dining" },
            { label: "Private Suites", value: "Bridal & Groom Rooms" },
            { label: "Reliability", value: "24/7 Power · Lift · CCTV" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] px-5 py-4"
            >
              <p className="text-xs text-[#665851]">{item.label}</p>
              <p className="mt-1 font-display text-xl font-semibold text-[#231917]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Asymmetric Bento Facilities Overview */}
      <section className="border-t border-[#E5DAC8] bg-[#FFFDF9] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-[#6B1426]">
                Thoughtful Architecture & Amenities
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#231917] sm:text-4xl">
                Designed for effortless hosting from welcome to feast
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/facilities">View All Facilities</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-12">
            <div className="overflow-hidden rounded-lg border border-[#E5DAC8] bg-[#FBF8F3] md:col-span-7">
              <VenueImage
                src={FACILITIES[1].image_url}
                alt={FACILITIES[1].title}
                title={FACILITIES[1].title}
                className="h-64 w-full sm:h-72"
              />
              <div className="p-6">
                <p className="text-xs text-[#665851]">
                  {FACILITIES[1].number} · {FACILITIES[1].category}
                </p>
                <h3 className="mt-1.5 font-display text-2xl font-semibold text-[#231917]">
                  {FACILITIES[1].title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#665851]">
                  {FACILITIES[1].summary}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 md:col-span-5">
              {FACILITIES.slice(2, 4).map((fac) => (
                <div
                  key={fac.id}
                  className="flex flex-1 flex-col justify-between rounded-lg border border-[#E5DAC8] bg-[#FBF8F3] p-6"
                >
                  <div>
                    <p className="text-xs text-[#665851]">
                      {fac.number} · {fac.category}
                    </p>
                    <h3 className="mt-1.5 font-display text-2xl font-semibold text-[#231917]">
                      {fac.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#665851]">
                      {fac.summary}
                    </p>
                  </div>
                  <p className="mt-4 border-t border-[#E5DAC8] pt-3 text-xs text-[#6B1426] font-medium">
                    {fac.specification}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Architectural Blueprint Infographic */}
      <section className="border-t border-[#E5DAC8] bg-[#FBF8F3] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <VenueFloorInfographic />
        </div>
      </section>

      {/* Celebrations Showcase */}
      <section className="border-t border-[#E5DAC8] bg-[#FFFDF9] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-[#6B1426]">
                11 Curated Celebration & Corporate Formats
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#231917] sm:text-4xl">
                Every family milestone and executive gathering
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/events">Explore All Events</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[EVENT_CATEGORIES[0], EVENT_CATEGORIES[2], EVENT_CATEGORIES[6]].map(
              (ev) => (
                <div
                  key={ev.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-[#E5DAC8] bg-[#FFFDF9]"
                >
                  <VenueImage
                    src={ev.image_url}
                    alt={ev.title}
                    title={ev.title}
                    className="h-52 w-full"
                  />
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <p className="text-xs text-[#665851]">
                        {ev.group} · {ev.guest_range}
                      </p>
                      <h3 className="mt-1.5 font-display text-2xl font-semibold text-[#231917]">
                        {ev.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#665851]">
                        {ev.description}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-[#E5DAC8]">
                      <Link
                        to={`/book?event=${encodeURIComponent(ev.title)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B1426] hover:underline"
                      >
                        Request this setup <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Reservation Process Infographic */}
      <section className="border-t border-[#E5DAC8] bg-[#FBF8F3] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <BookingProcessInfographic />
        </div>
      </section>

      {/* Location & FAQ Section */}
      <section className="border-t border-[#E5DAC8] bg-[#FFFDF9] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <div>
                <p className="text-xs font-medium text-[#6B1426]">
                  Visit Vishnu Priya Function Hall
                </p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-[#231917]">
                  Tilak Colony, Santosh Nagar, Eluru
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#665851]">
                  Conveniently situated in Santosh Nagar with spacious on-site guest
                  parking and lift access.
                </p>
              </div>
              <VenueMap />
              <div className="flex flex-wrap items-center gap-6 text-sm text-[#231917]">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#6B1426]" />
                  Eluru, Andhra Pradesh 534002
                </span>
                <a
                  href="tel:+917599996956"
                  className="inline-flex items-center gap-2 font-medium hover:text-[#6B1426]"
                >
                  <Phone className="h-4 w-4 text-[#6B1426]" />
                  {BUSINESS_INFO.phone}
                </a>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-6">
              <div>
                <p className="text-xs font-medium text-[#6B1426]">
                  Guest Information
                </p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-[#231917]">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="divide-y divide-[#E5DAC8] rounded-lg border border-[#E5DAC8] bg-[#FBF8F3]">
                {FAQS.map((faq) => (
                  <div key={faq.id} className="p-5">
                    <h3 className="font-display text-xl font-semibold text-[#231917]">
                      {faq.question}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#665851]">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
