import React from 'react';
import { Home, User, FolderGit2, Image, StickyNote, Mail, Terminal as TerminalIcon } from 'lucide-react';

interface DockProps {
    onNavigate: (dest: string) => void;
    currentPage?: string;
    className?: string;
}

const items = [
    { label: 'Home', icon: Home, accent: true },
    { label: 'About', icon: User },
    { label: 'Projects', icon: FolderGit2 },
    { label: 'Gallery', icon: Image },
    { label: 'Notes', icon: StickyNote },
    { label: 'Contact', icon: Mail },
    { label: 'Terminal', icon: TerminalIcon, accent: true },
] as const;

export const Dock: React.FC<DockProps> = ({ onNavigate, currentPage, className = '' }) => {
    return (
        <nav className={`px-3 md:px-4 ${className}`} aria-label="Navigation">
            <div className="flex items-center justify-center gap-0.5 md:gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-2 md:px-3 py-2 max-w-fit mx-auto overflow-x-auto">
                {items.map((item) => {
                    const isActive = currentPage === item.label;

                    return (
                        <React.Fragment key={item.label}>
                            {item.label === 'About' && (
                                <div className="w-px bg-white/10 mx-0.5 md:mx-1 my-2 self-stretch" />
                            )}
                            <button
                                onClick={() => onNavigate(item.label)}
                                className={`group relative flex flex-col items-center gap-0.5 px-2.5 py-2 md:px-3.5 md:py-2.5 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-white/10'
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
                                            : item.accent
                                                ? 'text-elegant-accent/70 group-hover:text-elegant-accent group-hover:scale-110'
                                                : 'text-elegant-text-secondary group-hover:text-elegant-text-primary group-hover:scale-110'
                                    }`}
                                />
                                <span className={`text-[11px] md:text-xs font-semibold transition-colors ${
                                    isActive
                                        ? 'text-elegant-accent'
                                        : item.accent
                                            ? 'text-elegant-text-muted group-hover:text-elegant-accent/80'
                                            : 'text-elegant-text-muted group-hover:text-elegant-text-secondary'
                                }`}>
                                    {item.label}
                                </span>
                            </button>
                            {item.label === 'Contact' && (
                                <div className="w-px bg-white/10 mx-0.5 md:mx-1 my-2 self-stretch" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </nav>
    );
};
