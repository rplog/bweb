import React from 'react';
import { FileEdit, Trash2 } from 'lucide-react';
import type { Album } from './types';
import { optimizeImage } from '../../utils/imageOptimizer';

// Custom tooltip component matching elegant theme (copied from Gallery.tsx to avoid circular dependency if possible, or we can export it)
// For now, I'll simplify or replicate it locally if it's small, or just assume it's available. 
// Actually, let's export Tooltip from a shared place or just define it here/import it if it was standalone. 
// Since it was defined in Gallery.tsx, I should probably check if I can extract it too.
// For now, I'll inline a simple version or copy the one from Gallery.

const Tooltip: React.FC<{ text: string; children: React.ReactNode; position?: 'top' | 'bottom' | 'left' }> = ({ text, children, position = 'top' }) => {
    const posClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2'
    };
    return (
        <div className="relative group/tip">
            {children}
            <div className={`absolute ${posClasses[position]} px-2.5 py-1 bg-elegant-card border border-elegant-border rounded text-[11px] text-elegant-text-secondary font-mono whitespace-nowrap opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-200 pointer-events-none z-[100] shadow-lg`}>
                {text}
                <div className={`absolute ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-elegant-border border-l-transparent border-r-transparent border-b-transparent border-4' : position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-elegant-border border-l-transparent border-r-transparent border-t-transparent border-4' : ''}`} />
            </div>
        </div>
    );
};

interface AlbumCardProps {
    album: Album;
    displayTitle: string;
    isAdmin: boolean;
    onOpen: (album: Album) => void;
    onEditAlbum: (album: Album) => void;
    onDelete: (title: string, isAlbum?: boolean) => void;
}

export const AlbumCard = ({ album, displayTitle, isAdmin, onOpen, onEditAlbum, onDelete }: AlbumCardProps) => (
    <div
        className="group relative bg-elegant-card border border-elegant-border rounded-sm overflow-hidden hover:border-elegant-text-muted transition-all duration-300 cursor-pointer"
        onClick={() => onOpen(album)}
    >
        <div className="aspect-video bg-black relative overflow-hidden grid grid-cols-2 grid-rows-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative w-full h-full overflow-hidden border-r border-b border-black/10 last:border-0">
                    {album.cover[i] ? (
                        <img
                            src={optimizeImage(album.cover[i], { width: 400, height: 400, fit: 'cover', quality: 80 })}
                            alt={`${album.title} cover ${i + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-100 grayscale group-hover:grayscale-0"
                            onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                        />
                    ) : (
                        <div className="w-full h-full bg-elegant-bg/50" />
                    )}
                </div>
            ))}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-300 pointer-events-none" />
            <div className="absolute top-3 right-3 pointer-events-none">
                <span className="px-3 py-1 bg-black/80 border border-elegant-border rounded text-xs text-elegant-text-secondary backdrop-blur-sm">
                    {album.count} items
                </span>
            </div>
        </div>
        <div className="p-5 flex justify-between items-start">
            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-elegant-text-primary mb-1 group-hover:text-elegant-accent transition-colors truncate">
                    {displayTitle}
                </h3>
                <p className="text-sm text-elegant-text-muted truncate">
                    {album.category}
                </p>
            </div>
            {isAdmin && (
                <div className="flex gap-1 ml-2 flex-shrink-0">
                    <Tooltip text="Edit Album">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEditAlbum(album); }}
                            className="text-elegant-text-muted hover:text-elegant-accent p-1.5 rounded hover:bg-white/5 transition-all"
                        >
                            <FileEdit size={15} />
                        </button>
                    </Tooltip>
                    <Tooltip text="Delete Album">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(album.title, true); }}
                            className="text-elegant-text-muted hover:text-red-400 p-1.5 rounded hover:bg-white/5 transition-all"
                        >
                            <Trash2 size={15} />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    </div>
);
