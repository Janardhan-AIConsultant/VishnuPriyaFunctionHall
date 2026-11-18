import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { venueApi } from "../lib/api";
import { VenueImage } from "../components/VenueImage";
import { VenueFloorInfographic } from "../components/VenueInfographics";
import { Button } from "../components/ui/button";

const CATEGORIES = [
  "All",
  "Hall & Dining",
  "Comfort & Power",
  "Suites & Security",
] as const;

export function FacilitiesPage() {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ["facilities"],
    queryFn: venueApi.getFacilities,
  });

  const filtered =
    filter === "All"
      ? facilities
      : facilities.filter((f) => f.category === filter);

  return (
    <div className="bg-[#FBF8F3] py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-[#6B1426]">
              Venue Specifications
            </p>
            <h1
              className="font-display font-semibold text-[#231917]"
              style={{ fontSize: "clamp(2.25rem, 3.6vw, 3.25rem)" }}
            >
              Facilities & Amenities
            </h1>
            <p className="text-base text-[#665851]">
              Purpose-built for 150–200 guests with separate A/C celebration and
              dining wings, private suites, elevator access, and uninterrupted power.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Facility categories"
            className="flex flex-wrap items-center gap-1 rounded-md border border-[#E5DAC8] bg-[#F3ECE0] p-1"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={filter === cat}
                onClick={() => setFilter(cat)}
                className={`whitespace-nowrap shrink-0 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filter === cat
                    ? "bg-[#FFFDF9] text-[#6B1426] shadow-xs"
                    : "text-[#665851] hover:text-[#231917]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 animate-pulse rounded-lg border border-[#E5DAC8] bg-[#F3ECE0]"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {filtered.map((fac) => (
              <div
                key={fac.id}
                className="flex flex-col overflow-hidden rounded-lg border border-[#E5DAC8] bg-[#FFFDF9]"
              >
                <VenueImage
                  src={fac.image_url}
                  alt={fac.title}
                  title={fac.title}
                  className="h-60 w-full"
                />
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-xs text-[#665851]">
                      {fac.number} · {fac.category}
                    </p>
                    <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#231917]">
                      {fac.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#665851]">
                      {fac.summary}
                    </p>
                  </div>
                  <p className="mt-5 border-t border-[#E5DAC8] pt-3 text-xs font-medium text-[#6B1426]">
                    {fac.specification}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12">
          <VenueFloorInfographic />
        </div>

        <div className="mt-12 rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold text-[#231917]">
              Ready to plan your event layout?
            </h3>
            <p className="mt-1 text-sm text-[#665851]">
              Check available dates and submit your booking request for management review.
            </p>
          </div>
          <Button asChild>
            <Link to="/book">Book Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
