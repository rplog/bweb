import { verifyAuth } from '../../utils/auth';

interface Env {
    neosphere_assets: R2Bucket;
    ADMIN_PASSWORD: string;
    JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'GET') {
        return handleGet(context);
    }

    if (!await verifyAuth(request, env)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        if (request.method === 'POST') return await handlePost(context);
        if (request.method === 'PUT') return await handlePut(context);
        if (request.method === 'DELETE') return await handleDelete(context);
        return new Response('Method Not Allowed', { status: 405 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

async function handleGet(context: EventContext<Env, any, any>) {
    const { request, env, params } = context;
    const pathParams = params.path;

    // 1. List Root / Albums
    if (!pathParams || pathParams.length === 0) {
        const listing = await env.neosphere_assets.list({
            include: ['customMetadata']
        } as any);

        const albums: Record<string, any> = {};

        for (const object of listing.objects) {
            const parts = object.key.split('/');
            if (parts.length < 2) continue;

            const albumName = parts[0];
            if (albumName === 'assets') continue;

            const filename = parts.slice(1).join('/');

            if (!albums[albumName]) {
                albums[albumName] = { title: albumName, count: 0, cover: [], photos: [], category: 'Gallery' };
            }

            // Read album metadata from .meta file
            if (filename === '.meta') {
                albums[albumName].category = object.customMetadata?.category || 'Gallery';
                continue;
            }

            if (!filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) continue;

            const url = `/api/gallery/${object.key}`;
            albums[albumName].photos.push({
                url,
                key: object.key,
                caption: object.customMetadata?.caption || '',
                filename
            });
            albums[albumName].count++;
        }

        Object.values(albums).forEach((album: any) => {
            album.cover = album.photos.slice(0, 4).map((p: any) => p.url);
        });

        return new Response(JSON.stringify(Object.values(albums)), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Serve Image
    const key = Array.isArray(pathParams) ? pathParams.join('/') : pathParams;
    const object = await env.neosphere_assets.get(key);

    if (object === null) return new Response("Not Found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    if (object.customMetadata?.caption) {
        headers.set('X-Custom-Caption', object.customMetadata.caption);
    }

    return new Response(object.body, { headers });
}

async function handlePost(context: any) {
    const { request, env } = context;
    const formData = await request.formData();
    const action = formData.get('action');

    if (action === 'upload') {
        const file = formData.get('file');
        const album = formData.get('album');
        const caption = formData.get('caption') || '';

        if (!file || !album) throw new Error('Missing file or album');

        const safeAlbum = album.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
        if (!safeAlbum) throw new Error('Invalid album name');

        const fileName = file.name.replace(/[^a-zA-Z0-9 ._-]/g, '');
        const key = `${safeAlbum}/${fileName}`;

        await env.neosphere_assets.put(key, file, {
            customMetadata: { caption }
        });

        return new Response(JSON.stringify({ success: true, key }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}

async function handlePut(context: any) {
    const { request, env } = context;
    const body = await request.json();
    const { action, key, caption, newName } = body;

    if (action === 'update-caption') {
        if (!key) throw new Error('Missing key');

        const object = await env.neosphere_assets.get(key);
        if (!object) throw new Error('Object not found');

        await env.neosphere_assets.put(key, object.body, {
            customMetadata: { caption: caption || '' },
            httpMetadata: object.httpMetadata
        });

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'update-category') {
        const { album, category } = body;
        if (!album) throw new Error('Missing album');

        const metaKey = `${album}/.meta`;
        await env.neosphere_assets.put(metaKey, '', {
            customMetadata: { category: category || 'Gallery' }
        });

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'rename-photo') {
        if (!key || !newName) throw new Error('Missing params');

        const object = await env.neosphere_assets.get(key);
        if (!object) throw new Error('Object not found');

        const parts = key.split('/');
        const album = parts[0];
        const newKey = `${album}/${newName}`;

        await env.neosphere_assets.put(newKey, object.body, {
            customMetadata: object.customMetadata,
            httpMetadata: object.httpMetadata
        });

        await env.neosphere_assets.delete(key);

        return new Response(JSON.stringify({ success: true, newKey }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'rename-album') {
        const { oldName } = body;
        const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, '');

        const list: any = await env.neosphere_assets.list({ prefix: oldName + '/' });
        const promises = [];

        for (const obj of list.objects) {
            const filename = obj.key.split('/').slice(1).join('/');
            const newKey = `${safeNewName}/${filename}`;

            promises.push(async () => {
                const o = await env.neosphere_assets.get(obj.key);
                await env.neosphere_assets.put(newKey, o.body, {
                    customMetadata: o.customMetadata,
                    httpMetadata: o.httpMetadata
                });
                await env.neosphere_assets.delete(obj.key);
            });
        }

        for (const p of promises) await p();

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}

async function handleDelete(context: any) {
    const { request, env } = context;
    const body = await request.json();
    const { key, album } = body;

    if (key) {
        await env.neosphere_assets.delete(key);
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (album) {
        let truncated = true;
        let cursor = undefined;

        while (truncated) {
            const list: any = await env.neosphere_assets.list({ prefix: album + '/', cursor });
            const keys = list.objects.map((o: any) => o.key);
            if (keys.length > 0) {
                await env.neosphere_assets.delete(keys);
            }
            truncated = list.truncated;
            cursor = list.cursor;
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Missing key or album' }), { status: 400 });
}
