import { useState, useRef, useCallback } from 'react';

export const useRouting = () => {
    const [activeComponent, setActiveComponent] = useState<React.ReactNode | null>(null);
    const activeComponentRef = useRef<React.ReactNode | null>(null);
    const [isInputVisible, setIsInputVisible] = useState(true);

    // Wrapper to update URL when setting full screen
    const setFullScreenWithRoute = useCallback((component: React.ReactNode | null, path?: string) => {
        setActiveComponent(component);
        activeComponentRef.current = component;
        if (path) {
            const currentPath = window.location.pathname;
            // Don't overwrite if current URL is already a sub-path (preserves deep links)
            if (currentPath !== path && !currentPath.startsWith(path + '/')) {
                window.history.pushState({}, '', path);
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        } else if (component === null) {
            if (window.location.pathname !== '/') {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        }
    }, []);

    return {
        activeComponent,
        activeComponentRef,
        isInputVisible,
        setIsInputVisible,
        setFullScreenWithRoute,
        setActiveComponent
    };
};
