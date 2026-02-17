import { Terminal } from './components/Terminal';

function App() {
  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#0a0a0a] text-[#00ff00] overflow-hidden flex flex-col">
      {/* Main Terminal Area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <Terminal />
      </div>
    </div>
  );
}

export default App;
