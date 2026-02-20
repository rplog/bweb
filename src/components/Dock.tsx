import React, { useRef, useEffect } from 'react';
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

export const Dock = ({ onNavigate, currentPage, className = '' }: DockProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    useEffect(() => {
        if (currentPage && scrollContainerRef.current) {
            const element = itemRefs.current.get(currentPage);
            const container = scrollContainerRef.current;
            
            if (element && container) {
                const scrollLeft = element.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2);
                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentPage]);

    return (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 w-full px-4 pb-4 pt-2 pointer-events-none ${className}`} aria-label="Navigation">
            <div className="mx-auto max-w-fit bg-elegant-bg/70 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 shadow-2xl pointer-events-auto">
                <div 
                    ref={scrollContainerRef}
                    className="flex items-center overflow-x-auto no-scrollbar" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
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
                                    ref={(el) => {
                                        if (el) itemRefs.current.set(item.label, el);
                                        else itemRefs.current.delete(item.label);
                                    }}
                                    onClick={() => onNavigate(item.label)}
                                    className={`group flex flex-col items-center gap-0.5 w-16 py-2.5 rounded-lg transition-all duration-200 shrink-0 ${
                                        isActive
                                            ? 'bg-white/10'
                                            : 'hover:bg-white/10'
                                    }`}
                                    aria-label={`Open ${item.label}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <item.icon
                                        size={22}
                                        className={`transition-all duration-200 ${
                                            isActive
                                                ? 'text-elegant-accent'
                                                : item.accent
                                                    ? 'text-elegant-accent/70 group-hover:text-elegant-accent group-hover:scale-110'
                                                    : 'text-elegant-text-secondary group-hover:text-elegant-text-primary group-hover:scale-110'
                                        }`}
                                    />
                                    <span className={`text-[11px] font-semibold leading-tight transition-colors ${
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
