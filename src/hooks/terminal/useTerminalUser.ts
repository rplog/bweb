import { useState, useEffect } from 'react';

export const useTerminalUser = () => {
    const [user, setUser] = useState('neo');

    // Check login status on mount
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) setTimeout(() => setUser('root'), 0);
    }, []);

    return {
        user,
        setUser
    };
};
