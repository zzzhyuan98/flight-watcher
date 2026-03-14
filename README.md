# Flight Watcher (API-free)

A modular Node.js/TypeScript CLI for comparing flight prices across adapters and tracking promo/price-drop changes over time.

## What this v1 does

- Accepts route/date/passenger/cabin/baggage search inputs
- Runs multiple source adapters (currently mock adapters + Playwright template)
- Normalizes and deduplicates itineraries across sources
- Ranks by cheapest/value score
- Detects promo-like tags from source data
- Stores previous best price and reports delta
- Writes JSON + Markdown artifacts under `data/reports/`

## Quick start

```bash
npm install
npm run check -- --origin KUL --destination BKK --depart-date 2026-04-20 --adults 1 --cabin economy --baggage carry_on --currency MYR

# Live extraction mode (real market page parsing, may be brittle)
npm run check -- --origin KUL --destination BKK --depart-date 2026-04-20 --return-date 2026-04-27 --adults 1 --currency MYR --live
```

Scheduler-ready command:

```bash
npm run monitor -- --origin KUL --destination BKK --depart-date 2026-04-20
```

## Scripts

- `npm run check` - single run
- `npm run monitor` - same command intended for cron/scheduler use
- `npm run build` - TypeScript build
- `npm test` - tests

## Adapter architecture

Adapters implement:

```ts
interface FlightAdapter {
  name: string;
  enabledByDefault: boolean;
  search(input: SearchInput): Promise<AdapterResult>;
}
```

Add new adapters in `src/adapters/` and register in `src/cli.ts`.

## Legal / ToS / anti-bot notes

- This project intentionally avoids third-party provider APIs per your requirement.
- For real websites, always review each site's Terms of Service and robots policy.
- Some websites use anti-bot controls (captcha, dynamic rendering, WAF). The included `playwrightTemplateAdapter` is disabled by default to avoid unsafe assumptions.
- Prefer API or affiliate-approved channels when available and lawful.

## Current limitations

- v1 ships mock data adapters for stable local development.
- Real-world extraction selectors are site-specific and may break over time.
- Promo detection is heuristic (tag/label based), not guaranteed.
