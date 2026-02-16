import React, { useRef, useEffect } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import type { CommandInputHandle } from './CommandInput';
import { CommandInput } from './CommandInput';
import { OutputDisplay } from './OutputDisplay';

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

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleContainerClick = () => {
        // Don't focus if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        inputRef.current?.focus();
    };

    if (activeComponent) {
        return (
            <div className="w-full h-full p-4 font-mono text-base text-[#00ff00]">
                {activeComponent}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Top Bar - Moved from App.tsx */}
            <div className="w-full h-10 bg-[#1a1a1a] flex items-center px-4 justify-between border-b border-[#333] flex-shrink-0">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-gray-400 text-sm font-mono">neo@neosphere:~</div>
                <div className="w-10"></div>
            </div>

            <div
                className="flex-1 p-4 overflow-y-auto font-mono text-base bg-transparent scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                onClick={handleContainerClick}
            >
                <div className="max-w-5xl mx-auto">
                    <OutputDisplay history={history} />
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
    );
};
