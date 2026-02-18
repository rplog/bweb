import { jwtVerify } from 'jose';

export async function verifyAuth(request: Request, env: any): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');


    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const jwtSecret = env.JWT_SECRET || env.ADMIN_PASSWORD;
            if (!jwtSecret) {
                console.error('Missing JWT_SECRET or ADMIN_PASSWORD');
                return false;
            }
            const secret = new TextEncoder().encode(jwtSecret);
            await jwtVerify(token, secret);
            return true;
        } catch (e) {
            console.error('JWT Verify Error:', e);
        }
    }

    return false;
}
