import { jwtVerify } from 'jose';

export const onRequest: PagesFunction<{ DB: D1Database, JWT_SECRET: string, ADMIN_PASSWORD: string }> = async (context) => {
    // 1. Verify Auth
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(context.env.JWT_SECRET || context.env.ADMIN_PASSWORD);

    try {
        await jwtVerify(token, secret);
    } catch {
        return new Response('Unauthorized', { status: 401 });
    }

    // 2. Handle POST (Set Config)
    if (context.request.method === 'POST') {
        try {
            const { key, value } = await context.request.json() as { key: string, value: string };
            if (!key || value === undefined) return new Response('Missing key or value', { status: 400 });

            await context.env.DB.prepare('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
                .bind(key, value, value)
                .run();

            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    // 3. Handle GET (Get Config)
    if (context.request.method === 'GET') {
        const { results } = await context.env.DB.prepare('SELECT * FROM config').run();
        // Convert array of {key, value} to object
        const config: Record<string, string> = {};
        if (results) {
            results.forEach((row: any) => {
                config[row.key] = row.value;
            });
        }
        return new Response(JSON.stringify(config), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Method not allowed', { status: 405 });
};
