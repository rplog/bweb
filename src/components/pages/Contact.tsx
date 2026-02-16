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
        <div className="h-full w-full bg-black text-gray-300 font-mono selection:bg-white/20 overflow-y-auto lg:overflow-hidden">
            <div className="h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="contact" onNavigate={handleNavigate} className="shrink-0" />

                {/* Main Content */}
                <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col justify-center">
                    {/* Breadcrumbs */}
                    <div className="mb-6 text-base font-semibold text-gray-600 flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-gray-300 transition-colors hover:underline decoration-gray-600 underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span className="text-gray-300 font-bold">contact</span>
                    </div>

                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-sm p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Send className="text-gray-500" size={20} />
                            <h2 className="text-xl font-bold text-white">Send Message</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">
                                        Name <span className="text-gray-700">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-black border border-gray-800 rounded-sm pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:outline-none focus:ring-0 focus:border-gray-600 transition-all placeholder-gray-700"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">
                                        Email <span className="text-gray-700">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-black border border-gray-800 rounded-sm pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:outline-none focus:ring-0 focus:border-gray-600 transition-all placeholder-gray-700"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5">
                                    Message <span className="text-gray-700">*</span>
                                </label>
                                <div className="relative">
                                    <MessageSquare size={16} className="absolute left-3 top-3 text-gray-600" />
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows={5}
                                        className="w-full bg-black border border-gray-800 rounded-sm pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:outline-none focus:ring-0 focus:border-gray-600 transition-all resize-none placeholder-gray-700"
                                        placeholder="Write your message here..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-2.5 px-6 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 border border-gray-700 text-sm"
                            >
                                <Send size={16} />
                                Send Message
                            </button>
                        </form>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-900 bg-black py-2 mt-auto shrink-0">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-xs text-gray-800 text-center font-mono">
                            neosphere v2.0
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
