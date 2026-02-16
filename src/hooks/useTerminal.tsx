import { useState, useCallback } from 'react';
import { commands } from '../utils/commands';
import { initialFileSystem } from '../utils/fileSystem';
import { resolvePath, resolvePathArray } from '../utils/fileSystemUtils';
import React from 'react';

export interface TerminalOutput {
    id: string;
    command: string;
    response: string | React.ReactNode;
    path: string;
}

export type CommandHandler = (args: string[]) => string | React.ReactNode;

export const useTerminal = () => {
    const [history, setHistory] = useState<TerminalOutput[]>([
        {
            id: 'welcome',
            command: '',
            response: 'Welcome to Neosphere v2.0. Type "help" to start. (Tab to autocomplete)',
            path: '~',
        },
    ]);
    const [currentPath, setCurrentPath] = useState<string[]>(['home', 'neo']);
    const [inputHistory, setInputHistory] = useState<string[]>([]);

    const [activeComponent, setActiveComponent] = useState<React.ReactNode | null>(null);
    const [isInputVisible, setIsInputVisible] = useState(true);
    const [fileSystem, setFileSystem] = useState(initialFileSystem);

    const getPromptPath = useCallback(() => {
        const pathStr = '/' + currentPath.join('/');
        if (pathStr === '/home/neo') return '~';
        if (pathStr.startsWith('/home/neo/')) {
            return '~' + pathStr.substring('/home/neo'.length);
        }
        return pathStr;
    }, [currentPath]);

    const addToHistory = useCallback((command: string, response: string | React.ReactNode) => {
        setHistory((prev) => [
            ...prev,
            {
                id: Math.random().toString(36).substr(2, 9),
                command,
                response,
                path: getPromptPath(),
            },
        ]);
    }, [getPromptPath]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const execute = async (commandStr: string) => {
        const trimmed = commandStr.trim();
        if (!trimmed) {
            addToHistory(trimmed, '');
            return;
        }

        // Add to input history
        setInputHistory((prev) => [...prev, trimmed]);

        const [cmdName, ...args] = trimmed.split(' ');

        if (cmdName === 'clear') {
            clearHistory();
            return;
        }

        if (cmdName === 'cd') {
            // Handle CD locally for now as it needs state access
            // TODO: Move to commands.ts with context if it gets complex
            if (args.length === 0) {
                setCurrentPath(['home', 'neo']);
                addToHistory(trimmed, '');
            } else {
                const dest = args[0];
                const node = resolvePath(fileSystem, currentPath, dest);

                if (!node) {
                    addToHistory(trimmed, `cd: no such file or directory: ${dest}`);
                } else if (node.type !== 'directory') {
                    addToHistory(trimmed, `cd: not a directory: ${dest}`);
                } else {
                    const newPath = resolvePathArray(currentPath, dest);
                    setCurrentPath(newPath);
                    addToHistory(trimmed, '');
                }
            }
            return;
        }

        const cmd = commands[cmdName];
        if (cmd) {
            try {
                const context = {
                    currentPath,
                    setFullScreen: setActiveComponent,
                    setIsInputVisible,
                    fileSystem,
                    setFileSystem
                };
                const result = await cmd.execute(args, context);
                // If the command set a fullscreen component, we don't add to history yet (or we add empty)
                // Actually if it returns null/undefined we might skip?
                // For now, if result is provided, we show it.
                if (result) {
                    addToHistory(trimmed, result);
                }
            } catch (e) {
                addToHistory(trimmed, `Error executing ${cmdName}: ${e}`);
            }
        } else {
            addToHistory(trimmed, `${cmdName}: command not found`);
        }
    };

    const handleTabCompletion = (input: string): string => {
        if (!input) return '';

        const [cmd, ...args] = input.split(' ');

        // Command completion
        if (args.length === 0 && !input.endsWith(' ')) {
            const matches = Object.keys(commands).filter(c => c.startsWith(cmd));
            if (matches.length === 1) return matches[0] + ' ';
            return input;
        }

        // File/Directory completion
        if (['cd', 'cat', 'ls', 'nano'].includes(cmd)) {
            const partialName = args[args.length - 1] || '';
            const node = resolvePath(fileSystem, currentPath, '.');

            if (node && node.type === 'directory' && node.children) {
                const candidates = Object.keys(node.children);
                const matches = candidates.filter(c => c.startsWith(partialName));

                if (matches.length === 1) {
                    const completed = matches[0];
                    // Reconstruct input
                    const newArgs = [...args];
                    newArgs[newArgs.length - 1] = completed;
                    return `${cmd} ${newArgs.join(' ')}`;
                    // Note: Could add trailing slash for dirs if we check type
                }
            }
        }

        return input;
    };

    return {
        history,
        currentPath,
        inputHistory,
        setInputHistory,
        addToHistory,
        setCurrentPath,
        getPromptPath,
        execute,
        clearHistory,
        activeComponent,
        isInputVisible,
        handleTabCompletion, // Exported
        fileSystem,
        setFileSystem
    };
};
