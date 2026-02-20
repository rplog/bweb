import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useTerminal } from '../hooks/useTerminal';
import type { CommandInputHandle } from './CommandInput';
import type { TerminalMode } from '../App';
import { CommandInput } from './CommandInput';
import { OutputDisplay } from './OutputDisplay';
import { Minus, Square, Maximize2, X } from 'lucide-react';

interface TerminalProps {
    terminalMode: TerminalMode;
    onMinimize: () => void;
    onMaximize: () => void;
    onClose: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ terminalMode, onMinimize, onMaximize, onClose }) => {
    const {
        history,
        getPromptPath,
        execute,
        inputHistory,
        activeComponent,
        isInputVisible,
        handleTabCompletion,
        user
    } = useTerminal();

    const inputRef = useRef<CommandInputHandle>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const isHome = location.pathname === '/' || location.pathname === '/index.html';

    const isWindowed = terminalMode === 'windowed';
    const isVisible = terminalMode !== 'hidden' && !activeComponent && isHome;

    // Reset SEO when returning to Desktop/Home
    useEffect(() => {
        if (!activeComponent) {
            document.title = 'Bahauddin Alam - Full Stack Developer';
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', 'Bahauddin Alam is a Full Stack Developer specializing in React, JavaScript, TypeScript, Tailwind CSS, and Python. Explore his portfolio and projects.');
            
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) canonical.setAttribute('href', 'https://bahauddin.in');
        }
    }, [activeComponent]);

    // Auto-scroll on ANY content change (handles Ping, Htop, etc. internal updates)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollToBottom = () => {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        };

        // Scroll immediately on history change
        scrollToBottom();

        // Also observe DOM mutations for components that update internally (e.g. Ping)
        const observer = new MutationObserver(scrollToBottom);
        observer.observe(container, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [history]);

    // Refocus input when activeComponent closes or terminal becomes visible
    useEffect(() => {
        if (!activeComponent && terminalMode !== 'hidden') {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 10);
        }
    }, [activeComponent, terminalMode]);

    const handleContainerClick = () => {
        // Don't focus if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;

        inputRef.current?.focus();
    };

    return (
        <>
            {/* Full Screen Component Layer - always rendered independently */}
            {activeComponent && (
                <div className="fixed inset-0 z-50 bg-elegant-bg text-elegant-text-primary font-mono text-base p-4 overflow-hidden">
                    {activeComponent}
                </div>
            )}

            {/* Terminal Window */}
            <div className={`fixed z-30 transition-all duration-300 ease-out ${
                !isVisible
                    ? 'opacity-0 invisible pointer-events-none scale-95'
                    : 'opacity-100 scale-100'
            } ${
                isWindowed
                    ? 'inset-3 md:inset-[8%] lg:inset-x-[12%] lg:inset-y-[8%] rounded-lg shadow-2xl shadow-black/60 border border-elegant-border'
                    : 'inset-0'
            }`}>
                <div className={`w-full h-full flex flex-col overflow-hidden ${isWindowed ? 'rounded-lg' : ''} bg-elegant-bg`}>
                    {/* Top Bar - KDE / Linux Style */}
                    <div className={`w-full h-10 bg-elegant-card flex items-center px-4 justify-end border-b border-elegant-border flex-shrink-0 select-none relative z-20 ${
                        isWindowed ? 'cursor-default' : ''
                    }`}>
                        <div className="absolute left-4 transform-none md:left-1/2 md:-translate-x-1/2 text-gray-400 text-lg font-medium font-mono truncate max-w-[60%] md:max-w-none">
                            {user}@neosphere:~
                        </div>
                        <div className="flex gap-3 relative z-10">
                            <div
                                onClick={onMinimize}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                                title="Minimize"
                            >
                                <Minus size={14} />
                            </div>
                            <div
                                onClick={isWindowed ? onMaximize : onMinimize}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                                title={isWindowed ? 'Maximize' : 'Restore'}
                            >
                                {isWindowed ? <Square size={12} /> : <Maximize2 size={12} />}
                            </div>
                            <div
                                onClick={onClose}
                                className="p-1.5 hover:bg-red-500 hover:text-white rounded-full transition-colors cursor-pointer text-gray-500"
                                title="Close"
                            >
                                <X size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Terminal Content */}
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 min-h-0 p-4 overflow-y-auto font-mono text-lg font-medium"
                        onClick={handleContainerClick}
                    >
                        <div className="max-w-5xl mx-auto">
                            <OutputDisplay history={history} />
                            {isInputVisible && (
                                <CommandInput
                                    ref={inputRef}
                                    promptPath={getPromptPath()}
                                    user={user}
                                    onSubmit={execute}
                                    inputHistory={inputHistory}
                                    onTabComplete={handleTabCompletion} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
