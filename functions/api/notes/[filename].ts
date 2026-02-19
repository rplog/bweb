import { checkRateLimit } from '../../utils/rateLimit';
import { verifyAuth } from '../../utils/auth';

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
    try {
        const { params, env } = context;
        const filename = params.filename;

        const note = await env.DB.prepare(
            "SELECT id, filename, content, country, created_at, updated_at FROM notes WHERE filename = ?"
        ).bind(filename).first();

        if (!note) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify(note), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: unknown) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
};

export const onRequestPut: PagesFunction<{ DB: D1Database; RATE_LIMITER: KVNamespace }> = async (context) => {
    try {
        const { request, params, env } = context;
        const filename = params.filename;

        const ip = request.headers.get("CF-Connecting-IP") || "unknown";

        // Rate Limit: 10 updates per minute per IP
        const allowed = await checkRateLimit(env, `update_note:${ip}`, 10, 60);
        if (!allowed) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), { status: 429, headers: { "Content-Type": "application/json" } });
        }

        const { content, commit_msg, author_name } = await request.json() as { content?: string; commit_msg?: string; author_name?: string };

        if (content == null) return new Response(JSON.stringify({ error: "Content required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        if (content.length > 10485760) return new Response(JSON.stringify({ error: "Content too large (max 10MB)" }), { status: 400, headers: { "Content-Type": "application/json" } });

        const now = Date.now();
        const city = request.cf?.city || "unknown";
        const country = request.cf?.country || "unknown";

        // Get current content for history
        const currentNote = await env.DB.prepare("SELECT id, content FROM notes WHERE filename = ?").bind(filename).first();

        if (currentNote) {
            const editId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO note_edits (id, note_id, previous_content, ip, city, country, created_at, commit_msg, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(editId, currentNote.id, currentNote.content, ip, city, country, now, commit_msg || null, author_name || null).run();
        }

        const info = await env.DB.prepare(
            "UPDATE notes SET content = ?, updated_at = ? WHERE filename = ?"
        ).bind(content, now, filename).run();

        if (info.meta.changes === 0) {
            return new Response(JSON.stringify({ error: "File not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: unknown) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
};

export const onRequestDelete: PagesFunction<{ DB: D1Database; JWT_SECRET: string; ADMIN_PASSWORD: string }> = async (context) => {
    try {
        const { request, params, env } = context;
        const filename = params.filename;

        // Admin auth required
        if (!await verifyAuth(request, env)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Find the note
        const note = await env.DB.prepare("SELECT id FROM notes WHERE filename = ?").bind(filename).first();
        if (!note) {
            return new Response(JSON.stringify({ error: 'Note not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete edit history first (foreign key), then the note
        await env.DB.batch([
            env.DB.prepare("DELETE FROM note_edits WHERE note_id = ?").bind(note.id),
            env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(note.id)
        ]);

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: unknown) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

