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
        // 2. Handle DELETE (Delete Message)
        if (context.request.method === 'DELETE') {
            const url = new URL(context.request.url);
            const id = url.searchParams.get('id');
            if (!id) return new Response('Missing ID', { status: 400 });

            await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Handle GET (Fetch Messages)
        if (context.request.method === 'GET') {
            const url = new URL(context.request.url);
            const period = url.searchParams.get('period'); // day, week, month, year
            const date = url.searchParams.get('date'); // YYYY-MM-DD

            let query = 'SELECT * FROM messages';
            const params: any[] = [];
            const conditions: string[] = [];

            if (date) {
                conditions.push("date(timestamp) = ?");
                params.push(date);
            } else if (period) {
                const now = new Date();
                let past = new Date();
                if (period === 'day') past.setDate(now.getDate() - 1);
                if (period === 'week') past.setDate(now.getDate() - 7);
                if (period === 'month') past.setMonth(now.getMonth() - 1);
                if (period === 'year') past.setFullYear(now.getFullYear() - 1);

                conditions.push("timestamp >= datetime(?)");
                params.push(past.toISOString());
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY timestamp DESC LIMIT 100';

            const { results } = await env.DB.prepare(query).bind(...params).all();
            return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response('Method not allowed', { status: 405 });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
