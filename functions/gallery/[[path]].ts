interface Env {
    neosphere_assets: R2Bucket;
    ASSETS: Fetcher;
}

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const pathParts = params.path;

    if (!pathParts || (Array.isArray(pathParts) && pathParts.length === 0)) {
        return context.next();
    }

    const key = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;
    const isPhotoUrl = IMAGE_EXT.test(key) || !key.includes('.');

    const escHtml = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let ogTitle: string;
    let ogDescription: string;
    let coverUrl = '';

    if (isPhotoUrl && key.includes('/')) {
        // Direct photo URL e.g. gallery/Arch/SugarFactoryyes.jpg or gallery/Arch/SugarFactoryyes
        const rawFilename = decodeURIComponent(key.split('/').pop() || key).replace(IMAGE_EXT, '');
        const albumParts = key.split('/').slice(0, -1).map(p => decodeURIComponent(p));
        const albumName = escHtml(albumParts.join(' / '));
        const filename = escHtml(rawFilename);
        coverUrl = new URL(`/r2/${key}`, request.url).href;
        ogTitle = albumName ? `${filename} — ${albumName}` : filename;
        ogDescription = albumName ? `Photo from the ${albumName} album` : 'View photo';
    } else {
        // Album URL e.g. gallery/Arch
        const albumTitle = escHtml(decodeURIComponent(key.split('/').pop() || key));
        ogTitle = `${albumTitle} — Gallery`;
        ogDescription = `Browse the ${albumTitle} album`;
        try {
            const listing = await env.neosphere_assets.list({ prefix: key + '/', limit: 10 });
            for (const obj of listing.objects) {
                if (IMAGE_EXT.test(obj.key) || !obj.key.split('/').pop()?.includes('.')) {
                    coverUrl = new URL(`/r2/${obj.key}`, request.url).href;
                    break;
                }
            }
        } catch {
            // No cover found, continue without image
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

    // Always serve the SPA shell via ASSETS (bypasses the static-file fallback
    // issue where Cloudflare Pages won't serve index.html for .jpg extension paths)
    const spaResponse = await env.ASSETS.fetch(new URL('/', request.url));

    // Use HTMLRewriter to inject OG tags for ALL requests — this is the
    // Cloudflare-recommended approach and ensures every crawler (Telegram,
    // Discord, etc.) gets correct tags regardless of user-agent string.
    return new HTMLRewriter()
        .on('head', {
            element(el) {
                el.append(`\n    ${ogTags}\n`, { html: true });
            }
        })
        .transform(spaResponse);
};
