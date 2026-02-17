import React, { useState, useRef, useEffect } from 'react';

interface NanoProps {
    filename?: string;
    initialContent: string;
    onSave: (content: string) => Promise<void> | void;
    onSaveAs: (filename: string, content: string, commitMsg?: string) => Promise<void> | void;
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

    const handleSave = async () => {
        if (filename) {
            try {
                await onSave(content);
                setMessage(`[ Wrote ${content.split('\n').length} lines ]`);
            } catch (e: any) {
                setMessage(`[ Error: ${e.message} ]`);
            }
            setTimeout(() => setMessage(''), 2000);
        } else {
            setIsPromptingSave(true);
            setSavePromptValue('');
            setMessage('File Name to Write: ');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isPromptingSave) return; // Handled by prompt input

        if (e.ctrlKey) {
            if (e.key === 'o') { // Save
                e.preventDefault();
                handleSave();
            } else if (e.key === 'x') { // Exit
                e.preventDefault();
                // TODO: specific check for modified buffer?
                onExit();
            }
        }
    };

    const handlePromptKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (message.startsWith('File Name to Write:')) {
                if (savePromptValue.trim()) {
                    setFilename(savePromptValue);
                    setMessage('Commit Message (Optional): ');
                    setSavePromptValue(''); // Clear for commit msg
                } else {
                    setMessage('[ Cancelled ]');
                    setIsPromptingSave(false);
                    setTimeout(() => setMessage(''), 2000);
                }
            } else if (message.startsWith('Commit Message (Optional):')) {
                const commitMsg = savePromptValue.trim();
                try {
                    // We need to pass commitMsg to onSaveAs. 
                    // Since onSaveAs signature is fixed in props, we might need to cast or update the prop type.
                    // For now, let's assume onSaveAs handles it or we pass it as a 3rd arg if we update the interface.
                    // Wait, onSaveAs is defined in commands.tsx. We need to update that too.
                    // Let's pass it as part of content? No. 
                    // We should update the onSaveAs prop signature in NanoProps.
                    await onSaveAs(filename!, content, commitMsg);
                    setIsPromptingSave(false);
                    setMessage(`[ Wrote ${content.split('\n').length} lines ]`);
                } catch (e: any) {
                    setMessage(`[ Error: ${e.message} ]`);
                }
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
        <div className="flex flex-col h-full bg-elegant-bg text-elegant-text-primary font-mono text-sm absolute inset-0 z-50">
            {/* Header */}
            <div className="bg-elegant-accent text-elegant-bg px-2 py-1 relative flex items-center justify-center font-bold">
                <span className="absolute left-2">GNU nano 5.4</span>
                <span>{filename || 'New Buffer'}</span>
                <span className="absolute right-2">{isPromptingSave ? 'Modified' : ''}</span>
            </div>

            {/* Editor Area */}
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-elegant-bg text-elegant-text-primary p-2 outline-none resize-none border-none font-inherit"
                spellCheck={false}
                disabled={isPromptingSave}
            />

            {/* Message / Prompt Area */}
            <div className="px-2 py-1 min-h-[1.5em] bg-elegant-bg text-elegant-text-primary flex items-center">
                {isPromptingSave ? (
                    <div className="flex w-full">
                        <span className="whitespace-nowrap mr-2">{message}</span>
                        <input
                            ref={promptInputRef}
                            type="text"
                            value={savePromptValue}
                            onChange={(e) => setSavePromptValue(e.target.value)}
                            onKeyDown={handlePromptKeyDown}
                            className="bg-elegant-card text-elegant-text-primary flex-grow outline-none px-1"
                        />
                    </div>
                ) : (
                    message
                )}
            </div>

            {/* Footer / Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-2 py-1 bg-elegant-bg text-elegant-text-primary select-none">
                <button className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1">
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^G</span> Get Help
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); handleSave(); }}
                    className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1"
                >
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^O</span> Write Out
                </button>
                <button className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1">
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^W</span> Where Is
                </button>
                <button className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1">
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^K</span> Cut Text
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); onExit(); }}
                    className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1"
                >
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^X</span> Exit
                </button>
                <button className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1">
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^R</span> Read File
                </button>
                <button className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1">
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^\</span> Replace
                </button>
                <button className="text-left hover:bg-elegant-card transition-colors cursor-pointer rounded px-1">
                    <span className="bg-elegant-accent text-elegant-bg px-1 font-bold mr-1">^U</span> Uncut Text
                </button>
            </div>
        </div>
    );
};
