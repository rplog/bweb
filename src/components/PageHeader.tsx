import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Terminal } from 'lucide-react';

interface PageHeaderProps {
    currentPath: string;
    onNavigate: (dest: string) => void;
    className?: string;
    maxWidth?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    currentPath,
    onNavigate,
    className = "",
    maxWidth = "max-w-6xl"
}) => {
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

    const pages = ['About', 'Gallery', 'Contact'];

    return (
        <header className={`border-b border-gray-800 bg-black px-4 sm:px-6 lg:px-8 py-3 ${className}`}>
            <div className={`${maxWidth} mx-auto flex items-center justify-end font-mono text-base relative`}>
                <span className="text-gray-500 mr-2 select-none font-semibold">neo@neosphere:~/</span>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="font-extrabold text-gray-200 hover:text-white flex items-center gap-1 transition-colors outline-none"
                    >
                        {currentPath}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-[#1a1a1a] border border-gray-800 rounded-sm shadow-xl z-50 py-1">
                            {pages.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => {
                                        if (page.toLowerCase() !== currentPath) {
                                            onNavigate(page);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors flex items-center justify-between ${page.toLowerCase() === currentPath ? 'text-green-500' : 'text-gray-400'
                                        }`}
                                >
                                    {page.toLowerCase()}
                                    {page.toLowerCase() === currentPath && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                                </button>
                            ))}
                            <div className="border-t border-gray-800 my-1"></div>
                            <button
                                onClick={() => {
                                    onNavigate('Terminal');
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors text-gray-500 hover:text-white flex items-center gap-2"
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
