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
        cover: '/gallery/neon_cover.jpg',
        photos: Array.from({ length: 5 }, (_, i) => `/gallery/neon_${i + 1}.jpg`),
        category: 'Urban',
    },
    {
        title: 'Cyber Dreams',
        count: 4,
        cover: '/gallery/cyber_cover.jpg',
        photos: Array.from({ length: 4 }, (_, i) => `/gallery/cyber_${i + 1}.jpg`),
        category: 'Digital',
    },
    {
        title: 'Matrix Code',
        count: 6,
        cover: '/gallery/matrix_cover.jpg',
        photos: Array.from({ length: 6 }, (_, i) => `/gallery/matrix_${i + 1}.jpg`),
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
        <div className="h-full w-full bg-black text-gray-300 font-mono selection:bg-white/20 overflow-y-auto">
            <div className="min-h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="gallery" onNavigate={handleNavigate} className="sticky top-0 z-30" maxWidth="max-w-7xl" />

                {/* Main Content */}
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumbs */}
                    <div className="mb-8 text-base font-semibold text-gray-600 flex items-center gap-2">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-gray-300 transition-colors hover:underline decoration-gray-600 underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span
                            className={activeAlbum ? "hover:text-gray-300 transition-colors cursor-pointer hover:underline decoration-gray-600 underline-offset-4" : "text-gray-300 font-bold"}
                            onClick={() => activeAlbum && setActiveAlbum(null)}
                        >
                            gallery
                        </span>
                        {activeAlbum && (
                            <>
                                <span>/</span>
                                <span className="text-white font-bold">{activeAlbum.title.toLowerCase().replace(/ /g, '_')}</span>
                            </>
                        )}
                    </div>

                    {!activeAlbum ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ALBUMS.map((album) => (
                                <div
                                    key={album.title}
                                    className="group relative bg-[#0a0a0a] border border-gray-800 rounded-sm overflow-hidden hover:border-gray-600 transition-all duration-300 cursor-pointer"
                                    onClick={() => setActiveAlbum(album)}
                                >
                                    <div className="aspect-video bg-gray-900 relative overflow-hidden">
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
                                            <span className="px-3 py-1 bg-black/80 border border-gray-700 rounded text-xs text-gray-300">
                                                {album.count} items
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gray-300 transition-colors">
                                            {album.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">{album.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 flex items-center gap-4">
                                <button
                                    onClick={() => setActiveAlbum(null)}
                                    className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <span className="text-gray-700">|</span>
                                <p className="text-gray-500 text-sm">
                                    {activeAlbum.count} photos
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {activeAlbum.photos.map((photo, i) => (
                                    <div
                                        key={i}
                                        className="group aspect-video bg-[#0a0a0a] border border-gray-800 rounded-sm overflow-hidden hover:border-gray-600 transition-all relative cursor-pointer"
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
                                        <div className="placeholder hidden w-full h-full flex items-center justify-center bg-gray-900 absolute inset-0">
                                            <span className="text-xs text-gray-700 font-mono">IMG_{i + 1}.RAW</span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-sm transition-all">
                                                <Maximize2 size={20} className="text-white" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-900 bg-black py-2 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-xs text-gray-800 text-center font-mono">
                            neosphere v2.0
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
