import { Link } from "react-router-dom";
import { BUSINESS_INFO, VENUE_IMAGES } from "../data/venueData";
import { VenueImage } from "../components/VenueImage";
import { Button } from "../components/ui/button";

export function AboutPage() {
  return (
    <div className="bg-[#FBF8F3] py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col justify-center space-y-5 lg:col-span-6">
            <p className="text-xs font-medium text-[#6B1426]">
              Our Heritage · Eluru, Andhra Pradesh
            </p>
            <h1
              className="font-display font-semibold text-[#231917] leading-[1.08]"
              style={{ fontSize: "clamp(2.25rem, 3.6vw, 3.25rem)", textWrap: "balance" }}
            >
              A refined sanctuary for family traditions and modern gatherings.
            </h1>
            <p className="text-base leading-relaxed text-[#665851]">
              Located in the quiet residential enclave of Tilak Colony, Santosh Nagar,
              Vishnu Priya Function Hall was envisioned to elevate intimate weddings,
              half-saree ceremonies, engagements, and civic gatherings in Eluru.
            </p>
            <p className="text-base leading-relaxed text-[#665851]">
              Rather than cavernous, impersonal convention sheds, our venue balances
              champagne-and-ivory acoustics, dedicated climate-controlled dining, private
              groom and bridal preparation suites, and attentive management oversight
              for 150 to 200 guests.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link to="/book">Reserve Your Date</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Schedule a Venue Visit</Link>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#E5DAC8] lg:col-span-6">
            <VenueImage
              src={VENUE_IMAGES.mandapStage}
              alt="Traditional ceremony stage inside Vishnu Priya Function Hall"
              title="Vishnu Priya Ceremony Stage"
              className="h-80 w-full lg:h-full"
            />
          </div>
        </div>

        <div className="grid gap-6 border-t border-[#E5DAC8] pt-12 md:grid-cols-3">
          <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6">
            <p className="text-xs text-[#665851]">01 · Exclusive Single-Event Dates</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#231917]">
              Undivided Management Focus
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#665851]">
              We confirm one exclusive event booking per date so your family enjoys
              unhurried preparation, parking priority, and peaceful ceremony timing.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6">
            <p className="text-xs text-[#665851]">02 · Separate Dining Wing</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#231917]">
              Air-Conditioned Comfort
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#665851]">
              Guests dine in a dedicated A/C dining hall independent of the ceremony
              floor, ensuring immaculate hygiene and calm circulation.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6">
            <p className="text-xs text-[#665851]">03 · Dependable Infrastructure</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#231917]">
              24/7 Power, Lift & Security
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#665851]">
              From passenger lift accessibility for elders to full-load generator
              backup and CCTV surveillance, every logistical detail is protected.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold text-[#231917]">
              Visit us in Santosh Nagar, Eluru
            </h3>
            <p className="mt-1 text-sm text-[#665851]">
              {BUSINESS_INFO.address} · {BUSINESS_INFO.phone}
            </p>
          </div>
          <Button asChild variant="gold">
            <Link to="/availability">Check Calendar Dates</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
