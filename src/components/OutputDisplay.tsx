import React from 'react';
import type { TerminalOutput } from '../hooks/useTerminal';
import { Typewriter } from './Typewriter';

interface OutputDisplayProps {
    history: TerminalOutput[];
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ history }) => {
    return (
        <div className="flex flex-col space-y-2 mb-2">
            {history.map((entry) => (
                <div key={entry.id} className="mb-2">
                    {entry.command && (
                        <div className="flex flex-wrap">
                            <span className="text-[#bd93f9] mr-2">neo@neosphere:{entry.path}$</span>
                            <span className="whitespace-pre-wrap break-all">
                                {(() => {
                                    const parts = entry.command.split(' ');
                                    const cmd = parts[0];
                                    const args = parts.slice(1).join(' ');
                                    return (
                                        <>
                                            <span className="text-[#00ff00]">{cmd}</span>
                                            {args && <span className="text-cyan-400"> {args}</span>}
                                        </>
                                    );
                                })()}
                            </span>
                        </div>
                    )}
                    <div className="whitespace-pre-wrap break-words text-[#e0e0e0]">
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
