import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Album } from './types';

// Types for different modal configs
export interface PromptConfig {
    isOpen: boolean;
    title: string;
    message?: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
}

export interface AlertConfig {
    isOpen: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
}

export interface EditAlbumConfig {
    album: Album;
    onConfirm: (newName: string, newCategory: string) => void;
}

export interface ConfirmConfig {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
}

interface GalleryModalsProps {
    promptConfig: PromptConfig | null;
    setPromptConfig: (config: PromptConfig | null) => void;

    alertConfig: AlertConfig | null;
    setAlertConfig: (config: AlertConfig | null) => void;

    editAlbumConfig: EditAlbumConfig | null;
    setEditAlbumConfig: (config: EditAlbumConfig | null) => void;

    confirmConfig: ConfirmConfig | null;
    setConfirmConfig: (config: ConfirmConfig | null) => void;
}

export const GalleryModals: React.FC<GalleryModalsProps> = ({
    promptConfig, setPromptConfig,
    alertConfig, setAlertConfig,
    editAlbumConfig, setEditAlbumConfig,
    confirmConfig, setConfirmConfig,
}) => {

    // Controlled inputs for Edit Album Modal
    // Note: We use an inner component or effect to reset state when config changes to avoid stale state.
    // Or we just implement the modal as a controlled component below.

    return (
        <>
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

            {/* Edit Album Modal - Refactored to use controlled inputs */}
            {editAlbumConfig && (
                <EditAlbumModal
                    config={editAlbumConfig}
                    onClose={() => setEditAlbumConfig(null)}
                />
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
        </>
    );
};

// Internal component for Edit Album specific logic (State)
const EditAlbumModal: React.FC<{ config: EditAlbumConfig; onClose: () => void }> = ({ config, onClose }) => {
    const [name, setName] = useState(config.album.title.split('/').pop() || '');
    const [category, setCategory] = useState(config.album.category || '');

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-elegant-card border border-elegant-border p-4 rounded-lg max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-bold text-elegant-text-primary mb-4">Edit Album</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-elegant-text-muted mb-1">Album Name</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-elegant-bg border border-elegant-border rounded p-2 text-elegant-text-primary focus:border-elegant-accent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-elegant-text-muted mb-1">Category / Subtitle</label>
                        <input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-elegant-bg border border-elegant-border rounded p-2 text-elegant-text-primary focus:border-elegant-accent outline-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-elegant-text-muted hover:text-elegant-text-primary text-sm font-medium">Cancel</button>
                    <button
                        onClick={() => {
                            config.onConfirm(name, category);
                            onClose();
                        }}
                        className="px-4 py-2 bg-elegant-accent text-white rounded hover:bg-elegant-accent/90 text-sm font-medium"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
