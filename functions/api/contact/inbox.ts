import { verifyAuth } from '../../utils/auth';

export const onRequestGet: PagesFunction<{ DB: D1Database, ADMIN_PASSWORD: string, JWT_SECRET: string }> = async (context) => {
    try {
        const { request, env } = context;

        if (!await verifyAuth(request, env)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const url = new URL(request.url);
        const period = url.searchParams.get('period');
        const date = url.searchParams.get('date');

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

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

export const onRequestDelete: PagesFunction<{ DB: D1Database, ADMIN_PASSWORD: string, JWT_SECRET: string }> = async (context) => {
    try {
        const { request, env } = context;

        if (!await verifyAuth(request, env)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const res = await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();

        if (res.meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Message not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
