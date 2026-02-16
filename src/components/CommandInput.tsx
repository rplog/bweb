import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface CommandInputProps {
    promptPath: string;
    onSubmit: (command: string) => void;
    inputHistory: string[];
    onTabComplete?: (input: string) => string;
}

export interface CommandInputHandle {
    focus: () => void;
}

export const CommandInput = forwardRef<CommandInputHandle, CommandInputProps>(({ promptPath, onSubmit, inputHistory, onTabComplete }, ref) => {
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        }
    }));

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (onTabComplete) {
                const completed = onTabComplete(input);
                if (completed !== input) {
                    setInput(completed);
                }
            }
        } else if (e.key === 'Enter') {
            onSubmit(input);
            setInput('');
            setHistoryIndex(-1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < inputHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(inputHistory[inputHistory.length - 1 - newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(inputHistory[inputHistory.length - 1 - newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        } else if (e.key === 'c' && e.ctrlKey) {
            // Let the parent/global handler deal with Ctrl+C for running commands if needed
            // But for input clearing:
            e.preventDefault();
            setInput(prev => prev + '^C');
            onSubmit(input + '^C');
            setInput('');
        }
    };

    return (
        <div className="flex items-center w-full relative">
            <span className="text-[#bd93f9] mr-2 whitespace-nowrap">neo@neosphere:{promptPath}$</span>
            <div className="relative flex-grow">
                {/* Syntax Highlight Layer */}
                <div className="absolute inset-0 pointer-events-none whitespace-pre font-inherit" aria-hidden="true">
                    {(() => {
                        // Split by first space to separate command and args
                        // const parts = input.split(' ');
                        // const cmd = parts[0];
                        // If there are args, join them back (preserving spaces effectively handled by split?)
                        // Actually split(' ') swallows the separator. 
                        // Better approach: find first space index.

                        const firstSpaceIndex = input.indexOf(' ');
                        if (firstSpaceIndex === -1) {
                            return <span className="text-[#00ff00]">{input}</span>;
                        }

                        const commandPart = input.substring(0, firstSpaceIndex);
                        const argsPart = input.substring(firstSpaceIndex);

                        return (
                            <>
                                <span className="text-[#00ff00]">{commandPart}</span>
                                <span className="text-cyan-400">{argsPart}</span>
                            </>
                        );
                    })()}
                </div>

                {/* Input Layer */}
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-inherit text-transparent caret-[#00ff00]"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    spellCheck="false"
                    autoComplete="off"
                />
            </div>
        </div>
    );
});

CommandInput.displayName = 'CommandInput';
