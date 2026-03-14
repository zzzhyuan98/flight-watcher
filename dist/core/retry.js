export async function withRetry(fn, retries = 2, delayMs = 300) {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        }
        catch (err) {
            lastErr = err;
            if (i < retries)
                await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        }
    }
    throw lastErr;
}
