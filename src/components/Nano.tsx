import React, { useState, useRef, useEffect } from 'react';

interface NanoProps {
    filename: string;
    initialContent: string;
    onSave: (content: string) => void;
    onExit: () => void;
}

export const Nano: React.FC<NanoProps> = ({ filename, initialContent, onSave, onExit }) => {
    const [content, setContent] = useState(initialContent);
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey) {
            if (e.key === 'o') { // Save
                e.preventDefault();
                onSave(content);
                setMessage(`[ Wrote ${content.split('\n').length} lines ]`);
                setTimeout(() => setMessage(''), 2000);
            } else if (e.key === 'x') { // Exit
                e.preventDefault();
                onExit();
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white font-mono text-sm absolute inset-0 z-50">
            {/* Header */}
            <div className="bg-gray-200 text-black px-2 py-1 flex justify-between">
                <span>GNU nano 5.4</span>
                <span>{filename}</span>
                <span></span>
            </div>

            {/* Editor Area */}
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-black text-white p-2 outline-none resize-none border-none font-inherit"
                spellCheck={false}
            />

            {/* Message Area */}
            <div className="px-2 py-1 min-h-[1.5em]">{message}</div>

            {/* Footer / Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-2 py-1 bg-black text-white">
                <div><span className="bg-white text-black px-1">^G</span> Get Help</div>
                <div><span className="bg-white text-black px-1">^O</span> Write Out</div>
                <div><span className="bg-white text-black px-1">^W</span> Where Is</div>
                <div><span className="bg-white text-black px-1">^K</span> Cut Text</div>
                <div><span className="bg-white text-black px-1">^X</span> Exit</div>
                <div><span className="bg-white text-black px-1">^R</span> Read File</div>
                <div><span className="bg-white text-black px-1">^\</span> Replace</div>
                <div><span className="bg-white text-black px-1">^U</span> Uncut Text</div>
            </div>
        </div>
    );
};
