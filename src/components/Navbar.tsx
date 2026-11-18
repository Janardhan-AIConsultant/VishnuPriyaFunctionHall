import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const DESKTOP_LINKS = [
  { to: "/about", label: "About" },
  { to: "/facilities", label: "Facilities" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/availability", label: "Availability" },
];

const MOBILE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/facilities", label: "Facilities" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/availability", label: "Check Availability" },
  { to: "/contact", label: "Contact Us" },
  { to: "/admin", label: "Admin Portal" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5DAC8] bg-[#FBF8F3]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand logo & wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <img
            src="/favicon.ico"
            alt="Vishnu Priya Function Hall logo"
            className="h-10 w-10 rounded-md border border-[#D8CBB8] bg-[#FFFDF9] object-contain shrink-0"
          />
          <span className="font-display text-2xl font-semibold tracking-tight text-[#6B1426] transition-colors group-hover:text-[#520F1D]">
            Vishnu Priya
          </span>
        </Link>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A4B44]"
        >
          {DESKTOP_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#6B1426]",
                  isActive
                    ? "text-[#6B1426] border-b border-[#B58938]"
                    : "text-[#5A4B44]"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Single primary CTA action */}
        <div className="flex items-center gap-3 shrink-0">
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link to="/book">Book Now</Link>
          </Button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E5DAC8] text-[#231917] md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E5DAC8] bg-[#FFFDF9] px-4 py-4 md:hidden">
          <nav className="flex flex-col space-y-1">
            {MOBILE_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#F3ECE0] text-[#6B1426]"
                      : "text-[#231917] hover:bg-[#F3ECE0]/60"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2">
              <Button asChild className="w-full" onClick={() => setMobileOpen(false)}>
                <Link to="/book">Book Now</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
