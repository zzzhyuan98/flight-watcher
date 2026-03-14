import { describe, it, expect } from "vitest";
import { dedupeCheapest, rankOffers } from "../src/core/rank.js";
describe("rank and dedupe", () => {
    it("keeps cheapest duplicate itinerary", () => {
        const offers = [
            {
                source: "a", itineraryKey: "KUL-BKK-1", departAt: "2026-04-01T00:00:00Z", arriveAt: "2026-04-01T01:00:00Z", durationMin: 60, stops: 0, airline: "A", price: 100, currency: "MYR", baggageIncluded: false, promoTags: [], scrapedAt: new Date().toISOString()
            },
            {
                source: "b", itineraryKey: "KUL-BKK-1", departAt: "2026-04-01T00:00:00Z", arriveAt: "2026-04-01T01:00:00Z", durationMin: 60, stops: 0, airline: "A", price: 90, currency: "MYR", baggageIncluded: false, promoTags: [], scrapedAt: new Date().toISOString()
            }
        ];
        const out = dedupeCheapest(offers);
        expect(out).toHaveLength(1);
        expect(out[0].price).toBe(90);
    });
    it("ranks lower score first", () => {
        const ranked = rankOffers([
            {
                source: "a", itineraryKey: "1", departAt: "", arriveAt: "", durationMin: 60, stops: 0, airline: "A", price: 120, currency: "MYR", baggageIncluded: false, promoTags: [], scrapedAt: ""
            },
            {
                source: "b", itineraryKey: "2", departAt: "", arriveAt: "", durationMin: 60, stops: 0, airline: "B", price: 100, currency: "MYR", baggageIncluded: true, promoTags: [], scrapedAt: ""
            }
        ]);
        expect(ranked[0].itineraryKey).toBe("2");
    });
});
