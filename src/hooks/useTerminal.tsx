import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { commands } from '../utils/commands';
import { resolvePath, resolvePathArray } from '../utils/fileSystemUtils';
import { useCommandHistory, type TerminalOutput } from './terminal/useCommandHistory';
import { useFileSystem } from './terminal/useFileSystem';
import { useTerminalUser } from './terminal/useTerminalUser';
import { useNavigate } from 'react-router';

// Component imports removed since routing is handled by React Router

export type { TerminalOutput };

export const useTerminal = () => {
    const { user, setUser } = useTerminalUser();
    const { fileSystem, setFileSystem, currentPath, setCurrentPath, getPromptPath } = useFileSystem();
    const { history, addToHistory, clearHistory, inputHistory, setInputHistory } = useCommandHistory(user, getPromptPath);
    
    const [activeComponent, setActiveComponent] = useState<React.ReactNode | null>(null);
    const [isInputVisible, setIsInputVisible] = useState(true);

    const navigate = useNavigate();
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
                    navigate,
                    setFullScreen: setActiveComponent,
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
    }, [addToHistory, clearHistory, currentPath, fileSystem, navigate, setActiveComponent, setInputHistory, setCurrentPath, setFileSystem, user, setUser, setIsInputVisible]);

    // Keep executeRef current so the popstate handler never captures a stale closure
    useEffect(() => {
        executeRef.current = execute;
    });

    // Handle initial routing - runs once on mount
    useLayoutEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const dir = params.get('dir');
        if (dir) {
            executeRef.current(`cd ${dir}`, true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

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
        setIsInputVisible,
        setActiveComponent,
        handleTabCompletion,
        fileSystem,
        setFileSystem,
        user
    };
};
