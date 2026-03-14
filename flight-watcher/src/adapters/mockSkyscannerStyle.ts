import type { FlightAdapter } from "./base.js";
import type { AdapterResult, SearchInput } from "../types.js";

export const mockSkyscannerStyleAdapter: FlightAdapter = {
  name: "mock-skyscanner-style",
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
          price: 115,
          currency: input.currency,
          baggageIncluded: false,
          promoTags: ["limited-time"],
          bookingUrl: "https://www.skyscanner.com/transport/flights",
          scrapedAt: now
        },
        {
          source: this.name,
          itineraryKey: `${input.origin}-${input.destination}-${input.departDate}-OD1001`,
          departAt: `${input.departDate}T18:35:00+08:00`,
          arriveAt: `${input.departDate}T19:45:00+08:00`,
          durationMin: 70,
          stops: 0,
          airline: "Batik Air",
          price: 132,
          currency: input.currency,
          baggageIncluded: false,
          promoTags: ["flash-sale"],
          bookingUrl: "https://www.skyscanner.com/transport/flights",
          scrapedAt: now
        }
      ]
    };
  }
};
