import type { BusinessInfo, EventCategory, FacilityItem, FaqItem, GalleryImage } from "../types/venue";

export const VENUE_IMAGES = {
  heroHall: "/src/assets/images/hero_function_hall_1795025247949.jpg",
  diningHall: "/src/assets/images/dining_hall_banquet_1795025248215.jpg",
  mandapStage: "/src/assets/images/mandap_engagement_stage_1795025249173.jpg",
  bridalSuite: "/src/assets/images/bridal_groom_suite_1795025249959.jpg",
  corporateHall: "/src/assets/images/corporate_cultural_event_1795025249392.jpg",
  birthdayCelebration: "/src/assets/images/event_birthday_celebration_1795026288564.jpg",
  babyShower: "/src/assets/images/event_baby_shower_1795026289476.jpg",
  halfSaree: "/src/assets/images/event_half_saree_1795026290484.jpg",
  exhibitionShowcase: "/src/assets/images/event_exhibition_showcase_1795026290880.jpg",
  engagementCeremony: "/src/assets/images/event_engagement_ceremony_1795026290955.jpg",
} as const;

export function normalizeWhatsAppDigits(raw?: string | null): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function formatWhatsAppDisplay(digits?: string | null): string {
  const clean = normalizeWhatsAppDigits(digits);
  if (clean.length === 12 && clean.startsWith("91")) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return clean || "Configured via .env";
}

