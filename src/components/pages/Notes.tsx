import { useState, useEffect } from 'react';
import { PageHeader } from '../PageHeader';
import { Dock } from '../Dock';
import { FileText, Calendar, User, Search, X, Loader2, Maximize2, Plus, Edit, Trash2, Share2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.min.css';
import { Nano } from '../Nano';

import { ActionModals, type PromptConfig, type AlertConfig, type ConfirmConfig } from '../shared/ActionModals';
import { formatBytes } from '../../utils/format';

interface Note {
    filename: string;
    created_at: number;
    updated_at: number;
    size: number;
    author: string | null;
}

interface NoteDetail {
    content: string;
}

import { useNavigate } from 'react-router';

import { useSEO } from '../../hooks/useSEO';

export const Notes = () => {
    const navigate = useNavigate();
    const onExit = () => navigate('/');
    
    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') {
            onExit();
            window.dispatchEvent(new CustomEvent('open-terminal'));
        } else if (dest === 'Home') {
            onExit();
        } else {
            navigate(`/${dest.toLowerCase()}`);
        }
    };

    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    useSEO({
        title: selectedNote ? `${selectedNote.filename} | Notes` : 'Notes | Bahauddin Alam',
        description: selectedNote ? `Read ${selectedNote.filename} on my personal digital garden.` : 'My personal digital garden. A collection of notes, thoughts, and learnings on software development and technology.',
        url: selectedNote ? `https://bahauddin.in/notes?note=${encodeURIComponent(selectedNote.filename)}` : 'https://bahauddin.in/notes'
    });
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // selectedNote state moved up
    const [noteContent, setNoteContent] = useState<string | null>(null);
    const [contentLoading, setContentLoading] = useState(false);

    // Deep Linking: Check URL for note param on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const noteParam = params.get('note');
        if (noteParam) {
            // Need to fetch specific note even if list isn't ready
            const loadDeepLinkedNote = async () => {
                // Create a placeholder note object since we don't have the full details yet
                // We'll update it when the list loads or we could fetch metadata
                const placeholderNote: Note = {
                    filename: noteParam,
                    created_at: Date.now(), // Fallback
                    updated_at: Date.now(), // Fallback
                    size: 0,
                    author: 'Loading...',
                };
                handleNoteClick(placeholderNote, false); // false = don't push state again
            };
            loadDeepLinkedNote();
        }
    }, []);

    // Nano / Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editFilename, setEditFilename] = useState<string | undefined>(undefined);
    const [editContent, setEditContent] = useState('');

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);

    // Custom Prompts/Alerts State
    const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null);
    const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

    const showConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirm') => {
        setConfirmConfig({ isOpen: true, title, message, onConfirm, confirmLabel });
    };

    const showAlert = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, message, type });
        if (type === 'success') setTimeout(() => setAlertConfig(null), 2500);
    };

    // const showPrompt = (title: string, defaultValue: string, onConfirm: (val: string) => void) => {
    //     setPromptConfig({ isOpen: true, title, defaultValue, onConfirm });
    // };

    useEffect(() => {
        fetchNotes();
        checkAdmin();
    }, []);

    const checkAdmin = () => {
        const token = localStorage.getItem('admin_token');
        setIsAdmin(!!token);
    };

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notes');
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNoteClick = async (note: Note, updateUrl = true) => {
        setSelectedNote(note);
        setContentLoading(true);
        setNoteContent(null);
        
        if (updateUrl) {
            const newUrl = `${window.location.pathname}?note=${encodeURIComponent(note.filename)}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }

        try {
            const res = await fetch(`/api/notes/${note.filename}`);
            if (res.ok) {
                const data: NoteDetail = await res.json();
                setNoteContent(data.content);
            } else {
                setNoteContent('Failed to load note content.');
            }
        } catch (error) {
            console.error('Failed to fetch note content:', error);
            setNoteContent('Error loading note.');
        } finally {
            setContentLoading(false);
        }
    };

    const closeNote = () => {
        setSelectedNote(null);
        setNoteContent(null);
        // Remove query param
        const newUrl = window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    // --- Actions ---

    const handleCreate = () => {
        setEditFilename(undefined); // New file
        setEditContent('');
        setIsEditing(true);
    };

    const handleEdit = () => {
        if (!selectedNote || noteContent === null) return;
        setEditFilename(selectedNote.filename);
        setEditContent(noteContent);
        setIsEditing(true);
    };

    const handleDelete = async () => {
        if (!selectedNote) return;

        if (!isAdmin) {
            showAlert('You are not authorized to delete notes.', 'error');
            return;
        }

        showConfirm(
            'Delete Note',
            `Are you sure you want to delete ${selectedNote.filename}?`,
            async () => {
                try {
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch(`/api/notes/${selectedNote.filename}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        closeNote();
                        fetchNotes();
                        showAlert('Note deleted successfully', 'success');
                    } else {
                        showAlert('Failed to delete note', 'error');
                    }
                } catch (e) {
                    console.error(e);
                    showAlert('Error deleting note', 'error');
                }
            },
            'Delete'
        );
    };

    const handleShare = () => {
        if (!selectedNote) return;
        // Construct standard URL format for shared notes if applicable, or just a link to this page with query param
        // Assuming /shared/notes/[filename] is handled by a route or we link back to here?
        // The previous commands.tsx implementation used `${window.location.origin}/shared/notes/${filename}`
        // We will match that.
        const url = `${window.location.origin}/shared/notes/${encodeURIComponent(selectedNote.filename)}`;
        navigator.clipboard.writeText(url);
        showAlert('Share link copied to clipboard!', 'success');
    };

    const handleNanoSave = async (filename: string, content: string, commitMsg?: string, authorName?: string) => {
        try {
            // Check if it's a new file or update
            // We use editFilename to determine if we started as an edit, but the user might change filename in Nano (Save As)

            // First check if file exists (if we didn't start with a filename, or if user changed it)
            // But simplify: Try GET. If 200 => update (PUT), else => create (POST)

            const checkRes = await fetch(`/api/notes/${filename}`);
            const exists = checkRes.status === 200;

            let res;
            if (exists) {
                res = await fetch(`/api/notes/${filename}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: content,
                        commit_msg: commitMsg,
                        author_name: authorName
                    })
                });
            } else {
                res = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: filename,
                        content: content,
                        commit_msg: commitMsg,
                        author_name: authorName
                    })
                });
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || res.statusText);
            }

            // Success
            setIsEditing(false);
            if (selectedNote) {
                // If we were editing, refresh the detail view with new content
                // If filename changed, we might need to close or update selectedNote
                if (selectedNote.filename === filename) {
                    setNoteContent(content);
                    // Refresh meta
                    fetchNotes();
                } else {
                    // Filename changed (Save As), refresh list and close old note
                    fetchNotes();
                    closeNote();
                }
            } else {
                // Created new note
                fetchNotes();
            }

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            showAlert(`Error saving note: ${msg}`, 'error');
            throw e;
        }
    };

    const filteredNotes = notes.filter(note =>
        note.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.author && note.author.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isEditing) {
        return (
            <div className="fixed inset-0 z-50 bg-elegant-bg">
                <Nano
                    filename={editFilename}
                    initialContent={editContent}
                    onSaveAs={handleNanoSave}
                    onExit={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono overflow-hidden">
            <div className="h-full flex flex-col">
                <PageHeader currentPath="notes" onNavigate={handleNavigate} className="sticky top-0 z-30 shrink-0" maxWidth="max-w-7xl" />
                    
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pt-8 lg:pb-32 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                    {/* Header Section */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-base font-semibold text-elegant-text-muted">
                            <button onClick={onExit} className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4">~</button>
                            <span>/</span>
                            <span className="text-elegant-text-primary font-bold">notes</span>
                            <span className="text-elegant-text-muted mx-2">({notes.length})</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                            {/* Create Button */}
                            <button
                                onClick={handleCreate}
                                className="flex items-center justify-center gap-2 bg-elegant-accent text-elegant-bg px-4 py-2 rounded-md font-bold hover:bg-elegant-accent/90 transition-colors"
                            >
                                <Plus size={16} />
                                <span>New Note</span>
                            </button>

                            {/* Search Bar */}
                            <div className="relative flex-1 sm:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={16} className="text-elegant-text-muted" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-elegant-card border border-elegant-border rounded-md pl-10 pr-4 py-2 text-sm text-elegant-text-primary placeholder-elegant-text-muted focus:outline-none focus:border-elegant-accent focus:ring-1 focus:ring-elegant-accent transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-elegant-text-muted animate-pulse">
                            <Loader2 size={32} className="animate-spin mb-4" />
                            <p>Loading notes...</p>
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-20 text-elegant-text-muted border border-dashed border-elegant-border rounded-lg">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">No notes found</p>
                            <p className="text-sm mb-6">
                                {searchTerm ? `No results for "${searchTerm}"` : "The archive is empty."}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleCreate}
                                    className="text-elegant-accent hover:underline flex items-center justify-center gap-1 mx-auto"
                                >
                                    <Plus size={14} /> Create your first note
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredNotes.map((note) => (
                                <a
                                    key={note.filename}
                                    href={`/notes?note=${encodeURIComponent(note.filename)}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleNoteClick(note);
                                    }}
                                    className="group bg-elegant-card border border-elegant-border rounded-lg p-5 hover:border-elegant-accent transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-elegant-accent/5 flex flex-col h-full relative overflow-hidden block text-left"
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 size={16} className="text-elegant-accent" />
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-elegant-bg rounded-md text-elegant-accent group-hover:bg-elegant-accent group-hover:text-white transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <h3 className="font-bold text-elegant-text-primary truncate flex-1" title={note.filename}>
                                            {note.filename}
                                        </h3>
                                    </div>

                                    <div className="mt-auto space-y-2 text-xs text-elegant-text-muted">
                                        <div className="flex items-center gap-2">
                                            <User size={12} />
                                            <span className="truncate">{note.author || 'Anonymous'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} />
                                            <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </main>

                <Dock onNavigate={handleNavigate} currentPage="Notes" className="py-3" />

                {/* Note Detail Modal */}
                {
                    selectedNote && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div
                                className="bg-elegant-card w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col border border-elegant-border animate-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-4 border-b border-elegant-border bg-elegant-bg/50 rounded-t-lg">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText className="text-elegant-accent shrink-0" size={20} />
                                        <h2 className="text-lg font-bold text-elegant-text-primary truncate">
                                            {selectedNote.filename}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Action Buttons */}
                                        <button
                                            onClick={handleShare}
                                            className="p-2 hover:bg-white/10 rounded-md text-elegant-text-muted hover:text-elegant-accent transition-colors flex items-center gap-1"
                                            title="Share Note"
                                        >
                                            <Share2 size={18} />
                                        </button>

                                        <button
                                            onClick={handleEdit}
                                            className="p-2 hover:bg-white/10 rounded-md text-elegant-text-muted hover:text-elegant-accent transition-colors flex items-center gap-1"
                                            title="Edit Note"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {isAdmin && (
                                            <button
                                                onClick={handleDelete}
                                                className="p-2 hover:bg-red-500/10 rounded-md text-elegant-text-muted hover:text-red-500 transition-colors flex items-center gap-1"
                                                title="Delete Note"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}

                                        <div className="w-px h-6 bg-elegant-border mx-1"></div>

                                        <button
                                            onClick={closeNote}
                                            className="p-2 hover:bg-white/10 rounded-full text-elegant-text-muted hover:text-white transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Content */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-elegant-bg custom-scrollbar">
                                    {contentLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-elegant-text-muted">
                                            <Loader2 size={32} className="animate-spin mb-4" />
                                            <p>Loading content...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {noteContent ? (
                                                <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:text-elegant-text-primary prose-a:text-elegant-accent prose-code:text-elegant-accent prose-code:bg-white/5 prose-code:px-1 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>{noteContent || ''}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 text-elegant-text-muted gap-2">
                                                    <AlertCircle size={32} opacity={0.5} />
                                                    <p>Failed to load content</p>
                                                </div>
                                            )}
                                        </>

                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t border-elegant-border bg-elegant-bg/50 rounded-b-lg text-xs text-elegant-text-muted flex justify-between items-center">
                                    <div>
                                        Last updated: {new Date(selectedNote.updated_at).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>{formatBytes(selectedNote.size)}</span>
                                        <span>•</span>
                                        <span>Author: {selectedNote.author || 'Anonymous'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Backdrop Click Handler */}
                            <div className="absolute inset-0 -z-10" onClick={closeNote} />
                        </div>
                    )
                }
                <ActionModals
                    promptConfig={promptConfig}
                    setPromptConfig={setPromptConfig}
                    alertConfig={alertConfig}
                    setAlertConfig={setAlertConfig}
                    confirmConfig={confirmConfig}
                    setConfirmConfig={setConfirmConfig}
                />
            </div >
        </div >
    );
};

