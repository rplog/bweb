import React, { useState } from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Send, User, Mail, MessageSquare } from 'lucide-react';

interface ContactProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onExit, onNavigate }) => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') onExit();
        else if (onNavigate) onNavigate(dest);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Message sent!\nName: ${formData.name}\nEmail: ${formData.email}\nMessage: ${formData.message}`);
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-y-auto lg:overflow-hidden">
            <div className="h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="contact" onNavigate={handleNavigate} className="shrink-0" />

                {/* Main Content */}
                <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col justify-center">
                    {/* Breadcrumbs */}
                    <div className="mb-6 text-base font-semibold text-elegant-text-muted flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span className="text-elegant-text-primary font-bold">contact</span>
                    </div>

                    <div className="bg-elegant-card border border-elegant-border rounded-sm p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Send className="text-elegant-text-muted" size={20} />
                            <h2 className="text-xl font-bold text-elegant-text-primary">Send Message</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-elegant-text-secondary mb-1.5">
                                        Name <span className="text-elegant-accent">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-elegant-text-muted" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-elegant-bg border border-elegant-border rounded-sm pl-10 pr-3 py-2.5 text-sm text-elegant-text-primary outline-none focus:outline-none focus:ring-0 focus:border-elegant-text-muted transition-all placeholder-elegant-text-muted"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-elegant-text-secondary mb-1.5">
                                        Email <span className="text-elegant-accent">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-elegant-text-muted" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-elegant-bg border border-elegant-border rounded-sm pl-10 pr-3 py-2.5 text-sm text-elegant-text-primary outline-none focus:outline-none focus:ring-0 focus:border-elegant-text-muted transition-all placeholder-elegant-text-muted"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-elegant-text-secondary mb-1.5">
                                    Message <span className="text-elegant-accent">*</span>
                                </label>
                                <div className="relative">
                                    <MessageSquare size={16} className="absolute left-3 top-3 text-elegant-text-muted" />
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={5}
                                        className="w-full bg-elegant-bg border border-elegant-border rounded-sm pl-10 pr-3 py-2.5 text-sm text-elegant-text-primary outline-none focus:outline-none focus:ring-0 focus:border-elegant-text-muted transition-all resize-none placeholder-elegant-text-muted"
                                        placeholder="Write your message here..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-elegant-accent hover:bg-elegant-accent-hover text-elegant-bg font-bold py-2.5 px-6 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 border border-transparent text-sm"
                            >
                                <Send size={16} />
                                Send Message
                            </button>
                        </form>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-elegant-border bg-elegant-bg py-2 mt-auto shrink-0">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-xs text-elegant-text-muted text-center font-mono">
                            neosphere v2.0
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
