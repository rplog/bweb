import React from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Globe, Code } from 'lucide-react';
import { SiGithub, SiX, SiLinkedin, SiReact, SiTypescript, SiVite, SiTailwindcss, SiCloudflare, SiNodedotjs } from 'react-icons/si';

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
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-y-auto">
            <div className="min-h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="about" onNavigate={handleNavigate} className="shrink-0" />

                {/* Main Content */}
                <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
                    {/* Breadcrumbs */}
                    <div className="mb-6 text-base font-semibold text-elegant-text-muted flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span className="text-elegant-text-primary font-bold">about</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-elegant-card border border-elegant-border rounded-sm p-6 lg:sticky lg:top-8">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-elegant-bg border border-elegant-border p-1 mb-4 lg:mb-6 grayscale">
                                        <div className="w-full h-full rounded-full bg-elegant-bg flex items-center justify-center overflow-hidden">
                                            <img
                                                src="/media/avatars/me.jpg"
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement!;
                                                    parent.innerHTML = '<span class="text-4xl font-bold text-elegant-text-muted">N</span>';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-elegant-text-primary mb-2">Neo Anderson</h2>
                                    <p className="text-elegant-text-muted text-sm mb-1">@neo</p>
                                    <p className="text-elegant-text-secondary mb-6 text-sm">Full Stack Developer</p>

                                    <div className="flex gap-3 mb-6 justify-center">
                                        <a href="#" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiGithub size={18} />
                                        </a>
                                        <a href="#" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiX size={18} />
                                        </a>
                                        <a href="#" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiLinkedin size={18} />
                                        </a>
                                        <a href="#" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <Globe size={18} />
                                        </a>
                                    </div>

                                    <div className="w-full space-y-2 text-xs text-left">
                                        <div className="flex justify-between py-2 border-t border-elegant-border">
                                            <span className="text-elegant-text-secondary">Status</span>
                                            <span className="text-elegant-text-muted flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-elegant-accent rounded-full"></span>
                                                Online
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-elegant-border">
                                            <span className="text-elegant-text-secondary">Location</span>
                                            <span className="text-elegant-text-muted">The Matrix</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-elegant-border">
                                            <span className="text-elegant-text-secondary">Joined</span>
                                            <span className="text-elegant-text-muted">2024</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="lg:col-span-2 space-y-6 flex flex-col">
                            {/* Bio Card */}
                            <div className="bg-elegant-card border border-elegant-border rounded-sm p-6">
                                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                                    <Code className="text-elegant-text-muted" size={20} />
                                    <h3 className="text-lg font-bold text-elegant-text-primary">About Me</h3>
                                </div>
                                <div className="space-y-4 text-elegant-text-secondary leading-relaxed text-sm">
                                    <p>
                                        I construct digital infrastructures in the void. Specializing in high-performance
                                        React environments, edge computing, and minimalistic UI/UX design.
                                    </p>
                                    <p>
                                        My work focuses on creating seamless user experiences with cutting-edge web
                                        technologies, always pushing the boundaries of what's possible in the browser.
                                    </p>
                                    <p className="text-elegant-accent text-xs font-mono mt-4 pt-4 border-t border-elegant-border">
                                        $ whoami → Building the future, one commit at a time.
                                    </p>
                                </div>
                            </div>

                            {/* Skills Card */}
                            <div className="bg-elegant-card border border-elegant-border rounded-sm p-6">
                                <h3 className="text-lg font-bold text-elegant-text-primary mb-6">Tech Stack</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { name: 'React', icon: SiReact, color: 'text-[#61DAFB]' },
                                        { name: 'TypeScript', icon: SiTypescript, color: 'text-[#3178C6]' },
                                        { name: 'Vite', icon: SiVite, color: 'text-[#646CFF]' },
                                        { name: 'Tailwind', icon: SiTailwindcss, color: 'text-[#06B6D4]' },
                                        { name: 'Cloudflare', icon: SiCloudflare, color: 'text-[#F38020]' },
                                        { name: 'Node.js', icon: SiNodedotjs, color: 'text-[#339933]' }
                                    ].map((skill) => (
                                        <div
                                            key={skill.name}
                                            className="bg-elegant-bg border border-elegant-border rounded-sm p-3 hover:border-elegant-text-muted transition-all cursor-default flex items-center gap-3 group"
                                        >
                                            <skill.icon size={20} className={`${skill.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                            <div className="text-xs text-elegant-text-secondary">{skill.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-elegant-border bg-elegant-bg py-2 mt-auto shrink-0">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className="text-sm font-bold text-elegant-text-muted text-center font-mono">
                            &copy; Neosphere v2.0
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
