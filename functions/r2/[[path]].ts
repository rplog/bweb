interface Env {
    neosphere_assets: R2Bucket;
}

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;
const IMAGE_CONTENT_TYPES = /^image\/(jpeg|png|webp|gif|avif)/i;

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env, params } = context;
    const pathParts = params.path;

    if (!pathParts || (Array.isArray(pathParts) && pathParts.length === 0)) {
        return new Response('Not Found', { status: 404 });
    }

    const key = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

    const object = await env.neosphere_assets.get(key);
    if (!object) {
        return new Response('Not Found', { status: 404 });
    }

    // Accept if key has an image extension OR if the stored content-type is an image
    const contentType = object.httpMetadata?.contentType || '';
    const isImage = IMAGE_EXT.test(key) || IMAGE_CONTENT_TYPES.test(contentType);
    if (!isImage) {
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
