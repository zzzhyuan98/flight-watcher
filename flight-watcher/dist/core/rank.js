export function dedupeCheapest(offers) {
    const map = new Map();
    for (const offer of offers) {
        const existing = map.get(offer.itineraryKey);
        if (!existing || offer.price < existing.price)
            map.set(offer.itineraryKey, offer);
    }
    return [...map.values()];
}
export function rankOffers(offers) {
    return offers
        .map((o) => {
        const stopPenalty = o.stops * 15;
        const durationPenalty = Math.max(0, o.durationMin - 90) * 0.2;
        const baggagePenalty = o.baggageIncluded ? 0 : 20;
        const score = o.price + stopPenalty + durationPenalty + baggagePenalty;
        const valueScore = Math.max(1, 1000 / score);
        return { ...o, score, valueScore };
    })
        .sort((a, b) => a.score - b.score);
}
export function detectBestDelta(currentBest, previousBest) {
    if (previousBest == null)
        return { drop: false, delta: 0 };
    const delta = previousBest - currentBest;
    return { drop: delta > 0, delta };
}
