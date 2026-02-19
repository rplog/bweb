import { resolvePath, getDirectoryContents, writeFile, isVisitorsNotesDir } from './fileSystemUtils';
import type { FileSystemNode } from './fileSystem';
import { Htop } from '../components/Htop';
import { Ping } from '../components/Ping';
import { Nano } from '../components/Nano';

import { createNavigator } from './navigation';
import React from 'react';

export interface CommandContext {
    currentPath: string[];
    fileSystem: Record<string, FileSystemNode>;
    user: string;
    setUser?: (user: string) => void;
    setFileSystem?: (updater: ((prev: Record<string, FileSystemNode>) => Record<string, FileSystemNode>) | Record<string, FileSystemNode>) => void;
    setFullScreenWithRoute?: (component: React.ReactNode, route: string) => void;
    setFullScreen?: (component: React.ReactNode | null) => void;
    setIsInputVisible: (visible: boolean) => void;
    addToHistory?: (command: string, output: string | React.ReactNode) => void;
}

export interface Command {
    description: string;
    usage?: string;
    execute: (args: string[], context: CommandContext) => string | React.ReactNode | Promise<string | React.ReactNode>;
}

// Helper component for inbox message item
interface InboxMessage {
    id: number;
    name: string;
    email: string;
    message: string;
    timestamp: string;
}

// eslint-disable-next-line react-refresh/only-export-components
const InboxMessageItem = ({ msg }: { msg: InboxMessage }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(msg.id.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white/5 p-3 rounded border border-white/10 group relative hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className="text-elegant-text-primary font-bold">{msg.name}</span>
                    <span className="text-elegant-text-muted text-xs">{msg.email}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-elegant-text-muted text-xs">{new Date(msg.timestamp).toLocaleString()}</span>
                    <button
                        onClick={handleCopyId}
                        className={`text-xs transition-all duration-200 flex items-center gap-1 ${copied ? 'text-green-400 opacity-100' : 'text-elegant-text-muted opacity-0 group-hover:opacity-100 hover:text-elegant-accent'}`}
                        title="Click to copy ID"
                    >
                        {copied ? 'Copied!' : `ID: ${msg.id}`}
                    </button>
                </div>
            </div>
            <div className="text-elegant-text-secondary whitespace-pre-wrap">{msg.message}</div>
        </div>
    );
};

