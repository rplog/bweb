import React, { useState } from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Maximize2, ArrowLeft } from 'lucide-react';

interface GalleryProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

const ALBUMS = [
    {
        title: 'Neon Nights',
        count: 5,
        cover: '/media/gallery/neon_cover.jpg',
        photos: Array.from({ length: 5 }, (_, i) => `/media/gallery/neon_${i + 1}.jpg`),
        category: 'Urban',
    },
    {
        title: 'Cyber Dreams',
        count: 4,
        cover: '/media/gallery/cyber_cover.jpg',
        photos: Array.from({ length: 4 }, (_, i) => `/media/gallery/cyber_${i + 1}.jpg`),
        category: 'Digital',
    },
    {
        title: 'Matrix Code',
        count: 6,
        cover: '/media/gallery/matrix_cover.jpg',
        photos: Array.from({ length: 6 }, (_, i) => `/media/gallery/matrix_${i + 1}.jpg`),
        category: 'Abstract',
    },
];

export const Gallery: React.FC<GalleryProps> = ({ onExit, onNavigate }) => {
    const [activeAlbum, setActiveAlbum] = useState<typeof ALBUMS[0] | null>(null);

    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') onExit();
        else if (onNavigate) onNavigate(dest);
    };

    return (
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-y-auto">
            <div className="min-h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="gallery" onNavigate={handleNavigate} className="sticky top-0 z-30" maxWidth="max-w-7xl" />

                {/* Main Content */}
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumbs */}
                    <div className="mb-8 text-base font-semibold text-elegant-text-muted flex items-center gap-2">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span
                            className={activeAlbum ? "hover:text-elegant-text-primary transition-colors cursor-pointer hover:underline decoration-elegant-text-muted underline-offset-4" : "text-elegant-text-primary font-bold"}
                            onClick={() => activeAlbum && setActiveAlbum(null)}
                        >
                            gallery
                        </span>
                        {activeAlbum && (
                            <>
                                <span>/</span>
                                <span className="text-elegant-accent font-bold">{activeAlbum.title.toLowerCase().replace(/ /g, '_')}</span>
                            </>
                        )}
                    </div>

                    {!activeAlbum ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ALBUMS.map((album) => (
                                <div
                                    key={album.title}
                                    className="group relative bg-elegant-card border border-elegant-border rounded-sm overflow-hidden hover:border-elegant-text-muted transition-all duration-300 cursor-pointer"
                                    onClick={() => setActiveAlbum(album)}
                                >
                                    <div className="aspect-video bg-black relative overflow-hidden">
                                        <img
                                            src={album.cover}
                                            alt={album.title}
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500 grayscale group-hover:grayscale-0"
                                            onError={(e) => {
                                                e.currentTarget.style.opacity = '0';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                                        <div className="absolute top-3 right-3">
                                            <span className="px-3 py-1 bg-black/80 border border-elegant-border rounded text-xs text-elegant-text-secondary">
                                                {album.count} items
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-elegant-text-primary mb-1 group-hover:text-elegant-accent transition-colors">
                                            {album.title}
                                        </h3>
                                        <p className="text-sm text-elegant-text-muted">{album.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 flex items-center gap-4">
                                <button
                                    onClick={() => setActiveAlbum(null)}
                                    className="text-elegant-text-muted hover:text-elegant-text-primary transition-colors flex items-center gap-2 text-sm"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <span className="text-elegant-text-muted">|</span>
                                <p className="text-elegant-text-muted text-sm">
                                    {activeAlbum.count} photos
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {activeAlbum.photos.map((photo, i) => (
                                    <div
                                        key={i}
                                        className="group aspect-video bg-elegant-card border border-elegant-border rounded-sm overflow-hidden hover:border-elegant-text-muted transition-all relative cursor-pointer"
                                    >
                                        <img
                                            src={photo}
                                            alt={`Photo ${i + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    const placeholder = parent.querySelector('.placeholder');
                                                    if (placeholder) placeholder.classList.remove('hidden');
                                                }
                                            }}
                                        />
                                        <div className="placeholder hidden w-full h-full flex items-center justify-center bg-elegant-card absolute inset-0">
                                            <span className="text-xs text-elegant-text-muted font-mono">IMG_{i + 1}.RAW</span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button className="p-3 bg-elegant-card/80 hover:bg-elegant-card rounded-sm transition-all border border-elegant-border">
                                                <Maximize2 size={20} className="text-elegant-text-primary" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-elegant-border bg-elegant-bg py-2 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-sm font-bold text-elegant-text-muted text-center font-mono">
                            &copy; Neosphere v2.0
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
