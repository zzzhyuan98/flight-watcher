# Flight Watcher (Amadeus API mode)

A Node.js/TypeScript CLI for comparing flight prices across routes/origins and tracking price changes over time.

## Current mode

- ✅ Uses **Amadeus Self-Service API** (no browser scraping / no Playwright crawling)
- ✅ Supports single-route checks and multi-origin comparisons
- ✅ Writes JSON + Markdown reports in `data/reports/`
- ✅ Maintains previous-best state for drop tracking

## Prerequisites

Set Amadeus credentials in environment variables:

```bash
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
```

On PowerShell (current session):

```powershell
$env:AMADEUS_CLIENT_ID="your_client_id"
$env:AMADEUS_CLIENT_SECRET="your_client_secret"
```

## Quick start

```bash
npm install
npm run check -- --origin KUL --destination BKK --depart-date 2027-04-11 --return-date 2027-04-17 --adults 2 --currency MYR
```

Compare multiple origins in one shot:

```bash
npm run compare-origins -- --origins "JHB,KUL" --destination BKK --depart-date 2027-04-11 --return-date 2027-04-17 --adults 2 --currency MYR
```

Scheduler-friendly command:

```bash
npm run monitor -- --origin KUL --destination BKK --depart-date 2027-04-11 --return-date 2027-04-17 --adults 2 --currency MYR
```

## Scripts

- `npm run check` - single run
- `npm run monitor` - intended for cron/scheduler use
- `npm run compare-origins` - compare several origins
- `npm run build` - TypeScript build
- `npm test` - tests

## Notes

- Amadeus test environment data/availability may differ from production.
- Promo tags are heuristic in API mode.
- If credentials are missing, the tool returns a clear adapter warning and no prices.
