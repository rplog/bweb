import React from 'react';
import { Spotlight } from '../Spotlight';
import { PageHeader } from '../PageHeader';
import { Dock } from '../Dock';
import { FolderGit2 } from 'lucide-react';
import { createNavigationHandler } from '../../utils/navigation';
import { SiGithub } from 'react-icons/si';

import { useSEO } from '../../hooks/useSEO';

interface ProjectsProps {
    onExit: () => void;
    onNavigate?: (dest: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onExit, onNavigate }) => {
    useSEO({
        title: 'Projects | Bahauddin Alam',
        description: 'Showcase of my recent projects. From web applications to system tools, explore what I\'ve built.',
        url: 'https://bahauddin.in/projects'
    });

    const handleNavigate = createNavigationHandler(onExit, onNavigate);

    const projects = [
        {
            title: "Terminal Portfolio",
            description: "A retro-futuristic terminal interface built with React, TypeScript, and Tailwind CSS. Features a simulated file system, command history, and immersive CLI experience.",
            tech: ["React", "TypeScript", "Tailwind"],
            link: "https://github.com/bahauddin-alam",
            color: "border-green-500/50"
        },
        // Add more projects here
    ];

    return (
        <div className="h-full w-full bg-transparent text-elegant-text-secondary font-mono selection:bg-elegant-accent/20 overflow-y-auto">
            <div className="min-h-full flex flex-col">
                <Spotlight onNavigate={handleNavigate} />
                <PageHeader currentPath="projects" onNavigate={handleNavigate} className="shrink-0" maxWidth="max-w-7xl" />

                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="mb-8 text-base font-semibold text-elegant-text-muted flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onExit()}
                            className="hover:text-elegant-text-primary transition-colors hover:underline decoration-elegant-text-muted underline-offset-4"
                        >
                            ~
                        </button>
                        <span>/</span>
                        <span className="text-elegant-text-primary font-bold">projects</span>
                    </nav>

                    <section aria-labelledby="projects-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <FolderGit2 className="text-elegant-text-muted" size={24} aria-hidden="true" />
                            <h1 id="projects-heading" className="text-2xl font-bold text-elegant-text-primary">Featured Projects</h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project, idx) => (
                                <article key={idx} className={`bg-elegant-card border border-elegant-border rounded-sm p-6 flex flex-col h-full hover:border-elegant-text-muted transition-colors group relative overflow-hidden`}>
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-elegant-border group-hover:bg-elegant-accent transition-colors`}></div>

                                    <h2 className="text-lg font-bold text-elegant-text-primary mb-2 flex items-center justify-between">
                                        {project.title}
                                        <a href={project.link} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.title} on GitHub`} className="text-elegant-text-muted hover:text-elegant-text-primary">
                                            <SiGithub size={18} />
                                        </a>
                                    </h2>

                                    <p className="text-sm text-elegant-text-secondary mb-6 flex-grow leading-relaxed">
                                        {project.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {project.tech.map(t => (
                                            <span key={t} className="text-xs px-2 py-1 bg-elegant-bg border border-elegant-border rounded text-elegant-text-muted">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </main>

                <Dock onNavigate={handleNavigate} currentPage="Projects" className="py-3" />
            </div>
        </div>
    );
};
