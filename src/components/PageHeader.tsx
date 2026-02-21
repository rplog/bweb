import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Terminal } from 'lucide-react';

interface PageHeaderProps {
    currentPath: string;
    onNavigate: (dest: string) => void;
    className?: string;
    maxWidth?: string;
}

export const PageHeader = ({
    currentPath,
    onNavigate,
    className = "",
    maxWidth = "max-w-6xl"
}: PageHeaderProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const pages = ['Projects', 'Gallery', 'Notes', 'About', 'Contact'];

    return (
        <header className={`sticky top-0 z-30 border-b border-white/[0.07] bg-elegant-bg/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2 ${className}`}>
            <div className={`${maxWidth} mx-auto flex items-center justify-end font-mono text-base relative`}>
                <span className="text-elegant-text-muted select-none font-semibold">neo@neosphere:</span>
                <button
                    onClick={() => onNavigate('Home')}
                    className="text-elegant-text-muted font-semibold hover:text-elegant-text-primary transition-colors mr-2 select-none"
                    aria-label="Go home"
                >~/</button>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="font-extrabold text-elegant-text-primary hover:text-white flex items-center gap-1 transition-colors outline-none"
                    >
                        {currentPath}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-elegant-card border border-elegant-border rounded-sm shadow-xl z-50 py-1">
                            {pages.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => {
                                        if (page.toLowerCase() !== currentPath) {
                                            onNavigate(page);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-between ${page.toLowerCase() === currentPath ? 'text-elegant-accent' : 'text-elegant-text-secondary'
                                        }`}
                                >
                                    {page.toLowerCase()}
                                    {page.toLowerCase() === currentPath && <span className="w-1.5 h-1.5 bg-elegant-accent rounded-full"></span>}
                                </button>
                            ))}
                            <div className="border-t border-elegant-border my-1"></div>
                            <button
                                onClick={() => {
                                    onNavigate('Terminal');
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors text-elegant-text-muted hover:text-white flex items-center gap-2"
                            >
                                <Terminal size={12} />
                                terminal
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
