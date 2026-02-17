export async function checkRateLimit(env: any, key: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!env.RATE_LIMITER) {
        console.warn('RATE_LIMITER KV not bound');
        return true;
    }

    const count = await env.RATE_LIMITER.get(key, { type: 'text' });
    const currentCount = count ? parseInt(count) : 0;

    if (currentCount >= limit) {
        return false;
    }

    // Increment
    // Note: KV is eventually consistent. This is a standard "loose" rate limit pattern.
    // We set ttl on every write to extend the window or keep it. 
    // Here we just set it to windowSeconds if it's new, or keep it alive? 
    // Actually, simple window: key expires after X seconds from first write.

    // Better pattern for sliding window is harder with just KV.
    // Simple pattern: Fixed window (ish).

    if (currentCount === 0) {
        await env.RATE_LIMITER.put(key, "1", { expirationTtl: windowSeconds });
    } else {
        // We increment. We blindly fetch the old TTL? No, just let it expire when it expires?
        // If we don't set expirationTtl, it might persist forever? No, put replaces it.
        // If we want a fixed window from the start time, we need to know when it started.
        // Compromise: Just write new value, keep original TTL? specific metadata feature?
        // Simplest "robust" enough: just strict write with TTL. If user spams, they get blocked. 
        // If they come back, they might get a new window.

        // To preserve TTL, we can Read metadata.
        const { value, metadata } = await env.RATE_LIMITER.getWithMetadata(key);
        // ... complex.

        // Let's do the standard simple approach:
        // Atomic increment isn't there.
        // We just put currentCount + 1. 
        // We set TTL to windowSeconds only if we want to reset the clock on every hit (Sliding window-ish).
        // OR we don't set TTL on update (if possible? No, put requires it or defaults).

        // Standard approach for KV Rate Limit:
        // Use key = `ratelimit:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}` which creates a time-bucket key.
        // This is robust and simple.

        // BUT the function signature asks for windowSeconds. 
        // Let's use the key suffix approach.
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
