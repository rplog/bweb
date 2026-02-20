import { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { Terminal } from './components/Terminal';
import { Desktop } from './components/Desktop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PerlinControls } from './components/PerlinControls';

const PerlinBackground = lazy(() => import('./components/PerlinBackground'));

export type TerminalMode = 'hidden' | 'windowed' | 'maximized';

function App() {
  const [terminalMode, setTerminalMode] = useState<TerminalMode>('hidden');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setTerminalMode('windowed');
    window.addEventListener('open-terminal', handler);
    return () => window.removeEventListener('open-terminal', handler);
  }, []);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((dest: string) => {
    const routes: Record<string, string> = {
      About: '/about',
      Projects: '/projects',
      Gallery: '/gallery',
      Notes: '/notes',
      Contact: '/contact',
    };
    const path = routes[dest];
    if (path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath(path);
    }
  }, []);

  const isHome = currentPath === '/' || currentPath === '/index.html' || currentPath === '';

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-elegant-bg overflow-hidden">
      {/* Global Background Layer */}
      <Suspense fallback={null}>
        <PerlinBackground />
      </Suspense>
      <PerlinControls />

      {/* Desktop - base layer, hidden when terminal is maximized */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <div className="pointer-events-auto w-full h-full">
          {terminalMode !== 'maximized' && isHome && (
            <Desktop
              onOpenTerminal={() => setTerminalMode('windowed')}
              onNavigate={handleNavigate}
            />
          )}
        </div>
      </div>

      {/* Terminal - always mounted so routing hooks stay active */}
      <div className="relative z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <ErrorBoundary>
            <Terminal
              terminalMode={terminalMode}
              onMinimize={() => setTerminalMode('hidden')}
              onMaximize={() => setTerminalMode('maximized')}
              onClose={() => setTerminalMode('hidden')}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default App;
