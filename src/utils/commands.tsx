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
        execute: (args, { currentPath, fileSystem }) => {
            const target = args[0] || '.';
            const node = resolvePath(fileSystem, currentPath, target);

            if (!node) return `ls: cannot access '${target}': No such file or directory`;
            if (node.type !== 'directory') return target; // Just print the filename

            const contents = getDirectoryContents(node);
            return contents.join('  ');
        }
    },
    cat: {
        description: 'Concatenate and print files',
        execute: (args, { currentPath, fileSystem }) => {
            if (args.length === 0) return 'cat: missing operand';
            const target = args[0];
            const node = resolvePath(fileSystem, currentPath, target);

            if (!node) return `cat: ${target}: No such file or directory`;
            if (node.type === 'directory') return `cat: ${target}: Is a directory`;

            return node.content || '';
        }
    },
    neofetch: {
        description: 'Display system information',
        execute: () => {
            return (
                <div className="flex gap-4 text-[#00ff00] font-mono whitespace-pre text-sm">
                    <div className="hidden sm:block text-cyan-500">
                        {`       .
      .::
     .::::
    .:::::
   .::::::
  .:::::::.
 :::::::::.
.:::::::::
::::::::::
':::::::::
 ':::::::.
  '::::::
   ':::::
    '::::
     '::
      '`}
                    </div>
                    <div className="flex flex-col justify-center">
                        <div><span className="text-cyan-500">neo@neosphere</span></div>
                        <div>-----------------</div>
                        <div><span className="text-cyan-500">OS</span>: Neosphere OS v2.0</div>
                        <div><span className="text-cyan-500">Host</span>: Cloudflare Pages</div>
                        <div><span className="text-cyan-500">Kernel</span>: 5.4.0-matrix-generic</div>
                        <div><span className="text-cyan-500">Uptime</span>: Forever</div>
                        <div><span className="text-cyan-500">Packages</span>: 1337 (npm)</div>
                        <div><span className="text-cyan-500">Shell</span>: React-Term v1.0</div>
                        <div><span className="text-cyan-500">Resolution</span>: 1920x1080</div>
                        <div><span className="text-cyan-500">DE</span>: Glassmorphism</div>
                        <div><span className="text-cyan-500">WM</span>: Tiling</div>
                        <div><span className="text-cyan-500">Theme</span>: Matrix Dark</div>
                        <div><span className="text-cyan-500">Terminal</span>: WebRender</div>
                        <div><span className="text-cyan-500">CPU</span>: Virtual Core x8</div>
                        <div><span className="text-cyan-500">GPU</span>: WebGL Renderer</div>
                        <div><span className="text-cyan-500">Memory</span>: 640KB / 16GB</div>
                        <div className="mt-2 flex gap-1">
                            <div className="w-3 h-3 bg-black"></div>
                            <div className="w-3 h-3 bg-red-500"></div>
                            <div className="w-3 h-3 bg-green-500"></div>
                            <div className="w-3 h-3 bg-yellow-500"></div>
                            <div className="w-3 h-3 bg-blue-500"></div>
                            <div className="w-3 h-3 bg-purple-500"></div>
                            <div className="w-3 h-3 bg-cyan-500"></div>
                            <div className="w-3 h-3 bg-white"></div>
                        </div>
                    </div>
                </div>
            );
        }
    },
    htop: {
        description: 'Interactive process viewer (Simulated) - Press "q" to quit',
        execute: (_args, { setFullScreen }) => {
            if (setFullScreen) {
                setFullScreen(<Htop onExit={() => setFullScreen(null)} />);
                return ''; // Don't add to history immediately or return empty
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
                // TODO: Replace with real API call or proxy
                // Simulating API delay
                await new Promise(r => setTimeout(r, 1000));
                return `Weather for ${city}: 22°C, Scattered Clouds (Simulated)`;
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

            // Parse -c flag
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
        execute: (args, { setFullScreen, currentPath, fileSystem, setFileSystem }) => {
            if (args.length === 0) return 'nano: filename missing';
            const filename = args[0];

            // Resolve file content if it exists
            const node = resolvePath(fileSystem, currentPath, filename);
            const initialContent = (node && node.type === 'file') ? (node.content || '') : '';

            if (setFullScreen) {
                setFullScreen(
                    <Nano
                        filename={filename}
                        initialContent={initialContent}
                        onSave={(newContent) => {
                            if (setFileSystem) {
                                // Write to FS
                                // Note: writeFile currently only supports writing to current directory easily
                                // We might need to handle 'resolvePath' equivalent for writing if filename has paths
                                // For now passed filename is assumed to be in current dir if simplistic
                                const newFS = writeFile(fileSystem, currentPath, filename, newContent);
                                setFileSystem(newFS);
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
                    else if (dest === 'Gallery') setFullScreen(<Gallery onExit={() => setFullScreen(null)} onNavigate={navigate} />);
                    else if (dest === 'About') setFullScreen(<About onExit={() => setFullScreen(null)} onNavigate={navigate} />);
                    else if (dest === 'Contact') setFullScreen(<Contact onExit={() => setFullScreen(null)} onNavigate={navigate} />);
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
                    else if (dest === 'Gallery') setFullScreen(<Gallery onExit={() => setFullScreen(null)} onNavigate={navigate} />);
                    else if (dest === 'About') setFullScreen(<About onExit={() => setFullScreen(null)} onNavigate={navigate} />);
                    else if (dest === 'Contact') setFullScreen(<Contact onExit={() => setFullScreen(null)} onNavigate={navigate} />);
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
                    else if (dest === 'Gallery') setFullScreen(<Gallery onExit={() => setFullScreen(null)} onNavigate={navigate} />);
                    else if (dest === 'About') setFullScreen(<About onExit={() => setFullScreen(null)} onNavigate={navigate} />);
                    else if (dest === 'Contact') setFullScreen(<Contact onExit={() => setFullScreen(null)} onNavigate={navigate} />);
                };
                navigate('Contact');
                return '';
            }
            return 'Fullscreen not supported';
        }
    }
};
