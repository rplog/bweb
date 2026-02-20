import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { SiGithub, SiX, SiLinkedin, SiTelegram } from 'react-icons/si';
import { Dock } from './Dock';
import { Spotlight } from './Spotlight';

interface DesktopProps {
    onOpenTerminal: () => void;
}

export const Desktop = ({ onOpenTerminal }: DesktopProps) => {
    const navigate = useNavigate();

    const handleDockNavigate = useCallback((dest: string) => {
        if (dest === 'Terminal') {
            onOpenTerminal();
        } else if (dest === 'Home') {
            // Already on desktop, no-op
        } else {
            navigate(`/${dest.toLowerCase()}`);
        }
    }, [onOpenTerminal, navigate]);

    return (
        <div className="fixed inset-0 bg-elegant-bg flex flex-col items-center justify-center font-mono select-none">
            <Spotlight onNavigate={handleDockNavigate} />

            {/* Main content area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto text-center">
                    {/* SEO-rich intro */}
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-elegant-text-primary mb-1.5 tracking-tight">
                            Bahauddin Alam
                        </h1>
                        <h2 className="text-base text-elegant-accent font-medium mb-4">
                            Full Stack Developer
                        </h2>
                        <div className="text-elegant-text-secondary text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-10">
                            <p>
                                I build high-performance web applications and developer-focused systems using tools like React, TypeScript, and Python. Explore my portfolio spanning frontend architectures to edge-deployed backends.
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
                className="pb-5 md:pb-6"
            />
        </div>
    );
};
