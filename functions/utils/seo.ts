export interface SEOData {
    title: string;
    description: string;
    url: string;
    image?: string;
}

export const defaultSEO = {
    title: "Bahauddin Alam - Full Stack Developer",
    description: "I'm Bahauddin Alam, a Full Stack Developer specializing in React, JavaScript, TypeScript, Tailwind CSS, and Python. Explore my portfolio and projects.",
    descriptionOG: "Bahauddin Alam is a Full Stack Developer specializing in React, JavaScript, TypeScript, Tailwind CSS, and Python. Explore his portfolio and projects.",
    url: "https://bahauddin.in",
    image: "https://bahauddin.in/og-image.png"
};

export function injectSEO(html: string, data: SEOData): string {
    // Helper to escape HTML special characters for safety
    const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    let newHtml = html;

    // Title
    newHtml = newHtml.replace(
        new RegExp(`<title>${defaultSEO.title}</title>`, 'g'),
        `<title>${escape(data.title)}</title>`
    );

    // Description
    newHtml = newHtml.replace(
        new RegExp(`<meta name="description"\\s+content="${defaultSEO.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*/>`, 'g'),
        `<meta name="description" content="${escape(data.description)}" />`
    );

    // Canonical
    newHtml = newHtml.replace(
        new RegExp(`<link rel="canonical" href="${defaultSEO.url}" />`, 'g'),
        `<link rel="canonical" href="${data.url}" />`
    );

    // OG Title
    newHtml = newHtml.replace(
        new RegExp(`<meta property="og:title" content="${defaultSEO.title}" />`, 'g'),
        `<meta property="og:title" content="${escape(data.title)}" />`
    );

    // OG Description
    newHtml = newHtml.replace(
        new RegExp(`<meta property="og:description"\\s+content="${defaultSEO.descriptionOG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*/>`, 'g'),
        `<meta property="og:description" content="${escape(data.description)}" />`
    );

    // OG URL
    newHtml = newHtml.replace(
        new RegExp(`<meta property="og:url" content="${defaultSEO.url}" />`, 'g'),
        `<meta property="og:url" content="${data.url}" />`
    );

    // Twitter Title
    newHtml = newHtml.replace(
        new RegExp(`<meta name="twitter:title" content="${defaultSEO.title}" />`, 'g'),
        `<meta name="twitter:title" content="${escape(data.title)}" />`
    );

    // Twitter Description
    newHtml = newHtml.replace(
        new RegExp(`<meta name="twitter:description"\\s+content="${defaultSEO.descriptionOG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*/>`, 'g'),
        `<meta name="twitter:description" content="${escape(data.description)}" />`
    );

    // Twitter URL
    newHtml = newHtml.replace(
        new RegExp(`<meta name="twitter:url" content="${defaultSEO.url}" />`, 'g'),
        `<meta name="twitter:url" content="${data.url}" />`
    );
    
    // Image (if provided)
    if (data.image) {
         newHtml = newHtml.replace(
            new RegExp(`<meta property="og:image" content="${defaultSEO.image}" />`, 'g'),
            `<meta property="og:image" content="${data.image}" />`
        );
        newHtml = newHtml.replace(
            new RegExp(`<meta name="twitter:image" content="${defaultSEO.image}" />`, 'g'),
            `<meta name="twitter:image" content="${data.image}" />`
        );
    }

    return newHtml;
}
