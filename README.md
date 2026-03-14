# Flight Watcher (SerpAPI mode)

A Node.js/TypeScript CLI for comparing flight prices across routes/origins and tracking price changes over time.

## Current mode

- ✅ Uses **SerpAPI (Google Flights engine)**
- ✅ Supports single-route checks and multi-origin comparisons
- ✅ Writes JSON + Markdown reports in `data/reports/`
- ✅ Maintains previous-best state for drop tracking

## Prerequisites

Set SerpAPI key in environment variables:

```bash
SERPAPI_API_KEY=your_api_key
```

On PowerShell (current session):

```powershell
$env:SERPAPI_API_KEY="your_api_key"
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

- SerpAPI is a paid service after trial credits.
- Promo tags are heuristic in API mode.
- If key is missing, the tool returns a clear adapter warning and no prices.
