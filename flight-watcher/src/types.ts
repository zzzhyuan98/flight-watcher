import { z } from "zod";

export const SearchInputSchema = z.object({
  origin: z.string().min(3).max(3).transform((s) => s.toUpperCase()),
  destination: z.string().min(3).max(3).transform((s) => s.toUpperCase()),
  departDate: z.string(),
  returnDate: z.string().optional(),
  adults: z.number().int().positive().default(1),
  children: z.number().int().nonnegative().default(0),
  cabin: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  baggage: z.enum(["carry_on", "checked"]).default("carry_on"),
  currency: z.string().default("MYR"),
  maxStops: z.number().int().nonnegative().default(2)
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

export const FlightOfferSchema = z.object({
  source: z.string(),
  itineraryKey: z.string(),
  departAt: z.string(),
  arriveAt: z.string(),
  durationMin: z.number().int().positive(),
  stops: z.number().int().nonnegative(),
  airline: z.string(),
  price: z.number().positive(),
  currency: z.string(),
  baggageIncluded: z.boolean().default(false),
  promoTags: z.array(z.string()).default([]),
  bookingUrl: z.string().url().optional(),
  scrapedAt: z.string()
});
export type FlightOffer = z.infer<typeof FlightOfferSchema>;

export type AdapterResult = {
  source: string;
  offers: FlightOffer[];
  errors: string[];
  disabled?: boolean;
};

export type RankedOffer = FlightOffer & {
  score: number;
  valueScore: number;
};
