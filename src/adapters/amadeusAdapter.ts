import type { FlightAdapter } from "./base.js";
import type { AdapterResult, FlightOffer, SearchInput } from "../types.js";

type AmadeusTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type AmadeusOffer = {
  price?: { total?: string; currency?: string };
  itineraries?: Array<{ duration?: string; segments?: Array<{ carrierCode?: string; number?: string; departure?: { at?: string }; arrival?: { at?: string } }> }>;
};

function durationToMinutes(isoDuration?: string): number {
  if (!isoDuration) return 0;
  const m = isoDuration.match(/^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!m) return 0;
  return (Number(m[1] || 0) * 60) + Number(m[2] || 0);
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret
  });

  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus token error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as AmadeusTokenResponse;
  return json.access_token;
}

function getPromoTags(total: number): string[] {
  // heuristic placeholder for API mode (no real promo label field in this endpoint)
  if (total <= 300) return ["low-fare"]; 
  return [];
}

export const amadeusAdapter: FlightAdapter = {
  name: "amadeus-self-service",
  enabledByDefault: true,
  async search(input: SearchInput): Promise<AdapterResult> {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        source: this.name,
        offers: [],
        errors: ["Missing AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET environment variables."]
      };
    }

    try {
      const token = await getAccessToken(clientId, clientSecret);

      const q = new URLSearchParams({
        originLocationCode: input.origin,
        destinationLocationCode: input.destination,
        departureDate: input.departDate,
        adults: String(input.adults),
        currencyCode: input.currency,
        max: "20"
      });
      if (input.returnDate) q.set("returnDate", input.returnDate);

      const res = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          source: this.name,
          offers: [],
          errors: [`Amadeus offer error ${res.status}: ${text}`]
        };
      }

      const json = (await res.json()) as { data?: AmadeusOffer[] };
      const data = json.data ?? [];

      const offers: FlightOffer[] = data
        .map((o, i) => {
          const total = Number(o.price?.total ?? 0);
          const currency = o.price?.currency ?? input.currency;
          const firstItin = o.itineraries?.[0];
          const firstSeg = firstItin?.segments?.[0];
          const lastSeg = firstItin?.segments?.[firstItin.segments.length - 1];
          const stops = Math.max(0, (firstItin?.segments?.length ?? 1) - 1);
          const carrier = firstSeg?.carrierCode ?? "UNK";
          const flightNo = firstSeg?.number ?? "0000";

          return {
            source: this.name,
            itineraryKey: `${input.origin}-${input.destination}-${input.departDate}-${carrier}${flightNo}-${i}`,
            departAt: firstSeg?.departure?.at ?? `${input.departDate}T00:00:00Z`,
            arriveAt: lastSeg?.arrival?.at ?? `${input.departDate}T00:00:00Z`,
            durationMin: Math.max(1, durationToMinutes(firstItin?.duration) || 1),
            stops,
            airline: carrier,
            price: Number.isFinite(total) && total > 0 ? total : 0,
            currency,
            baggageIncluded: input.baggage === "checked",
            promoTags: getPromoTags(total),
            scrapedAt: new Date().toISOString()
          } satisfies FlightOffer;
        })
        .filter((o) => o.price > 0);

      return { source: this.name, offers, errors: [] };
    } catch (err) {
      return {
        source: this.name,
        offers: [],
        errors: [err instanceof Error ? err.message : "Unknown Amadeus error"]
      };
    }
  }
};
