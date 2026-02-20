import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Home, Terminal, Image, User, Mail, FolderGit2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

export const Spotlight = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const options = [
        { name: 'Home', icon: <Home size={18} /> },
        { name: 'Terminal', icon: <Terminal size={18} /> },
        { name: 'Gallery', icon: <Image size={18} /> },
        { name: 'Projects', icon: <FolderGit2 size={18} /> },
        { name: 'Notes', icon: <FileText size={18} /> },
        { name: 'About', icon: <User size={18} /> },
        { name: 'Contact', icon: <Mail size={18} /> },
    ];

    const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

    const handleSelect = useCallback((dest: string) => {
        setIsOpen(false);
        setQuery('');
        requestAnimationFrame(() => {
            if (dest === 'Terminal') {
                navigate('/');
                window.dispatchEvent(new CustomEvent('open-terminal'));
            } else if (dest === 'Home') {
                navigate('/');
            } else {
                navigate(`/${dest.toLowerCase()}`);
            }
        });
    }, [navigate]);

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

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && isOpen) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh] font-mono p-4"
                    onClick={closeSpotlight}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <motion.div
                        className="w-full max-w-xl bg-elegant-bg/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col box-border ring-1 ring-white/5"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.96, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    >
                        <div className="flex items-center p-4 border-b border-elegant-border">
                            <Search className="text-elegant-text-muted mr-3" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                className="bg-transparent border-none outline-none text-elegant-text-primary text-xl flex-grow placeholder-elegant-text-muted font-normal"
                                placeholder="Where to?"
                                value={query}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                            />
                            <div className="text-xs text-elegant-text-muted border border-elegant-border rounded px-2 py-1 ml-2 hidden sm:block">ESC</div>
                        </div>
                        <div
                            ref={listRef}
                            className="max-h-[60vh] sm:max-h-[300px] overflow-y-auto py-2"
                        >
                            {filtered.map((opt, i) => (
                                <button
                                    key={opt.name}
                                    className={`w-full text-left px-4 py-3 flex items-center transition-colors
                                        ${i === selectedIndex ? 'bg-white/10 text-elegant-text-primary' : 'text-elegant-text-secondary hover:bg-white/5'}
                                    `}
                                    onClick={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelect(opt.name);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                >
                                    <span className={`mr-3 ${i === selectedIndex ? 'text-white' : 'text-elegant-text-muted'}`}>{opt.icon}</span>
                                    <span className="text-lg">{opt.name}</span>
                                    {i === selectedIndex && <span className="ml-auto text-xs text-elegant-accent hidden sm:block">Jump to</span>}
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <div className="p-8 text-elegant-text-muted text-center flex flex-col items-center gap-2">
                                    <Search size={32} className="opacity-20" />
                                    <span>No results found</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
