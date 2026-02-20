import { useState, useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Outlet, useLocation } from 'react-router';
import { Terminal } from './components/Terminal';
import { Desktop } from './components/Desktop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spotlight } from './components/Spotlight';

// Pages
import { Gallery } from './components/pages/Gallery';
import { About } from './components/pages/About';
import { Contact } from './components/pages/Contact';
import { Projects } from './components/pages/Projects';
import { Notes } from './components/pages/Notes';

export type TerminalMode = 'hidden' | 'windowed' | 'maximized';

function RootLayout() {
  const [terminalMode, setTerminalMode] = useState<TerminalMode>('hidden');

  // Listen for 'open-terminal' custom event from anywhere (pages, dock, spotlight)
  useEffect(() => {
    const handler = () => setTerminalMode('windowed');
    window.addEventListener('open-terminal', handler);
    return () => window.removeEventListener('open-terminal', handler);
  }, []);

  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/index.html';

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-elegant-bg overflow-hidden">
      {/* Desktop - base layer, hidden when terminal is maximized */}
      {terminalMode !== 'maximized' && (
        <Desktop onOpenTerminal={() => setTerminalMode('windowed')} />
      )}

      {/* Terminal - always mounted so routing hooks stay active */}
      <ErrorBoundary>
        <Terminal
          terminalMode={terminalMode}
          onMinimize={() => setTerminalMode('hidden')}
          onMaximize={() => setTerminalMode('maximized')}
          onRestore={() => setTerminalMode('windowed')}
          onClose={() => setTerminalMode('hidden')}
        />
      </ErrorBoundary>

      <Spotlight />

      {/* Full Screen Component Layer */}
      {!isHome && (
        <div className="fixed inset-0 z-50 bg-elegant-bg text-elegant-text-primary font-mono text-base p-4 overflow-hidden">
          <Outlet />
        </div>
      )}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "gallery/*", element: <Gallery /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "projects", element: <Projects /> },
      { path: "notes/*", element: <Notes /> }
    ]
  },
  {
    path: "*",
    element: <RootLayout />
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
