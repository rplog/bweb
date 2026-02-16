import React, { useState, useRef, useEffect } from 'react';

interface NanoProps {
    filename?: string;
    initialContent: string;
    onSave: (content: string) => void;
    onSaveAs: (filename: string, content: string) => void;
    onExit: () => void;
}

export const Nano: React.FC<NanoProps> = ({ filename: initialFilename, initialContent, onSave, onSaveAs, onExit }) => {
    const [content, setContent] = useState(initialContent);
    const [filename, setFilename] = useState(initialFilename);
    const [message, setMessage] = useState('');
    const [isPromptingSave, setIsPromptingSave] = useState(false);
    const [savePromptValue, setSavePromptValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const promptInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (textareaRef.current && !isPromptingSave) {
            textareaRef.current.focus();
        }
    }, [isPromptingSave]);

    useEffect(() => {
        if (isPromptingSave && promptInputRef.current) {
            promptInputRef.current.focus();
        }
    }, [isPromptingSave]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isPromptingSave) return; // Handled by prompt input

        if (e.ctrlKey) {
            if (e.key === 'o') { // Save
                e.preventDefault();
                if (filename) {
                    onSave(content);
                    setMessage(`[ Wrote ${content.split('\n').length} lines ]`);
                    setTimeout(() => setMessage(''), 2000);
                } else {
                    setIsPromptingSave(true);
                    setSavePromptValue('');
                    setMessage('File Name to Write: ');
                }
            } else if (e.key === 'x') { // Exit
                e.preventDefault();
                // TODO: specific check for modified buffer?
                onExit();
            }
        }
    };

    const handlePromptKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (savePromptValue.trim()) {
                setFilename(savePromptValue);
                onSaveAs(savePromptValue, content);
                setIsPromptingSave(false);
                setMessage(`[ Wrote ${content.split('\n').length} lines ]`);
                setTimeout(() => setMessage(''), 2000);
            } else {
                setMessage('[ Cancelled ]');
                setIsPromptingSave(false);
                setTimeout(() => setMessage(''), 2000);
            }
        } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
            e.preventDefault();
            setIsPromptingSave(false);
            setMessage('[ Cancelled ]');
            setTimeout(() => setMessage(''), 2000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white font-mono text-sm absolute inset-0 z-50">
            {/* Header */}
            <div className="bg-gray-200 text-black px-2 py-1 flex justify-between">
                <span>GNU nano 5.4</span>
                <span>{filename || 'New Buffer'}</span>
                <span>{isPromptingSave ? 'Modified' : ''}</span>
            </div>

            {/* Editor Area */}
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-black text-white p-2 outline-none resize-none border-none font-inherit"
                spellCheck={false}
                disabled={isPromptingSave}
            />

            {/* Message / Prompt Area */}
            <div className="px-2 py-1 min-h-[1.5em] bg-black text-white flex items-center">
                {isPromptingSave ? (
                    <div className="flex w-full">
                        <span className="whitespace-nowrap mr-2">File Name to Write:</span>
                        <input
                            ref={promptInputRef}
                            type="text"
                            value={savePromptValue}
                            onChange={(e) => setSavePromptValue(e.target.value)}
                            onKeyDown={handlePromptKeyDown}
                            className="bg-gray-800 text-white flex-grow outline-none px-1"
                        />
                    </div>
                ) : (
                    message
                )}
            </div>

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
