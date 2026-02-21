import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../PageHeader';
import { Code, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Dock } from '../Dock';
import {
    SiGithub, SiX, SiLinkedin, SiReact, SiTypescript, SiRust, SiTailwindcss,
    SiPython, SiTelegram, SiNodedotjs, SiCplusplus, SiAmazonwebservices, SiGo,
} from 'react-icons/si';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router';

import { useSEO } from '../../hooks/useSEO';

const ROLES = ['Full Stack Developer', 'Systems Programmer', 'Software Engineering Student', 'Open Source Builder', 'Solopreneur'];

const CURRENTLY = [
    { label: 'Building', value: 'bahauddin.in — this portfolio' },
    { label: 'Learning', value: 'Distributed systems & edge computing' },
    { label: 'Focus',    value: 'Performance-first web architecture' },
];

const SKILL_GROUPS = [
    {
        category: 'Frontend',
        skills: [
            { name: 'React',      icon: SiReact,            hex: '#61DAFB', progress: 95, flatIdx: 0 },
            { name: 'TypeScript', icon: SiTypescript,        hex: '#3178C6', progress: 90, flatIdx: 1 },
            { name: 'Tailwind',   icon: SiTailwindcss,       hex: '#06B6D4', progress: 98, flatIdx: 2 },
        ],
    },
    {
        category: 'Backend',
        skills: [
            { name: 'Node.js',    icon: SiNodedotjs,         hex: '#339933', progress: 90, flatIdx: 3 },
            { name: 'Python',     icon: SiPython,            hex: '#3776AB', progress: 85, flatIdx: 4 },
            { name: 'Go',         icon: SiGo,                hex: '#00ADD8', progress: 80, flatIdx: 5 },
        ],
    },
    {
        category: 'Systems & Cloud',
        skills: [
            { name: 'Rust',       icon: SiRust,              hex: '#CE422B', progress: 75, flatIdx: 6 },
            { name: 'C++',        icon: SiCplusplus,         hex: '#00599C', progress: 70, flatIdx: 7 },
            { name: 'AWS',        icon: SiAmazonwebservices, hex: '#FF9900', progress: 80, flatIdx: 8 },
        ],
    },
];

