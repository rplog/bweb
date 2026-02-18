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
        const albums: Record<string, any> = {};

        // Paginated R2 list to handle >1000 objects
        let truncated = true;
        let cursor: string | undefined = undefined;

        while (truncated) {
            const listing: any = await env.neosphere_assets.list({
                include: ['customMetadata'],
                cursor
            } as any);

            for (const object of listing.objects) {
                if (!object.key.includes('/')) continue;

                const lastSlash = object.key.lastIndexOf('/');
                const albumPath = object.key.substring(0, lastSlash);
                const filename = object.key.substring(lastSlash + 1);

                if (albumPath === 'assets') continue;
                if (filename === '.meta') {
                    if (!albums[albumPath]) {
                        albums[albumPath] = { title: albumPath, count: 0, cover: [], photos: [], category: 'Gallery' };
                    }
                    albums[albumPath].category = object.customMetadata?.category || 'Gallery';
                    continue;
                }

                if (!filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) continue;

                if (!albums[albumPath]) {
                    albums[albumPath] = { title: albumPath, count: 0, cover: [], photos: [], category: 'Gallery' };
                }

                const url = `/r2/${object.key}`;
                albums[albumPath].photos.push({
                    url,
                    key: object.key,
                    caption: object.customMetadata?.caption || '',
                    filename
                });
                albums[albumPath].count++;

                // Ensure parent albums exist (for navigation)
                let parent = albumPath;
                while (parent.includes('/')) {
                    parent = parent.substring(0, parent.lastIndexOf('/'));
                    if (!albums[parent]) {
                        albums[parent] = { title: parent, count: 0, cover: [], photos: [], category: 'Gallery' };
                    }
                }
            }

            truncated = listing.truncated;
            cursor = listing.cursor;
        }

        // Generate covers — inherit from sub-albums if album has no direct photos
        const albumList = Object.values(albums) as any[];
        for (const album of albumList) {
            if (album.photos.length > 0) {
                album.cover = album.photos.slice(0, 4).map((p: any) => p.url);
            } else {
                // Inherit covers from first sub-album that has photos
                const prefix = album.title + '/';
                const subWithPhotos = albumList.find(
                    (sub: any) => sub.title.startsWith(prefix) && sub.photos.length > 0
                );
                album.cover = subWithPhotos
                    ? subWithPhotos.photos.slice(0, 4).map((p: any) => p.url)
                    : [];
            }
        }

        return new Response(JSON.stringify(albumList), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Images are now served via /gallery/... — return 404 for any path params here
    return new Response("Not Found", { status: 404 });
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

        // Allow slashes for nested albums, block path traversal
        const safeAlbum = album.replace(/[^a-zA-Z0-9 _\-\/]/g, '').replace(/\/+/g, '/').replace(/^\/|\/$/g, '').trim();
        if (!safeAlbum || safeAlbum.includes('..')) throw new Error('Invalid album name');

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

        const safeName = newName.replace(/[^a-zA-Z0-9 ._-]/g, '');
        if (!safeName || safeName.includes('..')) throw new Error('Invalid file name');

        const object = await env.neosphere_assets.get(key);
        if (!object) throw new Error('Object not found');

        const parts = key.split('/');
        const album = parts.slice(0, -1).join('/');
        const newKey = `${album}/${safeName}`;

        await env.neosphere_assets.put(newKey, object.body, {
            customMetadata: object.customMetadata,
            httpMetadata: object.httpMetadata
        });

        await env.neosphere_assets.delete(key);

        return new Response(JSON.stringify({ success: true, newKey }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'rename-album') {
        const { oldName } = body;
        const safeNewName = newName.replace(/[^a-zA-Z0-9 _\-\/]/g, '').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
        if (!safeNewName || safeNewName.includes('..')) throw new Error('Invalid album name');

        const oldDepth = oldName.split('/').length;
        let truncated = true;
        let cursor: string | undefined = undefined;

        while (truncated) {
            const list: any = await env.neosphere_assets.list({ prefix: oldName + '/', cursor });

            for (const obj of list.objects) {
                const remainder = obj.key.split('/').slice(oldDepth).join('/');
                const newKey = `${safeNewName}/${remainder}`;

                const o = await env.neosphere_assets.get(obj.key);
                await env.neosphere_assets.put(newKey, o.body, {
                    customMetadata: o.customMetadata,
                    httpMetadata: o.httpMetadata
                });
                await env.neosphere_assets.delete(obj.key);
            }

            truncated = list.truncated;
            cursor = list.cursor;
        }

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
