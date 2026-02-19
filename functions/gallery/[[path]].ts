import { injectSEO } from '../utils/seo';

interface Env {
    neosphere_assets: R2Bucket;
    ASSETS: Fetcher;
}

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

const encodeKey = (k: string) => k.split('/').map(s => encodeURIComponent(s)).join('/');

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const pathParts = params.path;

    // Empty path (e.g. /gallery/ with trailing slash) → serve gallery index with SEO
    if (!pathParts || (Array.isArray(pathParts) && pathParts.length === 0)
        || (Array.isArray(pathParts) && pathParts.length === 1 && pathParts[0] === '')) {
        const spaResponse = await env.ASSETS.fetch(new URL('/', request.url));
        return injectSEO(spaResponse, {
            title: 'Gallery | Bahauddin Alam',
            description: 'Explore my photography portfolio. A collection of moments captured from my travels and daily life.',
            url: 'https://bahauddin.in/gallery'
        });
    }

    const key = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;
    // R2 keys are stored decoded; decode URL-encoded segments for R2 operations
    const r2Key = key.split('/').map(p => decodeURIComponent(p)).join('/');

    // Image request (has extension) → serve directly from R2
    if (IMAGE_EXT.test(key)) {
        const object = await env.neosphere_assets.get(r2Key);
        if (!object) return new Response('Not Found', { status: 404 });
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        return new Response(object.body, { headers });
    }

    // Extensionless URL → SPA page with OG tags (replace existing, don't append duplicates)
    let ogTitle = '';
    let ogDescription = '';
    let coverUrl = '';

    // Try to resolve as a photo share URL (e.g. Arch/nicephoto → Arch/nicephoto.jpg)
    let isPhoto = false;
    if (r2Key.includes('/')) {
        const photoListing = await env.neosphere_assets.list({ prefix: r2Key + '.', limit: 5 }).catch(() => null);
        const match = photoListing?.objects.find(o => IMAGE_EXT.test(o.key));
        if (match) {
            isPhoto = true;
            const rawFilename = decodeURIComponent(key.split('/').pop() || key);
            const albumParts = key.split('/').slice(0, -1).map(p => decodeURIComponent(p));
            const albumName = albumParts.join(' / ');
            const filename = rawFilename;
            coverUrl = new URL(`/gallery/${encodeKey(match.key)}`, request.url).href;
            ogTitle = albumName ? `${filename} — ${albumName}` : filename;
            ogDescription = albumName ? `Photo from the ${albumName} album` : 'View photo';
        }
    }

    if (!isPhoto) {
        // Album URL
        const albumTitle = decodeURIComponent(key.split('/').pop() || key);
        ogTitle = `${albumTitle} — Gallery`;
        ogDescription = `Browse the ${albumTitle} album`;
        const listing = await env.neosphere_assets.list({ prefix: r2Key + '/', limit: 10 }).catch(() => null);
        if (listing) {
            for (const obj of listing.objects) {
                if (IMAGE_EXT.test(obj.key)) {
                    coverUrl = new URL(`/gallery/${encodeKey(obj.key)}`, request.url).href;
                    break;
                }
            }
        }
    }

    const spaResponse = await env.ASSETS.fetch(new URL('/', request.url));
    return injectSEO(spaResponse, {
        title: ogTitle,
        description: ogDescription,
        url: request.url,
        image: coverUrl || undefined
    });
};
