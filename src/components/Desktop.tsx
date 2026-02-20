import React, { useState, useEffect, useCallback } from 'react';
import { SiGithub, SiX, SiLinkedin, SiTelegram } from 'react-icons/si';
import { Dock } from './Dock';
import { Spotlight } from './Spotlight';

interface DesktopProps {
    onOpenTerminal: () => void;
    onNavigate: (dest: string) => void;
}

export const Desktop: React.FC<DesktopProps> = ({ onOpenTerminal, onNavigate }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleDockNavigate = useCallback((dest: string) => {
        if (dest === 'Terminal') {
            onOpenTerminal();
        } else if (dest === 'Home') {
            // Already on desktop, no-op
        } else {
            onNavigate(dest);
        }
    }, [onOpenTerminal, onNavigate]);

    return (
        <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center font-mono select-none">
            <Spotlight onNavigate={handleDockNavigate} />

            {/* Top-right corner clock - Hidden on mobile to prevent overlap */}
            <div className="hidden sm:flex fixed top-6 right-6 z-20 flex-col items-end pointer-events-none">
                <time
                    dateTime={time.toISOString()}
                    className="text-xl sm:text-2xl font-light text-elegant-text-primary tabular-nums tracking-tight drop-shadow-md"
                >
                     {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </time>
                <p className="text-xs text-elegant-text-muted tracking-wide">
                    {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            {/* Main content area */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto text-center">
                    {/* SEO-rich intro */}
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-elegant-text-primary mb-1.5 tracking-tight">
                            Bahauddin Alam
                        </h1>
                        <h2 className="text-base text-elegant-accent font-medium mb-4">
                            Full Stack Developer
                        </h2>
                        <div className="text-elegant-text-secondary text-base md:text-lg leading-relaxed max-w-3xl mx-auto space-y-4">
                            <p>
                                I'm Bahauddin Alam, a freelance Full Stack Developer based in Patna, India. I build high-performance web applications and developer-focused tools using React, TypeScript, Tailwind CSS, Python, and Node.js, with deployment experience on AWS and edge platforms.

                                With a systems-level foundation in C++, I approach web development with a strong focus on performance, scalability, and clean architecture — handling projects end-to-end from interface design to backend logic and infrastructure.
                            </p>

                        </div>
                    </div>

                    {/* Social links */}
                    <div className="flex gap-3">
                        <a href="https://github.com/bahauddin-alam" target="_blank" rel="noopener noreferrer" aria-label="GitHub Profile" className="p-2.5 text-elegant-text-muted hover:text-elegant-text-primary transition-colors">
                            <SiGithub size={18} />
                        </a>
                        <a href="https://x.com/bahauddinalam" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) Profile" className="p-2.5 text-elegant-text-muted hover:text-elegant-text-primary transition-colors">
                            <SiX size={18} />
                        </a>
                        <a href="https://www.linkedin.com/in/bahauddinalam" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile" className="p-2.5 text-elegant-text-muted hover:text-elegant-text-primary transition-colors">
                            <SiLinkedin size={18} />
                        </a>
                        <a href="https://t.me/bahauddinalam" target="_blank" rel="noopener noreferrer" aria-label="Telegram Profile" className="p-2.5 text-elegant-text-muted hover:text-elegant-text-primary transition-colors">
                            <SiTelegram size={18} />
                        </a>
                    </div>
                </div>

            {/* Dock */}
            <Dock
                onNavigate={handleDockNavigate}
                currentPage="Home"
                className="pb-5 md:pb-6 relative z-10"
            />
        </div>
    );
};
