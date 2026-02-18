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

    // Bot User-Agent — return HTML with OG tags for social sharing
    const ua = request.headers.get('User-Agent') || '';
    if (BOT_UA.test(ua)) {
        try {
            const spaResponse = await env.ASSETS.fetch(new URL('/', request.url));
            let html = await spaResponse.text();

            const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const albumTitle = escHtml(decodeURIComponent(key.split('/').pop() || key));

            // Find a cover image: list objects with this prefix and pick the first image
            const listing = await env.neosphere_assets.list({ prefix: key + '/', limit: 10 });
            let coverUrl = '';
            for (const obj of listing.objects) {
                if (IMAGE_EXT.test(obj.key)) {
                    coverUrl = new URL(`/r2/${obj.key}`, request.url).href;
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

    // Regular browser — always fall through to SPA
    return context.next();
};
