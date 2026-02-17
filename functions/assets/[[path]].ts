interface Env {
    neosphere_assets: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const path = context.params.path;

    if (!path || (Array.isArray(path) && path.length === 0)) {
        return new Response("Not Found", { status: 404 });
    }

    const key = 'assets/' + (Array.isArray(path) ? path.join('/') : path);

    const object = await context.env.neosphere_assets.get(key);

    if (object === null) {
        return context.next();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(object.body, { headers });
};
