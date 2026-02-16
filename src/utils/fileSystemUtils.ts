import type { FileSystemNode } from './fileSystem';

export const resolvePath = (
    fileSystem: Record<string, FileSystemNode>,
    currentPath: string[],
    targetPath: string
): FileSystemNode | null => {
    // Basic normalization
    if (targetPath === '~') targetPath = '/home/neo';
    if (targetPath.startsWith('~/')) targetPath = '/home/neo' + targetPath.substring(1);

    let parts: string[] = [];
    if (targetPath.startsWith('/')) {
        parts = targetPath.split('/').filter(Boolean);
    } else {
        parts = [...currentPath, ...targetPath.split('/')].filter(Boolean);
    }

    // Resolve .. and .
    const resolvedParts: string[] = [];
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            resolvedParts.pop();
        } else {
            resolvedParts.push(part);
        }
    }

    // Traverse
    let current: FileSystemNode = { type: 'directory', children: fileSystem };

    for (const part of resolvedParts) {
        if (current.type !== 'directory' || !current.children) return null;
        current = current.children[part];
        if (!current) return null;
    }

    return current;
};

export const resolvePathArray = (
    currentPath: string[],
    targetPath: string
): string[] => {
    // Basic normalization
    if (targetPath === '~') return ['home', 'neo'];
    if (targetPath.startsWith('~/')) {
        const remaining = targetPath.substring(2);
        return ['home', 'neo', ...remaining.split('/').filter(Boolean)];
    }

    let parts: string[] = [];
    if (targetPath.startsWith('/')) {
        parts = targetPath.split('/').filter(Boolean);
    } else {
        parts = [...currentPath, ...targetPath.split('/')].filter(Boolean);
    }

    // Resolve .. and .
    const resolvedParts: string[] = [];
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            resolvedParts.pop();
        } else {
            resolvedParts.push(part);
        }
    }

    return resolvedParts;
};

export const writeFile = (
    fileSystem: Record<string, FileSystemNode>,
    currentPath: string[],
    filename: string,
    content: string
): Record<string, FileSystemNode> => {
    // Deep clone to avoid mutation
    const fs = JSON.parse(JSON.stringify(fileSystem));

    // Resolve location (parent dir)
    // For now we only support writing to current directory or simplistic filenames
    // Full path support for writing would require more logic

    let current: FileSystemNode = { type: 'directory', children: fs };
    for (const part of currentPath) {
        if (!current.children) break; // Should not happen if path is valid
        current = current.children[part];
    }

    if (current && current.type === 'directory' && current.children) {
        current.children[filename] = {
            type: 'file',
            content
        };
    }

    return fs;
};

export const getDirectoryContents = (node: FileSystemNode): string[] => {
    if (node.type !== 'directory' || !node.children) return [];
    return Object.keys(node.children);
};
