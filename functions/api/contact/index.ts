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
        } catch (err: unknown) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.error(`[${label}] Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);

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

async function sendTelegram(env: Record<string, unknown>, chatId: string, name: string, email: string, message: string): Promise<void> {
    const safeName = escapeMarkdown(name);
    const safeEmail = escapeMarkdown(email);
    const safeMessage = escapeMarkdown(message);
    const text = `*New Message from* ${safeName}\nEmail: ${safeEmail}\n\n${safeMessage}`;
    const telegramUrl = `https://api.telegram.org/bot${String(env.TELEGRAM_BOT_TOKEN)}/sendMessage`;

    const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'MarkdownV2'
        })
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Telegram API ${res.status}: ${body}`);
    }
}

async function sendEmail(env: Record<string, unknown>, name: string, email: string, message: string): Promise<void> {
    const port = parseInt(String(env.SMTP_PORT || '587'));

    await WorkerMailer.send({
        host: String(env.SMTP_HOST),
        port: port,
        credentials: {
            username: String(env.SMTP_USER),
            password: String(env.SMTP_PASS)
        },
        startTls: port === 587,
        secure: port === 465
    }, {
        from: String(env.SMTP_FROM || env.SMTP_USER),
        to: String(env.SMTP_FROM || env.SMTP_USER),
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
            const chatIds = String(env.TELEGRAM_CHAT_ID).split(',');
            context.waitUntil(
                Promise.all(chatIds.map(chatId =>
                    withRetry(() => sendTelegram(env, chatId.trim(), name, email, message), `Telegram:${chatId}`, 3, 500)
                        .catch(err => console.error(`[Telegram:${chatId}] All retries failed:`, err.message))
                ))
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

    } catch (e: unknown) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
