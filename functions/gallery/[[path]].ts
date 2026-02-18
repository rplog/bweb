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
    const isPhotoUrl = IMAGE_EXT.test(key);
    const ua = request.headers.get('User-Agent') || '';

    // Bot User-Agent — return HTML with OG tags for social sharing
    if (BOT_UA.test(ua)) {
        try {
            const spaResponse = await env.ASSETS.fetch(new URL('/', request.url));
            let html = await spaResponse.text();

            const escHtml = (s: string) =>
                s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            let ogTitle: string;
            let ogDescription: string;
            let coverUrl = '';

            if (isPhotoUrl) {
                // Direct photo URL — use the photo itself as og:image
                coverUrl = new URL(`/r2/${key}`, request.url).href;
                const filename = escHtml(
                    decodeURIComponent(key.split('/').pop() || key).replace(IMAGE_EXT, '')
                );
                const albumName = escHtml(
                    key.split('/').slice(0, -1).map(p => decodeURIComponent(p)).join(' / ')
                );
                ogTitle = albumName ? `${filename} — ${albumName}` : filename;
                ogDescription = albumName ? `Photo from the ${albumName} album` : 'View photo';
            } else {
                // Album URL — find first image in the album as cover
                const albumTitle = escHtml(decodeURIComponent(key.split('/').pop() || key));
                ogTitle = `${albumTitle} — Gallery`;
                ogDescription = `Browse the ${albumTitle} album`;
                const listing = await env.neosphere_assets.list({ prefix: key + '/', limit: 10 });
                for (const obj of listing.objects) {
                    if (IMAGE_EXT.test(obj.key)) {
                        coverUrl = new URL(`/r2/${obj.key}`, request.url).href;
                        break;
                    }
                }
            }

            const ogTags = [
                `<meta property="og:title" content="${ogTitle}" />`,
                `<meta property="og:type" content="website" />`,
                `<meta property="og:url" content="${request.url}" />`,
                `<meta property="og:description" content="${escHtml(ogDescription)}" />`,
                coverUrl ? `<meta property="og:image" content="${coverUrl}" />` : '',
                `<meta name="twitter:card" content="${coverUrl ? 'summary_large_image' : 'summary'}" />`,
                `<meta name="twitter:title" content="${ogTitle}" />`,
                coverUrl ? `<meta name="twitter:image" content="${coverUrl}" />` : '',
            ].filter(Boolean).join('\n    ');

            html = html.replace('</head>', `    ${ogTags}\n  </head>`);

            return new Response(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        } catch {
            return context.next();
        }
    }

    // Regular browser with image-extension path (/gallery/Album/photo.jpg):
    // context.next() does NOT fall back to index.html for paths that look like
    // static files — Cloudflare Pages bypasses the SPA and serves the raw asset.
    // Explicitly fetch the SPA shell to ensure the React app loads correctly.
    if (isPhotoUrl) {
        return env.ASSETS.fetch(new URL('/', request.url));
    }

    return context.next();
};
