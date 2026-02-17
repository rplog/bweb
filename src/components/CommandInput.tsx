import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface CommandInputProps {
    promptPath: string;
    user: string;
    onSubmit: (command: string) => void;
    inputHistory: string[];
    onTabComplete?: (input: string) => string;
}

export interface CommandInputHandle {
    focus: () => void;
}

export const CommandInput = forwardRef<CommandInputHandle, CommandInputProps>(({ promptPath, user, onSubmit, inputHistory, onTabComplete }, ref) => {
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
            e.preventDefault();
            setInput(prev => prev + '^C');
            onSubmit(input + '^C');
            setInput('');
        }
    };

    return (
        <div className="flex flex-wrap items-center w-full relative">
            <span className="text-elegant-accent mr-2 whitespace-nowrap shrink-0">{user}@neosphere:{promptPath}$</span>
            <div className="relative flex-grow min-w-[120px]">
                {/* Syntax Highlight Layer */}
                <div className="absolute inset-0 pointer-events-none whitespace-pre font-inherit" aria-hidden="true">
                    {(() => {
                        const firstSpaceIndex = input.indexOf(' ');
                        if (firstSpaceIndex === -1) {
                            return <span className="text-elegant-text-primary">{input}</span>;
                        }

                        const commandPart = input.substring(0, firstSpaceIndex);
                        const argsPart = input.substring(firstSpaceIndex);

                        // Mask arguments for login command
                        if (commandPart === 'login') {
                            return (
                                <>
                                    <span className="text-elegant-text-primary">{commandPart}</span>
                                    {/* Render nothing for the arguments to keep them hidden (cursor will still move) */}
                                    <span className="text-elegant-text-secondary"></span>
                                </>
                            );
                        }

                        return (
                            <>
                                <span className="text-elegant-text-primary">{commandPart}</span>
                                <span className="text-elegant-text-secondary">{argsPart}</span>
                            </>
                        );
                    })()}
                </div>

                {/* Input Layer */}
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-inherit text-transparent caret-elegant-accent"
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
