import React, { useState, useEffect } from 'react';
import { optimizeImage } from '../../utils/imageOptimizer';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Maximize2, ArrowLeft, X, ChevronLeft, ChevronRight, Hand } from 'lucide-react';

interface GalleryProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

interface Album {
    title: string;
    count: number;
    cover: string[];
    photos: string[];
    category: string;
}

export const Gallery: React.FC<GalleryProps> = ({ onExit, onNavigate }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
    const [activePhoto, setActivePhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch albums and handle deep link on mount
    useEffect(() => {
        fetch('/api/gallery')
            .then(res => res.json())
            .then((data: Album[]) => {
                setAlbums(data);
                setLoading(false);

                // Deep link: parse URL like /gallery/flora/filename.jpg
                const path = window.location.pathname;
                if (path.startsWith('/gallery/')) {
                    const parts = path.split('/').slice(2); // e.g. ['flora', 'filename.jpg']
                    if (parts.length >= 1 && parts[0]) {
                        const slug = decodeURIComponent(parts[0]);
                        const album = data.find((a: Album) =>
                            a.title.toLowerCase() === slug.toLowerCase()
                        );
                        if (album) {
                            setActiveAlbum(album);
                            if (parts.length >= 2) {
                                const photoName = decodeURIComponent(parts.slice(1).join('/'));
                                const photoUrl = `/api/gallery/${album.title}/${photoName}`;
                                setActivePhoto(photoUrl);
                            }
                        }
                    }
                }
            })
            .catch(err => {
                console.error('Failed to load gallery:', err);
                setLoading(false);
            });
    }, []);

    // Browser back button support
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/gallery') {
                setActiveAlbum(null);
                setActivePhoto(null);
            } else if (path.startsWith('/gallery/')) {
                const parts = path.split('/').slice(2);
                if (parts.length <= 1) {
                    // Album level - close photo if open
                    setActivePhoto(null);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') onExit();
        else if (onNavigate) onNavigate(dest);
    };

    const openAlbum = (album: Album) => {
        setActiveAlbum(album);
        setActivePhoto(null);
        const slug = album.title.toLowerCase();
        window.history.pushState({}, '', `/gallery/${slug}`);
    };

    const closeAlbum = () => {
        setActiveAlbum(null);
        setActivePhoto(null);
        window.history.pushState({}, '', '/gallery');
    };

    const openPhoto = (photo: string) => {
        setActivePhoto(photo);
        // photo URL: /api/gallery/Flora/img.jpg -> browser URL: /gallery/flora/img.jpg
        const browserPath = photo
            .replace('/api/gallery/', '/gallery/')
            .replace(/\/gallery\/([^/]+)/, (_, album) => `/gallery/${album.toLowerCase()}`);
        window.history.pushState({}, '', browserPath);
    };

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeAlbum || !activePhoto) return;
        const currentIndex = activeAlbum.photos.findIndex(p => p === activePhoto);
        if (currentIndex === -1) return;
        const nextIndex = (currentIndex + 1) % activeAlbum.photos.length;
        openPhoto(activeAlbum.photos[nextIndex]);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeAlbum || !activePhoto) return;
        const currentIndex = activeAlbum.photos.findIndex(p => p === activePhoto);
        if (currentIndex === -1) return;
        const prevIndex = (currentIndex - 1 + activeAlbum.photos.length) % activeAlbum.photos.length;
        openPhoto(activeAlbum.photos[prevIndex]);
    };

    // Keyboard navigation
    useEffect(() => {
        if (!activePhoto) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') closePhoto();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePhoto, activeAlbum]);

    // Swipe handlers
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) handleNext();
        if (isRightSwipe) handlePrev();
    };

    // Swipe Hint Logic
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const hasShownHint = React.useRef(false);

    useEffect(() => {
        if (activePhoto && !hasShownHint.current) {
            // Show hint only on touch devices (approximate check) or small screens
            if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768) {
                setShowSwipeHint(true);
                hasShownHint.current = true; // Mark as shown
                const timer = setTimeout(() => setShowSwipeHint(false), 2500);
                return () => clearTimeout(timer);
            }
        }
    }, [activePhoto]);



    const closePhoto = () => {
        setActivePhoto(null);
        if (activeAlbum) {
            const slug = activeAlbum.title.toLowerCase();
            window.history.pushState({}, '', `/gallery/${slug}`);
        }
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
                            onClick={() => {
                                if (activePhoto) closePhoto();
                                if (activeAlbum) closeAlbum();
                            }}
                        >
                            gallery
                        </span>
                        {activeAlbum && (
                            <>
                                <span>/</span>
                                <span
                                    className={activePhoto ? "hover:text-elegant-text-primary transition-colors cursor-pointer hover:underline decoration-elegant-text-muted underline-offset-4" : "text-elegant-accent font-bold"}
                                    onClick={() => activePhoto && closePhoto()}
                                >
                                    {activeAlbum.title.toLowerCase()}
                                </span>
                            </>
                        )}
                        {activePhoto && (
                            <>
                                <span>/</span>
                                <span className="text-elegant-accent font-bold">
                                    {decodeURIComponent(activePhoto.split('/').pop() || '')}
                                </span>
                            </>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-elegant-text-muted animate-pulse">
                            Loading gallery...
                        </div>
                    ) : !activeAlbum ? (
                        /* ---- Album Grid ---- */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {albums.map((album) => (
                                <div
                                    key={album.title}
                                    className="group relative bg-elegant-card border border-elegant-border rounded-sm overflow-hidden hover:border-elegant-text-muted transition-all duration-300 cursor-pointer"
                                    onClick={() => openAlbum(album)}
                                >
                                    {/* 2x2 Grid Cover */}
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
                                                        onError={(e) => {
                                                            e.currentTarget.style.opacity = '0';
                                                        }}
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
                        /* ---- Photo Grid (inside album) ---- */
                        <>
                            <div className="mb-6 flex items-center gap-4">
                                <button
                                    onClick={closeAlbum}
                                    className="text-elegant-text-muted hover:text-elegant-text-primary transition-colors flex items-center gap-2 text-sm"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <span className="text-elegant-text-muted">|</span>
                                <p className="text-elegant-text-muted text-sm">
                                    {activeAlbum.count} photos
                                </p>
                            </div>
                            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                                {activeAlbum.photos.map((photo, i) => (
                                    <div
                                        key={i}
                                        className="group bg-elegant-card border border-elegant-border rounded-sm overflow-hidden hover:border-elegant-text-muted transition-all relative cursor-pointer break-inside-avoid"
                                        onClick={() => openPhoto(photo)}
                                    >
                                        <img
                                            src={optimizeImage(photo, { width: 600, quality: 80 })}
                                            alt={`Photo ${i + 1}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    const placeholder = parent.querySelector('.placeholder');
                                                    if (placeholder) placeholder.classList.remove('hidden');
                                                }
                                            }}
                                        />
                                        <div className="placeholder hidden w-full aspect-video flex items-center justify-center bg-elegant-card">
                                            <span className="text-xs text-elegant-text-muted font-mono">IMG_{i + 1}.RAW</span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 size={20} className="text-elegant-text-primary" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>

                {/* Lightbox */}
                {activePhoto && (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
                        onClick={closePhoto}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div className="flex items-center justify-between p-4 flex-shrink-0 z-50">
                            <span className="text-elegant-text-muted font-mono text-sm truncate max-w-[70%]">
                                {decodeURIComponent(activePhoto.split('/').pop() || '')}
                            </span>
                            <button
                                onClick={closePhoto}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative group">
                            {/* Tap Zones for Navigation */}
                            <div
                                className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                title="Previous"
                            />
                            <div
                                className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                title="Next"
                            />

                            {/* Prev Button - Hidden on mobile, visible on hover desktop */}
                            <button
                                onClick={handlePrev}
                                className="absolute left-4 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-20"
                            >
                                <ChevronLeft size={32} />
                            </button>

                            <img
                                src={optimizeImage(activePhoto, { width: 1920, quality: 90 })}
                                alt="Full view"
                                className="max-w-full max-h-full object-contain relative z-0"
                                decoding="async"
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Next Button - Hidden on mobile, visible on hover desktop */}
                            <button
                                onClick={handleNext}
                                className="absolute right-4 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-20"
                            >
                                <ChevronRight size={32} />
                            </button>

                            {/* Mobile Swipe Hint Overlay */}
                            {showSwipeHint && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden">
                                    <div className="bg-black/60 text-white px-4 py-3 rounded-full flex items-center gap-3 backdrop-blur-sm animate-fade-out">
                                        <Hand size={24} className="animate-swipe-hint" />
                                        <span className="text-sm font-medium">Swipe to navigate</span>
                                    </div>
                                    <style>{`
                                        @keyframes swipe-hint {
                                            0%, 100% { transform: translateX(0); }
                                            25% { transform: translateX(-10px); }
                                            75% { transform: translateX(10px); }
                                        }
                                        .animate-swipe-hint {
                                            animation: swipe-hint 1.5s ease-in-out infinite;
                                        }
                                        @keyframes fade-out {
                                            0% { opacity: 1; }
                                            80% { opacity: 1; }
                                            100% { opacity: 0; }
                                        }
                                    `}</style>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