export const About = () => {
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion() ?? false;

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

    const [showProfile, setShowProfile]     = useState(false);
    const [hasImageError, setHasImageError] = useState(false);
    const [isExpanded, setIsExpanded]       = useState(false);
    const [activeCard, setActiveCard]       = useState<'about' | 'tech'>('about');
    const [hasGlowed, setHasGlowed]         = useState(false);

    // Typewriter state
    const [roleDisplayed, setRoleDisplayed] = useState('');
    const [roleIdx, setRoleIdx]             = useState(0);
    const [typePhase, setTypePhase]         = useState<'typing' | 'deleting'>('typing');

    // Initial glow timer
    useEffect(() => {
        const t = setTimeout(() => setHasGlowed(true), 2000);
        return () => clearTimeout(t);
    }, []);

    // Typewriter effect — self-scheduling state machine
    useEffect(() => {
        if (prefersReducedMotion) return;
        const current = ROLES[roleIdx];
        if (typePhase === 'typing') {
            if (roleDisplayed.length < current.length) {
                const t = setTimeout(
                    () => setRoleDisplayed(current.slice(0, roleDisplayed.length + 1)),
                    100,
                );
                return () => clearTimeout(t);
            } else {
                const t = setTimeout(() => setTypePhase('deleting'), 1800);
                return () => clearTimeout(t);
            }
        } else {
            if (roleDisplayed.length > 0) {
                const t = setTimeout(() => setRoleDisplayed(prev => prev.slice(0, -1)), 50);
                return () => clearTimeout(t);
            } else {
                const t = setTimeout(() => {
                    setRoleIdx(prev => (prev + 1) % ROLES.length);
                    setTypePhase('typing');
                }, 0);
                return () => clearTimeout(t);
            }
        }
    }, [roleDisplayed, typePhase, roleIdx, prefersReducedMotion]);

    // Ref to the right scrollable column
    const rightColRef = useRef<HTMLDivElement>(null);

    // Forward wheel events from anywhere on the page to the right column on desktop
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const col = rightColRef.current;
            if (!col) return;
            // Skip forwarding when the user is already scrolling inside the right column
            if (col.contains(e.target as Node)) return;
            col.scrollTop += e.deltaY;
        };
        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    // Keyboard arrow switching
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft')  setActiveCard('about');
            if (e.key === 'ArrowRight') { setActiveCard('tech'); setIsExpanded(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useSEO({
        title: 'About | Bahauddin Alam',
        description: 'About Bahauddin Alam - Full Stack Developer specializing in React, TypeScript, and Rust. Based in Patna, India.',
        url: 'https://bahauddin.in/about',
        image: 'https://bahauddin.in/assets/me.jpg',
    });

    const cardAnimate = (card: 'about' | 'tech') => ({
        y:      activeCard === card ? 0 : (prefersReducedMotion ? 0 : -35),
        x:      activeCard === card ? 0 : (prefersReducedMotion ? 0 : (card === 'about' ? 5 : -5)),
        scale:  activeCard === card ? 1 : (prefersReducedMotion ? 1 : 0.94),
        rotate: activeCard === card ? 0 : (prefersReducedMotion ? 0 : (card === 'about' ? 2 : -2)),
        zIndex: activeCard === card ? 10 : 1,
    });

    const cardTransition = prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 200, damping: 20 };

    return (
        <div className="h-full w-full bg-elegant-bg text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-hidden">
            <div className="h-full flex flex-col">
                <PageHeader currentPath="about" onNavigate={handleNavigate} className="shrink-0" maxWidth="max-w-7xl" />

                {/* Everything below the header */}
                <main className="flex-1 flex flex-col min-h-0">

                    {/* ── Breadcrumbs: OUTSIDE the scroll container, always visible ── */}
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 shrink-0">
                        <nav aria-label="Breadcrumb" className="mb-4 text-base font-semibold text-elegant-text-muted flex items-center gap-2">
                            <button
                                onClick={onExit}
                                className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4"
                            >
                                ~
                            </button>
                            <span>/</span>
                            <span className="text-elegant-text-primary font-bold">about</span>
                        </nav>
                    </div>

                    {/* ── Content area ──
                         Mobile  : single overflow-y-auto — everything scrolls as one column.
                         Desktop : overflow-hidden on wrapper; only the right column gets
                                   overflow-y-auto, so the profile sidebar stays fixed.       ── */}
                    <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 overflow-y-auto lg:overflow-hidden">
                        <motion.div
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-full pb-28 lg:pb-0"
                            initial={prefersReducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {/* ── Left: Profile card ──
                                 Mobile : normal document flow, scrolls with the page.
                                 Desktop: grid cell fills column height; card sits at the top.
                                          No sticky needed — the left column itself doesn't scroll. ── */}
                            <aside className="lg:col-span-1" aria-label="User Profile">
                                <div className="bg-elegant-card border border-elegant-border rounded-lg p-6 shadow-xl">
                                    <div className="flex flex-col items-center text-center">
                                        <div
                                            className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-elegant-bg border border-elegant-border p-1 mb-4 lg:mb-6 cursor-pointer hover:border-elegant-accent transition-colors"
                                            onClick={() => setShowProfile(true)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="View profile picture"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') setShowProfile(true);
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
                                                    <span className="text-4xl font-bold text-elegant-text-muted">B</span>
                                                )}
                                            </div>
                                        </div>

                                        <h1 className="text-xl font-bold text-elegant-text-primary mb-2">Bahauddin Alam</h1>
                                        <p className="text-elegant-text-muted text-sm mb-1">@bahauddinalam</p>

                                        {/* Typewriter role */}
                                        <p className="text-elegant-text-secondary mb-6 text-sm min-h-[1.25rem]">
                                            {prefersReducedMotion ? ROLES[0] : roleDisplayed}
                                            {!prefersReducedMotion && (
                                                <span className="animate-pulse text-elegant-accent" aria-hidden="true">|</span>
                                            )}
                                        </p>

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
                                                    <span className="relative flex w-1.5 h-1.5">
                                                        <span
                                                            className={`${prefersReducedMotion ? '' : 'animate-ping'} absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75`}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                                                    </span>
                                                    Active
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
                                            <div className="flex justify-between py-2 border-t border-elegant-border">
                                                <span className="text-elegant-text-secondary">Available</span>
                                                <span className="text-elegant-accent font-semibold">Open to work</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate('/contact')}
                                            className="mt-5 w-full py-2 border border-elegant-accent/40 text-elegant-accent hover:bg-elegant-accent/10 rounded text-sm font-semibold transition-colors"
                                        >
                                            Get in touch →
                                        </button>
                                    </div>
                                </div>
                            </aside>

                            {/* ── Right: only this column scrolls on desktop ── */}
                            <div ref={rightColRef} className="lg:col-span-2 lg:overflow-y-auto lg:pb-32 flex flex-col pt-2 lg:pt-6 w-full min-w-0">

                                {/* Card Tab Switcher — sits well above the stacked cards */}
                                <div className="mb-10 shrink-0">
                                    <div className="flex items-center gap-2 mb-2" role="tablist" aria-label="Content sections">
                                        {(['about', 'tech'] as const).map(card => (
                                            <button
                                                key={card}
                                                role="tab"
                                                aria-selected={activeCard === card}
                                                onClick={() => {
                                                    setActiveCard(card);
                                                    if (card === 'tech') setIsExpanded(false);
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                                                    activeCard === card
                                                        ? 'bg-elegant-accent/15 border-elegant-accent/40 text-elegant-accent'
                                                        : 'border-elegant-border text-elegant-text-muted hover:text-elegant-text-primary hover:border-elegant-text-muted bg-transparent'
                                                }`}
                                            >
                                                {card === 'about' ? 'About Me' : 'Tech Stack'}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Keyboard hint on its own line — never overlaps cards */}
                                    <p className="text-[10px] text-elegant-text-muted hidden sm:block select-none" aria-hidden="true">
                                        ← → arrow keys to switch
                                    </p>
                                </div>

                                {/* Stacked Cards */}
                                <div className="relative grid grid-cols-1 grid-rows-1 items-start w-full">
                                    {/* Bio Card */}
                                    <motion.section
                                        className="col-start-1 row-start-1 bg-elegant-card border border-elegant-border rounded-lg shadow-2xl p-6 origin-top w-full overflow-hidden"
                                        animate={cardAnimate('about')}
                                        transition={cardTransition}
                                        onClick={() => activeCard !== 'about' && setActiveCard('about')}
                                        style={{ cursor: activeCard !== 'about' ? 'pointer' : 'auto' }}
                                        aria-labelledby="about-me-heading"
                                    >
                                        <div className={`transition-opacity duration-300 ${activeCard === 'about' ? 'opacity-100 pointer-events-auto' : 'opacity-30 pointer-events-none'}`}>
                                            <div className="flex items-center gap-3 mb-4 lg:mb-6">
                                                <Code className="text-elegant-text-muted" size={20} aria-hidden="true" />
                                                <h2 id="about-me-heading" className="text-lg font-bold text-elegant-text-primary">About Me</h2>
                                            </div>
                                            <div className="space-y-4 text-elegant-text-secondary leading-relaxed text-sm">
                                                <p>
                                                    I'm Bahauddin Alam, a Full Stack Developer based in Patna, India. Alongside continuing my academic studies, I focus on building performance driven web applications and developer oriented systems designed for reliability, scalability, and long-term maintainability.
                                                </p>

                                                <p>
                                                    My primary stack includes React, TypeScript, Tailwind CSS, Python, and Node.js, and I deploy and scale applications using AWS and modern edge platforms. I work across the entire development lifecycle from frontend architecture and UI/UX implementation to backend logic, infrastructure setup, and deployment strategy.
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
                                                        <div className="pt-2">
                                                            <h3 className="text-base font-bold text-elegant-text-primary mt-4 mb-2">Engineering Approach</h3>

                                                            <p className="mb-4">
                                                                My background in systems programming with C++ has shaped the way I think about software. Understanding memory management, performance constraints, and low-level optimization gives me a systems first perspective when designing web applications. I prioritize clean architecture, efficient execution, and simplicity over unnecessary complexity.
                                                            </p>

                                                            <p className="mb-4">
                                                                Rather than separating frontend and backend concerns, I approach development holistically. Every layer — interface, API design, database interaction, deployment, and monitoring should work together cohesively. Good software is not just functional; it is structured, predictable, and maintainable.
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
                                                                I'm particularly interested in high performance computing, distributed systems, edge infrastructure, and developer tooling. My long term focus is on building software that is efficient, scalable, and thoughtfully engineered — whether for clients, open-source contributions, or independent projects.
                                                            </p>

                                                            <p className="mb-4">
                                                                I believe strong engineering is about clarity, performance, and responsibility — building systems that not only work today but remain stable and maintainable tomorrow.
                                                            </p>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                                                className="flex items-center gap-2 text-elegant-text-muted hover:text-elegant-text-primary transition-colors text-sm font-medium mt-6 group"
                                                            >
                                                                Read Less
                                                                <ChevronUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {activeCard !== 'about' && (
                                            <div className="absolute inset-0 z-50 flex items-start justify-center pt-2 pointer-events-none">
                                                <motion.span
                                                    className="bg-elegant-bg/80 text-elegant-text-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg border uppercase tracking-wider backdrop-blur-sm relative overflow-hidden pointer-events-auto cursor-pointer"
                                                    initial={!hasGlowed ? { borderColor: 'rgba(201, 166, 107, 0.8)', boxShadow: '0 0 15px rgba(201,166,107,0.4)' } : { borderColor: 'rgba(201, 166, 107, 0.1)', boxShadow: '0 0 0px rgba(201,166,107,0)' }}
                                                    animate={{ borderColor: 'rgba(201, 166, 107, 0.1)', boxShadow: '0 0 0px rgba(201,166,107,0)' }}
                                                    transition={{ duration: 2, ease: 'easeOut' }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        setActiveCard('about');
                                                    }}
                                                >
                                                    View About Me
                                                </motion.span>
                                            </div>
                                        )}
                                    </motion.section>

                                    {/* Skills Card */}
                                    <motion.section
                                        className="col-start-1 row-start-1 bg-elegant-card border border-elegant-border rounded-lg shadow-2xl p-6 origin-top w-full overflow-hidden"
                                        animate={cardAnimate('tech')}
                                        transition={cardTransition}
                                        onClick={() => { if (activeCard !== 'tech') { setActiveCard('tech'); setIsExpanded(false); } }}
                                        style={{ cursor: activeCard !== 'tech' ? 'pointer' : 'auto' }}
                                        aria-labelledby="tech-stack-heading"
                                    >
                                        <div className={`flex flex-col h-full transition-opacity duration-300 ${activeCard === 'tech' ? 'opacity-100 pointer-events-auto' : 'opacity-30 pointer-events-none'}`}>
                                            <h2 id="tech-stack-heading" className="text-lg font-bold text-elegant-text-primary mb-4">Tech Stack</h2>

                                            <div className="flex flex-col gap-4 w-full">
                                                {SKILL_GROUPS.map(group => (
                                                    <div key={group.category}>
                                                        <p className="text-xs font-bold uppercase tracking-widest text-elegant-text-secondary mb-2 pl-1">
                                                            {group.category}
                                                        </p>
                                                        <div className="flex flex-col gap-2">
                                                            {group.skills.map((skill) => (
                                                                <div
                                                                    key={skill.name}
                                                                    className="relative w-full bg-elegant-bg border border-elegant-border rounded-sm hover:border-elegant-text-muted transition-colors cursor-default group overflow-hidden"
                                                                    role="article"
                                                                    aria-label={`Skill: ${skill.name}, Proficiency: ${skill.progress}%`}
                                                                >
                                                                    <motion.div
                                                                        className="absolute top-0 left-0 h-full z-0 opacity-20 group-hover:opacity-30 transition-opacity"
                                                                        style={{ backgroundColor: skill.hex }}
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: activeCard === 'tech' ? `${skill.progress}%` : 0 }}
                                                                        transition={{
                                                                            duration: prefersReducedMotion ? 0 : 1,
                                                                            delay: prefersReducedMotion ? 0 : (activeCard === 'tech' ? skill.flatIdx * 0.07 : 0),
                                                                            ease: [0.16, 1, 0.3, 1],
                                                                        }}
                                                                    />
                                                                    <div className="relative z-10 p-3 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="shrink-0 flex items-center justify-center w-7 h-7">
                                                                                <skill.icon size={24} style={{ color: skill.hex }} className="tech-stack-icon" aria-hidden="true" />
                                                                            </div>
                                                                            <div className="tech-stack-text">{skill.name}</div>
                                                                        </div>
                                                                        <div className="text-sm font-medium text-elegant-text-secondary font-mono">
                                                                            {skill.progress}%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {activeCard !== 'tech' && (
                                            <div className="absolute inset-0 z-50 flex items-start justify-center pt-2 pointer-events-none">
                                                <motion.span
                                                    className="bg-elegant-bg/80 text-elegant-text-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg border uppercase tracking-wider backdrop-blur-sm relative overflow-hidden pointer-events-auto cursor-pointer"
                                                    initial={!hasGlowed ? { borderColor: 'rgba(201, 166, 107, 0.8)', boxShadow: '0 0 15px rgba(201,166,107,0.4)' } : { borderColor: 'rgba(201, 166, 107, 0.1)', boxShadow: '0 0 0px rgba(201,166,107,0)' }}
                                                    animate={{ borderColor: 'rgba(201, 166, 107, 0.1)', boxShadow: '0 0 0px rgba(201,166,107,0)' }}
                                                    transition={{ duration: 2, ease: 'easeOut' }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        setActiveCard('tech');
                                                        setIsExpanded(false);
                                                    }}
                                                >
                                                    View Tech Stack
                                                </motion.span>
                                            </div>
                                        )}
                                    </motion.section>
                                </div>

                                {/* Currently Section */}
                                <motion.div
                                    className="mt-6 shrink-0"
                                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.35, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className="bg-elegant-card border border-elegant-border rounded-lg p-4">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-elegant-text-muted mb-3">Currently</h3>
                                        <div className="space-y-2">
                                            {CURRENTLY.map(({ label, value }) => (
                                                <div key={label} className="flex items-baseline gap-3 text-sm">
                                                    <span className="font-mono text-elegant-accent shrink-0 w-16">{label}</span>
                                                    <span className="text-elegant-text-muted shrink-0" aria-hidden="true">→</span>
                                                    <span className="text-elegant-text-secondary">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                            </div>
                        </motion.div>
                    </div>
                </main>

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
                            aria-label="Close profile picture"
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
