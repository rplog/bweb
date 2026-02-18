import { SignJWT } from 'jose';
import { checkRateLimit } from '../../utils/rateLimit';

export const onRequestPost: PagesFunction<{ ADMIN_PASSWORD: string, JWT_SECRET: string, DB: D1Database, RATE_LIMITER: KVNamespace }> = async (context) => {
    try {
        const { request, env } = context;
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

        // Rate Limit: 5 attempts per minute per IP
        const allowed = await checkRateLimit(env, `login:${ip}`, 5, 60);
        if (!allowed) {
            return new Response(JSON.stringify({ error: 'Too many login attempts. Please try again later.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
        }

        const { password } = await request.json() as { password: string };

        if (!password) {
            return new Response(JSON.stringify({ error: 'Password required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (password !== env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Generate JWT
        const jwtSecret = env.JWT_SECRET || env.ADMIN_PASSWORD;
        if (!jwtSecret) throw new Error('Server misconfiguration: Missing JWT secret');
        const secret = new TextEncoder().encode(jwtSecret);
        const token = await new SignJWT({ role: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

        return new Response(JSON.stringify({ token }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
