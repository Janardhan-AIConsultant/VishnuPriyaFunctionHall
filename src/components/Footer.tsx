import { Link } from "react-router-dom";
import { BUSINESS_INFO } from "../data/venueData";

export function Footer() {
  return (
    <footer className="border-t border-[#E5DAC8] bg-[#F3ECE0] text-[#231917]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-[#6B1426]"
            >
              <img
                src="/favicon.ico"
                alt="Vishnu Priya Function Hall logo"
                className="h-10 w-10 rounded-md border border-[#D8CBB8] bg-[#FFFDF9] object-contain shrink-0"
              />
              <span>Vishnu Priya Function Hall</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#665851] max-w-sm">
              {BUSINESS_INFO.address}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#231917] pt-1">
              <a
                href="tel:+917599996956"
                className="font-medium hover:text-[#6B1426] transition-colors"
              >
                {BUSINESS_INFO.phone}
              </a>
              <span aria-hidden="true" className="text-[#B58938]">
                ·
              </span>
              <span className="text-[#665851]">{BUSINESS_INFO.seating_capacity}</span>
            </div>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="font-display text-lg font-semibold text-[#231917]">
              Explore Venue
            </h4>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-[#665851]">
              <li>
                <Link to="/about" className="hover:text-[#6B1426] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/facilities" className="hover:text-[#6B1426] transition-colors">
                  Facilities
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-[#6B1426] transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-[#6B1426] transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/availability" className="hover:text-[#6B1426] transition-colors">
                  Check Availability
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#6B1426] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-display text-lg font-semibold text-[#231917]">
              Reservations & Desk
            </h4>
            <ul className="space-y-2 text-sm text-[#665851]">
              <li>
                <Link to="/book" className="font-medium text-[#6B1426] hover:underline">
                  Request a Booking Date
                </Link>
              </li>
              <li>
                <Link to="/availability" className="hover:text-[#6B1426] transition-colors">
                  Track Booking Reference
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#6B1426] transition-colors">
                  Management Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#DFD2BE] pt-6 text-xs text-[#665851] sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Vishnu Priya Function Hall, Eluru. All rights reserved.
          </p>
          <p>Tilak Colony, Santosh Nagar, Eluru, Andhra Pradesh 534002</p>
        </div>
      </div>
    </footer>
  );
}
