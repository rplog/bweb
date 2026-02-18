import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { optimizeImage } from '../../utils/imageOptimizer';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { PageFooter } from '../PageFooter';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import { createNavigationHandler } from '../../utils/navigation';
import type { Album, Photo } from '../gallery/types';
import { AlbumGrid } from '../gallery/AlbumGrid';
import { PhotoGrid } from '../gallery/PhotoGrid';
import { Lightbox } from '../gallery/Lightbox';
import { GalleryAdmin } from '../gallery/GalleryAdmin';
import { GalleryModals } from '../gallery/GalleryModals';
import type { PromptConfig, AlertConfig, EditAlbumConfig, ConfirmConfig } from '../gallery/GalleryModals';

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

interface GalleryProps {
    onExit: () => void;
    onNavigate: (path: string) => void;
}

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
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        current: number;
        total: number;
        stage: 'stripping' | 'uploading';
        percent: number;
        fileName: string;
    } | null>(null);

    // Custom Prompts/Alerts State
    const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null);
    const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
    const [editAlbumConfig, setEditAlbumConfig] = useState<EditAlbumConfig | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

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
        const controller = new AbortController();
        const signal = controller.signal;

        fetch('/api/gallery', { signal })
            .then(async res => {
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to load gallery');
                }
                return res.json();
            })
            .then((data: Album[]) => {
                if (signal.aborted) return;
                setAlbums(data);
                setLoading(false);

                const path = window.location.pathname;
                if (path.startsWith('/gallery/')) {
                    const parts = path.split('/').slice(2).filter(Boolean);
                    if (parts.length >= 1) {
                        try {
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
                        } catch {
                            // Deep link resolution failed, silently fall back to gallery root
                        }
                    }
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                // Error handled by UI loading state
                setLoading(false);
            });

        return () => controller.abort();
    }, []);

    // Popstate handling
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


    const handleNavigate = createNavigationHandler(onExit, onNavigate);

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

    const openPhoto = useCallback((photo: Photo, replace = false) => {
        setActivePhotoKey(photo.key);
        const url = buildPhotoUrl(photo);
        if (replace) {
            window.history.replaceState({}, '', url);
        } else {
            window.history.pushState({}, '', url);
        }
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
        openPhoto(activeAlbum.photos[nextIndex], true);
    }, [activeAlbum, activePhoto, openPhoto]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!activeAlbum || !activePhoto) return;
        const currentIndex = activeAlbum.photos.findIndex(p => p.key === activePhoto.key);
        if (currentIndex === -1) return;
        const prevIndex = (currentIndex - 1 + activeAlbum.photos.length) % activeAlbum.photos.length;
        openPhoto(activeAlbum.photos[prevIndex], true);
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
        setUploadProgress(null);
    };

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
    const uploadWithProgress = (formData: FormData): Promise<{ success: boolean; key: string }> => {
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
                    url: `/r2/${key}`,
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

        } catch (err: unknown) {
            showAlert(`Upload Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
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
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Delete failed');
                    }

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
                } catch (err: unknown) {
                    showAlert(err instanceof Error ? err.message : 'Unknown error', 'error');
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
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Update failed');
                }
                setAlbums(prev => prev.map(a => {
                    if (a.title === activeAlbumTitle) {
                        return { ...a, photos: a.photos.map(p => p.key === activePhoto.key ? { ...p, caption: newCaption } : p) };
                    }
                    return a;
                }));
            } catch (err: unknown) {
                showAlert(err instanceof Error ? err.message : 'Unknown error', 'error');
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
                            const resBody = await res.json() as { error?: string };
                            throw new Error(resBody.error || 'Rename failed');
                        }

                        currentName = fullNewName;
                    } catch (err: unknown) {
                        showAlert(err instanceof Error ? err.message : 'Unknown error', 'error');
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
                        if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.error || 'Update category failed');
                        }
                    } catch (err: unknown) {
                        showAlert(err instanceof Error ? err.message : 'Unknown error', 'error');
                    }
                }

                // Refresh data
                fetch('/api/gallery')
                    .then(res => res.json())
                    .then(data => {
                        setAlbums(data);
                        if (activeAlbumTitle === oldName && currentName !== oldName) {
                            // Determine navigation if current album was renamed
                            const newAlbum = data.find((a: Album) => a.title === currentName);
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
                const resBody = await res.json() as { error?: string; newKey: string };
                if (!res.ok) throw new Error(resBody.error || 'Rename failed');
                const { newKey } = resBody;
                setAlbums(prev => prev.map(a => {
                    if (a.title === activeAlbumTitle) {
                        return { ...a, photos: a.photos.map(p => p.key === key ? { ...p, key: newKey, url: `/r2/${newKey}` } : p) };
                    }
                    return a;
                }));
                if (activePhotoKey === key) {
                    setActivePhotoKey(newKey ?? null);
                    if (activeAlbumTitle) {
                        window.history.replaceState({}, '', `/gallery/${encodeAlbumPath(activeAlbumTitle)}/${encodeURIComponent(newName)}`);
                    }
                }
            } catch (err: unknown) {
                showAlert(err instanceof Error ? err.message : 'Unknown error', 'error');
            }
        });
    };

    const handleNewAlbumClick = () => {
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
                    {/* Breadcrumbs + Mobile Admin Actions */}
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <div className="text-base font-semibold text-elegant-text-muted flex items-center gap-2 flex-wrap min-w-0">
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
                            <AlbumGrid
                                albums={albums.filter(a => !a.title.includes('/'))}
                                isAdmin={isAdmin}
                                onOpen={openAlbum}
                                onEditAlbum={handleEditAlbum}
                                onDelete={handleDelete}
                            />
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
                                    <AlbumGrid
                                        albums={subAlbums}
                                        isAdmin={isAdmin}
                                        onOpen={openAlbum}
                                        onEditAlbum={handleEditAlbum}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            )}

                            {activeAlbum.photos.length === 0 ? (
                                <div className="text-center py-20 text-elegant-text-muted">
                                    <p className="text-lg mb-2">This album is empty</p>
                                    <p className="text-sm">Upload photos to get started.</p>
                                </div>
                            ) : (
                                <PhotoGrid
                                    photos={activeAlbum.photos}
                                    isAdmin={isAdmin}
                                    onOpenPhoto={(photo) => openPhoto(photo)}
                                    onDeletePhoto={(key) => handleDelete(key, false)}
                                />
                            )}
                        </>
                    )}
                </main>

                <PageFooter />

                {/* Lightbox */}
                {activePhoto && (
                    <Lightbox
                        activePhoto={activePhoto}
                        onClose={closePhoto}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        isAdmin={isAdmin}
                        onDelete={(key) => handleDelete(key, false)}
                        onRename={handleRenamePhoto}
                        onUpdateCaption={handleUpdateCaption}
                    />
                )}

                {/* Admin FABs & Upload Modal */}
                <GalleryAdmin
                    isAdmin={isAdmin}
                    activeAlbumTitle={activeAlbumTitle}
                    showUploadModal={showUploadModal}
                    setShowUploadModal={setShowUploadModal}
                    uploadFiles={uploadFiles}
                    setUploadFiles={setUploadFiles}
                    uploadCaption={uploadCaption}
                    setUploadCaption={setUploadCaption}
                    uploadAlbumName={uploadAlbumName}
                    setUploadAlbumName={setUploadAlbumName}
                    uploadProgress={uploadProgress}
                    isProcessing={isProcessing}
                    handleUpload={handleUpload}
                    resetUploadForm={resetUploadForm}
                    albums={albums}
                    onNewAlbumClick={handleNewAlbumClick}
                />

                {/* Modals */}
                <GalleryModals
                    promptConfig={promptConfig}
                    setPromptConfig={setPromptConfig}
                    alertConfig={alertConfig}
                    setAlertConfig={setAlertConfig}
                    editAlbumConfig={editAlbumConfig}
                    setEditAlbumConfig={setEditAlbumConfig}
                    confirmConfig={confirmConfig}
                    setConfirmConfig={setConfirmConfig}
                />
            </div>
        </div>
    );
};
