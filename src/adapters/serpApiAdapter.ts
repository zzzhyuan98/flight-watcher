import type { FlightAdapter } from "./base.js";
import type { AdapterResult, FlightOffer, SearchInput } from "../types.js";

type SerpApiFlight = {
  price?: number;
  airline?: string;
  flights?: Array<{ airline?: string; flight_number?: string; departure_airport?: { time?: string }; arrival_airport?: { time?: string } }>;
  total_duration?: number;
  layovers?: unknown[];
};

type SerpApiResponse = {
  best_flights?: SerpApiFlight[];
  other_flights?: SerpApiFlight[];
};

function normalizeFlight(f: SerpApiFlight, input: SearchInput, idx: number, source: string): FlightOffer | null {
  const price = Number(f.price ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const firstLeg = f.flights?.[0];
  const lastLeg = f.flights?.[f.flights.length - 1];
  const airline = firstLeg?.airline ?? f.airline ?? "Unknown Airline";
  const flightNo = firstLeg?.flight_number ?? "0000";
  const stops = Array.isArray(f.layovers) ? f.layovers.length : Math.max(0, (f.flights?.length ?? 1) - 1);

  const promoTags: string[] = [];
  if (price <= 300) promoTags.push("low-fare");

  return {
    source,
    itineraryKey: `${input.origin}-${input.destination}-${input.departDate}-${airline}-${flightNo}-${idx}`,
    departAt: firstLeg?.departure_airport?.time ?? `${input.departDate}T00:00:00Z`,
    arriveAt: lastLeg?.arrival_airport?.time ?? `${input.departDate}T00:00:00Z`,
    durationMin: Math.max(1, Number(f.total_duration ?? 1)),
    stops,
    airline,
    price,
    currency: input.currency,
    baggageIncluded: input.baggage === "checked",
    promoTags,
    scrapedAt: new Date().toISOString()
  };
}

export const serpApiAdapter: FlightAdapter = {
  name: "serpapi-google-flights",
  enabledByDefault: true,
  async search(input: SearchInput): Promise<AdapterResult> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return {
        source: this.name,
        offers: [],
        errors: ["Missing SERPAPI_API_KEY environment variable."]
      };
    }

    try {
      const params = new URLSearchParams({
        engine: "google_flights",
        api_key: apiKey,
        departure_id: input.origin,
        arrival_id: input.destination,
        outbound_date: input.departDate,
        currency: input.currency,
        hl: "en",
        adults: String(input.adults),
        type: input.returnDate ? "1" : "2"
      });

      if (input.returnDate) params.set("return_date", input.returnDate);

      const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        return {
          source: this.name,
          offers: [],
          errors: [`SerpAPI error ${res.status}: ${text}`]
        };
      }

      const json = (await res.json()) as SerpApiResponse;
      const pool = [...(json.best_flights ?? []), ...(json.other_flights ?? [])];

      const offers = pool
        .map((f, i) => normalizeFlight(f, input, i, this.name))
        .filter((o): o is FlightOffer => Boolean(o));

      return { source: this.name, offers, errors: [] };
    } catch (err) {
      return {
        source: this.name,
        offers: [],
        errors: [err instanceof Error ? err.message : "Unknown SerpAPI error"]
      };
    }
  }
};
