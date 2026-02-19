import React from 'react';
import { Home, User, FolderGit2, Image, StickyNote, Mail, Terminal as TerminalIcon, type LucideIcon } from 'lucide-react';

interface DockProps {
    onNavigate: (dest: string) => void;
    currentPage?: string;
    className?: string;
}

interface DockItem {
    label: string;
    icon: LucideIcon;
    accent?: boolean;
}

const items: DockItem[] = [
    { label: 'Home', icon: Home, accent: true },
    { label: 'About', icon: User },
    { label: 'Projects', icon: FolderGit2 },
    { label: 'Gallery', icon: Image },
    { label: 'Notes', icon: StickyNote },
    { label: 'Contact', icon: Mail },
    { label: 'Terminal', icon: TerminalIcon, accent: true },
];

export const Dock: React.FC<DockProps> = ({ onNavigate, currentPage, className = '' }) => {
    return (
        <nav className={`w-full px-3 ${className}`} aria-label="Navigation">
            <div className="mx-auto max-w-fit bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-1.5 overflow-hidden">
                <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {items.map((item) => {
                        const isActive = currentPage === item.label;
                        const showSepBefore = item.label === 'About';
                        const showSepAfter = item.label === 'Contact';

                        return (
                            <React.Fragment key={item.label}>
                                {showSepBefore && (
                                    <div className="w-px bg-white/10 mx-0.5 my-1.5 self-stretch shrink-0" />
                                )}
                                <button
                                    onClick={() => onNavigate(item.label)}
                                    className={`group flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200 shrink-0 ${
                                        isActive
                                            ? 'bg-white/10'
                                            : 'hover:bg-white/10'
                                    }`}
                                    aria-label={`Open ${item.label}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <item.icon
                                        size={20}
                                        className={`transition-all duration-200 ${
                                            isActive
                                                ? 'text-elegant-accent'
                                                : item.accent
                                                    ? 'text-elegant-accent/70 group-hover:text-elegant-accent group-hover:scale-110'
                                                    : 'text-elegant-text-secondary group-hover:text-elegant-text-primary group-hover:scale-110'
                                        }`}
                                    />
                                    <span className={`text-[10px] font-semibold leading-tight transition-colors ${
                                        isActive
                                            ? 'text-elegant-accent'
                                            : item.accent
                                                ? 'text-elegant-text-muted group-hover:text-elegant-accent/80'
                                                : 'text-elegant-text-muted group-hover:text-elegant-text-secondary'
                                    }`}>
                                        {item.label}
                                    </span>
                                </button>
                                {showSepAfter && (
                                    <div className="w-px bg-white/10 mx-0.5 my-1.5 self-stretch shrink-0" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
