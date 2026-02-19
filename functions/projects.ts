import { injectSEO } from './utils/seo';

export const onRequest: PagesFunction = async (context) => {
    const url = new URL(context.request.url);
    const indexRequest = new Request(url.origin + '/', context.request);
    const response = await context.env.ASSETS.fetch(indexRequest);
    const html = await response.text();

    const newHtml = injectSEO(html, {
        title: 'Projects | Bahauddin Alam',
        description: 'Showcase of my recent projects. From web applications to system tools, explore what I\'ve built.',
        url: 'https://bahauddin.in/projects'
    });

    return new Response(newHtml, {
        headers: response.headers,
        status: response.status
    });
};
