import { injectSEO } from './utils/seo';

export const onRequest: PagesFunction = async (context) => {
    // 1. Fetch the original index.html
    // We use the root URL to fetch the index.html asset
    const url = new URL(context.request.url);
    const indexRequest = new Request(url.origin + '/', context.request);
    const response = await context.env.ASSETS.fetch(indexRequest);
    
    // 2. Inject customized SEO meta tags
    return injectSEO(response, {
        title: 'About | Bahauddin Alam',
        description: 'I build high-performance web applications and developer-focused tools with a strong emphasis on scaling, reliability, and systems-level optimization.',
        url: 'https://bahauddin.in/about'
    });
};
