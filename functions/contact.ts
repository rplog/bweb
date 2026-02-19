import { injectSEO } from './utils/seo';

export const onRequest: PagesFunction = async (context) => {
    const url = new URL(context.request.url);
    const indexRequest = new Request(url.origin + '/', context.request);
    const response = await context.env.ASSETS.fetch(indexRequest);
    const html = await response.text();

    const newHtml = injectSEO(html, {
        title: 'Contact | Bahauddin Alam',
        description: 'Get in touch with Bahauddin Alam. Available for freelance projects and collaborations.',
        url: 'https://bahauddin.in/contact'
    });

    return new Response(newHtml, {
        headers: response.headers,
        status: response.status
    });
};
