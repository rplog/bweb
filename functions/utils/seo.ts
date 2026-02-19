export interface SEOData {
    title: string;
    description: string;
    url: string;
    image?: string;
}

export const defaultSEO = {
    title: "Bahauddin Alam - Full Stack Developer",
    description: "I'm Bahauddin Alam, a Full Stack Developer specializing in React, JavaScript, TypeScript, Tailwind CSS, and Python. Explore my portfolio and projects.",
    url: "https://bahauddin.in",
    image: "https://bahauddin.in/og-image.png"
};

export function injectSEO(response: Response, data: SEOData): Response {
    // HTMLRewriter is available in Cloudflare Pages Functions environment
    // @ts-ignore - HTMLRewriter types might not be fully available in this local context
    let rewriter = new HTMLRewriter()
        .on('title', {
            element(element: any) {
                element.setInnerContent(data.title);
            }
        })
        .on('meta[name="description"]', {
            element(element: any) {
                element.setAttribute('content', data.description);
            }
        })
        .on('link[rel="canonical"]', {
            element(element: any) {
                element.setAttribute('href', data.url);
            }
        })
        // Open Graph
        .on('meta[property="og:title"]', {
            element(element: any) {
                element.setAttribute('content', data.title);
            }
        })
        .on('meta[property="og:description"]', {
            element(element: any) {
                element.setAttribute('content', data.description);
            }
        })
        .on('meta[property="og:url"]', {
            element(element: any) {
                element.setAttribute('content', data.url);
            }
        })
        // Twitter
        .on('meta[name="twitter:title"]', {
            element(element: any) {
                element.setAttribute('content', data.title);
            }
        })
        .on('meta[name="twitter:description"]', {
            element(element: any) {
                element.setAttribute('content', data.description);
            }
        })
        .on('meta[name="twitter:url"]', {
            element(element: any) {
                element.setAttribute('content', data.url);
            }
        });

    if (data.image) {
        rewriter = rewriter
            .on('meta[property="og:image"]', {
                element(element: any) {
                    element.setAttribute('content', data.image!);
                }
            })
            .on('meta[name="twitter:image"]', {
                element(element: any) {
                    element.setAttribute('content', data.image!);
                }
            });
    }

    return rewriter.transform(response);
}
