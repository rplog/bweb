interface Env {
    neosphere_assets: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const listing = await context.env.neosphere_assets.list();

        // Group by folder
        const albums: Record<string, string[]> = {};

        for (const object of listing.objects) {
            // key format: Folder/Filename.ext
            const parts = object.key.split('/');
            if (parts.length < 2) continue; // Root files ignored

            const albumName = parts[0];
            const filename = parts.slice(1).join('/');

            if (!albums[albumName]) {
                albums[albumName] = [];
            }

            // Only include images
            if (filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                albums[albumName].push(`/api/gallery/${object.key}`);
            }
        }

        // Format for frontend
        const result = Object.entries(albums).map(([title, photos]) => {
            return {
                title,
                count: photos.length,
                // Use first 4 photos for grid cover
                cover: photos.slice(0, 4),
                photos: photos,
                category: 'Gallery' // Default category
            };
        });

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
