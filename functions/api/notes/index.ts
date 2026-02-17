export const onRequestGet = async (context: any) => {
    try {
        const { results } = await context.env.DB.prepare(
            "SELECT filename, created_at, updated_at FROM notes ORDER BY updated_at DESC"
        ).all();
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
        const { filename, content } = await request.json();

        if (!filename) return new Response("Filename required", { status: 400 });

        const id = crypto.randomUUID();
        const now = Date.now();
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const city = request.cf?.city || "unknown";
        const country = request.cf?.country || "unknown";
        const userAgent = request.headers.get("User-Agent") || "unknown";
        const timezone = request.cf?.timezone || "UTC";

        await env.DB.prepare(
            `INSERT INTO notes (id, filename, content, ip, city, country, timezone, user_agent, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, filename, content, ip, city, country, timezone, userAgent, now, now).run();

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
