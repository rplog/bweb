import React, { useState, useEffect, useRef } from 'react';

interface HtopProps {
    onExit: () => void;
}

interface Process {
    pid: number;
    user: string;
    pri: number;
    ni: number;
    virt: string;
    res: string;
    shr: string;
    s: 'R' | 'S' | 'D' | 'Z' | 'T';
    cpu: number;
    mem: number;
    time: string;
    cmd: string;
}

export const Htop: React.FC<HtopProps> = ({ onExit }) => {
    const [cpu, setCpu] = useState<number[][]>([
        [15, 10, 5, 2], // CPU 0: [user, system, nice, iowait]
        [20, 8, 3, 1],  // CPU 1
        [12, 6, 2, 1],  // CPU 2
        [18, 7, 4, 2],  // CPU 3
    ]);
    const [mem, setMem] = useState({ used: 154, total: 416 }); // in MB
    const [swp] = useState({ used: 101, total: 416 }); // in MB
    const [tasks] = useState({ total: 63, threads: 109, running: 1 });
    const [uptime, setUptime] = useState(45 * 24 * 3600 + 10 * 3600 + 38 * 60 + 51); // 45 days
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Generate realistic process list
    const [processes] = useState<Process[]>([
        { pid: 1948254, user: 'x', pri: 20, ni: 0, virt: '8104', res: '4200', shr: '2856', s: 'R', cpu: 3.2, mem: 1.0, time: '0:00.26', cmd: 'htop' },
        { pid: 1, user: 'root', pri: 20, ni: 0, virt: '25252', res: '8276', shr: '5360', s: 'S', cpu: 0.0, mem: 1.9, time: '28:31.02', cmd: '/sbin/init splash' },
        { pid: 300, user: 'root', pri: 20, ni: 0, virt: '29136', res: '3400', shr: '2764', s: 'S', cpu: 0.0, mem: 0.8, time: '8:43.91', cmd: '/usr/lib/systemd/systemd-journald' },
        { pid: 351, user: 'systemd-ti', pri: 20, ni: 0, virt: '92228', res: '1300', shr: '1144', s: 'S', cpu: 0.0, mem: 0.3, time: '0:16.35', cmd: '/usr/lib/systemd/systemd-timesyncd' },
        { pid: 378, user: 'root', pri: 20, ni: 0, virt: '35752', res: '1440', shr: '1348', s: 'S', cpu: 0.0, mem: 0.3, time: '0:10.55', cmd: '/usr/lib/systemd/systemd-udevd' },
        { pid: 383, user: 'systemd-ti', pri: 20, ni: 0, virt: '92228', res: '1300', shr: '0', s: 'S', cpu: 0.0, mem: 0.3, time: '0:00.01', cmd: '/usr/lib/systemd/systemd-timesyncd' },
        { pid: 510, user: 'rpc', pri: 20, ni: 0, virt: '6840', res: '332', shr: '296', s: 'S', cpu: 0.0, mem: 0.1, time: '0:08.28', cmd: '/usr/sbin/rpcbind -f -w' },
        { pid: 519, user: 'root', pri: 20, ni: 0, virt: '5008', res: '240', shr: '236', s: 'S', cpu: 0.0, mem: 0.1, time: '0:00.01', cmd: '/usr/sbin/blkmapd' },
        { pid: 568, user: 'root', pri: 20, ni: 0, virt: '302M', res: '3860', shr: '3248', s: 'S', cpu: 0.0, mem: 0.9, time: '0:00.96', cmd: '/usr/libexec/accounts-daemon' },
        { pid: 570, user: 'avahi', pri: 20, ni: 0, virt: '5920', res: '1328', shr: '1032', s: 'S', cpu: 0.0, mem: 0.3, time: '5:38.85', cmd: 'avahi-daemon: running [xs.local]' },
        { pid: 571, user: 'root', pri: 20, ni: 0, virt: '13000', res: '392', shr: '388', s: 'S', cpu: 0.0, mem: 0.1, time: '0:00.25', cmd: '/usr/libexec/bluetooth/bluetoothd' },
        { pid: 572, user: 'root', pri: 20, ni: 0, virt: '6980', res: '800', shr: '704', s: 'S', cpu: 0.0, mem: 0.2, time: '0:42.53', cmd: '/usr/sbin/cron -f' },
        { pid: 574, user: 'messagebus', pri: 20, ni: 0, virt: '9748', res: '2736', shr: '1364', s: 'S', cpu: 0.0, mem: 0.6, time: '27:16.03', cmd: '/usr/bin/dbus-daemon --system --address=systemd: --nofork --nopidfile --systemd-activation' },
        { pid: 579, user: 'polkitd', pri: 20, ni: 0, virt: '302M', res: '3944', shr: '3064', s: 'S', cpu: 0.0, mem: 0.9, time: '0:01.88', cmd: '/usr/lib/polkit-1/polkitd --no-debug --log-level=notice' },
        { pid: 580, user: 'avahi', pri: 20, ni: 0, virt: '5656', res: '236', shr: '232', s: 'S', cpu: 0.0, mem: 0.1, time: '0:00.00', cmd: 'avahi-daemon: chroot helper' },
        { pid: 584, user: 'root', pri: 20, ni: 0, virt: '18864', res: '4988', shr: '4540', s: 'S', cpu: 1.2, mem: 1.2, time: '3:45.06', cmd: '/usr/lib/systemd/systemd-logind' },
        { pid: 585, user: 'root', pri: 20, ni: 0, virt: '399M', res: '3520', shr: '2932', s: 'S', cpu: 0.0, mem: 0.8, time: '0:03.15', cmd: '/usr/libexec/udisks2/udisksd' },
        { pid: 621, user: 'root', pri: 20, ni: 0, virt: '302M', res: '3860', shr: '0', s: 'S', cpu: 0.0, mem: 0.9, time: '0:00.00', cmd: '/usr/libexec/accounts-daemon' },
        { pid: 622, user: 'root', pri: 20, ni: 0, virt: '302M', res: '3860', shr: '0', s: 'S', cpu: 0.0, mem: 0.9, time: '0:00.09', cmd: '/usr/libexec/accounts-daemon' },
        { pid: 641, user: 'root', pri: 20, ni: 0, virt: '399M', res: '3520', shr: '0', s: 'S', cpu: 0.0, mem: 0.8, time: '1:41.54', cmd: '/usr/libexec/udisks2/udisksd' },
        { pid: 642, user: 'root', pri: 20, ni: 0, virt: '399M', res: '3520', shr: '0', s: 'S', cpu: 0.0, mem: 0.8, time: '0:01.52', cmd: '/usr/libexec/udisks2/udisksd' },
        { pid: 648, user: 'polkitd', pri: 20, ni: 0, virt: '302M', res: '3944', shr: '0', s: 'S', cpu: 0.0, mem: 0.9, time: '2:51.35', cmd: '/usr/lib/polkit-1/polkitd --no-debug --log-level=notice' },
        { pid: 649, user: 'polkitd', pri: 20, ni: 0, virt: '302M', res: '3944', shr: '0', s: 'S', cpu: 0.0, mem: 0.9, time: '0:00.00', cmd: '/usr/lib/polkit-1/polkitd --no-debug --log-level=notice' },
        { pid: 650, user: 'root', pri: 20, ni: 0, virt: '399M', res: '3520', shr: '0', s: 'S', cpu: 0.0, mem: 0.8, time: '0:00.14', cmd: '/usr/libexec/udisks2/udisksd' },
        { pid: 651, user: 'root', pri: 20, ni: 0, virt: '302M', res: '3860', shr: '0', s: 'S', cpu: 0.0, mem: 0.9, time: '0:00.45', cmd: '/usr/libexec/accounts-daemon' },
        { pid: 652, user: 'polkitd', pri: 20, ni: 0, virt: '302M', res: '3944', shr: '0', s: 'S', cpu: 0.0, mem: 0.9, time: '0:01.44', cmd: '/usr/lib/polkit-1/polkitd --no-debug --log-level=notice' },
        { pid: 654, user: 'root', pri: 20, ni: 0, virt: '333M', res: '3424', shr: '2232', s: 'S', cpu: 0.0, mem: 0.8, time: '13:17.37', cmd: '/usr/sbin/NetworkManager --no-daemon' },
        { pid: 690, user: 'root', pri: 20, ni: 0, virt: '316M', res: '2528', shr: '0', s: 'S', cpu: 0.0, mem: 0.6, time: '0:00.00', cmd: '/usr/sbin/ModemManager' },
        { pid: 692, user: 'root', pri: 20, ni: 0, virt: '316M', res: '2528', shr: '0', s: 'S', cpu: 0.0, mem: 0.6, time: '0:00.00', cmd: '/usr/sbin/ModemManager' },
    ]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'q' || e.key === 'Q' || (e.key === 'c' && e.ctrlKey)) {
                onExit();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(processes.length - 1, prev + 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(0, prev - 1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onExit, processes.length]);

    // Auto-scroll to keep selected item visible
    useEffect(() => {
        if (scrollRef.current) {
            const selectedElement = scrollRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            // Update CPU bars with realistic variations
            setCpu(prev => prev.map(core => [
                Math.max(0, Math.min(100, core[0] + (Math.random() * 10 - 5))), // user
                Math.max(0, Math.min(30, core[1] + (Math.random() * 4 - 2))),   // system
                Math.max(0, Math.min(10, core[2] + (Math.random() * 2 - 1))),   // nice
                Math.max(0, Math.min(5, core[3] + (Math.random() * 2 - 1))),    // iowait
            ]));

            // Update memory slightly
            setMem(prev => ({
                ...prev,
                used: Math.max(100, Math.min(prev.total - 10, prev.used + (Math.random() * 4 - 2)))
            }));

            setUptime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const MultiColorBar = ({ label, segments, showMem }: {
        label: string;
        segments: number[];
        showMem?: { used: number; total: number };
    }) => {
        // Elegant gold/grey palette for bars
        const colors = ['bg-elegant-accent', 'bg-elegant-text-primary', 'bg-elegant-text-secondary', 'bg-elegant-text-muted', 'bg-[#8a7a5a]', 'bg-[#5a4a3a]'];
        const sum = segments.reduce((a, b) => a + b, 0);
        const barWidth = showMem ? (showMem.used / showMem.total * 100) : sum;

        return (
            <div className="flex items-center font-mono text-xs leading-tight">
                <span className={`w-6 ${label.includes('Mem') || label.includes('Swp') ? 'text-elegant-accent' : 'text-elegant-text-primary'} font-bold`}>
                    {label}
                </span>
                <span className="text-gray-500 mx-1">[</span>
                <div className="flex-1 flex items-center">
                    <div className="flex w-full h-3 relative">
                        {segments.map((seg, i) => {
                            const width = showMem ? (seg / showMem.total * 100) : seg;
                            return seg > 0 ? (
                                <div
                                    key={i}
                                    className={`h-full ${colors[i % colors.length]}`}
                                    style={{ width: `${width}%` }}
                                />
                            ) : null;
                        })}
                    </div>
                </div>
                <span className="text-elegant-text-muted ml-1">]</span>
                {showMem ? (
                    <span className="ml-2 text-elegant-text-muted w-24 text-right">
                        {showMem.used.toFixed(0)}M/{showMem.total.toFixed(0)}M
                    </span>
                ) : (
                    <span className="ml-2 text-elegant-text-muted w-12 text-right">{barWidth.toFixed(1)}%</span>
                )}
            </div>
        );
    };

    const formatUptime = (sec: number) => {
        const days = Math.floor(sec / 86400);
        const hours = Math.floor((sec % 86400) / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = sec % 60;
        return `${days} days, ${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const loadAvg = [0.84, 0.45, 1.12];

    return (
        <div className="w-full h-full bg-elegant-bg text-elegant-text-secondary font-mono text-xs select-none overflow-hidden flex flex-col p-2">
            {/* Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 mb-2 flex-shrink-0">
                <div className="space-y-0">
                    {cpu.map((core, i) => (
                        <MultiColorBar
                            key={i}
                            label={`${i}`}
                            segments={core}
                        />
                    ))}
                    <MultiColorBar label="Mem" segments={[mem.used]} showMem={mem} />
                    <MultiColorBar label="Swp" segments={[swp.used]} showMem={swp} />
                </div>
                <div className="space-y-0 text-xs flex flex-col justify-center">
                    <div className="text-elegant-text-muted">
                        Tasks: <span className="text-elegant-accent font-bold">{tasks.total}</span>,{' '}
                        <span className="text-elegant-text-primary font-bold">{tasks.threads}</span> thr;{' '}
                        <span className="text-elegant-text-primary font-bold">{tasks.running}</span> running
                    </div>
                    <div className="text-elegant-text-muted">
                        Load average: <span className="text-elegant-accent font-bold">{loadAvg.join(' ')}</span>
                    </div>
                    <div className="text-elegant-text-muted">
                        Uptime: <span className="text-elegant-accent font-bold">{formatUptime(uptime)}</span>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="bg-elegant-card text-elegant-text-primary font-bold flex px-1 py-0.5 flex-shrink-0 border-t border-b border-elegant-border">
                <span className="w-16">PID</span>
                <span className="w-20">USER</span>
                <span className="w-10 text-right">PRI</span>
                <span className="w-10 text-right">NI</span>
                <span className="w-14 text-right">VIRT</span>
                <span className="w-14 text-right">RES</span>
                <span className="w-14 text-right">SHR</span>
                <span className="w-8">S</span>
                <span className="w-12 text-right">CPU%</span>
                <span className="w-12 text-right">MEM%</span>
                <span className="w-20">TIME+</span>
                <span className="flex-1">Command</span>
            </div>

            {/* Process List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-0 scrollbar-thin scrollbar-thumb-elegant-border scrollbar-track-transparent">
                {processes.map((p, idx) => {
                    const isHighlighted = idx === selectedIndex;
                    const isRunning = p.s === 'R';
                    const userColor = p.user === 'root' ? 'text-red-400' : // Keeping red for root alert
                        p.user.includes('systemd') ? 'text-elegant-accent' :
                            p.user === 'x' ? 'text-elegant-text-primary' : 'text-elegant-text-secondary';

                    return (
                        <div
                            key={p.pid}
                            className={`flex px-1 py-0 ${isHighlighted ? 'bg-elegant-accent text-elegant-bg font-bold' : ''} hover:bg-elegant-card cursor-pointer`}
                        >
                            <span className={`w-16 ${isHighlighted ? 'text-elegant-bg' : 'text-elegant-accent'}`}>{p.pid}</span>
                            <span className={`w-20 ${isHighlighted ? 'text-elegant-bg' : userColor}`}>{p.user}</span>
                            <span className="w-10 text-right">{p.pri}</span>
                            <span className="w-10 text-right">{p.ni}</span>
                            <span className="w-14 text-right">{p.virt}</span>
                            <span className="w-14 text-right">{p.res}</span>
                            <span className="w-14 text-right">{p.shr}</span>
                            <span className={`w-8 ${isRunning && !isHighlighted ? 'text-elegant-accent font-bold' : ''}`}>{p.s}</span>
                            <span className={`w-12 text-right ${isRunning && p.cpu > 1 && !isHighlighted ? 'text-elegant-accent' : ''}`}>
                                {p.cpu.toFixed(1)}
                            </span>
                            <span className="w-12 text-right">{p.mem.toFixed(1)}</span>
                            <span className="w-20">{p.time}</span>
                            <span className={`flex-1 truncate ${isHighlighted ? 'text-elegant-bg' : 'text-elegant-text-primary'}`}>{p.cmd}</span>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-2 flex gap-1 flex-wrap flex-shrink-0 border-t border-elegant-border pt-1">
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F1Help</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F2Setup</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F3Search</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F4Filter</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F5Tree</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F6Sort</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F7Nice-</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F8Nice+</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F9Kill</span>
                <span className="bg-elegant-card text-elegant-text-primary px-1.5 py-0.5 text-xs">F10Quit</span>
                <span className="ml-auto bg-elegant-accent text-elegant-bg px-2 py-0.5 text-xs font-bold animate-pulse">
                    Press 'Q' to quit
                </span>
            </div>
        </div>
    );
};
