import { useState, useEffect, useRef, useCallback } from 'react';

interface PingProps {
    host: string;
    onComplete: () => void;
    count?: number; // Optional: limit number of pings
}

export const Ping = ({ host, onComplete, count }: PingProps) => {
    const [lines, setLines] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(true);
    const [stats, setStats] = useState<{ tx: number; rx: number; loss: number; min: number; avg: number; max: number } | null>(null);

    // Use refs to avoid stale closures
    const seqRef = useRef(1);
    const rttsRef = useRef<number[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initial IP is null to prevent showing fake IP
    const [ip, setIp] = useState<string | null>(null);

    // Refs for values used in effect loop
    const isRunningRef = useRef(isRunning);
    useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

    const ipRef = useRef(ip);
    useEffect(() => { ipRef.current = ip; }, [ip]);

    // Validate hostname
    const isValidHost = useCallback((hostname: string): boolean => {
        if (!hostname || hostname.trim() === '') return false;
        // Basic validation - allows domain names and IPs
        const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$|^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        return pattern.test(hostname);
    }, []);



    const finalizePing = useCallback((cancelled: boolean = false) => {
        setIsRunning(false);

        const rtts = rttsRef.current;
        const min = rtts.length ? Math.min(...rtts) : 0;
        const max = rtts.length ? Math.max(...rtts) : 0;
        const avg = rtts.length ? rtts.reduce((a, b) => a + b, 0) / rtts.length : 0;

        const transmitted = seqRef.current - 1;
        const received = rtts.length;
        const loss = transmitted > 0 ? ((transmitted - received) / transmitted * 100) : 0;

        setStats({
            tx: transmitted,
            rx: received,
            loss: loss,
            min: isFinite(min) ? min : 0,
            avg: isFinite(avg) ? avg : 0,
            max: isFinite(max) ? max : 0
        });

        if (cancelled) {
            setLines(prev => [...prev, '^C']);
        }

        onComplete();
    }, [onComplete]);

    useEffect(() => {
        // Validate host first
        if (!isValidHost(host)) {
            setLines([`ping: ${host}: Name or service not known`]);
            setIsRunning(false);
            onComplete();
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout>;
        let mounted = true;

        const doPing = async () => {
            if (!mounted || !isRunningRef.current) return;

            const currentSeq = seqRef.current++;

            // Create abort controller for this request
            abortControllerRef.current = new AbortController();

            try {
                const controller = abortControllerRef.current;
                const startTime = performance.now();

                const res = await fetch(`/api/ping?host=${encodeURIComponent(host)}`, {
                    signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!mounted) return;

                if (!res.ok) {
                    if (res.status === 404) throw new Error('Ping service unavailable');
                    throw new Error(`HTTP ${res.status}`);
                } else {
                    const data = await res.json();

                    if (data.error) {
                        throw new Error(data.error);
                    }

                    const endTime = performance.now();
                    const actualTime = endTime - startTime;

                    const time = data.time ? data.time.toFixed(1) : actualTime.toFixed(1);

                    let effectiveIp = ipRef.current;
                    if (data.ip && data.ip !== 'unknown') {
                        if (data.ip !== ipRef.current) {
                            setIp(data.ip);
                            effectiveIp = data.ip;
                        }
                    }

                    rttsRef.current.push(parseFloat(time));

                    setLines(prev => [
                        ...prev,
                        `64 bytes from ${host} (${effectiveIp || 'unknown'}): icmp_seq=${currentSeq} ttl=${data.ttl || 64} time=${time} ms`
                    ]);
                }

                // Check count
                if (count && currentSeq >= count) {
                    finalizePing(false);
                    return;
                }

                // Schedule next ping
                if (mounted && isRunningRef.current) {
                    timeoutId = setTimeout(doPing, 1000);
                }
            } catch (e: unknown) {
                if (!mounted) return;
                if (e instanceof Error && e.name === 'AbortError') return;

                let errorMsg = `Request timeout for icmp_seq=${currentSeq}`;
                const errMsg = e instanceof Error ? e.message : '';
                if (errMsg?.includes('DNS') || errMsg?.includes('ENOTFOUND')) {
                    errorMsg = `ping: ${host}: Name or service not known`;
                    setIsRunning(false);
                } else if (errMsg?.includes('Network') || errMsg?.includes('Failed to fetch')) {
                    errorMsg = `From ${ipRef.current || 'unknown'}: icmp_seq=${currentSeq} Destination Host Unreachable`;
                }

                setLines(prev => [...prev, errorMsg]);

                if (!errMsg?.includes('DNS') && !errMsg?.includes('ENOTFOUND') && mounted && isRunningRef.current) {
                    timeoutId = setTimeout(doPing, 1000);
                } else {
                    finalizePing(false);
                }
            }
        };

        doPing();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'c') {
                if (isRunningRef.current) {
                    if (abortControllerRef.current) abortControllerRef.current.abort();
                    clearTimeout(timeoutId);
                    finalizePing(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            if (abortControllerRef.current) abortControllerRef.current.abort();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [host, count, isValidHost, finalizePing, onComplete]);

    return (
        <div className="text-elegant-text-primary">
            {ip && <div className="mb-1">PING {host} ({ip}) 56(84) bytes of data.</div>}
            {lines.map((line, i) => (
                <div key={i}>{line}</div>
            ))}
            {stats && (
                <>
                    <div className="mt-2 text-elegant-text-primary">--- {host} ping statistics ---</div>
                    <div className="text-elegant-text-primary">{stats.tx} packets transmitted, {stats.rx} received, {stats.loss.toFixed(0)}% packet loss, time {stats.tx}000ms</div>
                    {stats.rx > 0 && (
                        <div className="text-elegant-text-primary">rtt min/avg/max/mdev = {stats.min.toFixed(3)}/{stats.avg.toFixed(3)}/{stats.max.toFixed(3)}/{((stats.max - stats.min) / 2).toFixed(3)} ms</div>
                    )}
                </>
            )}
            {isRunning && (
                <button
                    onClick={() => {
                        if (abortControllerRef.current) abortControllerRef.current.abort();
                        finalizePing(true);
                    }}
                    className="mt-2 px-3 py-1 text-xs text-elegant-text-muted border border-elegant-border rounded hover:bg-white/10 hover:text-elegant-text-primary active:bg-white/20 transition-colors cursor-pointer select-none"
                >
                    ⏹ Stop (Ctrl+C)
                </button>
            )}
        </div>
    );
};
