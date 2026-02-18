export async function checkRateLimit(env: { RATE_LIMITER?: KVNamespace }, key: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!env.RATE_LIMITER) {
        console.warn('RATE_LIMITER KV not bound');
        return true;
    }

    // Time bucket approach
    // For 60s window, we want to count requests in the current minute.
    // If windowSeconds is 60.
    const timeStep = Math.floor(Date.now() / 1000 / windowSeconds);
    const timeKey = `${key}:${timeStep}`;

    const val = await env.RATE_LIMITER.get(timeKey);
    const requestCount = val ? parseInt(val) : 0;

    if (requestCount >= limit) {
        return false;
    }

    // Increment
    await env.RATE_LIMITER.put(timeKey, (requestCount + 1).toString(), { expirationTtl: windowSeconds * 2 }); // Keep it around a bit longer to be safe, but valid logic depends on key name

    return true;
}
