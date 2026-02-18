interface Env {
    neosphere_assets: R2Bucket;
    ASSETS: Fetcher;
}

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

const encodeKey = (k: string) => k.split('/').map(s => encodeURIComponent(s)).join('/');

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const pathParts = params.path;

    if (!pathParts || (Array.isArray(pathParts) && pathParts.length === 0)) {
        return context.next();
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

    // Extensionless URL → SPA page with OG tags
    const escHtml = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
            const albumName = escHtml(albumParts.join(' / '));
            const filename = escHtml(rawFilename);
            coverUrl = new URL(`/gallery/${encodeKey(match.key)}`, request.url).href;
            ogTitle = albumName ? `${filename} — ${albumName}` : filename;
            ogDescription = albumName ? `Photo from the ${albumName} album` : 'View photo';
        }
    }

    if (!isPhoto) {
        // Album URL
        const albumTitle = escHtml(decodeURIComponent(key.split('/').pop() || key));
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

    const ogTags = [
        `<meta property="og:title" content="${ogTitle}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:url" content="${escHtml(request.url)}" />`,
        `<meta property="og:description" content="${escHtml(ogDescription)}" />`,
        coverUrl ? `<meta property="og:image" content="${escHtml(coverUrl)}" />` : '',
        `<meta name="twitter:card" content="${coverUrl ? 'summary_large_image' : 'summary'}" />`,
        `<meta name="twitter:title" content="${ogTitle}" />`,
        `<meta name="twitter:description" content="${escHtml(ogDescription)}" />`,
        coverUrl ? `<meta name="twitter:image" content="${escHtml(coverUrl)}" />` : '',
    ].filter(Boolean).join('\n    ');

    const spaResponse = await env.ASSETS.fetch(new URL('/', request.url));

    return new HTMLRewriter()
        .on('head', {
            element(el) {
                el.append(`\n    ${ogTags}\n`, { html: true });
            }
        })
        .transform(spaResponse);
};
