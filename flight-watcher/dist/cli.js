import { Command } from "commander";
import pino from "pino";
import { SearchInputSchema } from "./types.js";
import { mockGoogleFlightsAdapter } from "./adapters/mockGoogleFlights.js";
import { mockSkyscannerStyleAdapter } from "./adapters/mockSkyscannerStyle.js";
import { playwrightTemplateAdapter } from "./adapters/playwrightTemplate.js";
import { dedupeCheapest, detectBestDelta, rankOffers } from "./core/rank.js";
import { loadState, saveState } from "./core/state.js";
import { renderSummary, writeArtifacts } from "./core/report.js";
import { withRetry } from "./core/retry.js";
const logger = pino({ transport: { target: "pino-pretty" } });
const adapters = [mockGoogleFlightsAdapter, mockSkyscannerStyleAdapter, playwrightTemplateAdapter];
async function runCheck(raw) {
    const input = SearchInputSchema.parse({
        adults: 1,
        children: 0,
        maxStops: 2,
        cabin: "economy",
        baggage: "carry_on",
        currency: "MYR",
        ...raw
    });
    const collected = [];
    for (const adapter of adapters.filter((a) => a.enabledByDefault)) {
        try {
            const result = await withRetry(() => adapter.search(input), 2, 350);
            if (result.errors.length)
                logger.warn({ adapter: adapter.name, errors: result.errors }, "adapter warnings");
            collected.push(...result.offers);
        }
        catch (err) {
            logger.error({ adapter: adapter.name, err }, "adapter failed");
        }
    }
    const deduped = dedupeCheapest(collected);
    const ranked = rankOffers(deduped);
    const statePath = "data/state.json";
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
}
const program = new Command();
program.name("flight-watcher").description("Compare flight prices and track promo-like changes");
const withSharedOptions = (cmd) => cmd
    .requiredOption("--origin <IATA>")
    .requiredOption("--destination <IATA>")
    .requiredOption("--depart-date <YYYY-MM-DD>")
    .option("--return-date <YYYY-MM-DD>")
    .option("--adults <n>", "number of adults", Number)
    .option("--children <n>", "number of children", Number)
    .option("--cabin <cabin>", "economy|premium_economy|business|first")
    .option("--baggage <type>", "carry_on|checked")
    .option("--currency <code>")
    .option("--max-stops <n>", "max stops", Number);
withSharedOptions(program.command("check").description("single check")).action(async (opts) => {
    await runCheck(opts);
});
withSharedOptions(program.command("monitor").description("scheduler-friendly check command")).action(async (opts) => {
    await runCheck(opts);
});
program.parseAsync(process.argv);
