import React from 'react';
import { User, FolderGit2, Image, StickyNote, Mail, Terminal as TerminalIcon } from 'lucide-react';

interface DockProps {
    onNavigate: (dest: string) => void;
    currentPage?: string;
    showTerminal?: boolean;
    onOpenTerminal?: () => void;
    className?: string;
}

const pages = [
    { label: 'About', icon: User },
    { label: 'Projects', icon: FolderGit2 },
    { label: 'Gallery', icon: Image },
    { label: 'Notes', icon: StickyNote },
    { label: 'Contact', icon: Mail },
] as const;

export const Dock: React.FC<DockProps> = ({ onNavigate, currentPage, showTerminal, onOpenTerminal, className = '' }) => {
    return (
        <nav className={`px-3 md:px-4 ${className}`} aria-label="Navigation">
            <div className="flex items-center justify-center gap-0.5 md:gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-2 md:px-3 py-2 max-w-fit mx-auto overflow-x-auto">
                {pages.map((item) => {
                    const isActive = currentPage === item.label;
                    return (
                        <button
                            key={item.label}
                            onClick={() => onNavigate(item.label)}
                            className={`group relative flex flex-col items-center gap-0.5 px-2.5 py-2 md:px-3.5 md:py-2.5 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-white/10 text-elegant-text-primary'
                                    : 'hover:bg-white/10'
                            }`}
                            aria-label={`Open ${item.label}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <item.icon
                                size={20}
                                className={`md:w-6 md:h-6 transition-all duration-200 ${
                                    isActive
                                        ? 'text-elegant-accent'
                                        : 'text-elegant-text-secondary group-hover:text-elegant-text-primary group-hover:scale-110'
                                }`}
                            />
                            <span className={`text-[11px] md:text-xs font-semibold transition-colors ${
                                isActive
                                    ? 'text-elegant-accent'
                                    : 'text-elegant-text-muted group-hover:text-elegant-text-secondary'
                            }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {showTerminal && onOpenTerminal && (
                    <>
                        <div className="w-px bg-white/10 mx-1 my-2 self-stretch" />
                        <button
                            onClick={onOpenTerminal}
                            className="group relative flex flex-col items-center gap-0.5 px-2.5 py-2 md:px-3.5 md:py-2.5 rounded-xl hover:bg-white/10 transition-all duration-200"
                            aria-label="Open Terminal"
                        >
                            <TerminalIcon
                                size={20}
                                className="md:w-6 md:h-6 text-elegant-accent/70 group-hover:text-elegant-accent group-hover:scale-110 transition-all duration-200"
                            />
                            <span className="text-[11px] md:text-xs font-semibold text-elegant-text-muted group-hover:text-elegant-accent/80 transition-colors">
                                Terminal
                            </span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};
