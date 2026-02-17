import React, { useRef, useEffect } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import type { CommandInputHandle } from './CommandInput';
import { CommandInput } from './CommandInput';
import { OutputDisplay } from './OutputDisplay';
import { Minus, Square, X } from 'lucide-react';

export const Terminal: React.FC = () => {
    const {
        history,
        getPromptPath,
        execute,
        inputHistory,
        activeComponent,
        isInputVisible,
        handleTabCompletion
    } = useTerminal();

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<CommandInputHandle>(null);
    const lastItemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to the latest command's start to keep it visible, especially on mobile
        if (lastItemRef.current) {
            lastItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history]);

    // Refocus input when activeComponent closes (e.g. exiting htop/nano)
    useEffect(() => {
        if (!activeComponent) {
            // Small timeout to ensure DOM update is complete
            setTimeout(() => {
                inputRef.current?.focus();
            }, 10);
        }
    }, [activeComponent]);

    const handleContainerClick = () => {
        // Don't focus if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        inputRef.current?.focus();
    };

    return (
        <div className="w-full h-full relative">
            {/* Full Screen Component Layer */}
            {activeComponent && (
                <div className="fixed inset-0 z-50 bg-elegant-bg text-elegant-text-primary font-mono text-base p-4 overflow-hidden">
                    {activeComponent}
                </div>
            )}

            {/* Terminal Layer - Hidden but mounted when activeComponent exists */}
            <div className={`h-full w-full overflow-y-auto ${activeComponent ? 'invisible' : ''}`}
                onClick={handleContainerClick}
            >
                {/* Top Bar - KDE / Linux Style - Sticky so commands scroll behind it */}
                <div className="sticky top-0 z-20 w-full h-10 bg-elegant-card flex items-center px-4 justify-end border-b border-elegant-border select-none">
                    <div className="absolute left-1/2 transform -translate-x-1/2 text-gray-400 text-sm font-mono">
                        neo@neosphere:~
                    </div>
                    <div className="flex gap-3 relative z-10">
                        <div className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white" title="Minimize">
                            <Minus size={14} />
                        </div>
                        <div className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white" title="Maximize">
                            <Square size={12} />
                        </div>
                        <div className="p-1.5 hover:bg-red-500 hover:text-white rounded-full transition-colors cursor-pointer text-gray-500" title="Close">
                            <X size={14} />
                        </div>
                    </div>
                </div>

                <div className="p-4 font-mono text-base">
                    <div className="max-w-5xl mx-auto">
                        <OutputDisplay history={history} lastItemRef={lastItemRef} />
                        {isInputVisible && (
                            <CommandInput
                                ref={inputRef}
                                promptPath={getPromptPath()}
                                onSubmit={execute}
                                inputHistory={inputHistory}
                                onTabComplete={handleTabCompletion} />
                        )}
                        <div ref={bottomRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};
