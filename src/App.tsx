import { Terminal } from './components/Terminal';

function App() {
  return (
    <div className="w-screen h-screen bg-[#0a0a0a] text-[#00ff00] overflow-hidden flex flex-col">
      {/* Main Terminal Area */}
      <div className="flex-1 relative">
        <Terminal />
      </div>
    </div>
  );
}

export default App;
