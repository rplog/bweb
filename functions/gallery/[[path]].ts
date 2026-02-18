interface Env {
    neosphere_assets: R2Bucket;
    ASSETS: Fetcher;
}

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;
const BOT_UA = /Telegrambot|Twitterbot|facebookexternalhit|Discordbot|Slackbot|LinkedInBot|WhatsApp|Googlebot|bingbot/i;

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const pathParts = params.path;

    if (!pathParts || (Array.isArray(pathParts) && pathParts.length === 0)) {
        return context.next();
    }

    const key = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

    // 1. Image file — serve raw from R2 ONLY if not navigating (HTML request)
    const accept = request.headers.get('Accept') || '';
    if (IMAGE_EXT.test(key) && !accept.includes('text/html')) {
        const object = await env.neosphere_assets.get(key);
        if (!object) return context.next();

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        if (object.customMetadata?.caption) {
            headers.set('X-Custom-Caption', object.customMetadata.caption);
        }

        return new Response(object.body, { headers });
    }

    // 2. Bot User-Agent on non-image path — return HTML with OG tags
    const ua = request.headers.get('User-Agent') || '';
    if (BOT_UA.test(ua)) {
        try {
            const spaResponse = await env.ASSETS.fetch(new URL('/', request.url));
            let html = await spaResponse.text();

            const albumTitle = decodeURIComponent(key.split('/').pop() || key);

            // Find a cover image: list objects with this prefix and pick the first image
            const listing = await env.neosphere_assets.list({ prefix: key + '/', limit: 10 });
            let coverUrl = '';
            for (const obj of listing.objects) {
                if (IMAGE_EXT.test(obj.key)) {
                    coverUrl = new URL(`/gallery/${obj.key}`, request.url).href;
                    break;
                }
            }

            const ogTags = [
                `<meta property="og:title" content="${albumTitle} — Gallery" />`,
                `<meta property="og:type" content="website" />`,
                `<meta property="og:url" content="${request.url}" />`,
                coverUrl ? `<meta property="og:image" content="${coverUrl}" />` : '',
                `<meta name="twitter:card" content="${coverUrl ? 'summary_large_image' : 'summary'}" />`,
            ].filter(Boolean).join('\n    ');

            html = html.replace('</head>', `    ${ogTags}\n  </head>`);

            return new Response(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        } catch {
            return context.next();
        }
    }

    // 3. Regular browser — fall through to SPA
    return context.next();
};
