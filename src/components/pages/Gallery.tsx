
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { optimizeImage } from '../../utils/imageOptimizer';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Maximize2, ArrowLeft, X, ChevronLeft, ChevronRight, Hand, Loader2, Trash2, Edit2, Plus, FileEdit, FolderPlus, ImagePlus, ChevronDown } from 'lucide-react';

interface Photo {
    url: string;
    caption: string;
    key: string;
}

interface GalleryProps {
    onExit: () => void;
    onNavigate: (path: string) => void;
}

interface Album {
    title: string;
    count: number;
    cover: string[];
    photos: Photo[];
    category: string;
}

// Custom tooltip component matching elegant theme
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

// Resolve a URL path like /gallery/Travel/Japan/photo.jpg into { album, photoFilename }
const resolveNestedPath = (parts: string[], albums: Album[]): { album: Album | null; photoFilename: string | null } => {
    // Try progressively longer album paths: "Travel", "Travel/Japan", "Travel/Japan/Tokyo", etc.
    for (let i = parts.length; i >= 1; i--) {
        const candidate = parts.slice(0, i).map(p => decodeURIComponent(p)).join('/');
        const album = albums.find(a => a.title.toLowerCase() === candidate.toLowerCase());
        if (album) {
            const remainder = parts.slice(i);
            const photoFilename = remainder.length > 0 ? remainder.map(p => decodeURIComponent(p)).join('/') : null;
            return { album, photoFilename };
        }
    }
    return { album: null, photoFilename: null };
};

