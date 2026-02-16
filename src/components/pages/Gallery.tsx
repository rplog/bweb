import React, { useState } from 'react';
import { Spotlight } from '../Spotlight';
import { Folder, Image as ImageIcon, ArrowLeft, Maximize2 } from 'lucide-react';

interface GalleryProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

const ALBUMS = [
    {
        title: 'Neon Nights',
        count: 5,
        cover: '/gallery/neon_cover.jpg',
        photos: Array.from({ length: 5 }, (_, i) => `/gallery/neon_${i + 1}.jpg`)
    },
    {
        title: 'Cyber Dreams',
        count: 4,
        cover: '/gallery/cyber_cover.jpg',
        photos: Array.from({ length: 4 }, (_, i) => `/gallery/cyber_${i + 1}.jpg`)
    },
    {
        title: 'Matrix Code',
        count: 6,
        cover: '/gallery/matrix_cover.jpg',
        photos: Array.from({ length: 6 }, (_, i) => `/gallery/matrix_${i + 1}.jpg`)
    },
];

export const Gallery: React.FC<GalleryProps> = ({ onExit, onNavigate }) => {
    const [activeAlbum, setActiveAlbum] = useState<typeof ALBUMS[0] | null>(null);

    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') onExit();
        else if (onNavigate) onNavigate(dest);
    };

    return (
        <div className="h-full w-full bg-black text-gray-300 p-8 overflow-y-auto relative font-mono selection:bg-white/20">
            <Spotlight onNavigate={handleNavigate} />

            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-200 mb-2 flex items-center gap-3">
                        {activeAlbum ? (
                            <>
                                <button onClick={() => setActiveAlbum(null)} className="hover:text-white/70 transition-colors">
                                    <ArrowLeft size={32} />
                                </button>
                                <span>{activeAlbum.title}</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon size={40} className="text-gray-200" />
                                <span>Gallery</span>
                            </>
                        )}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {activeAlbum ? `${activeAlbum.count} snapshots found` : 'Captured moments in the digital void.'}
                    </p>
                </div>

                <div className="text-xs border border-white/10 px-3 py-1 rounded-full text-gray-500">
                    Press <span className="font-bold text-gray-300">L</span> to search
                </div>
            </header>

            {!activeAlbum ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {ALBUMS.map((album) => (
                        <div
                            key={album.title}
                            onClick={() => setActiveAlbum(album)}
                            className="group relative bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-[#444] transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-white/5"
                        >
                            <div className="h-48 w-full relative overflow-hidden">
                                <img
                                    src={album.cover}
                                    alt={album.title}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        // Fallback to Icon
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            parent.classList.add('bg-gray-900', 'flex', 'items-center', 'justify-center');
                                            const icon = parent.querySelector('.folder-icon') as HTMLElement;
                                            if (icon) icon.style.display = 'flex';
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none folder-icon" style={{ display: 'none' }}>
                                    <Folder size={48} className="text-white/20" />
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-gray-200 mb-1 group-hover:text-white">{album.title}</h3>
                                <p className="text-sm text-gray-600">{album.count} items</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {activeAlbum.photos.map((photo, i) => (
                        <div key={i} className="aspect-video bg-[#111] border border-[#222] rounded-lg overflow-hidden hover:border-white/30 transition-colors group relative">
                            <img
                                src={photo}
                                alt={`Photo ${i}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('.placeholder')?.classList.remove('hidden');
                                }}
                            />
                            {/* Fallback placeholder */}
                            <div className="placeholder hidden w-full h-full flex items-center justify-center bg-[#0a0a0a] text-gray-700 absolute inset-0">
                                <span className="text-xs">IMG_{i + 1}.RAW</span>
                            </div>

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
