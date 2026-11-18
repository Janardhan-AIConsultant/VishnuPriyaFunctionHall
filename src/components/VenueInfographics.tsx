import { useState } from "react";
import {
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Utensils,
  Zap,
} from "lucide-react";

interface FloorZone {
  id: string;
  code: string;
  name: string;
  capacity: string;
  highlights: string[];
  flowNote: string;
}

const FLOOR_ZONES: FloorZone[] = [
  {
    id: "main-hall",
    code: "ZONE A",
    name: "Main A/C Function Hall",
    capacity: "150 – 200 Seated Guests",
    highlights: [
      "Elevated floral & mandap stage with warm chandelier illumination",
      "Column-free sightlines and acoustic wall treatments",
      "Central air conditioning powered by 24/7 generator backup",
    ],
    flowNote: "Direct entry from passenger lift lobby and private bridal/groom suites.",
  },
  {
    id: "dining-wing",
    code: "ZONE B",
    name: "Separate A/C Dining Wing",
    capacity: "120+ Simultaneous Diners",
    highlights: [
      "Completely separated from main ceremony floor to preserve serenity",
      "Supports traditional banana-leaf sit-down rows or buffet counters",
      "Dedicated handwash promenade and hygienic catering service entry",
    ],
    flowNote: "Guests transition smoothly via wide corridor without disrupting rituals.",
  },
  {
    id: "suites",
    code: "ZONE C",
    name: "Bridal & Groom Preparation Suites",
    capacity: "2 Private A/C Suites",
    highlights: [
      "Dedicated suite for the bride and separate suite for the groom",
      "Full-length gilded dressing mirrors and vanity lighting",
      "Quiet lounge seating with secure locker storage",
    ],
    flowNote: "Positioned behind the stage wing for effortless ceremonial entrances.",
  },
  {
    id: "access-security",
    code: "ZONE D",
    name: "Lift Foyer, Parking & 24/7 Utilities",
    capacity: "Multi-Zone Security & Power",
    highlights: [
      "Passenger lift connecting ground arrival, function hall, and dining",
      "Spacious off-street guest vehicle parking in Tilak Colony",
      "24/7 electricity, auto-start generator backup, and CCTV coverage",
    ],
    flowNote: "Step-free elder comfort from car drop-off to main seating.",
  },
];

