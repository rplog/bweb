import React from 'react';
import { Spotlight } from '../Spotlight';
import { Send, User, Mail, MessageSquare } from 'lucide-react';

interface ContactProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onExit, onNavigate }) => {
    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') onExit();
        else if (onNavigate) onNavigate(dest);
    };

    return (
        <div className="h-full w-full bg-black text-gray-300 p-8 overflow-y-auto font-mono flex items-center justify-center selection:bg-white/20">
            <Spotlight onNavigate={handleNavigate} />

            <div className="max-w-md w-full bg-[#0a0a0a] p-10 rounded-xl border border-[#222] shadow-2xl relative">

                <h2 className="text-3xl font-bold mb-8 text-gray-200 flex items-center gap-3">
                    <Send size={28} className="text-gray-200" />
                    <span>Signal Uplink</span>
                </h2>

                <div className="space-y-6">
                    <div className="relative">
                        <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Identity</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-3 text-gray-600" />
                            <input type="text" className="w-full bg-[#111] border border-[#333] rounded-lg pl-10 pr-4 py-3 text-gray-200 outline-none focus:border-white/40 transition-colors placeholder-gray-700" placeholder="Codename" />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Frequency</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-3 text-gray-600" />
                            <input type="email" className="w-full bg-[#111] border border-[#333] rounded-lg pl-10 pr-4 py-3 text-gray-200 outline-none focus:border-white/40 transition-colors placeholder-gray-700" placeholder="frequency@net.io" />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Packet Data</label>
                        <div className="relative">
                            <MessageSquare size={16} className="absolute left-3 top-3 text-gray-600" />
                            <textarea className="w-full bg-[#111] border border-[#333] rounded-lg pl-10 pr-4 py-3 text-gray-200 h-32 outline-none focus:border-white/40 transition-colors resize-none placeholder-gray-700" placeholder="Transmit your message..."></textarea>
                        </div>
                    </div>

                    <button className="w-full bg-gray-200 text-black font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 mt-2">
                        <Send size={18} /> Establish Connection
                    </button>
                </div>

                <div className="mt-8 text-center text-[10px] text-gray-600 uppercase tracking-widest">
                    Secured via AES-256 • Press <span className="text-gray-200">L</span> to disconnect
                </div>
            </div>
        </div>
    );
};
