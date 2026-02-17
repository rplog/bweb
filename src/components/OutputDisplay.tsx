import React from 'react';
import type { TerminalOutput } from '../hooks/useTerminal';
import { Typewriter } from './Typewriter';

interface OutputDisplayProps {
    history: TerminalOutput[];
    lastItemRef?: React.Ref<HTMLDivElement>;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ history, lastItemRef }) => {
    return (
        <div className="flex flex-col space-y-2 mb-2">
            {history.map((entry, index) => (
                <div
                    key={entry.id}
                    className="mb-2"
                    ref={index === history.length - 1 ? lastItemRef : null}
                >
                    {entry.command && (
                        <div className="flex flex-wrap">
                            <span className="text-elegant-accent mr-2">neo@neosphere:{entry.path}$</span>
                            <span className="whitespace-pre-wrap break-all">
                                {(() => {
                                    const parts = entry.command.split(' ');
                                    const cmd = parts[0];
                                    const args = parts.slice(1).join(' ');
                                    return (
                                        <>
                                            <span className="text-elegant-text-primary">{cmd}</span>
                                            {args && <span className="text-elegant-text-secondary"> {args}</span>}
                                        </>
                                    );
                                })()}
                            </span>
                        </div>
                    )}
                    <div className="whitespace-pre-wrap break-words text-elegant-text-primary">
                        {typeof entry.response === 'string' ? (
                            <Typewriter text={entry.response} speed={10} />
                        ) : (
                            entry.response
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
