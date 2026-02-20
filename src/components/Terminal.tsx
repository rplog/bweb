import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useTerminal } from '../hooks/useTerminal';
import type { CommandInputHandle } from './CommandInput';
import type { TerminalMode } from '../App';
import { CommandInput } from './CommandInput';
import { OutputDisplay } from './OutputDisplay';
import { Minus, Square, Maximize2, X } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalProps {
    terminalMode: TerminalMode;
    onMinimize: () => void;
    onMaximize: () => void;
    onRestore: () => void;
    onClose: () => void;
}

export const Terminal = ({ terminalMode, onMinimize, onMaximize, onRestore, onClose }: TerminalProps) => {
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

    // Track Rnd state for smooth restoring
    const [rndState, setRndState] = useState({
        x: window.innerWidth * 0.1,
        y: window.innerHeight * 0.1,
        width: window.innerWidth * 0.8,
        height: window.innerHeight * 0.8
    });

    // Handle responsive default spawn size
    useEffect(() => {
        const handleResize = () => {
             setRndState((prev: { x: number, y: number, width: number, height: number }) => ({
                ...prev,
                x: window.innerWidth * 0.1,
                y: window.innerHeight * 0.1,
                width: window.innerWidth * 0.8,
                height: window.innerHeight * 0.8
             }));
        };
        // Set initial
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        className="fixed inset-0 z-30 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {isWindowed ? (
                            <Rnd
                                size={{ width: rndState.width, height: rndState.height }}
                                position={{ x: rndState.x, y: rndState.y }}
                                onDragStop={(_e: unknown, d: { x: number, y: number }) => setRndState((prev: { width: number, height: number }) => ({ ...prev, x: d.x, y: d.y }))}
                                onResizeStop={(_e: unknown, _direction: unknown, ref: HTMLElement, _delta: unknown, position: { x: number, y: number }) => {
                                    setRndState({
                                        width: parseFloat(ref.style.width),
                                        height: parseFloat(ref.style.height),
                                        ...position
                                    });
                                }}
                                minWidth={320}
                                minHeight={240}
                                bounds="window"
                                dragHandleClassName="terminal-drag-handle"
                                cancel=".no-drag"
                                className="pointer-events-auto rounded-lg shadow-2xl shadow-black/60 border border-elegant-border bg-elegant-bg absolute"
                            >
                                <div className="w-full h-full flex flex-col overflow-hidden rounded-lg">
                                    {/* Top Bar - KDE / Linux Style */}
                                    <div 
                                        className="terminal-drag-handle w-full h-10 bg-elegant-card flex items-center px-4 justify-end border-b border-elegant-border flex-shrink-0 select-none relative z-20 cursor-grab active:cursor-grabbing"
                                    >
                                        <div className="absolute left-4 transform-none md:left-1/2 md:-translate-x-1/2 text-gray-400 text-lg font-medium font-mono truncate max-w-[60%] md:max-w-none pointer-events-none">
                                            {user}@neosphere:~
                                        </div>
                                        <div 
                                            className="flex gap-3 relative z-10 cursor-auto no-drag" 
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            <div
                                                onClick={onMinimize}
                                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                                                title="Minimize"
                                            >
                                                <Minus size={14} />
                                            </div>
                                            <div
                                                onClick={onMaximize}
                                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                                                title="Maximize"
                                            >
                                                <Square size={12} />
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
                                        className="flex-1 min-h-0 p-4 overflow-y-auto font-mono text-lg font-medium cursor-auto"
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
                            </Rnd>
                        ) : (
                            <motion.div 
                                layoutId="terminal-maximized"
                                className="pointer-events-auto absolute inset-0 w-full h-full bg-elegant-bg flex flex-col overflow-hidden"
                            >
                                {/* Top Bar - KDE / Linux Style */}
                                <div className="w-full h-10 bg-elegant-card flex items-center px-4 justify-end border-b border-elegant-border flex-shrink-0 select-none relative z-20">
                                    <div className="absolute left-4 transform-none md:left-1/2 md:-translate-x-1/2 text-gray-400 text-lg font-medium font-mono truncate max-w-[60%] md:max-w-none pointer-events-none">
                                        {user}@neosphere:~
                                    </div>
                                    <div 
                                        className="flex gap-3 relative z-10 cursor-auto no-drag"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            onClick={onMinimize}
                                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                                            title="Minimize"
                                        >
                                            <Minus size={14} />
                                        </div>
                                        <div
                                            onClick={onRestore}
                                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                                            title="Restore"
                                        >
                                            <Maximize2 size={12} />
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
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
