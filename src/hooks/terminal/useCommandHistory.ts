import { useState, useCallback } from 'react';
import React from 'react';

export interface TerminalOutput {
    id: string;
    command: string;
    response: string | React.ReactNode;
    path: string;
    user: string;
}

export const useCommandHistory = (user: string, getPromptPath: () => string) => {
    const [history, setHistory] = useState<TerminalOutput[]>([
        {
            id: 'welcome',
            command: '',
            response: 'Welcome to Neosphere v2.0. Type "help" to start. (Tab to autocomplete)',
            path: '~',
            user: 'neo',
        },
    ]);
    const [inputHistory, setInputHistory] = useState<string[]>([]);

    const addToHistory = useCallback((command: string, response: string | React.ReactNode) => {
        setHistory((prev) => [
            ...prev,
            {
                id: Math.random().toString(36).substring(2, 11),
                command,
                response,
                path: getPromptPath(),
                user: user,
            },
        ]);
    }, [getPromptPath, user]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return {
        history,
        setHistory,
        inputHistory,
        setInputHistory,
        addToHistory,
        clearHistory
    };
};
