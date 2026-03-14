import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
export function renderSummary(offers, delta) {
    if (!offers.length)
        return "No offers found from enabled adapters.";
    const best = offers[0];
    const promoCount = offers.filter((o) => o.promoTags.length > 0).length;
    return [
        `Best fare: ${best.currency} ${best.price.toFixed(2)} (${best.airline}, ${best.source})`,
        `Duration/stops: ${best.durationMin} min / ${best.stops} stop(s)`,
        `Promo hits: ${promoCount}`,
        `Delta vs previous best: ${delta > 0 ? "-" : ""}${Math.abs(delta).toFixed(2)}`
    ].join("\n");
}
export function writeArtifacts(basePath, offers, summary) {
    const jsonPath = `${basePath}.json`;
    const mdPath = `${basePath}.md`;
    mkdirSync(dirname(jsonPath), { recursive: true });
    writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), offers }, null, 2), "utf8");
    const lines = [
        "# Flight Watcher Report",
        "",
        "## Summary",
        "",
        summary,
        "",
        "## Offers",
        "",
        ...offers.map((o, i) => `${i + 1}. **${o.currency} ${o.price.toFixed(2)}** · ${o.airline} · ${o.source} · ${o.durationMin} min · stops: ${o.stops} · promos: ${o.promoTags.join(", ") || "-"}`)
    ];
    writeFileSync(mdPath, lines.join("\n"), "utf8");
}
