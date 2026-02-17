import { verifyAuth } from '../../utils/auth';

interface Env {
    neosphere_assets: R2Bucket;
    ADMIN_PASSWORD: string;
    JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // Dispatch based on Method
    if (request.method === 'GET') {
        return handleGet(context);
    }

    // Auth check for mutation
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
    const pathParams = params.path; // [] or ['Album', 'file.jpg']

    // 1. List Root / Albums
    if (!pathParams || pathParams.length === 0) {
        const listing = await env.neosphere_assets.list({
            include: ['customMetadata'] // Fetch captions
        } as any);

        const albums: Record<string, any> = {};

        for (const object of listing.objects) {
            const parts = object.key.split('/');
            if (parts.length < 2) continue; // Ignore root files

            const albumName = parts[0];
            if (albumName === 'assets') continue; // Skip assets folder

            const filename = parts.slice(1).join('/');

            if (!albums[albumName]) {
                albums[albumName] = {
                    title: albumName,
                    count: 0,
                    cover: [],
                    photos: [],
                    category: 'Gallery'
                };
            }

            if (filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                const url = `/api/gallery/${object.key}`;
                albums[albumName].count++;
                albums[albumName].photos.push({
                    url,
                    caption: object.customMetadata?.caption || '',
                    key: object.key
                });

                // Add metadata if cover needed or for grid
                // For now, simple list. We could inject caption into URL or side-channel?
                // Frontend currently expects string[].
                // We might need to change frontend to accept objects { url, caption }
                // For backward compat, we keep photos as string[] for now, but maybe expose a separate endpoint for details?
                // OR: Update frontend to handle objects.
                // Let's stick to existing "Album" interface for now, but maybe we modify it to "GalleryItem"?
                // User requirement: "add captions".
                // I will update the response to include `items: { url, caption }[]`.
            }
        }

        // Populate covers
        Object.values(albums).forEach((album: any) => {
            album.cover = album.photos.slice(0, 4);
        });

        // Current Frontend expects `photos: string[]`. I should probably update frontend to support objects.
        // But to avoid breaking it immediately, I'll pass `items` as a new field and let frontend adopt it.
        // Actually, I'll update frontend in next step.
        // For now, let's return `photos` as strings and maybe `photoDetails` map?
        // Or just change the API contract.

        // Let's change the API contract. Frontend will break until I fix it. That's acceptable in "Agent Mode".
        // New Interface: photos: { url: string, caption?: string, key: string }[]

        const result = Object.values(albums).map((album: any) => {
            // Map photos string[] to full objects if we had them.
            // Re-iterating to associate metadata is inefficient here.
            // Let's refactor the loop slightly.
            return album;
        });

        // Better loop
        const albumsV2: Record<string, any> = {};
        for (const object of listing.objects) {
            const parts = object.key.split('/');
            if (parts.length < 2 || parts[0] === 'assets') continue;

            const albumName = parts[0];
            const filename = parts.slice(1).join('/');

            if (!filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) continue;

            if (!albumsV2[albumName]) {
                albumsV2[albumName] = { title: albumName, count: 0, cover: [], photos: [], category: 'Gallery' };
            }

            const url = `/api/gallery/${object.key}`;
            const item = {
                url,
                key: object.key,
                caption: object.customMetadata?.caption || '',
                filename
            };

            albumsV2[albumName].photos.push(item); // Pushing object now
            albumsV2[albumName].count++;
        }

        Object.values(albumsV2).forEach((album: any) => {
            // Cover logic: use URLs
            album.cover = album.photos.slice(0, 4).map((p: any) => p.url);
            // Photos: return objects? Or just URLs?
            // To support captions, we MUST return objects.
            // Breaking change: `photos` is now `GalleryItem[]`.
            // Wait, standard `photos` was `string[]`.
            // I'll keep `photos` as `string[]` for compat and add `items: GalleryItem[]`.
            album.items = album.photos; // The objects
            album.photos = album.items.map((i: any) => i.url); // The strings
        });

        return new Response(JSON.stringify(Object.values(albumsV2)), {
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

    // Pass custom metadata in headers? Useful for htmx/client info
    if (object.customMetadata?.caption) {
        headers.set('X-Custom-Caption', object.customMetadata.caption);
    }

    return new Response(object.body, { headers });
}

async function handlePost(context: any) {
    const { request, env } = context;
    const formData = await request.formData();
    const action = formData.get('action');

    // Action: 'upload'
    if (action === 'upload') {
        const file = formData.get('file');
        const album = formData.get('album'); // Folder name
        const caption = formData.get('caption') || '';

        if (!file || !album) throw new Error('Missing file or album');

        // Path safety
        const safeAlbum = album.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
        if (!safeAlbum) throw new Error('Invalid album name');

        const fileName = file.name.replace(/[^a-zA-Z0-9 ._-]/g, '');
        const key = `${safeAlbum}/${fileName}`;

        await env.neosphere_assets.put(key, file, {
            customMetadata: { caption }
        });

        return new Response(JSON.stringify({ success: true, key }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Action: 'create-album'
    // R2 doesn't have folders. We can create a .keep file?
    // Or just rely on upload to create it.
    // Client side: "Create Album" -> asks for name -> "Upload photos". 
    // Effectively we don't need explicit create album action on backend unless we store metadata for albums.

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}

async function handlePut(context: any) {
    const { request, env } = context;
    const body = await request.json();
    const { action, key, caption, newName } = body;

    if (action === 'update-caption') {
        if (!key) throw new Error('Missing key');

        // R2: Get -> Put with new metadata
        // Since we can't easily COPY in workers without downloading, check size?
        // Actually, for metadata update, we have to re-upload or copy.
        // BUT: We can CopyObject to itself.
        // Note: R2 bind doesn't expose `copy`. We must use `get` then `put` with body.
        // Optimization: If generic object, `put` accepts `R2Object` body stream.

        const object = await env.neosphere_assets.get(key);
        if (!object) throw new Error('Object not found');

        await env.neosphere_assets.put(key, object.body, {
            customMetadata: { caption: caption || '' },
            httpMetadata: object.httpMetadata
        });

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'rename-photo') {
        // Copy to new key, delete old
        if (!key || !newName) throw new Error('Missing params');

        const object = await env.neosphere_assets.get(key);
        if (!object) throw new Error('Object not found');

        // Parts
        const parts = key.split('/');
        const album = parts[0];
        const newKey = `${album}/${newName}`; // Keep in same album

        await env.neosphere_assets.put(newKey, object.body, {
            customMetadata: object.customMetadata,
            httpMetadata: object.httpMetadata
        });

        await env.neosphere_assets.delete(key);

        return new Response(JSON.stringify({ success: true, newKey }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Rename Album?
    if (action === 'rename-album') {
        // Hard: List all, Copy all, Delete all.
        // Allowable for small albums.
        const { oldName } = body;
        const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, '');

        const list: any = await env.neosphere_assets.list({ prefix: oldName + '/' });
        const promises = [];

        for (const obj of list.objects) {
            const filename = obj.key.split('/').slice(1).join('/');
            const newKey = `${safeNewName}/${filename}`;

            // We need to fetch body to move
            promises.push(async () => {
                const o = await env.neosphere_assets.get(obj.key);
                await env.neosphere_assets.put(newKey, o.body, {
                    customMetadata: o.customMetadata,
                    httpMetadata: o.httpMetadata
                });
                await env.neosphere_assets.delete(obj.key);
            });
        }

        // Run serially? Or parallel? Limit concurrency.
        for (const p of promises) await p();

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}

async function handleDelete(context: any) {
    const { request, env } = context;
    const body = await request.json();
    const { key, album } = body;

    // Delete Single Photo
    if (key) {
        await env.neosphere_assets.delete(key);
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Delete Album
    if (album) {
        // List and delete all
        let truncated = true;
        let cursor = undefined;

        while (truncated) {
            const list: any = await env.neosphere_assets.list({ prefix: album + '/', cursor });
            const keys = list.objects.map((o: any) => o.key);
            if (keys.length > 0) {
                await env.neosphere_assets.delete(keys); // R2 supports batch delete? Yes, delete(keys: string[])
            }
            truncated = list.truncated;
            cursor = list.cursor;
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Missing key or album' }), { status: 400 });
}

