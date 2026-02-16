import React from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Github, Twitter, Linkedin, Globe, Code } from 'lucide-react';

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
        <div className="h-full w-full bg-black text-gray-300 font-mono selection:bg-white/20 overflow-y-auto lg:overflow-hidden">
            <div className="h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="about" onNavigate={handleNavigate} className="shrink-0" />

                {/* Main Content */}
                <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 h-full overflow-hidden flex flex-col">
                    {/* Breadcrumbs */}
                    <div className="mb-6 text-base font-semibold text-gray-600 flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-gray-300 transition-colors hover:underline decoration-gray-600 underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span className="text-gray-300 font-bold">about</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-y-auto lg:overflow-visible">
                        {/* Profile Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#0a0a0a] border border-gray-800 rounded-sm p-6 lg:sticky lg:top-0">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gray-900 border border-gray-800 p-1 mb-4 lg:mb-6 grayscale">
                                        <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                            <img
                                                src="/avatars/me.jpg"
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement!;
                                                    parent.innerHTML = '<span class="text-4xl font-bold text-gray-500">N</span>';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-white mb-2">Neo Anderson</h2>
                                    <p className="text-gray-600 text-sm mb-1">@neo</p>
                                    <p className="text-gray-500 mb-6 text-sm">Full Stack Developer</p>

                                    <div className="flex gap-3 mb-6 justify-center">
                                        <a href="#" className="p-2 bg-black hover:bg-gray-900 rounded transition-colors border border-gray-800 text-gray-500 hover:text-gray-300">
                                            <Github size={18} />
                                        </a>
                                        <a href="#" className="p-2 bg-black hover:bg-gray-900 rounded transition-colors border border-gray-800 text-gray-500 hover:text-gray-300">
                                            <Twitter size={18} />
                                        </a>
                                        <a href="#" className="p-2 bg-black hover:bg-gray-900 rounded transition-colors border border-gray-800 text-gray-500 hover:text-gray-300">
                                            <Linkedin size={18} />
                                        </a>
                                        <a href="#" className="p-2 bg-black hover:bg-gray-900 rounded transition-colors border border-gray-800 text-gray-500 hover:text-gray-300">
                                            <Globe size={18} />
                                        </a>
                                    </div>

                                    <div className="w-full space-y-2 text-xs text-left">
                                        <div className="flex justify-between py-2 border-t border-gray-800">
                                            <span className="text-gray-600">Status</span>
                                            <span className="text-gray-400 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                                Online
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-gray-800">
                                            <span className="text-gray-600">Location</span>
                                            <span className="text-gray-400">The Matrix</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-gray-800">
                                            <span className="text-gray-600">Joined</span>
                                            <span className="text-gray-400">2024</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="lg:col-span-2 space-y-6 flex flex-col">
                            {/* Bio Card */}
                            <div className="bg-[#0a0a0a] border border-gray-800 rounded-sm p-6">
                                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                                    <Code className="text-gray-500" size={20} />
                                    <h3 className="text-lg font-bold text-white">About Me</h3>
                                </div>
                                <div className="space-y-4 text-gray-400 leading-relaxed text-sm">
                                    <p>
                                        I construct digital infrastructures in the void. Specializing in high-performance
                                        React environments, edge computing, and minimalistic UI/UX design.
                                    </p>
                                    <p>
                                        My work focuses on creating seamless user experiences with cutting-edge web
                                        technologies, always pushing the boundaries of what's possible in the browser.
                                    </p>
                                    <p className="text-gray-600 text-xs font-mono mt-4 pt-4 border-t border-gray-900">
                                        $ whoami → Building the future, one commit at a time.
                                    </p>
                                </div>
                            </div>

                            {/* Skills Card */}
                            <div className="bg-[#0a0a0a] border border-gray-800 rounded-sm p-6">
                                <h3 className="text-lg font-bold text-white mb-6">Tech Stack</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {['React', 'TypeScript', 'Vite', 'Tailwind', 'Cloudflare', 'Node.js'].map((skill) => (
                                        <div
                                            key={skill}
                                            className="bg-black border border-gray-800 rounded-sm p-3 hover:border-gray-600 transition-all cursor-default"
                                        >
                                            <div className="text-xs text-gray-300 text-center">{skill}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
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
