import { Terminal } from './components/Terminal';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#0a0a0a] text-[#00ff00] overflow-hidden flex flex-col">
      {/* Main Terminal Area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <ErrorBoundary>
          <Terminal />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