export function VenueFloorInfographic() {
  const [activeId, setActiveId] = useState<string>(FLOOR_ZONES[0].id);
  const active = FLOOR_ZONES.find((z) => z.id === activeId) ?? FLOOR_ZONES[0];

  return (
    <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-[#E5DAC8] pb-5">
        <div>
          <p className="text-xs font-medium text-[#6B1426]">
            Interactive Architectural Blueprint
          </p>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#231917]">
            Two-Wing Venue Layout & Guest Flow
          </h3>
        </div>
        <p className="text-xs text-[#665851]">
          Select any zone on the schematic to inspect dimensions & hospitality flow
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Interactive Architectural Floor Plan SVG */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-md border border-[#E5DAC8] bg-[#FBF8F3] p-4 sm:p-5">
          <svg
            viewBox="0 0 640 380"
            className="w-full h-auto"
            role="img"
            aria-label="Vishnu Priya Function Hall two-wing floor plan schematic"
          >
            {/* Outer Campus Border */}
            <rect
              x="12"
              y="12"
              width="616"
              height="356"
              rx="8"
              fill="#FFFDF9"
              stroke="#D8CBB8"
              strokeWidth="1.5"
            />

            {/* Zone C: Bridal & Groom Suites (Top Left) */}
            <g
              onClick={() => setActiveId("suites")}
              className="cursor-pointer"
            >
              <rect
                x="28"
                y="28"
                width="175"
                height="96"
                rx="6"
                fill={activeId === "suites" ? "#6B1426" : "#F3ECE0"}
                stroke={activeId === "suites" ? "#4E0D1B" : "#B58938"}
                strokeWidth="1.5"
              />
              <text
                x="42"
                y="54"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fill={activeId === "suites" ? "#D4B475" : "#6B1426"}
              >
                ZONE C · 2 SUITES
              </text>
              <text
                x="42"
                y="76"
                fontSize="14"
                fontWeight="600"
                fontFamily="Cormorant Garamond, serif"
                fill={activeId === "suites" ? "#FFFDF9" : "#231917"}
              >
                Bridal & Groom Rooms
              </text>
              <text
                x="42"
                y="96"
                fontSize="11"
                fill={activeId === "suites" ? "#F3ECE0" : "#665851"}
              >
                Private A/C Vanity & Lounge
              </text>
            </g>

            {/* Stage Indicator */}
            <rect
              x="215"
              y="28"
              width="170"
              height="38"
              rx="4"
              fill="#B58938"
              fillOpacity="0.18"
              stroke="#B58938"
              strokeWidth="1.2"
            />
            <text
              x="300"
              y="51"
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#6B1426"
            >
              MANDAP / CEREMONY STAGE
            </text>

            {/* Zone A: Main Function Hall */}
            <g
              onClick={() => setActiveId("main-hall")}
              className="cursor-pointer"
            >
              <rect
                x="28"
                y="136"
                width="357"
                height="148"
                rx="6"
                fill={activeId === "main-hall" ? "#6B1426" : "#F3ECE0"}
                stroke={activeId === "main-hall" ? "#4E0D1B" : "#B58938"}
                strokeWidth="1.5"
              />
              {/* Seating Grid Visual */}
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3, 4, 5].map((col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={60 + col * 52}
                    cy={208 + row * 18}
                    r="3.5"
                    fill={activeId === "main-hall" ? "#D4B475" : "#B58938"}
                    fillOpacity="0.6"
                  />
                ))
              )}
              <text
                x="44"
                y="162"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fill={activeId === "main-hall" ? "#D4B475" : "#6B1426"}
              >
                ZONE A · CENTRAL A/C
              </text>
              <text
                x="44"
                y="186"
                fontSize="19"
                fontWeight="600"
                fontFamily="Cormorant Garamond, serif"
                fill={activeId === "main-hall" ? "#FFFDF9" : "#231917"}
              >
                Main Function Hall (150–200 Guests)
              </text>
            </g>

            {/* Connecting Corridor Arrows */}
            <path
              d="M 390 210 L 420 210"
              stroke="#B58938"
              strokeWidth="2"
              strokeDasharray="4 3"
            />

            {/* Zone B: Separate A/C Dining Wing */}
            <g
              onClick={() => setActiveId("dining-wing")}
              className="cursor-pointer"
            >
              <rect
                x="424"
                y="28"
                width="188"
                height="256"
                rx="6"
                fill={activeId === "dining-wing" ? "#6B1426" : "#F3ECE0"}
                stroke={activeId === "dining-wing" ? "#4E0D1B" : "#B58938"}
                strokeWidth="1.5"
              />
              {/* Dining Table Visuals */}
              {[0, 1, 2].map((r) => (
                <rect
                  key={r}
                  x="448"
                  y={124 + r * 46}
                  width="140"
                  height="20"
                  rx="3"
                  fill={activeId === "dining-wing" ? "#D4B475" : "#B58938"}
                  fillOpacity="0.35"
                />
              ))}
              <text
                x="440"
                y="54"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fill={activeId === "dining-wing" ? "#D4B475" : "#6B1426"}
              >
                ZONE B · SEPARATE A/C
              </text>
              <text
                x="440"
                y="80"
                fontSize="18"
                fontWeight="600"
                fontFamily="Cormorant Garamond, serif"
                fill={activeId === "dining-wing" ? "#FFFDF9" : "#231917"}
              >
                Dining Wing
              </text>
              <text
                x="440"
                y="102"
                fontSize="11"
                fill={activeId === "dining-wing" ? "#F3ECE0" : "#665851"}
              >
                Sit-Down & Buffet Lanes
              </text>
            </g>

            {/* Zone D: Lift Lobby, Parking & Power */}
            <g
              onClick={() => setActiveId("access-security")}
              className="cursor-pointer"
            >
              <rect
                x="28"
                y="296"
                width="584"
                height="56"
                rx="6"
                fill={activeId === "access-security" ? "#6B1426" : "#F3ECE0"}
                stroke={activeId === "access-security" ? "#4E0D1B" : "#B58938"}
                strokeWidth="1.5"
              />
              <text
                x="44"
                y="320"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fill={activeId === "access-security" ? "#D4B475" : "#6B1426"}
              >
                ZONE D · INFRASTRUCTURE & ARRIVAL
              </text>
              <text
                x="44"
                y="340"
                fontSize="14"
                fontWeight="600"
                fill={activeId === "access-security" ? "#FFFDF9" : "#231917"}
              >
                Passenger Lift · Spacious Guest Parking · 24/7 Power & Generator · CCTV Perimeter
              </text>
            </g>
          </svg>

          <div className="mt-3 flex flex-wrap gap-2">
            {FLOOR_ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setActiveId(z.id)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeId === z.id
                    ? "bg-[#6B1426] text-[#FFFDF9]"
                    : "border border-[#D8CBB8] bg-[#FFFDF9] text-[#231917] hover:border-[#B58938]"
                }`}
              >
                {z.code}: {z.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Zone Specification Card */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-md border border-[#E5DAC8] bg-[#FBF8F3] p-6">
          <div className="space-y-4">
            <div>
              <p className="font-mono text-xs font-semibold text-[#6B1426]">
                {active.code} · {active.capacity}
              </p>
              <h4 className="mt-1 font-display text-2xl font-semibold text-[#231917]">
                {active.name}
              </h4>
            </div>

            <ul className="space-y-3 border-t border-[#E5DAC8] pt-4 text-sm text-[#231917]">
              {active.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#B58938] shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-[#5A4B44]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded border border-[#E5DAC8] bg-[#FFFDF9] p-4 text-xs text-[#665851] leading-relaxed">
            <strong className="text-[#231917]">Hospitality Flow:</strong> {active.flowNote}
          </div>
        </div>
      </div>
    </div>
  );
}

const SEATING_MODES = [
  {
    label: "Theater & Cultural Recitals",
    guests: 200,
    max: 200,
    note: "Full auditorium seating facing stage",
  },
  {
    label: "Traditional Mandap + Dining",
    guests: 180,
    max: 200,
    note: "Ceremony floor + separate A/C dining wing",
  },
  {
    label: "Banquet Round Tables",
    guests: 160,
    max: 200,
    note: "Social rounds with wide aisle service",
  },
  {
    label: "Exhibitions & Trunk Shows",
    guests: 200,
    max: 200,
    note: "Boutique stalls along perimeter arches",
  },
];

export function SeatingCapacityInfographic() {
  return (
    <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs font-medium text-[#6B1426]">
            Capacity & Space Matrix
          </p>
          <h3 className="font-display text-3xl font-semibold text-[#231917]">
            Tailored Configurations for 150–200 Guests
          </h3>
          <p className="text-sm leading-relaxed text-[#665851]">
            Every celebration format adapts cleanly between our main celebration
            floor and separate air-conditioned dining hall without crowding.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded border border-[#E5DAC8] bg-[#FBF8F3] p-3">
              <Building2 className="h-4 w-4 text-[#6B1426]" />
              <p className="mt-1.5 font-mono text-lg font-semibold text-[#231917] tabular-nums">
                2 Wings
              </p>
              <p className="text-xs text-[#665851]">A/C Hall & Dining</p>
            </div>
            <div className="rounded border border-[#E5DAC8] bg-[#FBF8F3] p-3">
              <Utensils className="h-4 w-4 text-[#6B1426]" />
              <p className="mt-1.5 font-mono text-lg font-semibold text-[#231917] tabular-nums">
                120+
              </p>
              <p className="text-xs text-[#665851]">Dining Batch</p>
            </div>
            <div className="rounded border border-[#E5DAC8] bg-[#FBF8F3] p-3">
              <Zap className="h-4 w-4 text-[#6B1426]" />
              <p className="mt-1.5 font-mono text-lg font-semibold text-[#231917] tabular-nums">
                24/7
              </p>
              <p className="text-xs text-[#665851]">Gen Power & CCTV</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {SEATING_MODES.map((mode) => {
            const pct = Math.round((mode.guests / mode.max) * 100);
            return (
              <div
                key={mode.label}
                className="rounded-md border border-[#E5DAC8] bg-[#FBF8F3] p-4"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#231917]">
                      {mode.label}
                    </p>
                    <p className="text-xs text-[#665851]">{mode.note}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#6B1426] tabular-nums whitespace-nowrap">
                    Up to {mode.guests} Guests
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#E8DEC9]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6B1426] to-[#B58938]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BookingProcessInfographic() {
  const steps = [
    {
      num: "01",
      title: "Check Date Openness",
      desc: "Verify live availability in Asia/Kolkata against confirmed events.",
      icon: CalendarCheck2,
    },
    {
      num: "02",
      title: "Receive PENDING Ref",
      desc: "Submit event details and get a unique VPFH reference code immediately.",
      icon: Clock,
    },
    {
      num: "03",
      title: "Management Date Lock",
      desc: "Admin approves once; PostgreSQL transaction locks the date exclusively.",
      icon: ShieldCheck,
    },
    {
      num: "04",
      title: "WhatsApp & Calendar Sync",
      desc: "Receive official WhatsApp confirmation while Google Calendar syncs.",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="rounded-lg border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8">
      <div className="max-w-2xl mb-8">
        <p className="text-xs font-medium text-[#6B1426]">
          Transparent Reservation Lifecycle
        </p>
        <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#231917]">
          From Inquiry to Exclusively Confirmed Date
        </h3>
      </div>

      <div className="relative grid gap-6 md:grid-cols-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="relative flex flex-col justify-between rounded-md border border-[#E5DAC8] bg-[#FBF8F3] p-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#B58938]">
                    STEP {s.num}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5DAC8] bg-[#FFFDF9] text-[#6B1426]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h4 className="mt-3 font-display text-xl font-semibold text-[#231917]">
                  {s.title}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[#665851]">
                  {s.desc}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className="mt-4 hidden md:block text-right font-mono text-xs text-[#B58938]">
                  Next &rarr;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
