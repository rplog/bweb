export const onRequestGet = async (context: any) => {
    try {
        const { params, env } = context;
        const filename = params.filename;

        const note = await env.DB.prepare(
            "SELECT * FROM notes WHERE filename = ?"
        ).bind(filename).first();

        if (!note) {
            return new Response("Not found", { status: 404 });
        }

        return new Response(JSON.stringify(note), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
};

export const onRequestPut = async (context: any) => {
    try {
        const { request, params, env } = context;
        const filename = params.filename;
        const { content, commit_msg, author_name } = await request.json(); // Extract commit_msg and author_name

        const now = Date.now();
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const city = request.cf?.city || "unknown";
        const timezone = request.cf?.timezone || "UTC";

        // Get current content for history
        const currentNote = await env.DB.prepare("SELECT id, content FROM notes WHERE filename = ?").bind(filename).first();

        if (currentNote) {
            const editId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO note_edits (id, note_id, previous_content, ip, city, created_at, commit_msg, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(editId, currentNote.id, currentNote.content, ip, city, now, commit_msg || null, author_name || null).run();
        }

        const info = await env.DB.prepare(
            "UPDATE notes SET content = ?, updated_at = ?, ip = ?, city = ?, timezone = ? WHERE filename = ?"
        ).bind(content, now, ip, city, timezone, filename).run();

        if (info.meta.changes === 0) {
            return new Response("File not found", { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
};

export const onRequestDelete = async (context: any) => {
    try {
        const { request, params, env } = context;
        const filename = params.filename;

        // Admin auth required
        const { verifyAuth } = await import('../../utils/auth');
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
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

