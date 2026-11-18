import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { venueApi } from "../lib/api";
import { VenueImage } from "../components/VenueImage";
import { SeatingCapacityInfographic } from "../components/VenueInfographics";

const EVENT_GROUPS = ["All", "Family Celebrations", "Corporate & Cultural"] as const;

export function EventsPage() {
  const [group, setGroup] = useState<(typeof EVENT_GROUPS)[number]>("All");
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: venueApi.getEvents,
  });

  const visibleEvents =
    group === "All" ? events : events.filter((e) => e.group === group);

  return (
    <div className="bg-[#FBF8F3] py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-[#6B1426]">
              Occasions We Host
            </p>
            <h1
              className="font-display font-semibold text-[#231917]"
              style={{ fontSize: "clamp(2.25rem, 3.6vw, 3.25rem)" }}
            >
              Celebrations & Gatherings
            </h1>
            <p className="text-base text-[#665851]">
              From intimate Telugu weddings and half-saree ceremonies to corporate
              summits, product launches, and classical recitals.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Event groups"
            className="flex flex-wrap items-center gap-1 rounded-md border border-[#E5DAC8] bg-[#F3ECE0] p-1"
          >
            {EVENT_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={group === g}
                onClick={() => setGroup(g)}
                className={`whitespace-nowrap shrink-0 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  group === g
                    ? "bg-[#FFFDF9] text-[#6B1426] shadow-xs"
                    : "text-[#665851] hover:text-[#231917]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <SeatingCapacityInfographic />
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-80 animate-pulse rounded-lg border border-[#E5DAC8] bg-[#F3ECE0]"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col overflow-hidden rounded-lg border border-[#E5DAC8] bg-[#FFFDF9]"
              >
                <VenueImage
                  src={ev.image_url}
                  alt={ev.title}
                  title={ev.title}
                  className="h-48 w-full"
                />
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-xs text-[#665851]">
                      {ev.group} · {ev.guest_range}
                    </p>
                    <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#231917]">
                      {ev.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#665851]">
                      {ev.description}
                    </p>
                    <p className="mt-3 text-xs text-[#231917]">
                      <span className="font-medium text-[#665851]">Setup:</span>{" "}
                      {ev.recommended_setup}
                    </p>
                  </div>
                  <div className="mt-5 border-t border-[#E5DAC8] pt-3">
                    <Link
                      to={`/book?event=${encodeURIComponent(ev.title)}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B1426] hover:underline"
                    >
                      Book for {ev.title} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
