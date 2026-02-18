export interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'json';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

export const optimizeImage = (url: string, options: ImageOptions = {}): string => {
    if (!url) return '';

    // Check for localhost environment
    // Cloudflare Image Resizing typically requires the request to go through the Cloudflare network
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return url;
    }

    const params: string[] = [];

    if (options.width) params.push(`width=${options.width}`);
    if (options.height) params.push(`height=${options.height}`);
    if (options.quality) params.push(`quality=${options.quality}`);
    params.push(`format=${options.format || 'auto'}`);
    if (options.fit) params.push(`fit=${options.fit}`);

    const optionsStr = params.join(',');

    // Clean URL ensuring leading slash
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;

    // Cloudflare Image Resizing requires a recognizable image extension to process
    // the source URL. Skip optimization for extensionless paths (e.g. /r2/Arch/SugarFactoryyes).
    const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i;
    if (!IMAGE_EXT.test(cleanUrl)) {
        return cleanUrl;
    }

    return `/cdn-cgi/image/${optionsStr}${cleanUrl}`;
};
