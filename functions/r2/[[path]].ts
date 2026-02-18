interface Env {
    neosphere_assets: R2Bucket;
}

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env, params } = context;
    const pathParts = params.path;

    if (!pathParts || (Array.isArray(pathParts) && pathParts.length === 0)) {
        return new Response('Not Found', { status: 404 });
    }

    const key = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

    if (!IMAGE_EXT.test(key)) {
        return new Response('Not Found', { status: 404 });
    }

    const object = await env.neosphere_assets.get(key);
    if (!object) {
        return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    if (object.customMetadata?.caption) {
        headers.set('X-Custom-Caption', object.customMetadata.caption);
    }

    return new Response(object.body, { headers });
};
