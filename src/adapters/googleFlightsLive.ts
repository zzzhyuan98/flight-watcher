import { chromium } from "playwright";
import type { FlightAdapter } from "./base.js";
import type { AdapterResult, FlightOffer, SearchInput } from "../types.js";

const AIRLINES = [
  "AirAsia",
  "Malaysia Airlines",
  "Batik Air",
  "Thai Airways",
  "Scoot",
  "Singapore Airlines",
  "Jetstar",
  "Emirates",
  "Qatar Airways",
  "Etihad Airways",
  "Cathay Pacific",
  "ANA",
  "Japan Airlines",
  "Peach",
  "ZIPAIR",
  "Thai AirAsia"
];

function buildGoogleFlightsUrl(input: SearchInput): string {
  const out = `${input.origin}.${input.destination}.${input.departDate}`;
  const back = input.returnDate ? `*${input.destination}.${input.origin}.${input.returnDate}` : "";
  return `https://www.google.com/travel/flights?hl=en#flt=${out}${back};c:${input.currency};e:1;sd:1;t:f`;
}

function extractOffersFromText(text: string, input: SearchInput, source: string): FlightOffer[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const offers: FlightOffer[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const priceMatch = line.match(new RegExp(`(?:${input.currency}|RM|MYR)\\s?([0-9][0-9,]*)`, "i"));
    if (!priceMatch) continue;

    const price = Number(priceMatch[1].replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0) continue;

    const windowStart = Math.max(0, i - 8);
    const windowEnd = Math.min(lines.length, i + 8);
    const nearby = lines.slice(windowStart, windowEnd).join(" \n ");

    let airline = AIRLINES.find((a) => nearby.toLowerCase().includes(a.toLowerCase())) ?? "Unknown Airline";

    // Try to avoid too many duplicate entries from repeated fare chips
    const key = `${airline}-${price}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const promoTags: string[] = [];
    const nearbyLower = nearby.toLowerCase();
    if (nearbyLower.includes("sale")) promoTags.push("sale");
    if (nearbyLower.includes("promo")) promoTags.push("promo");
    if (nearbyLower.includes("deal")) promoTags.push("deal");

    offers.push({
      source,
      itineraryKey: `${input.origin}-${input.destination}-${input.departDate}-${airline}-${price}`,
      departAt: `${input.departDate}T00:00:00Z`,
      arriveAt: `${input.departDate}T00:00:00Z`,
      durationMin: 999,
      stops: 0,
      airline,
      price,
      currency: input.currency,
      baggageIncluded: input.baggage === "checked",
      promoTags,
      bookingUrl: buildGoogleFlightsUrl(input),
      scrapedAt: new Date().toISOString()
    });

    if (offers.length >= 15) break;
  }

  return offers;
}

export const googleFlightsLiveAdapter: FlightAdapter = {
  name: "google-flights-live",
  enabledByDefault: false,
  async search(input: SearchInput): Promise<AdapterResult> {
    const url = buildGoogleFlightsUrl(input);
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(5000);

      const text = await page.evaluate(() => document.body?.innerText ?? "");
      const offers = extractOffersFromText(text, input, this.name);

      if (!offers.length) {
        return {
          source: this.name,
          offers: [],
          errors: ["No fares parsed from Google Flights page. UI may have changed or content blocked."],
          disabled: false
        };
      }

      return { source: this.name, offers, errors: [] };
    } catch (err) {
      return {
        source: this.name,
        offers: [],
        errors: [err instanceof Error ? err.message : "Unknown browser error"]
      };
    } finally {
      await browser.close();
    }
  }
};
