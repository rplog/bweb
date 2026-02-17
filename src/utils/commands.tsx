import { resolvePath, getDirectoryContents, writeFile } from './fileSystemUtils';
import { Htop } from '../components/Htop';
import { Ping } from '../components/Ping';
import { Nano } from '../components/Nano';
import { Gallery } from '../components/pages/Gallery';
import { About } from '../components/pages/About';
import { Contact } from '../components/pages/Contact';
import React from 'react';

export interface Command {
    description: string;
    usage?: string;
    execute: (args: string[], context: any) => string | React.ReactNode | Promise<string | React.ReactNode>;
}

export const commands: Record<string, Command> = {
    help: {
        description: 'List all available commands',
        execute: (_args) => {
            const commandList = Object.keys(commands).join(', ');
            return `Available commands: ${commandList}`;
        },
    },
    whoami: {
        description: 'Print current user',
        execute: () => 'neo',
    },
    pwd: {
        description: 'Print working directory',
        execute: (_args, { currentPath }) => '/' + currentPath.join('/'),
    },
    ls: {
        description: 'List directory contents',
        execute: async (args, { currentPath, fileSystem }) => {
            const targetPath = args[0] || '.';

            // Special handling for visitors_notes
            if (targetPath === 'visitors_notes' || (targetPath === '.' && currentPath[0] === 'visitors_notes')) {
                try {
                    const response = await fetch('/api/notes');
                    if (!response.ok) throw new Error('Failed to fetch notes');
                    const notes = await response.json();
                    return (
                        <div className="grid grid-cols-2 gap-2">
                            {notes.map((note: any) => (
                                <div key={note.filename} className="flex justify-between">
                                    <span className="text-elegant-text-primary">{note.filename}</span>
                                    <span className="text-elegant-text-muted text-xs">{new Date(note.updated_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {notes.length === 0 && <span className="text-elegant-text-muted">No notes found. Create one with nano!</span>}
                        </div>
                    );
                } catch (e: any) {
                    return `Error: ${e.message}`;
                }
            }

            const targetNode = resolvePath(fileSystem, currentPath, targetPath);

            if (!targetNode) {
                return `ls: cannot access '${targetPath}': No such file or directory`;
            }

            if (targetNode.type === 'file') {
                return targetNode.content || '';
            }

            if (targetNode.type === 'directory') {
                const contents = getDirectoryContents(targetNode);
                return (
                    <div className="flex flex-wrap gap-4">
                        {contents.map(item => {
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
            const isInVisitorsNotes = currentPath[0] === 'visitors_notes' || pathParts[0] === 'visitors_notes';

            if (isInVisitorsNotes) {
                const filename = pathParts[pathParts.length - 1];
                try {
                    const response = await fetch(`/api/notes/${filename}`);
                    if (response.status === 404) return `cat: ${filename}: No such file or directory`;
                    if (!response.ok) throw new Error('Failed to fetch note');
                    const note = await response.json();
                    return note.content;
                } catch (e: any) {
                    return `Error: ${e.message}`;
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

            if (currentPath[0] === 'visitors_notes') {
                isVisitorNote = true;
            } else if (filename.startsWith('visitors_notes/')) {
                isVisitorNote = true;
                filename = filename.replace('visitors_notes/', '');
            }

            if (!isVisitorNote) {
                return 'share: can only share files from visitors_notes directory';
            }

            const url = `${window.location.origin}/shared/notes/${filename}`;

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
                if (!res.ok) return `Error: ${await res.text()}`;

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
            } catch (e) {
                return `Error fetching weather for ${city}`;
            }
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
                return currentPath[0] === 'visitors_notes' || name?.startsWith('visitors_notes/');
            };

            let loadFilename = filenameArg;
            let contentToEdit = '';

            if (loadFilename) {
                if (isVisitorNote(loadFilename)) {
                    const cleanName = loadFilename.replace('visitors_notes/', '');
                    if (cleanName) {
                        try {
                            const res = await fetch(`/api/notes/${cleanName}`);
                            if (res.ok) {
                                const data = await res.json();
                                contentToEdit = data.content;
                            }
                        } catch (e) {
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
                        onSave={async (newContent) => {
                            if (!loadFilename) return;

                            if (isVisitorNote(loadFilename)) {
                                const cleanName = loadFilename.replace('visitors_notes/', '');
                                // Try Create first
                                let res = await fetch('/api/notes', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ filename: cleanName, content: newContent })
                                });

                                if (res.status === 409) {
                                    // Exists, try Update
                                    res = await fetch(`/api/notes/${cleanName}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ content: newContent })
                                    });
                                }

                                if (!res.ok) {
                                    throw new Error(await res.text());
                                }
                            } else {
                                if (setFileSystem) {
                                    const newFS = writeFile(fileSystem, currentPath, loadFilename, newContent);
                                    setFileSystem(newFS);
                                }
                            }
                        }}
                        onSaveAs={async (newFilename, newContent) => {
                            let targetIsVisitor = false;
                            let cleanName = newFilename;

                            if (currentPath[0] === 'visitors_notes') {
                                targetIsVisitor = true;
                            } else if (newFilename.startsWith('visitors_notes/')) {
                                targetIsVisitor = true;
                                cleanName = newFilename.replace('visitors_notes/', '');
                            }

                            if (targetIsVisitor) {
                                const res = await fetch('/api/notes', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ filename: cleanName, content: newContent })
                                });

                                if (!res.ok) {
                                    if (res.status === 409) throw new Error('File exists (Overwrite not implemented in SaveAs)');
                                    throw new Error(await res.text());
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
                const navigate = (dest: string) => {
                    if (dest === 'Terminal') setFullScreen(null);
                    else if (dest === 'Gallery') setFullScreen(<Gallery onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/gallery');
                    else if (dest === 'About') setFullScreen(<About onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/about');
                    else if (dest === 'Contact') setFullScreen(<Contact onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/contact');
                };
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
                const navigate = (dest: string) => {
                    if (dest === 'Terminal') setFullScreen(null);
                    else if (dest === 'Gallery') setFullScreen(<Gallery onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/gallery');
                    else if (dest === 'About') setFullScreen(<About onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/about');
                    else if (dest === 'Contact') setFullScreen(<Contact onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/contact');
                };
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
                const navigate = (dest: string) => {
                    if (dest === 'Terminal') setFullScreen(null);
                    else if (dest === 'Gallery') setFullScreen(<Gallery onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/gallery');
                    else if (dest === 'About') setFullScreen(<About onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/about');
                    else if (dest === 'Contact') setFullScreen(<Contact onExit={() => setFullScreen(null)} onNavigate={navigate} />, '/contact');
                };
                navigate('Contact');
                return '';
            }
            return 'Fullscreen not supported';
        }
    }
};
