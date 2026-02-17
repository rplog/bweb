import { jwtVerify } from 'jose';

export const onRequestGet: PagesFunction<{ DB: D1Database, ADMIN_PASSWORD: string, JWT_SECRET: string }> = async (context) => {
    try {
        const { request, env } = context;

        // Security Check
        const authHeader = request.headers.get('Authorization');
        const adminPasswordHeader = request.headers.get('X-Admin-Password');

        let isAuthenticated = false;

        // Method 1: Simple Password Header (Legacy/Easy)
        if (adminPasswordHeader && env.ADMIN_PASSWORD && adminPasswordHeader === env.ADMIN_PASSWORD) {
            isAuthenticated = true;
        }

        // Method 2: JWT (Better)
        if (!isAuthenticated && authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const secret = new TextEncoder().encode(env.JWT_SECRET || env.ADMIN_PASSWORD || 'secret');
                await jwtVerify(token, secret);
                isAuthenticated = true;
            } catch (e) {
                console.error('JWT Verify Error:', e);
            }
        }

        if (!isAuthenticated) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Fetch Messages
        const { results } = await env.DB.prepare(`SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100`).all();

        return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
