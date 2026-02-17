import { SignJWT } from 'jose';

export const onRequestPost: PagesFunction<{ ADMIN_PASSWORD: string, JWT_SECRET: string }> = async (context) => {
    try {
        const { request, env } = context;
        const { password } = await request.json() as { password: string };

        if (!password) {
            return new Response(JSON.stringify({ error: 'Password required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (password !== env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Generate JWT
        const secret = new TextEncoder().encode(env.JWT_SECRET || env.ADMIN_PASSWORD || 'secret');
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
