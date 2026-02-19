import React from 'react';
import { Gallery } from '../components/pages/Gallery';
import { About } from '../components/pages/About';
import { Contact } from '../components/pages/Contact';
import { Projects } from '../components/pages/Projects';
import { Notes } from '../components/pages/Notes';

export const createNavigator = (setFullScreen: (node: React.ReactNode | null, path?: string) => void) => {
    const navigate = (dest: string) => {
        if (dest === 'Terminal' || dest === 'Home') {
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
        if (dest === 'Terminal' || dest === 'Home') onExit();
        else if (onNavigate) onNavigate(dest);
    };
};
