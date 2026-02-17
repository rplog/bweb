export const onRequestPost: PagesFunction<{ DB: D1Database, TELEGRAM_BOT_TOKEN: string, TELEGRAM_CHAT_ID: string }> = async (context) => {
    try {
        const { request, env } = context;
        const formData = await request.json() as { name: string, email: string, message: string };
        const { name, email, message } = formData;

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 1. Save to D1
        const insertQuery = `INSERT INTO messages (name, email, message, ip, user_agent) VALUES (?, ?, ?, ?, ?)`;
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = request.headers.get('User-Agent') || 'unknown';

        await env.DB.prepare(insertQuery).bind(name, email, message, ip, userAgent).run();

        // 2. Send Telegram Notification
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
            const text = `📩 *New Message from* ${name}\n📧 ${email}\n\n${message}`;
            const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

            // Fire and forget (don't await to speed up response, but catch errors)
            context.waitUntil(
                fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: env.TELEGRAM_CHAT_ID,
                        text: text,
                        parse_mode: 'Markdown'
                    })
                }).catch(err => console.error('Telegram Error:', err))
            );
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
