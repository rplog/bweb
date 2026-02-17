import { useState, useCallback, useEffect } from 'react';
import { commands } from '../utils/commands';
import { initialFileSystem } from '../utils/fileSystem';
import { resolvePath, resolvePathArray } from '../utils/fileSystemUtils';
import { ROUTES } from '../utils/routes';
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
    const [initialized, setInitialized] = useState(false);
    const [notesPreloaded, setNotesPreloaded] = useState(false);

    // Background preload: fetch last 100 notes and populate fileSystem
    useEffect(() => {
        if (notesPreloaded) return;
        fetch('/api/notes')
            .then(res => res.ok ? res.json() : Promise.reject())
            .then((notes: any[]) => {
                setFileSystem(prev => {
                    const updated = JSON.parse(JSON.stringify(prev));
                    const visitorsDir = updated.home?.children?.neo?.children?.visitors_notes;
                    if (visitorsDir) {
                        const children: { [key: string]: any } = {};
                        notes.forEach((note: any) => {
                            children[note.filename] = {
                                type: 'file',
                                content: '',
                                size: note.size || 0,
                                lastModified: note.updated_at,
                                author: note.author
                            };
                        });
                        visitorsDir.children = children;
                    }
                    return updated;
                });
                setNotesPreloaded(true);
            })
            .catch(() => { /* silently fail, ls will still work via API fallback */ });
    }, [notesPreloaded]);

    const [user, setUser] = useState('neo');

    // Check login status on mount
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) setUser('root');
    }, []);

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

    // Wrapper to update URL when setting full screen
    const setFullScreenWithRoute = useCallback((component: React.ReactNode | null, path?: string) => {
        setActiveComponent(component);
        if (path) {
            if (window.location.pathname !== path) {
                window.history.pushState({}, '', path);
            }
        } else if (component === null) {
            if (window.location.pathname !== '/') {
                window.history.pushState({}, '', '/');
            }
        }
    }, []);

    const execute = async (commandStr: string, isInitialLoad = false) => {
        const trimmed = commandStr.trim();
        if (!trimmed) {
            if (!isInitialLoad) addToHistory(trimmed, '');
            return;
        }

        // Add to input history only if user typed it
        if (!isInitialLoad) {
            setInputHistory((prev) => [...prev, trimmed]);
        }

        const [cmdName, ...args] = trimmed.split(' ');

        if (cmdName === 'clear') {
            clearHistory();
            return;
        }

        if (cmdName === 'cd') {
            // Handle CD locally
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
                    setFullScreen: setFullScreenWithRoute,
                    setIsInputVisible,
                    fileSystem,
                    setFileSystem,
                    user,
                    setUser
                };
                const result = await cmd.execute(args, context);

                // If the command returned active component (via context), we might not want to show output?
                // But for "about", "gallery", etc, they return string '' or null usually.
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

    // Handle initial routing and popstate
    useEffect(() => {
        if (!initialized) {
            const path = window.location.pathname;
            const command = ROUTES[path];
            if (command) {
                execute(command, true);
            } else if (path.startsWith('/gallery')) {
                execute('gallery', true);
            }
            // Auto-cd if ?dir= query parameter is present
            const params = new URLSearchParams(window.location.search);
            const dir = params.get('dir');
            if (dir) {
                execute(`cd ${dir}`, true);
                // Clean the URL
                window.history.replaceState({}, '', '/');
            }
            setInitialized(true);
        }

        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/') {
                setActiveComponent(null);
            } else {
                const command = ROUTES[path];
                if (command) {
                    // We just re-execute to open the modal
                    // Pass true to avoid polluting history? Or false to show "user navigated"?
                    // Let's pass true to keep it clean on back button
                    execute(command, true);
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [initialized, execute]); // dependencies should be stable

    const handleTabCompletion = (input: string): string => {
        if (!input) return '';
        const [cmd, ...args] = input.split(' ');

        if (args.length === 0 && !input.endsWith(' ')) {
            const matches = Object.keys(commands).filter(c => c.startsWith(cmd));
            if (matches.length === 1) return matches[0] + ' ';
            return input;
        }

        if (['cd', 'cat', 'ls', 'nano'].includes(cmd)) {
            const partialName = args[args.length - 1] || '';
            const node = resolvePath(fileSystem, currentPath, '.');

            if (node && node.type === 'directory' && node.children) {
                const candidates = Object.keys(node.children);
                const matches = candidates.filter(c => c.startsWith(partialName));

                if (matches.length === 1) {
                    const completed = matches[0];
                    const newArgs = [...args];
                    newArgs[newArgs.length - 1] = completed;
                    return `${cmd} ${newArgs.join(' ')}`;
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
        execute: (cmd: string) => execute(cmd), // Simple wrapper
        clearHistory,
        activeComponent,
        isInputVisible,
        handleTabCompletion,
        fileSystem,
        setFileSystem,
        user
    };
};
