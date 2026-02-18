import { WorkerMailer } from 'worker-mailer';
import { checkRateLimit } from "../../utils/rateLimit";

// Retry helper: exponential backoff with configurable attempts
async function withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    maxAttempts: number = 3,
    baseDelayMs: number = 500
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            console.error(`[${label}] Attempt ${attempt}/${maxAttempts} failed:`, err.message || err);

            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1); // 500, 1000, 2000
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    throw lastError;
}

function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

async function sendTelegram(env: any, name: string, email: string, message: string): Promise<void> {
    const safeName = escapeMarkdown(name);
    const safeEmail = escapeMarkdown(email);
    const safeMessage = escapeMarkdown(message);
    const text = `*New Message from* ${safeName}\nEmail: ${safeEmail}\n\n${safeMessage}`;
    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
        })
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Telegram API ${res.status}: ${body}`);
    }
}

async function sendEmail(env: any, name: string, email: string, message: string): Promise<void> {
    const port = parseInt(env.SMTP_PORT || '587');

    await WorkerMailer.send({
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
        to: env.SMTP_FROM || env.SMTP_USER,
        subject: `New Contact: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        reply: email
    });
}

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

        const body = await request.json() as { name?: string; email?: string; message?: string };
        const name = body.name;
        const email = body.email;
        const message = body.message;

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 1. Save to D1 (critical — fail the request if this fails)
        const insertQuery = `INSERT INTO messages (name, email, message, ip, user_agent) VALUES (?, ?, ?, ?, ?)`;
        const userAgent = request.headers.get('User-Agent') || 'unknown';
        await env.DB.prepare(insertQuery).bind(name, email, message, ip, userAgent).run();

        // 2. Check notification preferences
        const configResult = await env.DB.prepare("SELECT value FROM config WHERE key = 'notification_channels'").first();
        const notificationChannels = (configResult?.value as string || 'telegram,email').split(',');

        // 3. Send Telegram with retry (fire-and-forget, 3 attempts)
        if (notificationChannels.includes('telegram') && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
            context.waitUntil(
                withRetry(() => sendTelegram(env, name, email, message), 'Telegram', 3, 500)
                    .catch(err => console.error('[Telegram] All retries failed:', err.message))
            );
        }

        // 4. Send Email with retry (fire-and-forget, 3 attempts)
        if (notificationChannels.includes('email') && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
            context.waitUntil(
                withRetry(() => sendEmail(env, name, email, message), 'Email', 3, 1000)
                    .catch(err => console.error('[Email] All retries failed:', err.message))
            );
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
