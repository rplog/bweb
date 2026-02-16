import React from 'react';
import { Spotlight } from '../Spotlight';
import { Github, Twitter, Linkedin, Globe, Code, Terminal } from 'lucide-react';

interface AboutProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

export const About: React.FC<AboutProps> = ({ onExit, onNavigate }) => {
    const handleNavigate = (dest: string) => {
        if (dest === 'Terminal') onExit();
        else if (onNavigate) onNavigate(dest);
    };

    return (
        <div className="h-full w-full bg-black text-gray-300 p-8 overflow-y-auto font-mono flex flex-col items-center justify-center min-h-screen selection:bg-white/20">
            <Spotlight onNavigate={handleNavigate} />

            <div className="max-w-3xl w-full border border-[#222] bg-[#0a0a0a] p-12 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Terminal size={120} />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10 mb-12 relative z-10">
                    <div className="w-32 h-32 rounded-full bg-[#111] border-2 border-[#333] flex items-center justify-center shadow-2xl overflow-hidden">
                        <img src="/avatars/me.jpg" alt="Profile" className="w-full h-full object-cover" onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerText = 'N';
                            e.currentTarget.parentElement!.classList.add('text-5xl', 'font-bold', 'text-gray-200');
                        }} />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-5xl font-bold text-gray-200 mb-3 tracking-tight">Neo Anderson</h1>
                        <p className="text-xl text-gray-400 font-light flex items-center justify-center md:justify-start gap-2">
                            <Code size={20} /> Full Stack Cyber-Architect
                        </p>
                    </div>
                </div>

                <div className="space-y-6 text-gray-400 leading-relaxed text-lg border-t border-[#222] pt-8">
                    <p>
                        <span className="text-white font-bold">System Status:</span> Online.
                    </p>
                    <p>
                        I construct digital infrastructures in the void. Specializing in high-performance React environments, edge computing, and minimalistic UI/UX design.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4">
                        {['React 19', 'TypeScript', 'Vite', 'Cloudflare', 'Tailwind'].map(tech => (
                            <span key={tech} className="bg-[#111] border border-[#333] px-3 py-1 rounded text-sm text-gray-300">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-6">
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"><Github size={24} /></button>
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"><Twitter size={24} /></button>
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"><Linkedin size={24} /></button>
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"><Globe size={24} /></button>
                </div>

                <div className="mt-16 text-center text-xs text-gray-600">
                    ID: <span className="font-mono text-gray-500">USER_101010</span> • Access Level: <span className="text-green-500">ROOT</span>
                </div>
            </div>
        </div>
    );
};
