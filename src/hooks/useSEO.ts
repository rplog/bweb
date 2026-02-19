import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description: string;
    url?: string;
    image?: string;
}

export const useSEO = ({ title, description, url, image }: SEOProps) => {
    useEffect(() => {
        // Store original values to restore on cleanup (optional, depends on behavior preference)
        // For this SPA, we just overwrite.

        // Update Title
        document.title = title;

        // Update Meta Description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }

        // Update OG Tags
        const setMeta = (property: string, content: string) => {
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        setMeta('og:title', title);
        setMeta('og:description', description);
        if (url) setMeta('og:url', url);
        if (image) setMeta('og:image', image);

        // Update Twitter Tags
        const setTwitter = (name: string, content: string) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        setTwitter('twitter:title', title);
        setTwitter('twitter:description', description);
        if (image) setTwitter('twitter:image', image);

        // Update Canonical
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && url) {
            canonical.setAttribute('href', url);
        } else if (!canonical && url) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            canonical.setAttribute('href', url);
            document.head.appendChild(canonical);
        }

    }, [title, description, url, image]);
};
