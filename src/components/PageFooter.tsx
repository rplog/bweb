import React from 'react';

interface PageFooterProps {
    className?: string;
}

export const PageFooter = ({ className = "" }: PageFooterProps) => {
    return (
        <footer className={`border-t border-elegant-border bg-elegant-bg py-2 mt-auto shrink-0 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-sm font-bold text-elegant-text-muted text-center font-mono">
                    &copy; Neosphere v2.0
                </p>
            </div>
        </footer>
    );
};
