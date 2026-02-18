import React from 'react';
import { Maximize2, Trash2 } from 'lucide-react';
import type { Photo } from './types';
import { optimizeImage } from '../../utils/imageOptimizer';

interface PhotoGridProps {
    photos: Photo[];
    isAdmin: boolean;
    onOpenPhoto: (photo: Photo) => void;
    onDeletePhoto: (key: string) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, isAdmin, onOpenPhoto, onDeletePhoto }) => {
    return (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {photos.map((photo, i) => (
                <div
                    key={photo.key}
                    className="group bg-elegant-card border border-elegant-border rounded-sm overflow-hidden hover:border-elegant-text-muted transition-all relative cursor-pointer break-inside-avoid"
                    onClick={() => onOpenPhoto(photo)}
                >
                    <img
                        src={optimizeImage(photo.url, { width: 600, quality: 80 })}
                        alt={photo.caption || `Photo ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) { const ph = parent.querySelector('.placeholder'); if (ph) ph.classList.remove('hidden'); }
                        }}
                    />
                    <div className="placeholder hidden w-full aspect-video flex items-center justify-center bg-elegant-card">
                        <span className="text-xs text-elegant-text-muted font-mono">IMG_{i + 1}.RAW</span>
                    </div>

                    {/* Desktop hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-4">
                        <Maximize2 size={20} className="text-elegant-text-primary" />
                        {isAdmin && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeletePhoto(photo.key); }}
                                className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 text-white transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    {/* Mobile: always-visible delete button */}
                    {isAdmin && (
                        <div className="absolute top-2 right-2 md:hidden z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeletePhoto(photo.key); }}
                                className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-red-400 active:bg-red-500/30 transition-colors"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
