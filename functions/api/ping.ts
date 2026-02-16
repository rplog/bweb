interface Env {
    // Add environment variables here if needed
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
        const [pingRes, dnsRes] = await Promise.all([
            fetch(`https://${host}`, {
                method: 'HEAD',
                headers: { 'User-Agent': 'Neosphere-Ping/1.0' },
                redirect: 'follow'
            }),
            fetch(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`, {
                headers: { 'Accept': 'application/dns-json' }
            })
        ]);

        status = pingRes.status;

        if (dnsRes.ok) {
            const dnsData = await dnsRes.json() as any;
            if (dnsData.Answer && dnsData.Answer.length > 0) {
                // Get the first A record
                const record = dnsData.Answer.find((a: any) => a.type === 1);
                if (record) ip = record.data;
            }
        }
    } catch (e: any) {
        return new Response(JSON.stringify({
            error: e.message,
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
        ttl: 50 + Math.floor(Math.random() * 20) // Simulated TTL variation
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
