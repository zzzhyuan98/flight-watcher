import { Command } from "commander";
import pino from "pino";
import { SearchInputSchema, type FlightOffer, type SearchInput } from "./types.js";
import { mockGoogleFlightsAdapter } from "./adapters/mockGoogleFlights.js";
import { mockSkyscannerStyleAdapter } from "./adapters/mockSkyscannerStyle.js";
import { playwrightTemplateAdapter } from "./adapters/playwrightTemplate.js";
import { googleFlightsLiveAdapter } from "./adapters/googleFlightsLive.js";
import { dedupeCheapest, detectBestDelta, rankOffers } from "./core/rank.js";
import { loadState, saveState } from "./core/state.js";
import { renderSummary, writeArtifacts } from "./core/report.js";
import { withRetry } from "./core/retry.js";

const logger = pino({ transport: { target: "pino-pretty" } });

const defaultAdapters = [mockGoogleFlightsAdapter, mockSkyscannerStyleAdapter, playwrightTemplateAdapter];
const liveAdapters = [googleFlightsLiveAdapter];

type RunCheckResult = {
  input: SearchInput;
  bestPrice: number;
  summary: string;
};

async function runCheck(raw: Record<string, unknown>, statePath = "data/state.json", useLive = false): Promise<RunCheckResult> {
  const input: SearchInput = SearchInputSchema.parse({
    adults: 1,
    children: 0,
    maxStops: 2,
    cabin: "economy",
    baggage: "carry_on",
    currency: "MYR",
    ...raw
  });

  const collected: FlightOffer[] = [];

  const chosenAdapters = useLive ? liveAdapters : defaultAdapters;

  for (const adapter of chosenAdapters.filter((a) => a.enabledByDefault || useLive)) {
    try {
      const result = await withRetry(() => adapter.search(input), 2, 350);
      if (result.errors.length) logger.warn({ adapter: adapter.name, errors: result.errors }, "adapter warnings");
      collected.push(...result.offers);
    } catch (err) {
      logger.error({ adapter: adapter.name, err }, "adapter failed");
    }
  }

  const deduped = dedupeCheapest(collected);
  const ranked = rankOffers(deduped);

  const previous = loadState(statePath);
  const currentBest = ranked[0]?.price ?? 0;
  const { delta } = detectBestDelta(currentBest, previous.lastBestPrice);

  const summary = renderSummary(ranked, delta);
  logger.info("\n" + summary);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeArtifacts(`data/reports/${stamp}`, ranked, summary);

  saveState(statePath, {
    lastBestPrice: currentBest,
    lastCheckedAt: new Date().toISOString()
  });

  return { input, bestPrice: currentBest, summary };
}

const program = new Command();
program.name("flight-watcher").description("Compare flight prices and track promo-like changes");

const withSharedOptions = (cmd: Command) =>
  cmd
    .requiredOption("--origin <IATA>")
    .requiredOption("--destination <IATA>")
    .requiredOption("--depart-date <YYYY-MM-DD>")
    .option("--return-date <YYYY-MM-DD>")
    .option("--adults <n>", "number of adults", Number)
    .option("--children <n>", "number of children", Number)
    .option("--cabin <cabin>", "economy|premium_economy|business|first")
    .option("--baggage <type>", "carry_on|checked")
    .option("--currency <code>")
    .option("--max-stops <n>", "max stops", Number)
    .option("--live", "use live adapter extraction (real market page parsing)", false);

withSharedOptions(program.command("check").description("single check")).action(async (opts) => {
  await runCheck(opts, "data/state.json", Boolean(opts.live));
});

withSharedOptions(program.command("monitor").description("scheduler-friendly check command")).action(async (opts) => {
  await runCheck(opts, "data/state.json", Boolean(opts.live));
});

program
  .command("compare-origins")
  .description("run same search across multiple origins and show cheapest")
  .requiredOption("--origins <IATA,...>", "comma-separated origins, e.g. JHB,KUL")
  .requiredOption("--destination <IATA>")
  .requiredOption("--depart-date <YYYY-MM-DD>")
  .option("--return-date <YYYY-MM-DD>")
  .option("--adults <n>", "number of adults", Number)
  .option("--children <n>", "number of children", Number)
  .option("--cabin <cabin>", "economy|premium_economy|business|first")
  .option("--baggage <type>", "carry_on|checked")
  .option("--currency <code>")
  .option("--max-stops <n>", "max stops", Number)
  .option("--live", "use live adapter extraction (real market page parsing)", false)
  .action(async (opts) => {
    const origins = String(opts.origins)
      .split(/[\s,]+/)
      .map((o) => o.trim().toUpperCase())
      .filter(Boolean);

    const base = {
      destination: opts.destination,
      departDate: opts.departDate,
      returnDate: opts.returnDate,
      adults: opts.adults,
      children: opts.children,
      cabin: opts.cabin,
      baggage: opts.baggage,
      currency: opts.currency,
      maxStops: opts.maxStops
    };

    const results: RunCheckResult[] = [];
    for (const origin of origins) {
      const statePath = `data/state-${origin}.json`;
      const result = await runCheck({ ...base, origin }, statePath, Boolean(opts.live));
      results.push(result);
    }

    const valid = results.filter((r) => r.bestPrice > 0).sort((a, b) => a.bestPrice - b.bestPrice);
    if (!valid.length) {
      logger.warn("\nNo valid live fares parsed across selected origins.");
      return;
    }

    const best = valid[0];
    logger.info(
      `\nBest origin overall: ${best.input.origin} -> ${best.input.destination} at ${best.input.currency} ${best.bestPrice.toFixed(2)}`
    );
  });

program.parseAsync(process.argv);
