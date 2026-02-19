import React, { useState, useEffect } from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { PageFooter } from '../PageFooter';
import { createNavigationHandler } from '../../utils/navigation';
import { FileText, Calendar, User, Search, X, Loader2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

interface NotesProps {
    onExit: () => void;
    onNavigate: (path: string) => void;
}

export const Notes: React.FC<NotesProps> = ({ onExit, onNavigate }) => {
    const handleNavigate = createNavigationHandler(onExit, onNavigate);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState<string | null>(null);
    const [contentLoading, setContentLoading] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, []);

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

    const handleNoteClick = async (note: Note) => {
        setSelectedNote(note);
        setContentLoading(true);
        setNoteContent(null);
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
    };

    const filteredNotes = notes.filter(note =>
        note.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.author && note.author.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-y-auto">
            <div className="min-h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="notes" onNavigate={handleNavigate} className="sticky top-0 z-30" maxWidth="max-w-7xl" />

                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-base font-semibold text-elegant-text-muted">
                            <button onClick={onExit} className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4">~</button>
                            <span>/</span>
                            <span className="text-elegant-text-primary font-bold">notes</span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-64">
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
                            <p className="text-sm">
                                {searchTerm ? `No results for "${searchTerm}"` : "The archive is empty."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredNotes.map((note) => (
                                <div
                                    key={note.filename}
                                    onClick={() => handleNoteClick(note)}
                                    className="group bg-elegant-card border border-elegant-border rounded-lg p-5 hover:border-elegant-accent transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-elegant-accent/5 flex flex-col h-full relative overflow-hidden"
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
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <PageFooter />

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
                                    <button
                                        onClick={closeNote}
                                        className="p-2 hover:bg-white/10 rounded-full text-elegant-text-muted hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-elegant-bg custom-scrollbar">
                                    {contentLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-elegant-text-muted">
                                            <Loader2 size={32} className="animate-spin mb-4" />
                                            <p>Loading content...</p>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:text-elegant-text-primary prose-a:text-elegant-accent prose-code:text-elegant-accent prose-code:bg-white/5 prose-code:px-1 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{noteContent || ''}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t border-elegant-border bg-elegant-bg/50 rounded-b-lg text-xs text-elegant-text-muted flex justify-between items-center">
                                    <div>
                                        Last updated: {new Date(selectedNote.updated_at).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>{selectedNote.size} bytes</span>
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
            </div >
        </div >
    );
};
