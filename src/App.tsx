import { useState, useCallback } from 'react';
import { Terminal } from './components/Terminal';
import { Desktop } from './components/Desktop';
import { ErrorBoundary } from './components/ErrorBoundary';

export type TerminalMode = 'hidden' | 'windowed' | 'maximized';

function App() {
  const [terminalMode, setTerminalMode] = useState<TerminalMode>('hidden');

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
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-elegant-bg overflow-hidden">
      {/* Desktop - base layer, hidden when terminal is maximized */}
      {terminalMode !== 'maximized' && (
        <Desktop
          onOpenTerminal={() => setTerminalMode('windowed')}
          onNavigate={handleNavigate}
        />
      )}

      {/* Terminal - always mounted so routing hooks stay active */}
      <ErrorBoundary>
        <Terminal
          terminalMode={terminalMode}
          onMinimize={() => setTerminalMode('hidden')}
          onMaximize={() => setTerminalMode('maximized')}
          onClose={() => setTerminalMode('hidden')}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
