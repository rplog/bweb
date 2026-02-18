import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Terminal, Image, User, Mail } from 'lucide-react';

interface SpotlightProps {
    onNavigate: (destination: string) => void;
}

export const Spotlight: React.FC<SpotlightProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const options = [
        { name: 'Terminal', icon: <Terminal size={18} /> },
        { name: 'Gallery', icon: <Image size={18} /> },
        { name: 'About', icon: <User size={18} /> },
        { name: 'Contact', icon: <Mail size={18} /> },
    ];

    const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

    const handleSelect = useCallback((dest: string) => {
        setIsOpen(false);
        setQuery('');
        requestAnimationFrame(() => onNavigate(dest));
    }, [onNavigate]);

    const openSpotlight = () => {
        setIsOpen(true);
        setSelectedIndex(0);
    };

    const closeSpotlight = () => {
        setIsOpen(false);
        setQuery('');
    };

    // Toggle on 'L' key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen && e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                e.preventDefault();
                openSpotlight();
            }

            if (isOpen) {
                if (e.key === 'Escape') {
                    closeSpotlight();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % filtered.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered.length > 0) {
                        handleSelect(filtered[selectedIndex].name);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filtered, handleSelect]);

    // Focus the input when spotlight opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center font-mono" onClick={closeSpotlight}>
            <div
                className="w-full max-w-xl bg-black border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col box-border ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center p-4 border-b border-[#333]">
                    <Search className="text-gray-500 mr-3" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        className="bg-transparent border-none outline-none text-gray-200 text-xl flex-grow placeholder-gray-600 font-normal"
                        placeholder="Where to?"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="text-xs text-gray-600 border border-gray-800 rounded px-2 py-1">ESC to close</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto py-2">
                    {filtered.map((opt, i) => (
                        <button
                            key={opt.name}
                            className={`w-full text-left px-4 py-3 flex items-center transition-colors
                                ${i === selectedIndex ? 'bg-white/10 text-gray-200' : 'text-gray-400 hover:bg-white/5'}
                            `}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSelect(opt.name);
                            }}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <span className={`mr-3 ${i === selectedIndex ? 'text-white' : 'text-gray-500'}`}>{opt.icon}</span>
                            <span className="text-lg">{opt.name}</span>
                            {i === selectedIndex && <span className="ml-auto text-xs text-gray-500">Jump to</span>}
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-8 text-gray-500 text-center">No results found</div>
                    )}
                </div>
            </div>
        </div>
    );
};
