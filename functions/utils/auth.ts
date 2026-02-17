import { jwtVerify } from 'jose';

export async function verifyAuth(request: Request, env: any): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');
    const adminPasswordHeader = request.headers.get('X-Admin-Password');

    if (adminPasswordHeader && env.ADMIN_PASSWORD && adminPasswordHeader === env.ADMIN_PASSWORD) {
        return true;
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const secret = new TextEncoder().encode(env.JWT_SECRET || env.ADMIN_PASSWORD || 'secret');
            await jwtVerify(token, secret);
            return true;
        } catch (e) {
            console.error('JWT Verify Error:', e);
        }
    }

    return false;
}
