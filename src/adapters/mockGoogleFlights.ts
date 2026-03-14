import type { FlightAdapter } from "./base.js";
import type { AdapterResult, SearchInput } from "../types.js";

export const mockGoogleFlightsAdapter: FlightAdapter = {
  name: "mock-google-flights",
  enabledByDefault: true,
  async search(input: SearchInput): Promise<AdapterResult> {
    const now = new Date().toISOString();
    return {
      source: this.name,
      errors: [],
      offers: [
        {
          source: this.name,
          itineraryKey: `${input.origin}-${input.destination}-${input.departDate}-AK6112`,
          departAt: `${input.departDate}T08:20:00+08:00`,
          arriveAt: `${input.departDate}T09:35:00+08:00`,
          durationMin: 75,
          stops: 0,
          airline: "AirAsia",
          price: 119,
          currency: input.currency,
          baggageIncluded: input.baggage === "checked",
          promoTags: ["promo", "weekend-deal"],
          bookingUrl: "https://www.google.com/travel/flights",
          scrapedAt: now
        },
        {
          source: this.name,
          itineraryKey: `${input.origin}-${input.destination}-${input.departDate}-MH1234`,
          departAt: `${input.departDate}T12:50:00+08:00`,
          arriveAt: `${input.departDate}T14:10:00+08:00`,
          durationMin: 80,
          stops: 0,
          airline: "Malaysia Airlines",
          price: 179,
          currency: input.currency,
          baggageIncluded: true,
          promoTags: [],
          bookingUrl: "https://www.google.com/travel/flights",
          scrapedAt: now
        }
      ]
    };
  }
};
