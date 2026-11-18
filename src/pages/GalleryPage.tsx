import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { venueApi } from "../lib/api";
import type { GalleryImage } from "../types/venue";
import { VenueImage } from "../components/VenueImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const GALLERY_CATEGORIES = [
  "All",
  "Function Hall",
  "Dining",
  "Ceremony",
  "Suites",
  "Corporate",
] as const;

export function GalleryPage() {
  const [filter, setFilter] = useState<(typeof GALLERY_CATEGORIES)[number]>("All");
  const [selected, setSelected] = useState<GalleryImage | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: venueApi.getGallery,
  });

  const visible =
    filter === "All" ? images : images.filter((img) => img.category === filter);

  return (
    <div className="bg-[#FBF8F3] py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-[#6B1426]">
              Spaces & Atmosphere
            </p>
            <h1
              className="font-display font-semibold text-[#231917]"
              style={{ fontSize: "clamp(2.25rem, 3.6vw, 3.25rem)" }}
            >
              Venue Gallery
            </h1>
            <p className="text-base text-[#665851]">
              Step inside our air-conditioned celebration hall, dining wing,
              traditional mandap stages, and private preparation suites.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Gallery categories"
            className="flex flex-wrap items-center gap-1 rounded-md border border-[#E5DAC8] bg-[#F3ECE0] p-1"
          >
            {GALLERY_CATEGORIES.map((cat) => (
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
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 animate-pulse rounded-lg border border-[#E5DAC8] bg-[#F3ECE0]"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelected(img)}
                className="group flex flex-col overflow-hidden rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] text-left transition-colors hover:border-[#B58938] cursor-pointer"
              >
                <div className="overflow-hidden">
                  <VenueImage
                    src={img.image_url}
                    alt={img.title}
                    title={img.title}
                    className="h-60 w-full transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs text-[#665851]">{img.category}</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#231917]">
                    {img.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#665851] leading-relaxed">
                    {img.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-3xl p-4 sm:p-6">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>{selected.title}</DialogTitle>
                  <DialogDescription>{selected.caption}</DialogDescription>
                </DialogHeader>
                <div className="overflow-hidden rounded-md border border-[#E5DAC8]">
                  <VenueImage
                    src={selected.image_url}
                    alt={selected.title}
                    title={selected.title}
                    className="max-h-[70vh] w-full"
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