export const commands: Record<string, Command> = {
    help: {
        description: 'List all available commands',
        execute: () => {
            const hiddenCommands = ['login', 'inbox', 'alerts', 'admin', 'logout', 'rm'];
            const commandList = Object.keys(commands)
                .filter(cmd => !hiddenCommands.includes(cmd))
                .join(', ');
            return (
                <div>
                    <div>Available commands: {commandList}</div>
                    <div className="text-elegant-text-muted text-xs mt-1">Type 'admin' for administrative tools.</div>
                </div>
            );
        },
    },
    admin: {
        description: 'Administrative tools and help',
        execute: (args) => {
            const token = localStorage.getItem('admin_token');
            const isLoggedIn = !!token;

            if (args[0] === '-h' || args[0] === '--help') {
                return (
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="text-elegant-accent font-bold">Admin Tools</div>
                        <div className="grid grid-cols-[100px_1fr] gap-x-2">
                            <span className="text-elegant-text-primary">login</span><span>Authenticate as admin</span>
                            <span className="text-elegant-text-primary">inbox</span><span>View/Manage messages (Requires Login)</span>
                            <span className="text-elegant-text-primary">alerts</span><span>Configure notifications (Requires Login)</span>
                        </div>
                    </div>
                );
            }

            if (!isLoggedIn) {
                return (
                    <div className="text-elegant-text-secondary">
                        Admin tools require authentication.
                        <br />
                        Usage: <span className="text-elegant-text-primary">login &lt;password&gt;</span>
                    </div>
                );
            }

            return (
                <div className="flex flex-col gap-2 text-sm">
                    <div className="text-elegant-accent font-bold">Authenticated (Admin)</div>
                    <div>You have access to the following tools:</div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 mt-1">
                        <span className="text-elegant-text-primary font-bold">inbox</span>
                        <span className="text-elegant-text-muted">View, filter, and delete messages.</span>

                        <span className="text-elegant-text-primary font-bold">alerts</span>
                        <span className="text-elegant-text-muted">Configure notification channels.</span>

                        <span className="text-elegant-text-primary font-bold">rm</span>
                        <span className="text-elegant-text-muted">Remove a visitor note.</span>

                        <span className="text-elegant-text-primary font-bold">logout</span>
                        <span className="text-elegant-text-muted">End admin session.</span>
                    </div>
                    <div className="mt-2 text-elegant-text-muted text-xs">
                        Type <span className="text-elegant-text-primary">inbox -h</span> or <span className="text-elegant-text-primary">alerts -h</span> for details.
                    </div>
                </div>
            );
        }
    },
    login: {
        description: 'Login as admin',
        usage: 'login [password]',
        execute: async (args, { user, setUser }) => {
            if (user === 'root') return 'Already logged in as root.';
            if (args.length === 0) return 'Usage: login <password>';
            const password = args[0];

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (!res.ok) {
                    const data = await res.json();
                    return `Error: ${data.error || 'Login failed'}`;
                }

                const data = await res.json();
                localStorage.setItem('admin_token', data.token);
                if (setUser) setUser('root');
                return 'Logged in successfully as root.';
            } catch (e: unknown) {
                return `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
            }
        }
    },
    logout: {
        description: 'Logout from admin session',
        execute: (_args, { user, setUser }) => {
            const token = localStorage.getItem('admin_token');
            if (!token && user !== 'root') {
                 return 'Error: You are not logged in.';
            }
            localStorage.removeItem('admin_token');
            if (setUser) setUser('neo');
            return 'Logged out successfully.';
        }
    },
    inbox: {
        description: 'View contact messages',
        execute: async (args, { user }) => {
            if (user !== 'root') return 'Error: You must be logged in. Use "login <password>" first.';
            const token = localStorage.getItem('admin_token');
            // ... rest of the code is same as before but now we rely on user state + token for visual feedback
            // actually we should still check token existence to be safe.
            if (!token) return 'Error: You must be logged in. Use "login <password>" first.';

            const arg = args[0]?.toLowerCase();

            // Help
            if (arg === '-h' || arg === '--help' || arg === 'help') {
                return (
                    <div className="flex flex-col gap-2 text-sm max-w-lg">
                        <div className="text-elegant-accent font-bold mb-1">Inbox Management</div>
                        <div className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-1">
                            <span className="text-elegant-text-primary font-bold">inbox</span>
                            <span className="text-elegant-text-muted">View all messages (latest 100)</span>

                            <span className="text-elegant-text-primary font-bold">inbox day</span>
                            <span className="text-elegant-text-muted">View messages from last 24h</span>

                            <span className="text-elegant-text-primary font-bold">inbox week</span>
                            <span className="text-elegant-text-muted">View messages from last 7 days</span>

                            <span className="text-elegant-text-primary font-bold">inbox month</span>
                            <span className="text-elegant-text-muted">View messages from last 30 days</span>

                            <span className="text-elegant-text-primary font-bold">inbox [date]</span>
                            <span className="text-elegant-text-muted">View messages from YYYY-MM-DD</span>

                            <span className="text-elegant-text-primary font-bold">inbox delete [id]</span>
                            <span className="text-elegant-text-muted">Delete a specific message by ID</span>
                        </div>
                    </div>
                );
            }

            // Delete
            if (arg === 'delete') {
                const id = args[1];
                if (!id) return 'Usage: inbox delete <id>';

                try {
                    const res = await fetch(`/api/contact/inbox?id=${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('Failed to delete message');
                    return `Message ${id} deleted successfully.`;
                } catch (e: unknown) {
                    return `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
                }
            }

            // Fetch
            let query = '';
            if (['day', 'week', 'month', 'year'].includes(arg)) {
                query = `?period=${arg}`;
            } else if (arg && arg.match(/^\d{4}-\d{2}-\d{2}$/)) {
                query = `?date=${arg}`;
            }

            try {
                const res = await fetch(`/api/contact/inbox${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    return 'Error: Session expired or unauthorized. Please login again.';
                }

                if (!res.ok) throw new Error('Failed to fetch inbox');

                const messages = await res.json();

                if (messages.length === 0) return 'Inbox is empty.';

                return (
                    <div className="flex flex-col gap-4 font-mono text-sm">
                        <div className="text-elegant-accent font-bold mb-2">Inbox ({messages.length})</div>
                        {messages.map((msg: InboxMessage) => (
                            <InboxMessageItem key={msg.id} msg={msg} />
                        ))}
                    </div>
                );
            } catch (e: unknown) {
                return `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
            }
        }
    },
    alerts: {
        description: 'Configure notification channels (Admin only)',
        usage: 'alerts [telegram|email|both|off]',
        execute: async (args, { user }) => {
            if (user !== 'root') return 'Error: You must be logged in. Use "login <password>" first.';
            const mode = args[0]?.toLowerCase();

            if (mode === '-h' || mode === '--help' || mode === 'help') {
                return (
                    <div className="flex flex-col gap-2 text-sm max-w-lg">
                        <div className="text-elegant-accent font-bold text-base mb-1">Alerts Configuration</div>
                        <div className="text-elegant-text-secondary mb-2">
                            Manage which channels receive notifications when a user submits the contact form.
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="text-elegant-text-primary font-bold border-b border-white/10 pb-1 mb-1">Available Modes</div>
                            <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-1">
                                <span className="text-elegant-accent font-mono">telegram</span>
                                <span className="text-elegant-text-muted">Send notifications via Telegram Bot only.</span>

                                <span className="text-elegant-accent font-mono">email</span>
                                <span className="text-elegant-text-muted">Send emails via SMTP only.</span>

                                <span className="text-elegant-accent font-mono">both</span>
                                <span className="text-elegant-text-muted">Send to both Telegram and Email.</span>

                                <span className="text-elegant-accent font-mono">off</span>
                                <span className="text-elegant-text-muted">Disable all notifications (messages still saved).</span>
                            </div>
                        </div>

                        <div className="mt-2 text-xs text-elegant-text-muted">
                            <span className="font-bold">Note:</span> Requires admin login. Changes apply immediately.
                        </div>
                    </div>
                );
            }

            const token = localStorage.getItem('admin_token');
            if (!token) return 'Error: You must be logged in. Use "login <password>" first.';

            const validModes = ['telegram', 'email', 'both', 'off'];

            // GET current setting
            if (!mode) {
                try {
                    const res = await fetch('/api/admin/config', {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error(res.statusText);
                    const config = await res.json();
                    const current = config['notification_channels'] || 'telegram,email';
                    return `Current alerts: ${current.replace(',', ' & ')}`;
                } catch (e: unknown) {
                    return `Error fetching config: ${e instanceof Error ? e.message : 'Unknown error'}`;
                }
            }

            // SET new setting
            if (!validModes.includes(mode)) return `Usage: alerts [telegram|email|both|off]`;

            let value = '';
            if (mode === 'telegram') value = 'telegram';
            if (mode === 'email') value = 'email';
            if (mode === 'both') value = 'telegram,email';
            if (mode === 'off') value = 'none';

            try {
                const res = await fetch('/api/admin/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ key: 'notification_channels', value })
                });

                if (!res.ok) {
                    const data = await res.json();
                    return `Error: ${data.error || 'Failed to update settings'}`;
                }
                return `Alerts updated to: ${mode}`;
            } catch (e: unknown) {
                return `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
            }
        }
    },
    whoami: {
        description: 'Print current user',
        execute: (_args, { user }) => user,
    },
    pwd: {
        description: 'Print working directory',
        execute: (_args, { currentPath }) => '/' + currentPath.join('/'),
    },
    ls: {
        description: 'List directory contents',
        execute: async (args, { currentPath, fileSystem }) => {
            const flags = args.filter(arg => arg.startsWith('-'));
            const targets = args.filter(arg => !arg.startsWith('-'));

            const showHidden = flags.some(f => f.includes('a'));
            const longFormat = flags.some(f => f.includes('l'));
            const humanReadable = flags.some(f => f.includes('h'));

            const targetPath = targets[0] || '.';
            const targetNode = resolvePath(fileSystem, currentPath, targetPath);

            if (!targetNode) {
                return `ls: cannot access '${targetPath}': No such file or directory`;
            }

            if (targetNode.type === 'file') {
                return targetNode.content || '';
            }

            if (targetNode.type === 'directory') {
                const contents = getDirectoryContents(targetNode);
                const filtered = showHidden ? contents : contents.filter(c => !c.startsWith('.'));

                if (longFormat) {
                    return (
                        <div className="flex flex-col font-mono text-sm">
                            {filtered.map(item => {
                                const node = targetNode.children?.[item];
                                const isDir = node?.type === 'directory';
                                const permissions = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                                const author = node?.author || 'neo';
                                const owner = `${author} neo`;

                                let size = node?.size || (node?.content?.length || 0);
                                if (isDir) size = 4096;

                                let sizeStr = size.toString();
                                if (humanReadable) {
                                    if (size < 1024) sizeStr = size + 'B';
                                    else if (size < 1024 * 1024) sizeStr = (size / 1024).toFixed(1) + 'K';
                                    else sizeStr = (size / (1024 * 1024)).toFixed(1) + 'M';
                                }

                                const date = node?.lastModified ? new Date(node.lastModified) : new Date();
                                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false });

                                return (
                                    <div key={item} className="grid grid-cols-[100px_150px_80px_120px_1fr] gap-2 hover:bg-white/5 p-0.5 rounded items-center">
                                        <span className="text-elegant-text-muted">{permissions}</span>
                                        <span className="text-elegant-text-secondary font-bold text-base truncate" title={owner}>{owner}</span>
                                        <span className="text-elegant-text-secondary text-right">{sizeStr}</span>
                                        <span className="text-elegant-text-muted text-right">{dateStr}</span>
                                        <span className={`${isDir ? 'text-elegant-accent font-bold' : 'text-elegant-text-primary'} ml-2`}>
                                            {item}{isDir ? '/' : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                }

                return (
                    <div className="flex flex-wrap gap-4">
                        {filtered.map(item => {
                            const isDir = targetNode.children?.[item]?.type === 'directory';
                            return (
                                <span key={item} className={isDir ? 'text-elegant-accent font-bold' : 'text-elegant-text-primary'}>
                                    {item}{isDir ? '/' : ''}
                                </span>
                            );
                        })}
                    </div>
                );
            }

            return '';
        }
    },
    cat: {
        description: 'Concatenate and print files',
        execute: async (args, { currentPath, fileSystem }) => {
            if (args.length === 0) return 'cat: missing operand';

            const pathParts = args[0].split('/');
            const isInVisitorsNotes = isVisitorsNotesDir(currentPath) || pathParts.includes('visitors_notes');

            if (isInVisitorsNotes) {
                const filename = pathParts[pathParts.length - 1];
                try {
                    const response = await fetch(`/api/notes/${filename}`);
                    if (response.status === 404) return `cat: ${filename}: No such file or directory`;
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch note');
                    }
                    const note = await response.json();
                    return note.content;
                } catch (e: unknown) {
                    return `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
                }
            }

            const targetNode = resolvePath(fileSystem, currentPath, args[0]);

            if (!targetNode) {
                return `cat: ${args[0]}: No such file or directory`;
            }

            if (targetNode.type === 'directory') {
                return `cat: ${args[0]}: Is a directory`;
            }

            return targetNode.content || '';
        }
    },
    share: {
        description: 'share a visitor note via public link',
        usage: 'share <filename>',
        execute: async (args, { currentPath }) => {
            if (!args[0]) return 'share: missing file operand';

            // Check if target is in visitors_notes
            let filename = args[0];
            let isVisitorNote = false;

            if (isVisitorsNotesDir(currentPath)) {
                isVisitorNote = true;
            } else if (filename.includes('visitors_notes/')) {
                isVisitorNote = true;
                filename = filename.split('visitors_notes/')[1];
            }

            if (!isVisitorNote) {
                return 'share: can only share files from visitors_notes directory';
            }

            const url = `${window.location.origin}/shared/notes/${encodeURIComponent(filename)}`;

            return (
                <div className="text-elegant-text-primary">
                    <div className="mb-2">Shareable Link generated:</div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-elegant-accent hover:underline break-all">
                        {url}
                    </a>
                </div>
            );
        }
    },
    rm: {
        description: 'Remove a visitor note (Admin only)',
        usage: 'rm <filename>',
        execute: async (args, { currentPath, user, setFileSystem }) => {
            if (!args[0]) return 'rm: missing file operand';

            if (user !== 'root') {
                return 'rm: permission denied. Admin login required. Use "login <password>" first.';
            }

            const token = localStorage.getItem('admin_token');
            if (!token) {
                return 'rm: permission denied. Admin login required. Use "login <password>" first.';
            }

            let filename = args[0];
            let isVisitorNote = false;

            if (isVisitorsNotesDir(currentPath)) {
                isVisitorNote = true;
            } else if (filename.includes('visitors_notes/')) {
                isVisitorNote = true;
                filename = filename.split('visitors_notes/')[1];
            }

            if (!isVisitorNote) {
                return 'rm: can only remove files from visitors_notes directory';
            }

            try {
                const res = await fetch(`/api/notes/${filename}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    return 'rm: permission denied. Session expired, please login again.';
                }
                if (res.status === 404) {
                    return `rm: cannot remove '${filename}': No such file`;
                }
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to delete');
                }

                // Update local fileSystem to remove the file from ls
                if (setFileSystem) {
                    setFileSystem((prev: Record<string, FileSystemNode>) => {
                        const updated = structuredClone(prev);
                        const visitorsDir = updated.home?.children?.neo?.children?.visitors_notes;
                        if (visitorsDir?.children?.[filename]) {
                            delete visitorsDir.children[filename];
                        }
                        return updated;
                    });
                }

                return `removed '${filename}'`;
            } catch (e: unknown) {
                return `rm: error: ${e instanceof Error ? e.message : 'Unknown error'}`;
            }
        }
    },
    fastfetch: {
        description: 'Display system information (fast)',
        execute: () => {
            const baseDays = 45;
            const baseHours = 10;
            const baseMins = 38;

            const now = new Date();
            const extraMins = now.getMinutes();
            const extraHours = now.getHours() % 12;

            const totalMins = baseMins + extraMins;
            const totalHours = baseHours + extraHours + Math.floor(totalMins / 60);
            const totalDays = baseDays + Math.floor(totalHours / 24);

            const finalMins = totalMins % 60;
            const finalHours = totalHours % 24;

            const uptimeStr = `${totalDays} days, ${finalHours} hours, ${finalMins} mins`;

            const memUsed = 4.2;
            const memTotal = 16.0;
            const memPercent = Math.round((memUsed / memTotal) * 100);

            return (
                <div className="flex gap-6 font-mono text-sm leading-tight">
                    {/* Arch Linux ASCII Art */}
                    <div className="hidden md:block text-elegant-accent whitespace-pre select-none flex-shrink-0 text-xs leading-tight">
                        {`                   -\`
                  .o+\`
                 \`ooo/
                \`+oooo:
               \`+oooooo:
               -+oooooo+:
             \`/:-:++oooo+:
            \`/++++/+++++++:
           \`/++++++++++++++:
          \`/+++ooooooooooooo/\`
         ./ooosssso++osssssso+\`
        .oossssso-\`\`\`\`/ossssss+\`
       -osssssso.      :ssssssso.
      :osssssss/        osssso+++.
     /ossssssss/        +ssssooo/-
   \`/ossssso+/:-        -:/+osssso+-
  \`+sso+:-\`                 \`.-/+oso:
 \`++:.                           \`-/+/
 .\`                                 \`/`}
                    </div>

                    {/* System Information */}
                    <div className="flex flex-col justify-center space-y-0 text-elegant-text-primary flex-1 min-w-0 text-sm">
                        <div className="mb-0.5">
                            <span className="text-elegant-accent font-bold">neo@neosphere</span>
                        </div>
                        <div className="text-elegant-accent mb-1">{'─'.repeat(17)}</div>

                        <div><span className="text-elegant-accent font-bold">OS:</span> <span className="text-elegant-text-secondary">Neosphere OS v2.0 LTS x86_64</span></div>
                        <div><span className="text-elegant-accent font-bold">Host:</span> <span className="text-elegant-text-secondary">Cloudflare Workers (Virtual)</span></div>
                        <div><span className="text-elegant-accent font-bold">Kernel:</span> <span className="text-elegant-text-secondary">6.8.0-matrix-generic</span></div>
                        <div><span className="text-elegant-accent font-bold">Uptime:</span> <span className="text-elegant-text-secondary">{uptimeStr}</span></div>
                        <div><span className="text-elegant-accent font-bold">Packages:</span> <span className="text-elegant-text-secondary">1337 (pacman), 42 (cargo)</span></div>
                        <div><span className="text-elegant-accent font-bold">Shell:</span> <span className="text-elegant-text-secondary">bash 5.2.21</span></div>
                        <div><span className="text-elegant-accent font-bold">Terminal:</span> <span className="text-elegant-text-secondary">/dev/pts/0</span></div>
                        <div><span className="text-elegant-accent font-bold">CPU:</span> <span className="text-elegant-text-secondary">8 x Virtual Core @ 3.40 GHz</span></div>
                        <div><span className="text-elegant-accent font-bold">GPU:</span> <span className="text-elegant-text-secondary">WebGL 2.0 Renderer</span></div>
                        <div><span className="text-elegant-accent font-bold">Memory:</span> <span className="text-elegant-text-secondary">{memUsed.toFixed(2)} GiB / {memTotal.toFixed(2)} GiB ({memPercent}%)</span></div>
                        <div><span className="text-elegant-accent font-bold">Disk (/):</span> <span className="text-elegant-text-secondary">40.11 GiB / 95.82 GiB (42%)</span></div>
                        <div><span className="text-elegant-accent font-bold">Local IP:</span> <span className="text-elegant-text-secondary">10.0.0.100</span></div>
                        <div><span className="text-elegant-accent font-bold">Locale:</span> <span className="text-elegant-text-secondary">en_US.UTF-8</span></div>

                        {/* Color Palette */}
                        <div className="mt-2 flex gap-1">
                            <div className="w-6 h-3 bg-gray-800"></div>
                            <div className="w-6 h-3 bg-red-600"></div>
                            <div className="w-6 h-3 bg-green-600"></div>
                            <div className="w-6 h-3 bg-yellow-600"></div>
                            <div className="w-6 h-3 bg-blue-600"></div>
                            <div className="w-6 h-3 bg-purple-600"></div>
                            <div className="w-6 h-3 bg-cyan-600"></div>
                            <div className="w-6 h-3 bg-gray-400"></div>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-6 h-3 bg-gray-600"></div>
                            <div className="w-6 h-3 bg-red-500"></div>
                            <div className="w-6 h-3 bg-green-500"></div>
                            <div className="w-6 h-3 bg-yellow-400"></div>
                            <div className="w-6 h-3 bg-blue-500"></div>
                            <div className="w-6 h-3 bg-purple-500"></div>
                            <div className="w-6 h-3 bg-cyan-400"></div>
                            <div className="w-6 h-3 bg-white"></div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    neofetch: {
        description: 'Display system information (alias for fastfetch)',
        execute: (_args, context) => {
            return commands.fastfetch.execute([], context);
        }
    },
    htop: {
        description: 'Interactive process viewer (Simulated) - Press "q" to quit',
        execute: (_args, { setFullScreen }) => {
            if (setFullScreen) {
                setFullScreen(<Htop onExit={() => setFullScreen(null)} />);
                return '';
            }
            return 'Error: Fullscreen mode not supported';
        }
    },
    clear: {
        description: 'Clear the terminal output',
        execute: () => '',
    },
    date: {
        description: 'Print current date',
        execute: () => new Date().toString(),
    },
    echo: {
        description: 'Display a line of text',
        execute: (args) => args.join(' '),
    },
    weather: {
        description: 'Get weather for a city',
        usage: 'weather <city>',
        execute: async (args) => {
            if (args.length === 0) return 'Usage: weather <city>';
            const city = args.join(' ');
            try {
                const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);

                if (res.status === 404) return `Error: City '${city}' not found.`;
                if (!res.ok) {
                    const err = await res.json();
                    return `Error: ${err.error || res.statusText}`;
                }

                const data = await res.json();
                const temp = Math.round(data.main.temp);
                const desc = data.weather[0].description;
                const humidity = data.main.humidity;
                const wind = data.wind.speed;
                const country = data.sys.country;
                const name = data.name;

                return (
                    <div className="text-sm">
                        <div className="text-elegant-accent font-bold mb-1">Weather Report: {name}, {country}</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-w-xs text-elegant-text-secondary">
                            <span>Temperature:</span> <span className="text-elegant-text-primary">{temp}°C</span>
                            <span>Condition:</span> <span className="text-elegant-text-primary capitalize">{desc}</span>
                            <span>Humidity:</span> <span className="text-elegant-text-primary">{humidity}%</span>
                            <span>Wind:</span> <span className="text-elegant-text-primary">{wind} m/s</span>
                        </div>
                    </div>
                );
            } catch {
                return `Error fetching weather for ${city}`;
            }
        }
    },
    notes: {
        description: 'View visitor notes',
        execute: (_args, { setFullScreen }) => {
            if (setFullScreen) {
                const navigate = createNavigator(setFullScreen);
                navigate('Notes');
                return '';
            }
            return 'Error: Fullscreen mode not supported';
        }
    },
    ping: {
        description: 'Measure latency to a host',
        usage: 'ping [-c count] <host>',
        execute: (args, { setIsInputVisible }) => {
            if (args.length === 0) return 'Usage: ping [-c count] <host>';

            let host = args[0];
            let count: number | undefined = undefined;

            if (args[0] === '-c') {
                if (args.length < 3) return 'Usage: ping [-c count] <host>';
                count = parseInt(args[1]);
                if (isNaN(count) || count <= 0) return 'ping: invalid count';
                host = args[2];
            }

            setIsInputVisible(false);
            return <Ping host={host} count={count} onComplete={() => setIsInputVisible(true)} />;
        }
    },
    nano: {
        description: 'Nano text editor',
        usage: 'nano <filename>',
        execute: async (args, { setFullScreen, currentPath, fileSystem, setFileSystem }) => {
            const filenameArg = args.length > 0 ? args[0] : undefined;

            const isVisitorNote = (name: string) => {
                return currentPath[currentPath.length - 1] === 'visitors_notes' || name?.includes('visitors_notes/');
            };

            const loadFilename = filenameArg;
            let contentToEdit = '';

            if (loadFilename) {
                if (isVisitorNote(loadFilename)) {
                    const cleanName = loadFilename.includes('visitors_notes/') ? loadFilename.split('visitors_notes/')[1] : loadFilename;
                    if (cleanName) {
                        try {
                            const res = await fetch(`/api/notes/${cleanName}`);
                            if (res.ok) {
                                const data = await res.json();
                                contentToEdit = data.content;
                            }
                        } catch {
                            // Ignore error, assume new file
                        }
                    }
                } else {
                    const node = resolvePath(fileSystem, currentPath, loadFilename);
                    contentToEdit = (node && node.type === 'file') ? (node.content || '') : '';
                }
            }

            if (setFullScreen) {
                setFullScreen(
                    <Nano
                        filename={loadFilename}
                        initialContent={contentToEdit}
                        onSaveAs={async (newFilename, newContent, commitMsg, authorName) => {
                            let targetIsVisitor = false;
                            let cleanName = newFilename;

                            if (currentPath[currentPath.length - 1] === 'visitors_notes') {
                                targetIsVisitor = true;
                            } else if (newFilename.includes('visitors_notes/')) {
                                targetIsVisitor = true;
                                cleanName = newFilename.split('visitors_notes/')[1];
                            }

                            if (targetIsVisitor) {
                                // Check if file exists first to decide between POST (Create) and PUT (Update)
                                const checkRes = await fetch(`/api/notes/${cleanName}`);
                                const exists = checkRes.status === 200;

                                let res;
                                if (exists) {
                                    // File exists, use PUT to update
                                    res = await fetch(`/api/notes/${cleanName}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            content: newContent,
                                            commit_msg: commitMsg,
                                            author_name: authorName
                                        })
                                    });
                                } else {
                                    // File does not exist, use POST to create
                                    res = await fetch('/api/notes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            filename: cleanName,
                                            content: newContent,
                                            commit_msg: commitMsg,
                                            author_name: authorName
                                        })
                                    });
                                }

                                if (!res.ok) {
                                    const err = await res.json();
                                    throw new Error(err.error || res.statusText);
                                }
                                // Update local fileSystem so ls reflects the new/updated note immediately
                                if (setFileSystem) {
                                    setFileSystem((prev: Record<string, FileSystemNode>) => {
                                        const updated = structuredClone(prev);
                                        const visitorsDir = updated.home?.children?.neo?.children?.visitors_notes;
                                        if (visitorsDir && visitorsDir.children) {
                                            visitorsDir.children[cleanName] = {
                                                type: 'file',
                                                content: '',
                                                size: newContent.length,
                                                lastModified: Date.now(),
                                                author: authorName || 'visitor'
                                            };
                                        }
                                        return updated;
                                    });
                                }
                            } else {
                                if (setFileSystem) {
                                    const newFS = writeFile(fileSystem, currentPath, newFilename, newContent);
                                    setFileSystem(newFS);
                                }
                            }
                        }}
                        onExit={() => setFullScreen(null)}
                    />
                );
                return '';
            }
            return 'Error: Fullscreen mode not supported';
        }
    },
    gallery: {
        description: 'Open Gallery',
        execute: (_args, { setFullScreen }) => {
            if (setFullScreen) {
                const navigate = createNavigator(setFullScreen);
                navigate('Gallery');
                return '';
            }
            return 'Fullscreen not supported';
        }
    },
    about: {
        description: 'Open About page',
        execute: (_args, { setFullScreen }) => {
            if (setFullScreen) {
                const navigate = createNavigator(setFullScreen);
                navigate('About');
                return '';
            }
            return 'Fullscreen not supported';
        }
    },
    contact: {
        description: 'Open Contact page',
        execute: (_args, { setFullScreen }) => {
            if (setFullScreen) {
                const navigate = createNavigator(setFullScreen);
                navigate('Contact');
                return '';
            }
            return 'Fullscreen not supported';
        }
    },
    projects: {
        description: 'Open Projects page',
        execute: (_args, { setFullScreen }) => {
            if (setFullScreen) {
                const navigate = createNavigator(setFullScreen);
                navigate('Projects');
                return '';
            }
            return 'Fullscreen not supported';
        }
    },
    grep: {
        description: 'Search for notes by filename pattern',
        usage: 'grep <pattern>',
        execute: async (args) => {
            if (args.length === 0) {
                return 'Usage: grep <pattern>\nSearches all visitor notes by filename.';
            }
            const pattern = args[0];
            try {
                const response = await fetch(`/api/notes?search=${encodeURIComponent(pattern)}`);
                if (!response.ok) {
                    const err = await response.json();
                    return `grep: error fetching notes: ${err.error || response.statusText}`;
                }
                const results = await response.json();
                if (results.length === 0) {
                    return <span className="text-elegant-text-muted">No notes matching "{pattern}"</span>;
                }
                return (
                    <div>
                        <div className="text-elegant-text-muted mb-2">
                            Found {results.length} note{results.length !== 1 ? 's' : ''} matching "{pattern}":
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {results.map((note: { filename: string; updated_at: number }) => (
                                <div key={note.filename} className="flex justify-between">
                                    <span className="text-elegant-text-primary">{note.filename}</span>
                                    <span className="text-elegant-text-muted text-xs">{new Date(note.updated_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                return `grep: error: ${msg}`;
            }
        }
    }
};
