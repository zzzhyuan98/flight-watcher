---
name: flight-watcher
description: Run the local Flight Watcher CLI to compare cheapest flight prices and detect promo tags/price drops. Use when the user asks for flight price checks, route comparisons, cheapest fare summaries, or monitoring a route over time without third-party API providers.
---

# Flight Watcher

Run the project from workspace root.

## Single check

Use this command:

```bash
npm run check -- --origin <IATA> --destination <IATA> --depart-date <YYYY-MM-DD> [--return-date <YYYY-MM-DD>] [--adults <n>] [--children <n>] [--cabin economy|premium_economy|business|first] [--baggage carry_on|checked] [--currency <CODE>] [--max-stops <n>]
```

Example:

```bash
npm run check -- --origin KUL --destination BKK --depart-date 2026-04-20 --adults 1 --cabin economy --baggage carry_on --currency MYR
```

## Monitor mode (scheduler-ready)

Use this command:

```bash
npm run monitor -- --origin <IATA> --destination <IATA> --depart-date <YYYY-MM-DD>
```

## Output handling

After each run:
- Read latest report files in `data/reports/` (`.md` + `.json`).
- Summarize best fare, source, promo tags, and delta vs previous best.
- Mention if adapters are mock/template and results are not live-booking guarantees.

## Safety and limitations

- Respect website Terms of Service and anti-bot controls before enabling real scraping adapters.
- If a real target blocks automation/captcha, report clearly and continue with other adapters.
- Do not claim guaranteed lowest market price; present results as observed offers from configured adapters.
