interface Env {
    neosphere_assets: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const path = context.params.path;

    if (!path || path.length === 0) {
        return new Response("Not Found", { status: 404 });
    }

    // Construct key from path array - handles /api/gallery/Flora/img.jpg -> Flora/img.jpg
    const key = Array.isArray(path) ? path.join('/') : path;

    // Fetch object from R2
    const object = await context.env.neosphere_assets.get(key);

    if (object === null) {
        return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    // Cache for 1 day
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(object.body, {
        headers,
    });
};