export function buildWhatsAppHref(digits?: string | null, text?: string): string {
  const clean = normalizeWhatsAppDigits(digits);
  if (!clean) return "#whatsapp-not-configured";
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${clean}${query}`;
}

export const BUSINESS_INFO: BusinessInfo = {
  name: "Vishnu Priya Function Hall",
  tagline: "Timeless Celebrations in the Heart of Eluru",
  address: "Tilak Colony, Santosh Nagar, Eluru, Andhra Pradesh 534002, India",
  city: "Eluru",
  state: "Andhra Pradesh",
  postal_code: "534002",
  country: "India",
  phone: "+91 75999 96956",
  whatsapp_number: normalizeWhatsAppDigits(import.meta.env.VITE_WHATSAPP_NUMBER || ""),
  email: "bookings@vishnupriyafunctionhall.in",
  seating_capacity: "150 - 200 Guests",
  operating_hours: "6:00 AM - 11:00 PM IST",
  timezone: "Asia/Kolkata",
  coordinates: {
    lat: 16.7107,
    lng: 81.0952,
  },
};

export const FACILITIES: FacilityItem[] = [
  {
    id: "ac-function-hall",
    number: "01",
    title: "Separate A/C Function Hall",
    category: "Hall & Dining",
    summary:
      "Climate-controlled main celebration hall engineered for 150 to 200 seated guests with unobstructed stage sightlines and acoustic clarity.",
    specification: "150-200 Guest Seating · Central Air Conditioning · Custom Stage",
    image_url: VENUE_IMAGES.heroHall,
  },
  {
    id: "ac-dining-hall",
    number: "02",
    title: "Separate A/C Dining Hall",
    category: "Hall & Dining",
    summary:
      "Dedicated air-conditioned banquet dining wing separated from the ceremony floor so traditional sit-down meals and buffets flow without crowding.",
    specification: "Dedicated Dining Wing · Full Climate Control · Hygienic Service",
    image_url: VENUE_IMAGES.diningHall,
  },
  {
    id: "bridal-groom-rooms",
    number: "03",
    title: "Dedicated Bridal & Groom Rooms",
    category: "Suites & Security",
    summary:
      "Two private air-conditioned preparation suites with full-length dressing mirrors, soft vanity lighting, and tranquil lounge seating.",
    specification: "2 Private Suites · En-suite Vanity · Direct Stage Access",
    image_url: VENUE_IMAGES.bridalSuite,
  },
  {
    id: "lift-accessibility",
    number: "04",
    title: "Passenger Lift Facility",
    category: "Comfort & Power",
    summary:
      "Smooth elevator access connecting arrival, ceremony, and dining levels for elders, families with children, and mobility comfort.",
    specification: "Multi-Floor Elevator · Wheelchair Friendly · Senior Comfort",
    image_url: VENUE_IMAGES.heroHall,
  },
  {
    id: "power-generator",
    number: "05",
    title: "24/7 Electricity & Generator Backup",
    category: "Comfort & Power",
    summary:
      "Continuous 24/7 power supply reinforced by heavy-duty automatic generator backup keeping air conditioning, stage lighting, and sound uninterrupted.",
    specification: "24/7 Utility Power · Full-Load Auto Generator Backup",
    image_url: VENUE_IMAGES.corporateHall,
  },
  {
    id: "parking-cctv",
    number: "06",
    title: "Spacious Parking & CCTV Surveillance",
    category: "Suites & Security",
    summary:
      "Generous off-street guest vehicle parking paired with 24-hour multi-zone CCTV monitoring across entrances, corridors, and parking bays.",
    specification: "Spacious Guest Parking · 24/7 High-Definition CCTV",
    image_url: VENUE_IMAGES.mandapStage,
  },
];

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: "small-weddings",
    title: "Small Weddings",
    group: "Family Celebrations",
    guest_range: "150 - 200 Guests",
    description:
      "Intimate Telugu and pan-Indian wedding ceremonies complete with carved mandap staging, dedicated bridal and groom suites, and A/C dining.",
    recommended_setup: "Traditional Mandap + Separate Sit-Down Banana Leaf Dining",
    image_url: VENUE_IMAGES.mandapStage,
  },
  {
    id: "engagements",
    title: "Engagements",
    group: "Family Celebrations",
    guest_range: "120 - 200 Guests",
    description:
      "Refined ring-exchange and nischitartham ceremonies bathed in warm chandelier lighting and custom floral arches.",
    recommended_setup: "Center Stage Floral Backdrop + Buffet Lounge",
    image_url: VENUE_IMAGES.engagementCeremony,
  },
  {
    id: "half-saree-functions",
    title: "Half-Saree Functions",
    group: "Family Celebrations",
    guest_range: "120 - 200 Guests",
    description:
      "Traditional Voni Function celebrations featuring vibrant floral backdrops, brass lamp staging, and comfortable family hospitality.",
    recommended_setup: "Ceremonial Throne & Floral Arch + Family Dining",
    image_url: VENUE_IMAGES.halfSaree,
  },
  {
    id: "baby-showers",
    title: "Baby Showers",
    group: "Family Celebrations",
    guest_range: "80 - 160 Guests",
    description:
      "Joyful Seemantham and baby shower gatherings with decorated ceremonial swing, accessible lift entry, and serene climate control.",
    recommended_setup: "Floral Ceremonial Swing + Afternoon High-Tea Dining",
    image_url: VENUE_IMAGES.babyShower,
  },
  {
    id: "birthdays",
    title: "Birthdays",
    group: "Family Celebrations",
    guest_range: "60 - 200 Guests",
    description:
      "Milestone first birthdays, 60th Sashtiabdapoorthi celebrations, and evening family dinners tailored to every generation.",
    recommended_setup: "Themed Photo Backdrop + Banquet Round Tables",
    image_url: VENUE_IMAGES.birthdayCelebration,
  },
  {
    id: "corporate-parties",
    title: "Corporate Parties",
    group: "Corporate & Cultural",
    guest_range: "100 - 200 Guests",
    description:
      "Executive appreciation dinners, annual milestone galas, and networking evenings supported by uninterrupted power and parking.",
    recommended_setup: "Banquet Rounds + Acoustic Stage Lighting",
    image_url: VENUE_IMAGES.diningHall,
  },
  {
    id: "meetings",
    title: "Meetings",
    group: "Corporate & Cultural",
    guest_range: "50 - 180 Guests",
    description:
      "Regional business conferences, dealer meets, and association assemblies in Eluru with crisp audio-visual readiness.",
    recommended_setup: "Theater or Classroom Seating + Breakout Dining",
    image_url: VENUE_IMAGES.corporateHall,
  },
  {
    id: "product-launches",
    title: "Product Launches",
    group: "Corporate & Cultural",
    guest_range: "80 - 200 Guests",
    description:
      "High-visibility brand unveilings and regional press showcases with dedicated stage illumination and vehicle parking.",
    recommended_setup: "Spotlight Stage + Reception Gallery",
    image_url: VENUE_IMAGES.corporateHall,
  },
  {
    id: "cultural-programs",
    title: "Cultural Programs",
    group: "Corporate & Cultural",
    guest_range: "120 - 200 Guests",
    description:
      "Classical Kuchipudi recitals, Carnatic music concerts, and community festivals with dedicated green rooms for artists.",
    recommended_setup: "Acoustic Auditorium + Artist Suites",
    image_url: VENUE_IMAGES.corporateHall,
  },
  {
    id: "exhibitions",
    title: "Exhibitions",
    group: "Corporate & Cultural",
    guest_range: "100 - 200 Guests",
    description:
      "Boutique handloom showcases, bridal trunk shows, and art exhibitions utilizing clean marble floor layouts and CCTV security.",
    recommended_setup: "Open-Floor Pavilion + Security Coverage",
    image_url: VENUE_IMAGES.exhibitionShowcase,
  },
  {
    id: "fundraisers",
    title: "Fundraisers",
    group: "Corporate & Cultural",
    guest_range: "100 - 200 Guests",
    description:
      "Philanthropic galas and community benefit evenings hosted in a dignified, accessible Eluru setting.",
    recommended_setup: "Gala Dinner Seating + Keynote Stage",
    image_url: VENUE_IMAGES.heroHall,
  },
];

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "gal-1",
    title: "Grand A/C Celebration Hall",
    category: "Function Hall",
    caption: "Champagne marble floor, crystal chandeliers, and maroon ceiling drapes set for 200 guests.",
    image_url: VENUE_IMAGES.heroHall,
  },
  {
    id: "gal-2",
    title: "Separate A/C Dining Wing",
    category: "Dining",
    caption: "Climate-controlled banquet dining room with brass accents and effortless guest circulation.",
    image_url: VENUE_IMAGES.diningHall,
  },
  {
    id: "gal-3",
    title: "Sacred Mandap & Wedding Stage",
    category: "Ceremony",
    caption: "Carved antique gold arch dressed with fresh crimson roses, jasmine garlands, and brass diyas.",
    image_url: VENUE_IMAGES.mandapStage,
  },
  {
    id: "gal-4",
    title: "Engagement & Ring Ceremony",
    category: "Ceremony",
    caption: "Orchid and crimson rose stage setting with plush seating and chandelier glow.",
    image_url: VENUE_IMAGES.engagementCeremony,
  },
  {
    id: "gal-5",
    title: "Half-Saree & Seemantham Decor",
    category: "Ceremony",
    caption: "Traditional marigold arches and jasmine ceremonial swings inside our A/C hall.",
    image_url: VENUE_IMAGES.halfSaree,
  },
  {
    id: "gal-6",
    title: "Milestone Birthdays & Exhibitions",
    category: "Function Hall",
    caption: "Adaptable champagne-floor layouts for family birthdays and boutique trunk shows.",
    image_url: VENUE_IMAGES.birthdayCelebration,
  },
  {
    id: "gal-7",
    title: "Private Bridal & Groom Suite",
    category: "Suites",
    caption: "Tranquil air-conditioned dressing lounge with gilded mirror and velvet seating.",
    image_url: VENUE_IMAGES.bridalSuite,
  },
  {
    id: "gal-8",
    title: "Corporate & Cultural Auditorium",
    category: "Corporate",
    caption: "Acoustic timber panels and tiered theater seating for summits, launches, and recitals.",
    image_url: VENUE_IMAGES.corporateHall,
  },
  {
    id: "gal-9",
    title: "Boutique Exhibitions & Trunk Shows",
    category: "Corporate",
    caption: "Marble exhibition gallery with spotlight arches and spacious visitor aisles.",
    image_url: VENUE_IMAGES.exhibitionShowcase,
  },
];

export const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "What is the guest seating capacity of Vishnu Priya Function Hall?",
    answer:
      "The main air-conditioned function hall comfortably accommodates 150 to 200 seated guests, complemented by a separate air-conditioned dining hall.",
  },
  {
    id: "faq-2",
    question: "Is there separate dining and preparation rooms for the bride and groom?",
    answer:
      "Yes. We provide a separate A/C dining hall as well as two dedicated air-conditioned rooms—one for the bride and one for the groom.",
  },
  {
    id: "faq-3",
    question: "How does the booking approval process work?",
    answer:
      "Once you submit a booking request online or via our AI chat bot, you receive a booking reference with PENDING status. Management reviews availability and confirms your reservation, after which your date is exclusively locked and confirmed via WhatsApp.",
  },
  {
    id: "faq-4",
    question: "Are power backup, lift access, and parking available?",
    answer:
      "Yes. The venue features 24/7 electricity with full-load generator backup, a passenger lift for elderly guests, spacious parking, and 24-hour CCTV surveillance.",
  },
];
