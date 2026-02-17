export const onRequestGet = async (context: any) => {
    try {
        const url = new URL(context.request.url);
        const search = url.searchParams.get('search');

        let results;
        if (search) {
            // Grep mode: search entire DB by filename pattern (no limit)
            const { results: r } = await context.env.DB.prepare(
                "SELECT filename, created_at, updated_at, length(content) as size FROM notes WHERE filename LIKE ? ORDER BY updated_at DESC"
            ).bind(`%${search}%`).all();
            results = r;
        } else {
            // Default: return last 100 notes
            const { results: r } = await context.env.DB.prepare(
                "SELECT filename, created_at, updated_at, length(content) as size FROM notes ORDER BY updated_at DESC LIMIT 100"
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

export const onRequestPost = async (context: any) => {
    try {
        const { request, env } = context;
        const { filename, content, commit_msg, author_name } = await request.json();

        if (!filename) return new Response("Filename required", { status: 400 });

        const id = crypto.randomUUID();
        const now = Date.now();
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
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
                `INSERT INTO note_edits (id, note_id, previous_content, ip, city, created_at, commit_msg, author_name) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(crypto.randomUUID(), id, "", ip, city, now, commit_msg || "Initial commit", author_name || null)
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
