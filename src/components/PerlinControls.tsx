import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { usePerlinSettings } from '../hooks/usePerlinSettings';

export const PerlinControls: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { noiseScale, timeFlow, height, updateSettings, reset } = usePerlinSettings();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open perlin controls"
        className="fixed bottom-30 md:bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-elegant-card border border-elegant-border backdrop-blur-md opacity-60 hover:opacity-100 hover:bg-elegant-hover hover:border-elegant-accent/50 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-xl shadow-black/40"
      >
        <Settings2 size={20} className="text-elegant-text-secondary hover:text-elegant-text-primary transition-colors" />
      </button>

      {open && (
        <div className="fixed bottom-40 md:bottom-20 right-6 z-50 p-5 w-64 space-y-5 rounded-xl bg-elegant-bg/80 border border-elegant-border backdrop-blur-xl shadow-2xl shadow-black/80 font-mono">
          <h3 className="text-sm font-semibold text-elegant-text-primary">Perlin Controls</h3>

          <div className="space-y-4">
            <label className="flex flex-col text-sm font-semibold text-elegant-text-primary gap-2 cursor-pointer">
              <span className="flex justify-between">
                <span>Noise Scale</span>
                <span className="text-elegant-accent">{noiseScale.toFixed(2)}</span>
              </span>
              <input 
                type="range" 
                min="0" max="2" step="0.05" 
                value={noiseScale}
                onChange={(e) => updateSettings({ noiseScale: parseFloat(e.target.value) })}
                className="h-1 bg-elegant-border appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-elegant-accent [&::-webkit-slider-thumb]:rounded-full cursor-pointer transition-all" 
              />
            </label>

            <label className="flex flex-col text-sm font-semibold text-elegant-text-primary gap-2 cursor-pointer">
              <span className="flex justify-between">
                <span>Time Flow</span>
                <span className="text-elegant-accent">{timeFlow.toFixed(2)}</span>
              </span>
              <input 
                type="range" 
                min="0" max="2" step="0.05" 
                value={timeFlow}
                onChange={(e) => updateSettings({ timeFlow: parseFloat(e.target.value) })}
                className="h-1 bg-elegant-border appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-elegant-accent [&::-webkit-slider-thumb]:rounded-full cursor-pointer transition-all" 
              />
            </label>

            <label className="flex flex-col text-sm font-semibold text-elegant-text-primary gap-2 cursor-pointer">
              <span className="flex justify-between">
                <span>Height</span>
                <span className="text-elegant-accent">{height}</span>
              </span>
              <input 
                type="range" 
                min="0" max="80" step="1" 
                value={height}
                onChange={(e) => updateSettings({ height: parseFloat(e.target.value) })}
                className="h-1 bg-elegant-border appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-elegant-accent [&::-webkit-slider-thumb]:rounded-full cursor-pointer transition-all" 
              />
            </label>

            <div className="pt-2">
              <button
                onClick={reset}
                className="w-full text-sm font-semibold px-3 py-2 rounded-md bg-elegant-card border border-elegant-border text-elegant-text-primary hover:bg-elegant-hover transition-colors cursor-pointer"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
