import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AvailabilityPage } from "../pages/AvailabilityPage";
import { BookNowPage } from "../pages/BookNowPage";
import { FloatingConcierge } from "../components/FloatingConcierge";
import { Navbar } from "../components/Navbar";
import {
  SeatingCapacityInfographic,
  VenueFloorInfographic,
} from "../components/VenueInfographics";
import { PaymentGatewayPanel } from "../components/PaymentGatewayPanel";
import { EVENT_CATEGORIES } from "../data/venueData";

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Frontend Pages & Components", () => {
  it("AvailabilityPage looks up seeded booking reference VPFH-2026-1048", async () => {
    renderWithProviders(<AvailabilityPage />);
    const input = screen.getByLabelText(/Booking Reference Code/i);
    fireEvent.change(input, { target: { value: "VPFH-2026-1048" } });
    fireEvent.click(screen.getByRole("button", { name: /Check Reference/i }));

    await waitFor(() => {
      expect(screen.getByText(/Status: PENDING/i)).toBeInTheDocument();
    });
  });

  it("BookNowPage validates date availability before advancing", async () => {
    renderWithProviders(<BookNowPage />);
    const continueBtn = screen.getByRole("button", { name: /Continue to Guest Details/i });
    expect(continueBtn).toBeDisabled();

    const dateInput = screen.getByLabelText(/Event Date/i);
    const future = new Date();
    future.setDate(future.getDate() + 60);
    fireEvent.change(dateInput, { target: { value: future.toISOString().slice(0, 10) } });
    fireEvent.click(screen.getByRole("button", { name: /Check Availability/i }));

    await waitFor(() => {
      expect(screen.getByText(/AVAILABLE/i)).toBeInTheDocument();
    });
    expect(continueBtn).toBeEnabled();
  });

  it("FloatingConcierge opens Mythri chatbot, displays all default questions one by one, and answers inquiry", async () => {
    renderWithProviders(<FloatingConcierge />);
    fireEvent.click(screen.getByRole("button", { name: /Open Chat Bot/i }));

    expect(screen.getByRole("dialog", { name: /Mythri — Vishnu Priya Chat Bot/i })).toBeInTheDocument();
    expect(screen.getByText("Mythri")).toBeInTheDocument();
    expect(screen.queryByText("Venue Chat Bot")).not.toBeInTheDocument();
    expect(screen.getByText(/What facilities and seating capacity do you have\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Which events can we host\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Check availability for 2026-12-15/i)).toBeInTheDocument();
    expect(screen.getByText(/Where is the hall located in Eluru\?/i)).toBeInTheDocument();
    expect(screen.getByText(/How does the booking approval process work\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/What facilities and seating capacity do you have/i));

    await waitFor(() => {
      expect(screen.getByText(/150–200 guests/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Default Questions \(5\)/i })).toBeInTheDocument();
  });

  it("VenueFloorInfographic switches zones interactively and SeatingCapacityInfographic renders", () => {
    renderWithProviders(
      <>
        <VenueFloorInfographic />
        <SeatingCapacityInfographic />
      </>
    );

    expect(screen.getByText(/Two-Wing Venue Layout & Guest Flow/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ZONE B: Separate A\/C Dining Wing/i }));
    expect(screen.getByText(/120\+ Simultaneous Diners/i)).toBeInTheDocument();

    expect(screen.getByText(/Tailored Configurations for 150–200 Guests/i)).toBeInTheDocument();
    expect(screen.getByText(/Theater & Cultural Recitals/i)).toBeInTheDocument();
  });

  it("assigns distinct event-matched photography for birthdays, baby showers, half-saree, and exhibitions", () => {
    const byId = Object.fromEntries(EVENT_CATEGORIES.map((e) => [e.id, e.image_url]));
    expect(byId["birthdays"]).toContain("event_birthday_celebration");
    expect(byId["baby-showers"]).toContain("event_baby_shower");
    expect(byId["half-saree-functions"]).toContain("event_half_saree");
    expect(byId["exhibitions"]).toContain("event_exhibition_showcase");
    expect(byId["engagements"]).toContain("event_engagement_ceremony");
  });

  it("PaymentGatewayPanel supports PhonePe, Google Pay, and WhatsApp and shows Payment Successful confirmation", async () => {
    renderWithProviders(<PaymentGatewayPanel bookingReference="VPFH-2026-1048" />);

    expect(screen.getByRole("button", { name: /^PhonePe/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Google Pay/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pay from WhatsApp/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Pay from WhatsApp/i }));
    fireEvent.click(screen.getByRole("button", { name: /Pay Rs\. 15,000 via Pay from WhatsApp/i }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Pay from WhatsApp/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Confirm Payment & Get Receipt/i }));

    await waitFor(() => {
      expect(screen.getByText(/Advance Payment Confirmed/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Payment Successful/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("Navbar header renders the logo alongside the Vishnu Priya brand name", () => {
    renderWithProviders(<Navbar />);
    const header = screen.getByRole("banner");
    const logo = screen.getByAltText(/Vishnu Priya Function Hall logo/i);
    expect(header).toContainElement(logo);
    expect(logo).toHaveAttribute("src", "/favicon.ico");
    expect(header).toHaveTextContent("Vishnu Priya");
  });
});
