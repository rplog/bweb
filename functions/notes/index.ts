import { injectSEO } from '../utils/seo';

export const onRequest: PagesFunction = async (context) => {
    const url = new URL(context.request.url);
    
    // Check for deep link query param ?note=filename
    const noteParam = url.searchParams.get('note');
    
    let title = 'Notes | Bahauddin Alam';
    let description = 'My personal digital garden. A collection of notes, thoughts, and learnings on software development and technology.';
    let pageUrl = 'https://bahauddin.in/notes';

    if (noteParam) {
        title = `${noteParam} | Notes`;
        description = `Read ${noteParam} on my personal digital garden.`;
        pageUrl = `https://bahauddin.in/notes?note=${encodeURIComponent(noteParam)}`;
    }

    const indexRequest = new Request(url.origin + '/', context.request);
    const response = await context.env.ASSETS.fetch(indexRequest);
    const html = await response.text();

    const newHtml = injectSEO(html, {
        title: title,
        description: description,
        url: pageUrl
    });

    return new Response(newHtml, {
        headers: response.headers,
        status: response.status
    });
};
