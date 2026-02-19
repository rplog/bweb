import React, { useState } from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Code, X } from 'lucide-react';
import { Dock } from '../Dock';
import { SiGithub, SiX, SiLinkedin, SiReact, SiTypescript, SiRust, SiTailwindcss, SiPython, SiTelegram, SiNodedotjs } from 'react-icons/si';
import { createNavigationHandler } from '../../utils/navigation';

import { useSEO } from '../../hooks/useSEO';

interface AboutProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

export const About: React.FC<AboutProps> = ({ onExit, onNavigate }) => {
    useSEO({
        title: 'About | Bahauddin Alam',
        description: 'About Bahauddin Alam - Full Stack Developer specializing in React, TypeScript, and Rust. Based in Patna, India.',
        url: 'https://bahauddin.in/about',
        image: 'https://bahauddin.in/assets/me.jpg'
    });

    const handleNavigate = createNavigationHandler(onExit, onNavigate);

    const [showProfile, setShowProfile] = useState(false);
    const [hasImageError, setHasImageError] = useState(false);

    return (
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-y-auto">
            <div className="min-h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="about" onNavigate={handleNavigate} className="shrink-0" maxWidth="max-w-7xl" />

                {/* Main Content */}
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="mb-6 text-base font-semibold text-elegant-text-muted flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span className="text-elegant-text-primary font-bold">about</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Card */}
                        <aside className="lg:col-span-1" aria-label="User Profile">
                            <div className="bg-elegant-card border border-elegant-border rounded-sm p-6 lg:sticky lg:top-8">
                                <div className="flex flex-col items-center text-center">
                                    <div
                                        className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-elegant-bg border border-elegant-border p-1 mb-4 lg:mb-6 cursor-pointer hover:border-elegant-accent transition-colors group"
                                        onClick={() => setShowProfile(true)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="View profile picture"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setShowProfile(true);
                                            }
                                        }}
                                    >
                                        <div className="w-full h-full rounded-full bg-elegant-bg flex items-center justify-center overflow-hidden">
                                            {!hasImageError ? (
                                                <img
                                                    src="/assets/me.jpg"
                                                    alt="Bahauddin Alam, Full Stack Developer"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setHasImageError(true)}
                                                    loading="eager"
                                                />
                                            ) : (
                                                <span className="text-4xl font-bold text-elegant-text-muted">N</span>
                                            )}
                                        </div>
                                    </div>

                                    <h1 className="text-xl font-bold text-elegant-text-primary mb-2">Bahauddin Alam</h1>
                                    <p className="text-elegant-text-muted text-sm mb-1">@bahauddinalam</p>
                                    <p className="text-elegant-text-secondary mb-6 text-sm">Full Stack Developer</p>

                                    <div className="flex gap-3 mb-6 justify-center">
                                        <a href="https://github.com/bahauddin-alam" target="_blank" rel="noopener noreferrer" aria-label="Github Profile" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiGithub size={18} aria-hidden="true" />
                                        </a>
                                        <a href="https://x.com/bahauddinalam" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) Profile" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiX size={18} aria-hidden="true" />
                                        </a>
                                        <a href="https://www.linkedin.com/in/bahauddinalam" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiLinkedin size={18} aria-hidden="true" />
                                        </a>
                                        <a href="https://t.me/bahauddinalam" target="_blank" rel="noopener noreferrer" aria-label="Telegram Profile" className="p-2 bg-elegant-bg hover:bg-elegant-card rounded transition-colors border border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiTelegram size={18} aria-hidden="true" />
                                        </a>
                                    </div>

                                    <div className="w-full space-y-2 text-xs text-left">
                                        <div className="flex justify-between py-2 border-t border-elegant-border">
                                            <span className="text-elegant-text-secondary">Status</span>
                                            <span className="text-elegant-text-muted flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-elegant-accent rounded-full" aria-hidden="true"></span>
                                                Online
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-elegant-border">
                                            <span className="text-elegant-text-secondary">Location</span>
                                            <span className="text-elegant-text-muted">Patna, India</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-elegant-border">
                                            <span className="text-elegant-text-secondary">Joined</span>
                                            <span className="text-elegant-text-muted">2022</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Content Section */}
                        <div className="lg:col-span-2 space-y-6 flex flex-col">
                            {/* Bio Card */}
                            <section className="bg-elegant-card border border-elegant-border rounded-sm p-6" aria-labelledby="about-me-heading">
                                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                                    <Code className="text-elegant-text-muted" size={20} aria-hidden="true" />
                                    <h2 id="about-me-heading" className="text-lg font-bold text-elegant-text-primary">About Me</h2>
                                </div>
                                <div className="space-y-4 text-elegant-text-secondary leading-relaxed text-sm">
                                    <p>
                                        I construct digital infrastructures in the void. Specializing in high-performance edge computing, and easy to navigate UI/UX design.
                                    </p>
                                    <p>
                                        My work focuses on creating seamless user experiences and always pushing the boundaries of what's possible in the browser.
                                    </p>
                                    <p className="text-elegant-accent text-xs font-mono mt-4 pt-4 border-t border-elegant-border">
                                        <span aria-hidden="true">$ whoami → </span>Building the future, one commit at a time.
                                    </p>
                                </div>
                            </section>

                            {/* Skills Card */}
                            <section className="bg-elegant-card border border-elegant-border rounded-sm p-6" aria-labelledby="tech-stack-heading">
                                <h2 id="tech-stack-heading" className="text-lg font-bold text-elegant-text-primary mb-6">Tech Stack</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { name: 'React', icon: SiReact, color: 'text-[#61DAFB]' },
                                        { name: 'TypeScript', icon: SiTypescript, color: 'text-[#3178C6]' },
                                        { name: 'Rust', icon: SiRust, color: 'text-[#646CFF]' },
                                        { name: 'Tailwind', icon: SiTailwindcss, color: 'text-[#06B6D4]' },
                                        { name: 'Python', icon: SiPython, color: 'text-[#F38020]' },
                                        { name: 'Node.js', icon: SiNodedotjs, color: 'text-[#339933]' }
                                    ].map((skill) => (
                                        <div
                                            key={skill.name}
                                            className="bg-elegant-bg border border-elegant-border rounded-sm p-3 hover:border-elegant-text-muted transition-all cursor-default flex items-center gap-3 group"
                                            role="article"
                                            aria-label={`Skill: ${skill.name}`}
                                        >
                                            <skill.icon size={20} className={`${skill.color} opacity-80 group-hover:opacity-100 transition-opacity`} aria-hidden="true" />
                                            <div className="text-xs text-elegant-text-secondary">{skill.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </main>

                {/* Dock */}
                <Dock onNavigate={handleNavigate} currentPage="About" className="py-3" />

                {/* Profile Lightbox */}
                {showProfile && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setShowProfile(false)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={() => setShowProfile(false)}
                        >
                            <X size={24} />
                        </button>

                        <div
                            className="relative max-w-2xl w-full aspect-square md:aspect-auto md:h-[80vh] flex items-center justify-center p-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src="/assets/me.jpg"
                                alt="Bahauddin Alam"
                                className="w-full h-full object-contain rounded-full md:rounded-lg shadow-2xl ring-4 ring-elegant-border/20"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
