import { useState, useCallback, useEffect } from 'react';
import { initialFileSystem, type FileSystemNode, type FileSystem } from '../../utils/fileSystem';

export const useFileSystem = () => {
    const [fileSystem, setFileSystem] = useState<FileSystem>(initialFileSystem);
    const [currentPath, setCurrentPath] = useState<string[]>(['home', 'neo']);
    const [notesPreloaded, setNotesPreloaded] = useState(false);

    // Background preload: fetch last 100 notes and populate fileSystem
    useEffect(() => {
        if (notesPreloaded) return;
        fetch('/api/notes')
            .then(res => res.ok ? res.json() : Promise.reject())
            .then((notes: { filename: string; size?: number; updated_at?: number; author?: string }[]) => {
                setFileSystem((prev: FileSystem) => {
                    const updated = structuredClone(prev);
                    // Safely navigate to visitors_notes or fallback
                    const home = updated.home?.children;
                    const neo = home?.neo?.children;
                    const visitorsDir = neo?.visitors_notes;

                    if (visitorsDir) {
                        const children: Record<string, FileSystemNode> = {};
                        notes.forEach((note) => {
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

    const getPromptPath = useCallback(() => {
        const pathStr = '/' + currentPath.join('/');
        if (pathStr === '/home/neo') return '~';
        if (pathStr.startsWith('/home/neo/')) {
            return '~' + pathStr.substring('/home/neo'.length);
        }
        return pathStr;
    }, [currentPath]);

    return {
        fileSystem,
        setFileSystem,
        currentPath,
        setCurrentPath,
        getPromptPath
    };
};
