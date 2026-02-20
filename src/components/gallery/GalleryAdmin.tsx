import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus, ImagePlus, Loader2, ChevronDown, Plus, X } from 'lucide-react';
import type { Album } from './types';

// Simple tooltip
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="relative group/tip">
        {children}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 bg-elegant-card border border-elegant-border rounded text-[11px] text-elegant-text-secondary font-mono whitespace-nowrap opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-200 pointer-events-none z-[100] shadow-lg">
            {text}
            <div className="absolute top-1/2 left-full -translate-y-1/2 border-l-elegant-border border-t-transparent border-b-transparent border-r-transparent border-4" />
        </div>
    </div>
);

interface GalleryAdminProps {
    isAdmin: boolean;
    activeAlbumTitle: string | null;
    showUploadModal: boolean;
    setShowUploadModal: (show: boolean) => void;

    // Upload State & Handlers
    uploadFiles: File[];
    setUploadFiles: (files: File[]) => void;
    uploadCaption: string;
    setUploadCaption: (caption: string) => void;
    uploadAlbumName: string;
    setUploadAlbumName: (name: string) => void;
    uploadProgress: {
        current: number;
        total: number;
        stage: 'stripping' | 'uploading';
        percent: number;
        fileName: string;
    } | null;
    isProcessing: boolean;

    handleUpload: (e: React.FormEvent) => void;
    resetUploadForm: () => void;

    // Dropdown Data
    albums: Album[];

    // Actions to trigger prompts
    onNewAlbumClick: () => void;
}

export const GalleryAdmin = ({
    isAdmin,
    activeAlbumTitle,
    showUploadModal,
    setShowUploadModal,
    uploadFiles,
    setUploadFiles,
    uploadCaption,
    setUploadCaption,
    uploadAlbumName,
    setUploadAlbumName,
    uploadProgress,
    isProcessing,
    handleUpload,
    resetUploadForm,
    albums,
    onNewAlbumClick
}: GalleryAdminProps) => {
    const [isAlbumDropdownOpen, setIsAlbumDropdownOpen] = useState(false);
    const albumDropdownRef = useRef<HTMLDivElement>(null);

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

    // FABs
    if (isAdmin && !showUploadModal) {
        return (
            <>
                {/* Desktop FABs */}
                <div className="fixed bottom-24 right-8 hidden md:flex flex-col gap-4 z-40">
                    <Tooltip text="New Album">
                        <button
                            onClick={onNewAlbumClick}
                            className="p-4 bg-elegant-card border border-elegant-border text-elegant-text-primary rounded-full shadow-lg transition-all duration-300 hover:bg-elegant-accent hover:text-white hover:border-elegant-accent hover:scale-110 hover:shadow-elegant-accent/20 hover:shadow-xl active:scale-95"
                        >
                            <FolderPlus size={24} />
                        </button>
                    </Tooltip>
                    <Tooltip text="Upload Photos">
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

            </>
        );
    }

    // Modal
    if (showUploadModal) {
        return (
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
        );
    }

    return null;
};
