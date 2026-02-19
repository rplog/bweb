import { injectSEO } from './utils/seo';

export const onRequest: PagesFunction = async (context) => {
    // 1. Fetch the original index.html
    // We use the root URL to fetch the index.html asset
    const url = new URL(context.request.url);
    const indexRequest = new Request(url.origin + '/', context.request);
    const response = await context.env.ASSETS.fetch(indexRequest);
    
    // 2. Get the HTML content
    const html = await response.text();

    // 3. Inject customized SEO meta tags
    const newHtml = injectSEO(html, {
        title: 'About | Bahauddin Alam',
        description: 'Learn more about Bahauddin Alam, a Full Stack Developer with a passion for building elegant and functional web applications.',
        url: 'https://bahauddin.in/about'
    });

    // 4. Return new response
    return new Response(newHtml, {
        headers: response.headers,
        status: response.status
    });
};