// Extracted album card component to eliminate duplication
const AlbumCard: React.FC<{
    album: Album;
    displayTitle: string;
    isAdmin: boolean;
    onOpen: (album: Album) => void;
    onEditAlbum: (album: Album) => void;
    onDelete: (title: string, isAlbum?: boolean) => void;
}> = ({ album, displayTitle, isAdmin, onOpen, onEditAlbum, onDelete }) => (
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

export const Gallery: React.FC<GalleryProps> = ({ onExit, onNavigate }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [activeAlbumTitle, setActiveAlbumTitle] = useState<string | null>(null);
    const [activePhotoKey, setActivePhotoKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const activeAlbum = activeAlbumTitle ? albums.find(a => a.title === activeAlbumTitle) ?? null : null;
    const activePhoto = activeAlbum && activePhotoKey ? activeAlbum.photos.find(p => p.key === activePhotoKey) ?? null : null;

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploadCaption, setUploadCaption] = useState('');
    const [uploadAlbumName, setUploadAlbumName] = useState('');
    const [isAlbumDropdownOpen, setIsAlbumDropdownOpen] = useState(false);
    const albumDropdownRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        current: number;
        total: number;
        stage: 'stripping' | 'uploading';
        percent: number;
        fileName: string;
    } | null>(null);

    // Custom Prompts/Alerts State
    const [promptConfig, setPromptConfig] = useState<{
        isOpen: boolean;
        title: string;
        message?: string;
        defaultValue: string;
        onConfirm: (value: string) => void;
    } | null>(null);

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'error' | 'success' | 'info';
    } | null>(null);

    const [editAlbumConfig, setEditAlbumConfig] = useState<{
        album: Album;
        onConfirm: (newName: string, newCategory: string) => void;
    } | null>(null);

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        onConfirm: () => void;
    } | null>(null);

    const showConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirm') => {
        setConfirmConfig({ isOpen: true, title, message, onConfirm, confirmLabel });
    };

    const showAlert = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, message, type });
        if (type === 'success') setTimeout(() => setAlertConfig(null), 2500);
    };

    const showPrompt = (title: string, defaultValue: string, onConfirm: (val: string) => void) => {
        setPromptConfig({ isOpen: true, title, defaultValue, onConfirm });
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) setIsAdmin(true);
    }, []);

    useEffect(() => {
        fetch('/api/gallery')
            .then(res => res.json())
            .then((data: Album[]) => {
                setAlbums(data);
                setLoading(false);

                const path = window.location.pathname;
                if (path.startsWith('/gallery/')) {
                    const parts = path.split('/').slice(2).filter(Boolean);
                    if (parts.length >= 1) {
                        const { album, photoFilename } = resolveNestedPath(parts, data);
                        if (album) {
                            setActiveAlbumTitle(album.title);
                            if (photoFilename) {
                                const foundPhoto = album.photos.find(p => p.key.toLowerCase().endsWith(photoFilename.toLowerCase()));
                                if (foundPhoto) {
                                    setActivePhotoKey(foundPhoto.key);
                                }
                            }
                        }
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load gallery:", err);
                setLoading(false);
            });
    }, []);

    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const hasShownSwipeHint = useRef(false);
    useEffect(() => {
        if (activePhoto && !hasShownSwipeHint.current) {
            hasShownSwipeHint.current = true;
            setShowSwipeHint(true);
            const timer = setTimeout(() => setShowSwipeHint(false), 3000);
            return () => clearTimeout(timer);
        }
        if (!activePhoto) {
            setShowSwipeHint(false);
        }
    }, [activePhoto]);

    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/gallery') {
                setActiveAlbumTitle(null);
                setActivePhotoKey(null);
            } else if (path.startsWith('/gallery/')) {
                const parts = path.split('/').slice(2).filter(Boolean);
                const { album, photoFilename } = resolveNestedPath(parts, albums);
                if (album) {
                    setActiveAlbumTitle(album.title);
                    if (photoFilename) {
                        const foundPhoto = album.photos.find(p => p.key.toLowerCase().endsWith(photoFilename.toLowerCase()));
                        setActivePhotoKey(foundPhoto ? foundPhoto.key : null);
                    } else {
                        setActivePhotoKey(null);
                    }
                } else {
                    setActiveAlbumTitle(null);
                    setActivePhotoKey(null);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [albums]);

    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') onExit();
        else if (onNavigate) onNavigate(dest);
    };

    const encodeAlbumPath = useCallback((title: string) => {
        return title.split('/').map(s => encodeURIComponent(s)).join('/');
    }, []);

    const openAlbum = useCallback((album: Album) => {
        setActiveAlbumTitle(album.title);
        setActivePhotoKey(null);
        window.history.pushState({}, '', `/gallery/${encodeAlbumPath(album.title)}`);
    }, [encodeAlbumPath]);

    const closeAlbum = useCallback(() => {
        setActiveAlbumTitle(null);
        setActivePhotoKey(null);
        window.history.pushState({}, '', '/gallery');
    }, []);

    const buildPhotoUrl = useCallback((photo: Photo) => {
        const parts = photo.key.split('/');
        return `/gallery/${parts.map(p => encodeURIComponent(p)).join('/')}`;
    }, []);

    const openPhoto = useCallback((photo: Photo) => {
        setActivePhotoKey(photo.key);
        window.history.pushState({}, '', buildPhotoUrl(photo));
    }, [buildPhotoUrl]);

    const closePhoto = useCallback(() => {
        setActivePhotoKey(null);
        if (activeAlbumTitle) {
            window.history.pushState({}, '', `/gallery/${encodeAlbumPath(activeAlbumTitle)}`);
        }
    }, [activeAlbumTitle, encodeAlbumPath]);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeAlbum || !activePhoto) return;
        const currentIndex = activeAlbum.photos.findIndex(p => p.key === activePhoto.key);
        if (currentIndex === -1) return;
        const nextIndex = (currentIndex + 1) % activeAlbum.photos.length;
        openPhoto(activeAlbum.photos[nextIndex]);
    }, [activeAlbum, activePhoto, openPhoto]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeAlbum || !activePhoto) return;
        const currentIndex = activeAlbum.photos.findIndex(p => p.key === activePhoto.key);
        if (currentIndex === -1) return;
        const prevIndex = (currentIndex - 1 + activeAlbum.photos.length) % activeAlbum.photos.length;
        openPhoto(activeAlbum.photos[prevIndex]);
    }, [activeAlbum, activePhoto, openPhoto]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activePhoto) closePhoto();
                else if (activeAlbum) closeAlbum();
                else onExit();
            }
            if (activePhoto) {
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePhoto, activeAlbum, closePhoto, closeAlbum, onExit, handleNext, handlePrev]);

    // Swipe
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
    const onTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) handleNext();
        if (distance < -minSwipeDistance) handlePrev();
    };

    // Preload
    const preloadedRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!activeAlbum || !activePhoto) return;
        const currentIndex = activeAlbum.photos.findIndex(p => p.key === activePhoto.key);
        if (currentIndex === -1) return;
        const photos = activeAlbum.photos;
        const total = photos.length;
        const preload = (photo: Photo) => {
            const optimizedUrl = optimizeImage(photo.url, { width: 1920, quality: 90 });
            if (preloadedRef.current.has(optimizedUrl)) return;
            const img = new Image();
            img.src = optimizedUrl;
            preloadedRef.current.add(optimizedUrl);
        };
        for (let i = 1; i <= 3; i++) preload(photos[(currentIndex + i) % total]);
        preload(photos[(currentIndex - 1 + total) % total]);
    }, [activeAlbum, activePhoto]);

    // --- ADMIN ACTIONS ---

    const resetUploadForm = () => {
        setUploadFiles([]);
        setUploadCaption('');
        setUploadAlbumName('');
        setIsAlbumDropdownOpen(false);
        setUploadProgress(null);
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (albumDropdownRef.current && !albumDropdownRef.current.contains(event.target as Node)) {
                setIsAlbumDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Process a single file: strip metadata via canvas, return blob
    const processImage = async (file: File): Promise<Blob> => {
        const objectUrl = URL.createObjectURL(file);
        try {
            const img = new Image();
            img.src = objectUrl;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(img, 0, 0);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (!blob) throw new Error('Image processing failed');
            return blob;
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    };

    // Upload with XHR for progress tracking
    const uploadWithProgress = (formData: FormData): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/gallery');
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('admin_token')}`);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    setUploadProgress(prev => prev ? { ...prev, percent: Math.round((e.loaded / e.total) * 100) } : null);
                }
            };
            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) resolve(data);
                    else reject(new Error(data.error || 'Upload failed'));
                } catch { reject(new Error('Upload failed')); }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (uploadFiles.length === 0) return;
        if (!uploadAlbumName) {
            showAlert('Please select or enter an album name', 'error');
            return;
        }

        setIsProcessing(true);
        const total = uploadFiles.length;
        const uploadedPhotos: Photo[] = [];

        try {
            for (let i = 0; i < total; i++) {
                const file = uploadFiles[i];

                // Stage 1: Strip metadata
                setUploadProgress({ current: i + 1, total, stage: 'stripping', percent: 0, fileName: file.name });
                const blob = await processImage(file);

                // Stage 2: Upload
                setUploadProgress({ current: i + 1, total, stage: 'uploading', percent: 0, fileName: file.name });
                const formData = new FormData();
                formData.append('action', 'upload');
                formData.append('file', blob, file.name);
                formData.append('album', uploadAlbumName);
                formData.append('caption', uploadCaption);

                const resBody = await uploadWithProgress(formData);
                const { key } = resBody;

                uploadedPhotos.push({
                    url: `/api/gallery/${key}`,
                    caption: uploadCaption,
                    key
                });
            }

            // Update state with all uploaded photos
            setAlbums(prev => {
                const existing = prev.find(a => a.title === uploadAlbumName);
                if (existing) {
                    return prev.map(a => {
                        if (a.title === uploadAlbumName) {
                            const updatedPhotos = [...a.photos, ...uploadedPhotos];
                            return {
                                ...a,
                                count: updatedPhotos.length,
                                photos: updatedPhotos,
                                cover: updatedPhotos.slice(0, 4).map(p => p.url)
                            };
                        }
                        return a;
                    });
                } else {
                    return [...prev, {
                        title: uploadAlbumName,
                        count: uploadedPhotos.length,
                        cover: uploadedPhotos.slice(0, 4).map(p => p.url),
                        photos: uploadedPhotos,
                        category: 'Gallery'
                    }];
                }
            });

            showAlert(`${total} photo${total > 1 ? 's' : ''} uploaded`, 'success');
            resetUploadForm();
            setShowUploadModal(false);

        } catch (err: any) {
            console.error(err);
            showAlert(`Upload Error: ${err.message}`, 'error');
        } finally {
            setIsProcessing(false);
            setUploadProgress(null);
        }
    };

    const handleDelete = async (key: string, isAlbum = false) => {
        showConfirm(
            isAlbum ? 'Delete Album' : 'Delete Photo',
            `Are you sure you want to delete this ${isAlbum ? 'album' : 'photo'}? This action cannot be undone.`,
            async () => {
                try {
                    const res = await fetch('/api/gallery', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
                        body: JSON.stringify(isAlbum ? { album: key } : { key })
                    });
                    if (!res.ok) throw new Error('Delete failed');

                    if (isAlbum) {
                        setAlbums(prev => prev.filter(a => a.title !== key && !a.title.startsWith(key + '/')));
                        if (activeAlbumTitle === key || activeAlbumTitle?.startsWith(key + '/')) closeAlbum();
                    } else {
                        setAlbums(prev => prev.map(a => {
                            if (a.title === activeAlbumTitle) {
                                const updatedPhotos = a.photos.filter(p => p.key !== key);
                                return { ...a, count: updatedPhotos.length, photos: updatedPhotos, cover: updatedPhotos.slice(0, 4).map(p => p.url) };
                            }
                            return a;
                        }));
                        if (activePhotoKey === key) closePhoto();
                    }
                } catch (err: any) {
                    showAlert(err.message, 'error');
                }
            },
            'Delete'
        );
    };

    const handleUpdateCaption = () => {
        if (!activePhoto) return;
        showPrompt('Update Caption', activePhoto.caption, async (newCaption) => {
            try {
                const res = await fetch('/api/gallery', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
                    body: JSON.stringify({ action: 'update-caption', key: activePhoto.key, caption: newCaption })
                });
                if (!res.ok) throw new Error('Update failed');
                setAlbums(prev => prev.map(a => {
                    if (a.title === activeAlbumTitle) {
                        return { ...a, photos: a.photos.map(p => p.key === activePhoto.key ? { ...p, caption: newCaption } : p) };
                    }
                    return a;
                }));
            } catch (err: any) {
                showAlert(err.message, 'error');
            }
        });
    };



    const handleEditAlbum = (album: Album) => {
        setEditAlbumConfig({
            album,
            onConfirm: async (newName, newCategory) => {
                if (!newName) return;

                // 1. Rename Album if changed
                const oldName = album.title;
                const oldSimpleName = oldName.split('/').pop() || '';
                let currentName = oldName;

                if (newName !== oldSimpleName) {
                    try {
                        const parentPath = oldName.includes('/') ? oldName.substring(0, oldName.lastIndexOf('/') + 1) : '';
                        const fullNewName = parentPath + newName;

                        const res = await fetch('/api/gallery', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
                            body: JSON.stringify({ action: 'rename-album', oldName, newName: fullNewName })
                        });

                        if (!res.ok) {
                            const resBody = await res.json() as any;
                            throw new Error(resBody.error || 'Rename failed');
                        }

                        currentName = fullNewName;

                        // Optimistic update for rename (partial, full reload comes after category update)
                    } catch (err: any) {
                        showAlert(err.message, 'error');
                        return; // Stop if rename fails
                    }
                }

                // 2. Update Category if changed
                if (newCategory !== album.category) {
                    try {
                        const res = await fetch('/api/gallery', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
                            body: JSON.stringify({ action: 'update-category', album: currentName, category: newCategory })
                        });
                        if (!res.ok) throw new Error('Update category failed');
                    } catch (err: any) {
                        showAlert(err.message, 'error');
                    }
                }

                // Refresh data
                fetch('/api/gallery')
                    .then(res => res.json())
                    .then(data => {
                        setAlbums(data);
                        if (activeAlbumTitle === oldName && currentName !== oldName) {
                            // Determine navigation if current album was renamed
                            const newAlbum = data.find((a: any) => a.title === currentName);
                            if (newAlbum) openAlbum(newAlbum);
                            else closeAlbum();
                        }
                    });
            }
        });
    };

    const handleRenamePhoto = (key: string) => {
        const oldName = key.split('/').pop() || '';
        showPrompt('Rename Photo', oldName, async (newName) => {
            if (!newName || newName === oldName) return;
            try {
                const res = await fetch('/api/gallery', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
                    body: JSON.stringify({ action: 'rename-photo', key, newName })
                });
                const resBody = await res.json() as any;
                if (!res.ok) throw new Error(resBody.error || 'Rename failed');
                const { newKey } = resBody;
                setAlbums(prev => prev.map(a => {
                    if (a.title === activeAlbumTitle) {
                        return { ...a, photos: a.photos.map(p => p.key === key ? { ...p, key: newKey, url: `/api/gallery/${newKey}` } : p) };
                    }
                    return a;
                }));
                if (activePhotoKey === key) {
                    setActivePhotoKey(newKey);
                    if (activeAlbumTitle) {
                        window.history.replaceState({}, '', `/gallery/${encodeAlbumPath(activeAlbumTitle)}/${encodeURIComponent(newName)}`);
                    }
                }
            } catch (err: any) {
                showAlert(err.message, 'error');
            }
        });
    };

    const subAlbums = useMemo(() => {
        if (!activeAlbum) return [];
        const prefix = activeAlbum.title + '/';
        const depth = activeAlbum.title.split('/').length + 1;
        return albums.filter(a => a.title.startsWith(prefix) && a.title.split('/').length === depth);
    }, [albums, activeAlbum]);

    const breadcrumbSegments = useMemo(() => {
        if (!activeAlbum) return [];
        return activeAlbum.title.split('/');
    }, [activeAlbum]);

    const navigateToBreadcrumb = useCallback((segmentIndex: number) => {
        const targetPath = breadcrumbSegments.slice(0, segmentIndex + 1).join('/');
        const targetAlbum = albums.find(a => a.title === targetPath);
        if (targetAlbum) {
            openAlbum(targetAlbum);
        }
    }, [breadcrumbSegments, albums, openAlbum]);

    return (
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-y-auto">
            <div className="min-h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="gallery" onNavigate={handleNavigate} className="sticky top-0 z-30" maxWidth="max-w-7xl" />

                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumbs */}
                    <div className="mb-8 text-base font-semibold text-elegant-text-muted flex items-center gap-2 flex-wrap">
                        <button onClick={() => onExit()} className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4">~</button>
                        <span>/</span>
                        <span
                            className={activeAlbum ? "hover:text-elegant-text-primary transition-colors cursor-pointer hover:underline decoration-elegant-text-muted underline-offset-4" : "text-elegant-text-primary font-bold"}
                            onClick={() => { if (activeAlbum) closeAlbum(); }}
                        >gallery</span>
                        {activeAlbum && breadcrumbSegments.map((segment, idx) => {
                            const isLast = idx === breadcrumbSegments.length - 1 && !activePhoto;
                            const isClickable = !isLast;
                            return (
                                <React.Fragment key={idx}>
                                    <span>/</span>
                                    <span
                                        className={isLast ? "text-elegant-accent font-bold" : "hover:text-elegant-text-primary transition-colors cursor-pointer hover:underline decoration-elegant-text-muted underline-offset-4"}
                                        onClick={() => { if (isClickable) { if (activePhoto) { closePhoto(); } else { navigateToBreadcrumb(idx); } } }}
                                    >{segment.toLowerCase()}</span>
                                </React.Fragment>
                            );
                        })}
                        {activePhoto && (
                            <>
                                <span>/</span>
                                <span className="text-elegant-accent font-bold">{activePhoto.key.split('/').pop()}</span>
                            </>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-elegant-text-muted animate-pulse">Loading gallery...</div>
                    ) : !activeAlbum ? (
                        albums.length === 0 ? (
                            <div className="text-center py-20 text-elegant-text-muted">
                                <p className="text-lg mb-2">No albums yet</p>
                                <p className="text-sm">Photos will appear here once uploaded.</p>
                            </div>
                        ) : (
                            /* ---- Album Grid ---- */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {albums.filter(a => !a.title.includes('/')).map((album) => (
                                    <AlbumCard
                                        key={album.title}
                                        album={album}
                                        displayTitle={album.title}
                                        isAdmin={isAdmin}
                                        onOpen={openAlbum}
                                        onEditAlbum={handleEditAlbum}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        /* ---- Photo Grid ---- */
                        <>
                            <div className="mb-6 flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        // Navigate to parent album or gallery root
                                        const parentPath = activeAlbum.title.includes('/')
                                            ? activeAlbum.title.substring(0, activeAlbum.title.lastIndexOf('/'))
                                            : null;
                                        const parentAlbum = parentPath ? albums.find(a => a.title === parentPath) : null;
                                        if (parentAlbum) openAlbum(parentAlbum);
                                        else closeAlbum();
                                    }}
                                    className="text-elegant-text-muted hover:text-elegant-text-primary transition-colors flex items-center gap-2 text-sm"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <span className="text-elegant-text-muted">|</span>
                                <p className="text-elegant-text-muted text-sm">{activeAlbum.photos.length} photos</p>
                            </div>

                            {/* Sub-Albums Grid */}
                            {subAlbums.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-elegant-text-primary font-bold mb-4 flex items-center gap-2"><FolderPlus size={18} /> Sub-Albums</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {subAlbums.map((album) => (
                                            <AlbumCard
                                                key={album.title}
                                                album={album}
                                                displayTitle={album.title.split('/').pop() || album.title}
                                                isAdmin={isAdmin}
                                                onOpen={openAlbum}
                                                onEditAlbum={handleEditAlbum}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeAlbum.photos.length === 0 ? (
                                <div className="text-center py-20 text-elegant-text-muted">
                                    <p className="text-lg mb-2">This album is empty</p>
                                    <p className="text-sm">Upload photos to get started.</p>
                                </div>
                            ) : (
                                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                                    {activeAlbum.photos.map((photo, i) => (
                                        <div
                                            key={photo.key}
                                            className="group bg-elegant-card border border-elegant-border rounded-sm overflow-hidden hover:border-elegant-text-muted transition-all relative cursor-pointer break-inside-avoid"
                                            onClick={() => openPhoto(photo)}
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
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.key); }}
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
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.key); }}
                                                        className="p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-red-400 active:bg-red-500/30 transition-colors"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            <span
                                className={`text-elegant-text-primary font-mono text-sm truncate max-w-[70%] ${isAdmin ? 'cursor-pointer hover:text-elegant-accent hover:underline decoration-dashed underline-offset-4' : ''}`}
                                onClick={(e) => { e.stopPropagation(); if (isAdmin) handleRenamePhoto(activePhoto.key); }}
                            >
                                {decodeURIComponent(activePhoto.key.split('/').pop() || '')}
                            </span>
                            <button onClick={closePhoto} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative group">
                            <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
                            <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

                            <button onClick={handlePrev} className="absolute left-4 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-20">
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

                            <button onClick={handleNext} className="absolute right-4 p-3 bg-black/50 hover:bg-white/20 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-20">
                                <ChevronRight size={32} />
                            </button>

                            {showSwipeHint && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden">
                                    <div className="bg-black/60 text-white px-4 py-3 rounded-full flex items-center gap-3 backdrop-blur-sm animate-fade-out">
                                        <Hand size={24} className="animate-swipe-hint" />
                                        <span className="text-sm font-medium">Swipe to navigate</span>
                                    </div>
                                    <style>{`
                                        @keyframes swipe-hint { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
                                        .animate-swipe-hint { animation: swipe-hint 1.5s ease-in-out infinite; }
                                        @keyframes fade-out { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
                                        .animate-fade-out { animation: fade-out 3s forwards; }
                                    `}</style>
                                </div>
                            )}
                        </div>

                        {/* Lightbox admin actions */}
                        {isAdmin && (
                            <div className="absolute bottom-6 right-6 z-50 flex gap-3" onClick={(e) => e.stopPropagation()}>
                                <Tooltip text="Delete Photo">
                                    <button
                                        onClick={() => handleDelete(activePhoto.key)}
                                        className="p-3 bg-elegant-card/80 border border-elegant-border backdrop-blur-md text-red-400 rounded-full hover:bg-red-500/20 hover:border-red-500/50 transition-all shadow-lg"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </Tooltip>
                                <Tooltip text="Edit Caption">
                                    <button
                                        onClick={handleUpdateCaption}
                                        className="p-3 bg-elegant-card/80 border border-elegant-border backdrop-blur-md text-elegant-text-primary rounded-full hover:bg-elegant-accent hover:text-white transition-all shadow-lg"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                )}

                {/* Admin FABs — tucked to the right edge, expand on hover */}
                {isAdmin && !activePhoto && (
                    <div className="fixed bottom-24 right-0 z-40 group/fab flex flex-col gap-4 translate-x-[calc(100%-16px)] hover:translate-x-0 transition-transform duration-300 pr-4">
                        <Tooltip text="New Album" position="left">
                            <button
                                onClick={() => {
                                    showPrompt(
                                        activeAlbumTitle ? `Create New Album in ${activeAlbumTitle.split('/').pop()}` : 'Create New Album',
                                        '',
                                        (name) => {
                                            if (name) {
                                                const finalName = activeAlbumTitle ? `${activeAlbumTitle}/${name}` : name;
                                                setUploadAlbumName(finalName);
                                                setShowUploadModal(true);
                                            }
                                        }
                                    );
                                }}
                                className="p-4 bg-elegant-card border border-elegant-border text-elegant-text-primary rounded-full shadow-lg transition-all duration-300 hover:bg-elegant-accent hover:text-white hover:border-elegant-accent hover:scale-110 hover:shadow-elegant-accent/20 hover:shadow-xl active:scale-95"
                            >
                                <FolderPlus size={24} />
                            </button>
                        </Tooltip>
                        <Tooltip text="Upload Photos" position="left">
                            <button
                                onClick={() => {
                                    if (activeAlbumTitle) setUploadAlbumName(activeAlbumTitle);
                                    setShowUploadModal(true);
                                }}
                                className="p-4 bg-elegant-card border border-elegant-border text-elegant-text-primary rounded-full shadow-lg transition-all duration-300 hover:bg-elegant-accent hover:text-white hover:border-elegant-accent hover:scale-110 hover:rotate-90 hover:shadow-elegant-accent/20 hover:shadow-xl active:scale-95"
                            >
                                <Plus size={24} />
                            </button>
                        </Tooltip>
                    </div>
                )}

                {/* --- CUSTOM MODALS --- */}

                {/* Prompt Modal */}
                {promptConfig && (
                    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-elegant-card border border-elegant-border p-4 rounded-lg max-w-sm w-full shadow-2xl">
                            <h3 className="text-lg font-bold text-elegant-text-primary mb-4">{promptConfig.title}</h3>
                            <input
                                autoFocus
                                defaultValue={promptConfig.defaultValue}
                                className="w-full bg-elegant-bg border border-elegant-border rounded p-2 text-elegant-text-primary focus:border-elegant-accent outline-none mb-6"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { promptConfig.onConfirm(e.currentTarget.value); setPromptConfig(null); }
                                    if (e.key === 'Escape') setPromptConfig(null);
                                }}
                                ref={(input) => { if (input) setTimeout(() => input.focus(), 10); }}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setPromptConfig(null)} className="px-4 py-2 text-elegant-text-muted hover:text-elegant-text-primary">Cancel</button>
                                <button
                                    onClick={(e) => { const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement; promptConfig.onConfirm(input.value); setPromptConfig(null); }}
                                    className="px-4 py-2 bg-elegant-accent text-white rounded hover:bg-elegant-accent/90"
                                >Confirm</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Album Modal */}
                {editAlbumConfig && (
                    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-elegant-card border border-elegant-border p-4 rounded-lg max-w-sm w-full shadow-2xl">
                            <h3 className="text-lg font-bold text-elegant-text-primary mb-4">Edit Album</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-elegant-text-muted mb-1">Album Name</label>
                                    <input
                                        autoFocus
                                        defaultValue={editAlbumConfig.album.title.split('/').pop()}
                                        className="w-full bg-elegant-bg border border-elegant-border rounded p-2 text-elegant-text-primary focus:border-elegant-accent outline-none"
                                        id="edit-album-name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-elegant-text-muted mb-1">Category / Subtitle</label>
                                    <input
                                        defaultValue={editAlbumConfig.album.category}
                                        className="w-full bg-elegant-bg border border-elegant-border rounded p-2 text-elegant-text-primary focus:border-elegant-accent outline-none"
                                        id="edit-album-category"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setEditAlbumConfig(null)} className="px-4 py-2 text-elegant-text-muted hover:text-elegant-text-primary text-sm font-medium">Cancel</button>
                                <button
                                    onClick={() => {
                                        const nameInput = document.getElementById('edit-album-name') as HTMLInputElement;
                                        const catInput = document.getElementById('edit-album-category') as HTMLInputElement;
                                        if (nameInput && catInput) {
                                            editAlbumConfig.onConfirm(nameInput.value, catInput.value);
                                            setEditAlbumConfig(null);
                                        }
                                    }}
                                    className="px-4 py-2 bg-elegant-accent text-white rounded hover:bg-elegant-accent/90 text-sm font-medium"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Modal */}
                {confirmConfig && (
                    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-elegant-card border border-elegant-border p-4 rounded-lg max-w-sm w-full shadow-2xl">
                            <h3 className="text-lg font-bold text-elegant-text-primary mb-2">{confirmConfig.title}</h3>
                            <p className="text-elegant-text-muted mb-6">{confirmConfig.message}</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setConfirmConfig(null)} className="px-4 py-2 text-elegant-text-muted hover:text-elegant-text-primary">Cancel</button>
                                <button
                                    onClick={() => { confirmConfig.onConfirm(); setConfirmConfig(null); }}
                                    className={`px-4 py-2 text-white rounded transition-colors ${confirmConfig.confirmLabel === 'Delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-elegant-accent hover:bg-elegant-accent/90'}`}
                                >{confirmConfig.confirmLabel}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {alertConfig && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70]">
                        <div className={`px-4 py-2 rounded border shadow-lg flex items-center gap-2 text-sm font-mono backdrop-blur-sm ${alertConfig.type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' :
                            alertConfig.type === 'success' ? 'bg-elegant-accent/10 border-elegant-accent/40 text-elegant-accent' :
                                'bg-elegant-card border-elegant-border text-elegant-text-primary'
                            }`}>
                            <span>{alertConfig.message}</span>
                            <button onClick={() => setAlertConfig(null)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity"><X size={12} /></button>
                        </div>
                    </div>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-elegant-card border border-elegant-border rounded-lg max-w-lg w-full p-4 shadow-2xl relative">
                            <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }} className="absolute top-4 right-4 text-elegant-text-muted hover:text-white">
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold text-elegant-text-primary mb-6 flex items-center gap-2">
                                <ImagePlus className="text-elegant-accent" size={22} /> Upload Photos
                            </h2>

                            <form onSubmit={handleUpload} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm text-elegant-text-muted">Album Name</label>
                                    <div className="relative" ref={albumDropdownRef}>
                                        <div className="relative">
                                            <input
                                                value={uploadAlbumName}
                                                onChange={(e) => {
                                                    setUploadAlbumName(e.target.value);
                                                    setIsAlbumDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsAlbumDropdownOpen(true)}
                                                className="w-full bg-elegant-bg border border-elegant-border rounded p-3 pr-10 text-elegant-text-primary focus:border-elegant-accent outline-none appearance-none"
                                                placeholder="e.g. Summer 2024"
                                                required
                                                disabled={isProcessing}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsAlbumDropdownOpen(!isAlbumDropdownOpen)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-elegant-text-muted hover:text-elegant-text-primary transition-colors"
                                                disabled={isProcessing}
                                            >
                                                <ChevronDown size={16} className={`transition-transform duration-200 ${isAlbumDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        {isAlbumDropdownOpen && albums.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-elegant-card border border-elegant-border rounded-sm shadow-xl z-50 max-h-48 overflow-y-auto">
                                                {albums
                                                    .filter(a => !uploadAlbumName || a.title.toLowerCase().includes(uploadAlbumName.toLowerCase()))
                                                    .map(a => (
                                                        <button
                                                            key={a.title}
                                                            type="button"
                                                            onClick={() => {
                                                                setUploadAlbumName(a.title);
                                                                setIsAlbumDropdownOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors text-elegant-text-secondary hover:text-elegant-text-primary text-sm"
                                                        >
                                                            {a.title}
                                                        </button>
                                                    ))}
                                                {uploadAlbumName && !albums.some(a => a.title.toLowerCase() === uploadAlbumName.toLowerCase()) && (
                                                    <div className="px-4 py-2 text-elegant-text-muted text-xs italic border-t border-elegant-border">
                                                        Create new album "{uploadAlbumName}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-elegant-text-muted">Caption (Optional, applies to all)</label>
                                    <textarea
                                        value={uploadCaption}
                                        onChange={(e) => setUploadCaption(e.target.value)}
                                        className="w-full bg-elegant-bg border border-elegant-border rounded p-3 text-elegant-text-primary focus:border-elegant-accent outline-none resize-none h-20"
                                        placeholder="Add a description..."
                                        disabled={isProcessing}
                                    />
                                </div>

                                <div className="relative group">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setUploadFiles(Array.from(e.target.files));
                                            }
                                        }}
                                        accept="image/png, image/jpeg, image/webp"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        required
                                        disabled={isProcessing}
                                    />
                                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isProcessing ? 'opacity-50' : 'group-hover:border-elegant-text-muted'} ${uploadFiles.length > 0 ? 'bg-elegant-accent/5 border-elegant-accent/40' : 'bg-elegant-bg border-elegant-border'}`}>
                                        {uploadFiles.length > 0 ? (
                                            <div>
                                                <p className="text-elegant-accent font-medium">{uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected</p>
                                                <p className="text-xs text-elegant-text-muted mt-1 truncate">
                                                    {uploadFiles.map(f => f.name).join(', ')}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-elegant-text-muted">
                                                <p className="font-medium">Click to select photos</p>
                                                <p className="text-xs mt-1">JPG, PNG, WebP &middot; Multiple files supported</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Progress */}
                                {uploadProgress && (
                                    <div className="space-y-2 text-sm font-mono">
                                        <div className="flex justify-between text-elegant-text-muted">
                                            <span>
                                                {uploadProgress.stage === 'stripping' ? 'Removing metadata' : 'Uploading'} ({uploadProgress.current}/{uploadProgress.total})
                                            </span>
                                            <span>{uploadProgress.stage === 'uploading' ? `${uploadProgress.percent}%` : ''}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-elegant-bg rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${uploadProgress.stage === 'stripping' ? 'bg-elegant-text-muted animate-pulse w-full' : 'bg-elegant-accent'}`}
                                                style={uploadProgress.stage === 'uploading' ? { width: `${uploadProgress.percent}%` } : undefined}
                                            />
                                        </div>
                                        <p className="text-elegant-text-muted text-xs truncate">{uploadProgress.fileName}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-elegant-accent hover:bg-elegant-accent/90 text-white font-bold py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                    ) : (
                                        `Upload ${uploadFiles.length > 0 ? uploadFiles.length : ''} Photo${uploadFiles.length !== 1 ? 's' : ''}`
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer className="border-t border-elegant-border bg-elegant-bg py-2 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-sm font-bold text-elegant-text-muted text-center font-mono">&copy; Neosphere v2.0</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
