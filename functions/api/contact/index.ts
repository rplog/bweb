import { WorkerMailer } from 'worker-mailer';
import { checkRateLimit } from "../../utils/rateLimit";

export const onRequestPost: PagesFunction<{
    DB: D1Database,
    RATE_LIMITER: KVNamespace,
    TELEGRAM_BOT_TOKEN: string,
    TELEGRAM_CHAT_ID: string,
    SMTP_HOST: string,
    SMTP_PORT: string,
    SMTP_USER: string,
    SMTP_PASS: string,
    SMTP_FROM: string
}> = async (context) => {
    try {
        const { request, env } = context;
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

        // Rate Limit: 3 messages per hour per IP
        const allowed = await checkRateLimit(env, `contact:${ip}`, 3, 3600);
        if (!allowed) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending another message.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
        }

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const message = formData.get('message') as string;

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 1. Save to D1
        const insertQuery = `INSERT INTO messages (name, email, message, ip, user_agent) VALUES (?, ?, ?, ?, ?)`;
        const userAgent = request.headers.get('User-Agent') || 'unknown';

        await env.DB.prepare(insertQuery).bind(name, email, message, ip, userAgent).run();

        // 1.5. Check Notification Preferences
        const configResult = await env.DB.prepare("SELECT value FROM config WHERE key = 'notification_channels'").first();
        const notificationChannels = (configResult?.value as string || 'telegram,email').split(',');

        // 2. Send Telegram Notification
        if (notificationChannels.includes('telegram') && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
            const text = `*New Message from* ${name}\nEmail: ${email}\n\n${message}`;
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

        // 3. Send Email (SMTP)
        if (notificationChannels.includes('email') && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
            const port = parseInt(env.SMTP_PORT || '587');
            context.waitUntil(
                WorkerMailer.send({
                    host: env.SMTP_HOST,
                    port: port,
                    credentials: {
                        username: env.SMTP_USER,
                        password: env.SMTP_PASS
                    },
                    startTls: port === 587,
                    secure: port === 465
                }, {
                    from: env.SMTP_FROM || env.SMTP_USER,
                    to: env.SMTP_FROM || env.SMTP_USER, // Send TO yourself
                    subject: `New Contact: ${name}`,
                    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
                    reply: email
                }).catch(err => console.error('SMTP Error:', err))
            );
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
