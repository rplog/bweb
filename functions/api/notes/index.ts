export const onRequestGet = async (context: any) => {
    try {
        const url = new URL(context.request.url);
        const search = url.searchParams.get('search');

        let results;
        if (search) {
            // Grep mode: search entire DB by filename pattern (no limit)
            const { results: r } = await context.env.DB.prepare(
                `SELECT filename, created_at, updated_at, length(content) as size, 
                (SELECT author_name FROM note_edits WHERE note_id = notes.id ORDER BY created_at ASC LIMIT 1) as author 
                FROM notes WHERE filename LIKE ? ORDER BY updated_at DESC`
            ).bind(`%${search}%`).all();
            results = r;
        } else {
            // Default: return last 100 notes
            const { results: r } = await context.env.DB.prepare(
                `SELECT filename, created_at, updated_at, length(content) as size, 
                (SELECT author_name FROM note_edits WHERE note_id = notes.id ORDER BY created_at ASC LIMIT 1) as author 
                FROM notes ORDER BY updated_at DESC LIMIT 100`
            ).all();
            results = r;
        }

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
};

import { checkRateLimit } from '../../utils/rateLimit';

export const onRequestPost = async (context: any) => {
    try {
        const { request, env } = context;
        const { filename, content, commit_msg, author_name } = await request.json();

        if (!filename) return new Response("Filename required", { status: 400 });
        if (filename.length > 150) return new Response("Filename too long (max 150 chars)", { status: 400 });
        if (content && content.length > 10485760) return new Response("Content too large (max 10MB)", { status: 400 });

        const ip = request.headers.get("CF-Connecting-IP") || "unknown";

        // Rate Limit: 10 notes per minute per IP
        const allowed = await checkRateLimit(env, `create_note:${ip}`, 10, 60);
        if (!allowed) {
            return new Response("Rate limit exceeded. Please wait.", { status: 429 });
        }

        const id = crypto.randomUUID();
        const now = Date.now();
        const city = request.cf?.city || "unknown";
        const country = request.cf?.country || "unknown";
        const userAgent = request.headers.get("User-Agent") || "unknown";
        const timezone = request.cf?.timezone || "UTC";

        const batch = [
            env.DB.prepare(
                `INSERT INTO notes (id, filename, content, ip, city, country, timezone, user_agent, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(id, filename, content, ip, city, country, timezone, userAgent, now, now),
            env.DB.prepare(
                `INSERT INTO note_edits (id, note_id, previous_content, ip, city, country, created_at, commit_msg, author_name) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(crypto.randomUUID(), id, "", ip, city, country, now, commit_msg || "Initial commit", author_name || null)
        ];

        await env.DB.batch(batch);

        return new Response(JSON.stringify({ success: true, filename }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        if (e.message.includes("UNIQUE constraint failed")) {
            return new Response("File already exists", { status: 409 });
        }
        return new Response(e.message, { status: 500 });
    }
};
