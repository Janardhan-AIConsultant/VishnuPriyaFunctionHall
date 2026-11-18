import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "../lib/utils";

interface VenueImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
}

export function VenueImage({ src, alt, title, className }: VenueImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-gradient-to-br from-[#F3ECE0] via-[#EBE0CE] to-[#DFCEB2] p-6 text-center text-[#6B1426]",
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Building2 className="h-8 w-8 text-[#B58938] mb-2" />
        <p className="font-display text-lg font-semibold text-[#231917]">
          {title || "Vishnu Priya Function Hall"}
        </p>
        <p className="text-xs text-[#665851] mt-1">Eluru, Andhra Pradesh</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
