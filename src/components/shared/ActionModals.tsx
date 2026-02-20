import React, { useState } from 'react';
import { X } from 'lucide-react';

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

export interface ConfirmConfig {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
}

interface ActionModalsProps {
    promptConfig?: PromptConfig | null;
    setPromptConfig?: (config: PromptConfig | null) => void;

    alertConfig?: AlertConfig | null;
    setAlertConfig?: (config: AlertConfig | null) => void;

    confirmConfig?: ConfirmConfig | null;
    setConfirmConfig?: (config: ConfirmConfig | null) => void;
}

export const ActionModals = ({
    promptConfig, setPromptConfig,
    alertConfig, setAlertConfig,
    confirmConfig, setConfirmConfig,
}: ActionModalsProps) => {
    return (
        <>
            {/* Prompt Modal */}
            {promptConfig && setPromptConfig && (
                <PromptModal config={promptConfig} onClose={() => setPromptConfig(null)} />
            )}

            {/* Confirm Modal */}
            {confirmConfig && setConfirmConfig && (
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
            {alertConfig && setAlertConfig && (
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

// Internal component for Prompt (State)
const PromptModal: React.FC<{ config: PromptConfig; onClose: () => void }> = ({ config, onClose }) => {
    const [value, setValue] = useState(config.defaultValue);

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-elegant-card border border-elegant-border p-4 rounded-lg max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-bold text-elegant-text-primary mb-4">{config.title}</h3>
                <input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-elegant-bg border border-elegant-border rounded p-2 text-elegant-text-primary focus:border-elegant-accent outline-none mb-6"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { config.onConfirm(value); onClose(); }
                        if (e.key === 'Escape') onClose();
                    }}
                    ref={(input) => { if (input) setTimeout(() => input.focus(), 10); }}
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-elegant-text-muted hover:text-elegant-text-primary">Cancel</button>
                    <button
                        onClick={() => { config.onConfirm(value); onClose(); }}
                        className="px-4 py-2 bg-elegant-accent text-white rounded hover:bg-elegant-accent/90"
                    >Confirm</button>
                </div>
            </div>
        </div>
    );
};
