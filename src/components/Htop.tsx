import React, { useState, useEffect } from 'react';

interface HtopProps {
    onExit: () => void;
}

export const Htop: React.FC<HtopProps> = ({ onExit }) => {
    const [cpu, setCpu] = useState<number[]>([10, 20, 15, 30]);
    const [mem, setMem] = useState(25);
    const [swp, setSwp] = useState(5);
    const [tasks, setTasks] = useState(112);
    const [uptime, setUptime] = useState(0);

    // Mock processes
    const [processes, setProcesses] = useState([
        { pid: 1452, user: 'root', pri: 20, ni: 0, virt: '245M', res: '12M', shr: '4M', s: 'S', cpu: 1.2, mem: 0.5, time: '1:45.02', cmd: '/usr/bin/dockerd' },
        { pid: 1489, user: 'neo', pri: 20, ni: 0, virt: '890M', res: '230M', shr: '85M', s: 'R', cpu: 4.5, mem: 4.2, time: '12:30.45', cmd: 'node server.js' },
        { pid: 2201, user: 'neo', pri: 20, ni: 0, virt: '1.2G', res: '340M', shr: '110M', s: 'S', cpu: 0.8, mem: 6.1, time: '4:15.12', cmd: 'chrome --no-sandbox' },
        { pid: 3012, user: 'www', pri: 20, ni: 0, virt: '400M', res: '50M', shr: '12M', s: 'S', cpu: 0.0, mem: 1.1, time: '0:00.15', cmd: 'nginx: worker process' },
        { pid: 4921, user: 'root', pri: 20, ni: 0, virt: '120M', res: '4M', shr: '2M', s: 'S', cpu: 0.1, mem: 0.1, time: '5 days', cmd: 'systemd --system' },
        { pid: 5102, user: 'neo', pri: 20, ni: 0, virt: '55M', res: '18M', shr: '5M', s: 'R', cpu: 2.1, mem: 0.4, time: '0:12.33', cmd: 'htop' },
        { pid: 6612, user: 'root', pri: -20, ni: 0, virt: '0', res: '0', shr: '0', s: 'S', cpu: 0.0, mem: 0.0, time: '0:00.00', cmd: '[kworker/u16:0]' },
    ]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'q' || (e.key === 'c' && e.ctrlKey)) {
                onExit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onExit]);

    useEffect(() => {
        const interval = setInterval(() => {
            // Update CPU bars
            setCpu(prev => prev.map(() => Math.floor(Math.random() * 60) + 5));
            // Update Mem/Swp slightly
            setMem(prev => Math.min(100, Math.max(10, prev + (Math.random() * 4 - 2))));
            setSwp(prev => Math.min(50, Math.max(0, prev + (Math.random() * 2 - 1))));
            setUptime(prev => prev + 1);
            setTasks(prev => Math.max(50, prev + Math.floor(Math.random() * 3 - 1)));

            // Randomize processes usage
            setProcesses(prev => prev.map(p => ({
                ...p,
                cpu: p.cmd === 'htop' ? (Math.random() * 2 + 1).toFixed(1) : (Math.random() * 5).toFixed(1),
                mem: parseFloat((Math.random() * 2 + (p.user === 'neo' ? 2 : 0)).toFixed(1))
            })) as any); // simplifying types for speed

        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const ProgressBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
        <div className="flex items-center text-xs font-mono">
            <span className="w-8 text-cyan-400 font-bold">{label}</span>
            <div className="flex items-center flex-1 mx-2">
                <div className="flex-1 bg-gray-700 h-3 relative">
                    <div
                        className={`absolute top-0 left-0 h-full ${color}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
            <span className="w-12 text-right">{percent.toFixed(1)}%</span>
        </div>
    );

    const formatUptime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return (
        <div className="w-full h-full bg-black text-gray-300 font-mono text-xs select-none p-1">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-2">
                <div className="space-y-1">
                    {cpu.map((c, i) => (
                        <ProgressBar key={i} label={`${i + 1}`} percent={c} color="bg-green-500" />
                    ))}
                    <ProgressBar label="Mem" percent={mem} color="bg-green-500" />
                    <ProgressBar label="Swp" percent={swp} color="bg-red-500" />
                </div>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Tasks: <span className="text-white font-bold">{tasks}</span>, <span className="text-white font-bold">21</span> thr; <span className="text-white font-bold">1</span> running</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Load average: <span className="text-white font-bold">0.84 0.45 1.12</span></span>
                    </div>
                    <div className="flex justify-between">
                        <span>Uptime: <span className="text-white font-bold">{formatUptime(uptime)}</span></span>
                    </div>
                </div>
            </div>

            {/* Process List */}
            <div className="w-full mt-2">
                {/* Table Header */}
                <div className="flex bg-gray-800 text-black font-bold px-1 mb-1">
                    <span className="w-12">PID</span>
                    <span className="w-12">USER</span>
                    <span className="w-10">PRI</span>
                    <span className="w-10">NI</span>
                    <span className="w-12">VIRT</span>
                    <span className="w-12">RES</span>
                    <span className="w-12">SHR</span>
                    <span className="w-8">S</span>
                    <span className="w-12">CPU%</span>
                    <span className="w-12">MEM%</span>
                    <span className="w-20">TIME+</span>
                    <span className="flex-1">Command</span>
                </div>

                {/* Table Body */}
                <div className="space-y-0.5">
                    {processes.map((p) => (
                        <div key={p.pid} className={`flex px-1 ${p.cmd === 'htop' ? 'bg-cyan-900 text-white' : ''} hover:bg-gray-800`}>
                            <span className="w-12 text-cyan-400">{p.pid}</span>
                            <span className="w-12">{p.user}</span>
                            <span className="w-10">{p.pri}</span>
                            <span className="w-10">{p.ni}</span>
                            <span className="w-12">{p.virt}</span>
                            <span className="w-12">{p.res}</span>
                            <span className="w-12">{p.shr}</span>
                            <span className="w-8">{p.s}</span>
                            <span className="w-12">{p.cpu}</span>
                            <span className="w-12">{p.mem}</span>
                            <span className="w-20">{p.time}</span>
                            <span className="flex-1 text-green-400">{p.cmd}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex gap-2 text-black font-bold">
                <span className="bg-gray-300 px-1">F1Help</span>
                <span className="bg-gray-300 px-1">F2Setup</span>
                <span className="bg-gray-300 px-1">F3Search</span>
                <span className="bg-gray-300 px-1">F4Filter</span>
                <span className="bg-gray-300 px-1">F5Tree</span>
                <span className="bg-gray-300 px-1">F6Sort</span>
                <span className="bg-gray-300 px-1">F7Nice</span>
                <span className="bg-gray-300 px-1">F8Nice+</span>
                <span className="bg-gray-300 px-1">F9Kill</span>
                <span className="bg-gray-300 px-1">F10Quit</span>
            </div>
        </div>
    );
};
