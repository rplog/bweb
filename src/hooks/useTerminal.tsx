import { useCallback, useEffect, useRef } from 'react';
import { commands } from '../utils/commands';
import { resolvePath, resolvePathArray } from '../utils/fileSystemUtils';
import { createNavigator } from '../utils/navigation';
import { useCommandHistory, type TerminalOutput } from './terminal/useCommandHistory';
import { useFileSystem } from './terminal/useFileSystem';
import { useTerminalUser } from './terminal/useTerminalUser';
import { useRouting } from './terminal/useRouting';

// Import pages for direct routing
import { Gallery } from '../components/pages/Gallery';
import { About } from '../components/pages/About';
import { Contact } from '../components/pages/Contact';
import { Projects } from '../components/pages/Projects';
import { Notes } from '../components/pages/Notes';

export type { TerminalOutput };

export const useTerminal = () => {
    const { user, setUser } = useTerminalUser();
    const { fileSystem, setFileSystem, currentPath, setCurrentPath, getPromptPath } = useFileSystem();
    const { history, addToHistory, clearHistory, inputHistory, setInputHistory } = useCommandHistory(user, getPromptPath);
    const { activeComponent, activeComponentRef, isInputVisible, setIsInputVisible, setFullScreenWithRoute, setActiveComponent } = useRouting();

    const initializedRef = useRef(false);
    const executeRef = useRef<(commandStr: string, isInitialLoad?: boolean) => Promise<void>>(async () => { });

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

    // Keep executeRef current so the popstate handler never captures a stale closure
    useEffect(() => {
        executeRef.current = execute;
    });

    // Handle initial routing - runs once on mount
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const path = window.location.pathname;
        const navigate = createNavigator(setFullScreenWithRoute);

        // Direct routing for initial load
        if (path === '/gallery' || path.startsWith('/gallery/')) {
            setFullScreenWithRoute(<Gallery onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
        } else if (path === '/about') {
            setFullScreenWithRoute(<About onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
        } else if (path === '/contact') {
            setFullScreenWithRoute(<Contact onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
        } else if (path === '/projects') {
            setFullScreenWithRoute(<Projects onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
        } else if (path === '/notes') {
            setFullScreenWithRoute(<Notes onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
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
            executeRef.current(`cd ${dir}`, true);
            window.history.replaceState({}, '', '/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Popstate handler - registered once
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            const navigate = createNavigator(setFullScreenWithRoute);

            if (path === '/') {
                setActiveComponent(null);
                activeComponentRef.current = null;
            } else if (path === '/gallery' || path.startsWith('/gallery/')) {
                // For gallery, only mount if not already active to avoid resetting state during internal navigation
                // BUT if we are coming from another page, we MUST mount it.
                if (!activeComponentRef.current || !activeComponentRef.current.toString().includes('Gallery')) {
                    // Note: checking toString() on component is flaky, but checking path through useRouting context/state would be better
                    // However, simplify: Just remount. React reconciliation should handle it if it's the same type?
                    // Actually, Gallery handles its own internal routing. We just ensure Gallery is mounted.
                    // The safe bet is: if we are at /gallery path, ensure Gallery component is the active one.
                    setFullScreenWithRoute(<Gallery onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
                }
            } else if (path === '/about') {
                setFullScreenWithRoute(<About onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
            } else if (path === '/contact') {
                setFullScreenWithRoute(<Contact onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
            } else if (path === '/projects') {
                setFullScreenWithRoute(<Projects onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
            } else if (path === '/notes') {
                setFullScreenWithRoute(<Notes onExit={() => setFullScreenWithRoute(null)} onNavigate={navigate} />, path);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [setActiveComponent, activeComponentRef, setFullScreenWithRoute]);

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
