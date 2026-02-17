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
        const { content } = await request.json();

        const now = Date.now();
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const city = request.cf?.city || "unknown";
        const timezone = request.cf?.timezone || "UTC";

        // Get current content for history
        const currentNote = await env.DB.prepare("SELECT id, content FROM notes WHERE filename = ?").bind(filename).first();

        if (currentNote) {
            const editId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO note_edits (id, note_id, previous_content, ip, city, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(editId, currentNote.id, currentNote.content, ip, city, now).run();
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
