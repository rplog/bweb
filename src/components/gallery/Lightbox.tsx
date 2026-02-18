import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Hand, Trash2, Edit2 } from 'lucide-react';
import type { Photo } from './types';
import { optimizeImage } from '../../utils/imageOptimizer';

// Simple tooltip for internal use if needed, or just standard buttons
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="relative group/tip">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-elegant-card border border-elegant-border rounded text-[11px] text-elegant-text-secondary font-mono whitespace-nowrap opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-200 pointer-events-none z-[100] shadow-lg">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-t-elegant-border border-l-transparent border-r-transparent border-b-transparent border-4" />
        </div>
    </div>
);

interface LightboxProps {
    activePhoto: Photo;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    isAdmin: boolean;
    onDelete: (key: string) => void;
    onRename: (key: string) => void;
    onUpdateCaption: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ activePhoto, onClose, onNext, onPrev, isAdmin, onDelete, onRename, onUpdateCaption }) => {
    // Swipe Logic
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;
    const [showSwipeHint, setShowSwipeHint] = useState(false);

    const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
    const onTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) onNext();
        if (distance < -minSwipeDistance) onPrev();
    };

    useEffect(() => {
        const t1 = setTimeout(() => setShowSwipeHint(true), 500);
        const t2 = setTimeout(() => setShowSwipeHint(false), 3500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={onClose}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-center justify-between p-4 flex-shrink-0 z-50">
                <span
                    className={`text-elegant-text-primary font-mono text-sm truncate max-w-[70%] ${isAdmin ? 'cursor-pointer hover:text-elegant-accent hover:underline decoration-dashed underline-offset-4' : ''}`}
                    onClick={(e) => { e.stopPropagation(); if (isAdmin) onRename(activePhoto.key); }}
                >
                    {decodeURIComponent(activePhoto.key.split('/').pop() || '')}
                </span>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative group">
                <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrev(); }} />
                <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onNext(); }} />

                <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-20">
                    <ChevronLeft size={32} />
                </button>

                <img
                    src={optimizeImage(activePhoto.url, { width: 1920, quality: 90 })}
                    alt={activePhoto.caption || "Full view"}
                    className="max-w-full max-h-full object-contain relative z-0"
                    decoding="async"
                    onClick={(e) => e.stopPropagation()}
                />

                <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-30">
                    {activePhoto.caption && (
                        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 max-w-[80vw]">
                            <p className="text-white/90 font-medium text-sm sm:text-base drop-shadow-md text-center truncate">{activePhoto.caption}</p>
                        </div>
                    )}
                </div>

                <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-20">
                    <ChevronRight size={32} />
                </button>

                {showSwipeHint && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden">
                        <div className="bg-black/60 text-white px-4 py-3 rounded-full flex items-center gap-3 backdrop-blur-sm animate-fade-out">
                            <Hand size={24} className="animate-swipe-hint" />
                            <span className="text-sm font-medium">Swipe to navigate</span>
                        </div>

                    </div>
                )}
            </div>

            {/* Lightbox admin actions */}
            {isAdmin && (
                <div className="absolute bottom-6 right-6 z-50 flex gap-3" onClick={(e) => e.stopPropagation()}>
                    <Tooltip text="Delete Photo">
                        <button
                            onClick={() => onDelete(activePhoto.key)}
                            className="p-3 bg-elegant-card/80 border border-elegant-border backdrop-blur-md text-red-400 rounded-full hover:bg-red-500/20 hover:border-red-500/50 transition-all shadow-lg"
                        >
                            <Trash2 size={20} />
                        </button>
                    </Tooltip>
                    <Tooltip text="Edit Caption">
                        <button
                            onClick={onUpdateCaption}
                            className="p-3 bg-elegant-card/80 border border-elegant-border backdrop-blur-md text-elegant-text-primary rounded-full hover:bg-elegant-accent hover:text-white transition-all shadow-lg"
                        >
                            <Edit2 size={20} />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};
