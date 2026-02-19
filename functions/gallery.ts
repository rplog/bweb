import { injectSEO } from './utils/seo';

export const onRequest: PagesFunction = async (context) => {
    const url = new URL(context.request.url);
    const indexRequest = new Request(url.origin + '/', context.request);
    const response = await context.env.ASSETS.fetch(indexRequest);
    return injectSEO(response, {
        title: 'Gallery | Bahauddin Alam',
        description: 'Explore my photography portfolio. A collection of moments captured from my travels and daily life.',
        url: 'https://bahauddin.in/gallery'
    });
};
