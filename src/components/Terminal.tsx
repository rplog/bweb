import React, { useRef, useEffect, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import type { CommandInputHandle } from './CommandInput';
import type { TerminalMode } from '../App';
import { CommandInput } from './CommandInput';
import { OutputDisplay } from './OutputDisplay';
import { Minus, Square, Maximize2, X } from 'lucide-react';
import { Rnd } from 'react-rnd';

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

    const isWindowed = terminalMode === 'windowed';
    const isVisible = terminalMode !== 'hidden' && !activeComponent;

    // Responsive check for Rnd
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const shouldEnableRnd = isWindowed && !isMobile;

    // Rnd state for windowed mode
    const [rndState, setRndState] = useState(() => ({
        width: Math.min(1024, typeof window !== 'undefined' ? window.innerWidth * 0.8 : 1024),
        height: Math.min(768, typeof window !== 'undefined' ? window.innerHeight * 0.8 : 768),
        x: typeof window !== 'undefined' ? (window.innerWidth - Math.min(1024, window.innerWidth * 0.8)) / 2 : 0,
        y: typeof window !== 'undefined' ? (window.innerHeight - Math.min(768, window.innerHeight * 0.8)) / 2 : 0,
    }));
    const [isInteracting, setIsInteracting] = useState(false);

    // Delayed unmount for active component to allow fade out
    const [renderedComponent, setRenderedComponent] = useState<React.ReactNode | null>(activeComponent);
    const [isComponentFadingOut, setIsComponentFadingOut] = useState(false);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (activeComponent) {
            setRenderedComponent(activeComponent);
            setIsComponentFadingOut(false);
        } else if (renderedComponent) {
            setIsComponentFadingOut(true);
            const timer = setTimeout(() => {
                setRenderedComponent(null);
                setIsComponentFadingOut(false);
            }, 300); // 300ms fade out duration
            return () => clearTimeout(timer);
        }
    }, [activeComponent, renderedComponent]);
    /* eslint-enable react-hooks/set-state-in-effect */

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

    // Auto-scroll on ANY content change
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

    const terminalContent = (
        <div className={`w-full h-full flex flex-col overflow-hidden ${isWindowed ? 'rounded-lg' : ''} bg-elegant-bg transition-transform origin-center ${
            !shouldEnableRnd && isWindowed ? 'shadow-2xl shadow-black/80 border border-elegant-border' : ''
        } ${
            !isVisible 
                ? 'scale-[0.97] duration-300 ease-out' 
                : 'scale-100 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
        }`}>
            {/* Top Bar - KDE / Linux Style */}
            <div className={`w-full h-10 bg-elegant-card flex items-center px-4 justify-end border-b border-elegant-border flex-shrink-0 select-none relative z-20 ${
                shouldEnableRnd ? 'cursor-move terminal-drag-handle' : 'cursor-default'
            }`}>
                <div className="absolute left-4 transform-none md:left-1/2 md:-translate-x-1/2 text-gray-400 text-lg font-medium font-mono truncate max-w-[60%] md:max-w-none pointer-events-none">
                    {user}@neosphere:~
                </div>
                <div className="flex gap-3 relative z-10 pointer-events-auto">
                    <div
                        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                        title="Minimize"
                    >
                        <Minus size={14} />
                    </div>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isWindowed) {
                                onMaximize();
                            } else {
                                onMinimize();
                            }
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-white"
                        title={isWindowed ? 'Maximize' : 'Restore'}
                    >
                        {isWindowed ? <Square size={12} /> : <Maximize2 size={12} />}
                    </div>
                    <div
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
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
                className="flex-1 min-h-0 p-4 overflow-y-auto font-mono text-lg font-medium cursor-text"
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
    );

    return (
        <>
            {/* Full Screen Component Layer - rendered with delayed unmount mechanism */}
            {renderedComponent && (
                <div className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm text-elegant-text-primary font-mono text-base p-4 overflow-hidden transition-all duration-300 ease-out ${
                    isComponentFadingOut ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                }`}>
                    {renderedComponent}
                </div>
            )}

            {/* Terminal Window Wrapper */}
            <div className={`fixed z-30 pointer-events-none transition-all ${
                !isVisible
                    ? 'opacity-0 invisible scale-[0.97] origin-bottom duration-300 ease-out'
                    : 'opacity-100 scale-100 origin-center duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
            } ${
                !shouldEnableRnd && isWindowed
                    ? 'inset-3 md:inset-[8%] lg:inset-x-[12%] lg:inset-y-[8%]'
                    : 'inset-0'
            }`}>
                {shouldEnableRnd ? (
                    <Rnd
                        className={`${isVisible ? 'pointer-events-auto' : 'pointer-events-none'} transition-all ${
                            !isInteracting 
                                ? (!isVisible ? 'duration-300 ease-out' : 'duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]') 
                                : ''
                        } shadow-2xl shadow-black/80 border border-elegant-border rounded-lg`}
                        size={{ width: rndState.width, height: rndState.height }}
                        position={{ x: rndState.x, y: rndState.y }}
                        onDragStart={() => setIsInteracting(true)}
                        onDragStop={(_e, d) => {
                            setIsInteracting(false);
                            setRndState(prev => ({ ...prev, x: d.x, y: d.y }));
                        }}
                        onResizeStart={() => setIsInteracting(true)}
                        onResizeStop={(_e, _direction, ref, _delta, position) => {
                            setIsInteracting(false);
                            setRndState({
                                width: parseFloat(ref.style.width) || ref.offsetWidth,
                                height: parseFloat(ref.style.height) || ref.offsetHeight,
                                ...position,
                            });
                        }}
                        bounds="window"
                        minWidth={350}
                        minHeight={250}
                        dragHandleClassName="terminal-drag-handle"
                    >
                        {terminalContent}
                    </Rnd>
                ) : (
                    <div className="w-full h-full pointer-events-auto">
                        {terminalContent}
                    </div>
                )}
            </div>
        </>
    );
};

