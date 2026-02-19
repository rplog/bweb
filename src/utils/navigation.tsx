import React, { lazy } from 'react';
const Gallery = lazy(() => import('../components/pages/Gallery').then(module => ({ default: module.Gallery })));
const About = lazy(() => import('../components/pages/About').then(module => ({ default: module.About })));
const Contact = lazy(() => import('../components/pages/Contact').then(module => ({ default: module.Contact })));
const Projects = lazy(() => import('../components/pages/Projects').then(module => ({ default: module.Projects })));
const Notes = lazy(() => import('../components/pages/Notes').then(module => ({ default: module.Notes })));

export const createNavigator = (setFullScreen: (node: React.ReactNode | null, path?: string) => void) => {
    const navigate = (dest: string) => {
        if (dest === 'Terminal') {
            setFullScreen(null);
            // Tell App to open the terminal window
            window.dispatchEvent(new CustomEvent('open-terminal'));
        } else if (dest === 'Home') {
            setFullScreen(null);
        } else if (dest === 'Gallery') {
            setFullScreen(<Gallery onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/gallery');
        } else if (dest === 'About') {
            setFullScreen(<About onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/about');
        } else if (dest === 'Contact') {
            setFullScreen(<Contact onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/contact');
        } else if (dest === 'Projects') {
            setFullScreen(<Projects onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/projects');
        } else if (dest === 'Notes') {
            setFullScreen(<Notes onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/notes');
        }
    };
    return navigate;
};

export const createNavigationHandler = (onExit: () => void, onNavigate?: (dest: string) => void) => {
    return (dest: string) => {
        if (dest === 'Terminal') {
            onExit();
            window.dispatchEvent(new CustomEvent('open-terminal'));
        } else if (dest === 'Home') {
            onExit();
        } else if (onNavigate) {
            onNavigate(dest);
        }
    };
};
