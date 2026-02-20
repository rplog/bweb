import { useState } from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Code, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Dock } from '../Dock';
import { SiGithub, SiX, SiLinkedin, SiReact, SiTypescript, SiRust, SiTailwindcss, SiPython, SiTelegram, SiNodedotjs } from 'react-icons/si';
import { useNavigate } from 'react-router';

import { useSEO } from '../../hooks/useSEO';

export const About = () => {
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

    const [showProfile, setShowProfile] = useState(false);
    const [hasImageError, setHasImageError] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useSEO({
        title: 'About | Bahauddin Alam',
        description: 'About Bahauddin Alam - Full Stack Developer specializing in React, TypeScript, and Rust. Based in Patna, India.',
        url: 'https://bahauddin.in/about',
        image: 'https://bahauddin.in/assets/me.jpg'
    });

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
                                        I'm Bahauddin Alam, a freelance Full Stack Developer based in Patna, India. Alongside continuing my academic studies, I focus on building performance-driven web applications and developer-oriented systems designed for reliability, scalability, and long-term maintainability.
                                    </p>

                                    <p>
                                        My primary stack includes React, TypeScript, Tailwind CSS, Python, and Node.js, and I deploy and scale applications using AWS and modern edge platforms. I work across the entire development lifecycle — from frontend architecture and UI/UX implementation to backend logic, infrastructure setup, and deployment strategy.
                                    </p>

                                    {!isExpanded && (
                                        <button
                                            onClick={() => setIsExpanded(true)}
                                            className="flex items-center gap-2 text-elegant-accent hover:text-elegant-accent/80 transition-colors text-sm font-medium mt-4 group"
                                        >
                                            Read More
                                            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                                        </button>
                                    )}

                                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
                                        <div className="overflow-hidden">
                                            <div className="pt-2"> {/* Padding to separate from button/prev paragraph */}
                                                <h3 className="text-base font-bold text-elegant-text-primary mt-4 mb-2">Engineering Approach</h3>

                                                <p className="mb-4">
                                                    My background in systems programming with C++ has shaped the way I think about software. Understanding memory management, performance constraints, and low-level optimization gives me a systems-first perspective when designing web applications. I prioritize clean architecture, efficient execution, and simplicity over unnecessary complexity.
                                                </p>

                                                <p className="mb-4">
                                                    Rather than separating frontend and backend concerns, I approach development holistically. Every layer — interface, API design, database interaction, deployment, and monitoring — should work together cohesively. Good software is not just functional; it is structured, predictable, and maintainable.
                                                </p>

                                                <h3 className="text-base font-bold text-elegant-text-primary mt-6 mb-2">What I Build</h3>

                                                <p className="mb-4">
                                                    I have built server uptime monitoring systems, real-time health tracking dashboards, and alert tools designed to improve system visibility and operational awareness. These tools focus on performance, reliability, and clarity — minimizing noise while maximizing actionable insight.
                                                </p>

                                                <p className="mb-4">
                                                    I also designed and developed a custom terminal-themed web interface engineered for speed and responsiveness. This project reflects my interest in blending structured systems thinking with modern web technologies.
                                                </p>

                                                <h3 className="text-base font-bold text-elegant-text-primary mt-6 mb-2">Areas of Interest</h3>

                                                <p className="mb-4">
                                                    I'm particularly interested in high-performance computing, distributed systems, edge infrastructure, and developer tooling. My long-term focus is on building software that is efficient, scalable, and thoughtfully engineered — whether for clients, open-source contributions, or independent projects.
                                                </p>

                                                <p className="mb-4">
                                                    I believe strong engineering is about clarity, performance, and responsibility — building systems that not only work today but remain stable and maintainable tomorrow.
                                                </p>

                                                <button
                                                    onClick={() => setIsExpanded(false)}
                                                    className="flex items-center gap-2 text-elegant-text-muted hover:text-elegant-text-primary transition-colors text-sm font-medium mt-6 group"
                                                >
                                                    Read Less
                                                    <ChevronUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Skills Card */}
                            <section className="bg-elegant-card border border-elegant-border rounded-sm p-6" aria-labelledby="tech-stack-heading">
                                <h2 id="tech-stack-heading" className="text-lg font-bold text-elegant-text-primary mb-6">Tech Stack</h2>
                                <div className="flex flex-wrap gap-3">
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
                                            className="bg-elegant-bg border border-elegant-border rounded-sm p-3 md:p-4 hover:border-elegant-text-muted transition-all cursor-default flex items-center gap-3 group shrink-0"
                                            role="article"
                                            aria-label={`Skill: ${skill.name}`}
                                        >
                                            <div className="shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8">
                                                <skill.icon size={28} className={`w-full h-full ${skill.color} opacity-80 group-hover:opacity-100 transition-opacity`} aria-hidden="true" />
                                            </div>
                                            <div className="text-sm md:text-base font-medium text-elegant-text-secondary whitespace-nowrap">{skill.name}</div>
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
