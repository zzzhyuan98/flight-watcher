import { describe, it, expect } from "vitest";
import { mockGoogleFlightsAdapter } from "../src/adapters/mockGoogleFlights.js";

describe("mock adapter", () => {
  it("returns offers and promo tags", async () => {
    const result = await mockGoogleFlightsAdapter.search({
      origin: "KUL",
      destination: "BKK",
      departDate: "2026-04-10",
      adults: 1,
      children: 0,
      cabin: "economy",
      baggage: "carry_on",
      currency: "MYR",
      maxStops: 2
    });

    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.offers.some((o) => o.promoTags.length > 0)).toBe(true);
  });
});
