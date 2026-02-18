import { useCallback, useEffect, useState } from 'react';
import { commands } from '../utils/commands';
import { resolvePath, resolvePathArray } from '../utils/fileSystemUtils';
import { ROUTES } from '../utils/routes';
import { useCommandHistory, type TerminalOutput } from './terminal/useCommandHistory';
import { useFileSystem } from './terminal/useFileSystem';
import { useTerminalUser } from './terminal/useTerminalUser';
import { useRouting } from './terminal/useRouting';

export type { TerminalOutput };

export const useTerminal = () => {
    const { user, setUser } = useTerminalUser();
    const { fileSystem, setFileSystem, currentPath, setCurrentPath, getPromptPath } = useFileSystem();
    const { history, addToHistory, clearHistory, inputHistory, setInputHistory } = useCommandHistory(user, getPromptPath);
    const { activeComponent, activeComponentRef, isInputVisible, setIsInputVisible, setFullScreenWithRoute, setActiveComponent } = useRouting();

    const [initialized, setInitialized] = useState(false);

    const execute = useCallback(async (commandStr: string, isInitialLoad = false) => {
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

                if (result) {
                    // MASK PASSWORD IN HISTORY
                    let historyCommand = trimmed;
                    if (cmdName === 'login' && args.length > 0) {
                        historyCommand = 'login *********';
                    }
                    addToHistory(historyCommand, result);
                }
            } catch (e: unknown) {
                let historyCommand = trimmed;
                if (cmdName === 'login' && args.length > 0) {
                    historyCommand = 'login *********';
                }
                addToHistory(historyCommand, `Error executing ${cmdName}: ${e instanceof Error ? e.message : String(e)}`);
            }
        } else {
            addToHistory(trimmed, `${cmdName}: command not found`);
        }
    }, [addToHistory, clearHistory, currentPath, fileSystem, setFullScreenWithRoute, setInputHistory, setCurrentPath, setFileSystem, user, setUser, setIsInputVisible]);

    // Handle initial routing and popstate
    useEffect(() => {
        if (!initialized) {
            setTimeout(() => {
                const path = window.location.pathname;
                const command = ROUTES[path];
                if (command) {
                    execute(command, true);
                } else if (path.startsWith('/gallery')) {
                    execute('gallery', true);
                } else if (path !== '/' && path !== '/index.html') {
                    addToHistory(`access ${path}`, (
                        <div className="flex flex-col">
                            <span className="text-red-500 font-bold">404 ERROR: ROUTE NOT FOUND</span>
                            <span className="text-elegant-text-primary">The requested path '{path}' does not exist in this sector.</span>
                            <span className="text-elegant-text-secondary italic">Redirecting to safe harbor...</span>
                        </div>
                    ));
                    window.history.replaceState({}, '', '/');
                }
                const params = new URLSearchParams(window.location.search);
                const dir = params.get('dir');
                if (dir) {
                    execute(`cd ${dir}`, true);
                    window.history.replaceState({}, '', '/');
                }
                setInitialized(true);
            }, 0);
        }

        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/') {
                setActiveComponent(null);
                activeComponentRef.current = null;
            } else {
                const command = ROUTES[path];
                if (command) {
                    execute(command, true);
                } else if (path.startsWith('/gallery')) {
                    if (!activeComponentRef.current) {
                        execute('gallery', true);
                    }
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [initialized, execute, setActiveComponent, activeComponentRef, addToHistory]);

    const handleTabCompletion = (input: string): string => {
        if (!input) return '';
        const [cmd, ...args] = input.split(' ');

        if (args.length === 0 && !input.endsWith(' ')) {
            const matches = Object.keys(commands).filter(c => c.startsWith(cmd));
            if (matches.length === 1) return matches[0] + ' ';
            return input;
        }

        if (['cd', 'cat', 'ls', 'nano', 'share', 'rm'].includes(cmd)) {
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
        execute: (cmd: string) => execute(cmd),
        clearHistory,
        activeComponent,
        isInputVisible,
        handleTabCompletion,
        fileSystem,
        setFileSystem,
        user
    };
};
