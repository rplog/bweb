// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Env {
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const url = new URL(context.request.url);
    const host = url.searchParams.get('host');

    if (!host) {
        return new Response(JSON.stringify({ error: 'Host is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const start = performance.now();
    let status = 0;
    let ip = '';

    try {
        // Parallel execution: Ping (HEAD request) and DNS lookup (DoH)
        const dnsPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`, {
            headers: { 'Accept': 'application/dns-json' }
        });

        const pingPromise = (async () => {
            try {
                const res = await fetch(`https://${host}`, {
                    method: 'HEAD',
                    headers: { 'User-Agent': 'Neosphere-Ping/1.0' },
                    redirect: 'follow'
                });
                return res.status;
            } catch {
                // Fallback to HTTP
                const res = await fetch(`http://${host}`, {
                    method: 'HEAD',
                    headers: { 'User-Agent': 'Neosphere-Ping/1.0' },
                    redirect: 'follow'
                });
                return res.status;
            }
        })();

        const [pingStatus, dnsRes] = await Promise.all([pingPromise, dnsPromise]);
        status = pingStatus;

        if (dnsRes.ok) {
            const dnsData = await dnsRes.json() as { Answer?: { type: number; data: string }[] };
            if (dnsData.Answer && dnsData.Answer.length > 0) {
                // Get the first A record
                const record = dnsData.Answer.find((a) => a.type === 1);
                if (record) ip = record.data;
            }
        }
    } catch (e: unknown) {
        return new Response(JSON.stringify({
            error: e instanceof Error ? e.message : 'Unknown error',
            time: 0
        }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const end = performance.now();
    const duration = end - start;

    return new Response(JSON.stringify({
        host,
        time: duration,
        status,
        ip: ip || 'unknown',
        ttl: 64
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
