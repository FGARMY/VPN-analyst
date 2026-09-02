"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* ── Types ───────────────────────────────────── */

interface LogEntry {
  id: number;
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "error" | "system";
  latency?: number;
}

/* ── Helpers ─────────────────────────────────── */

function classifyLine(text: string): LogEntry["type"] {
  const lower = text.toLowerCase();
  if (lower.includes("reply from") || lower.includes("bytes=")) return "success";
  if (lower.includes("request timed out") || lower.includes("unreachable"))
    return "error";
  if (
    lower.includes("pinging") ||
    lower.includes("statistics") ||
    lower.includes("packets") ||
    lower.includes("approximate")
  )
    return "system";
  if (lower.includes("ttl=")) return "success";
  return "info";
}

function parseLatency(text: string): number | undefined {
  const match = text.match(/time[=<](\d+)ms/i);
  return match ? parseInt(match[1], 10) : undefined;
}

function getTimestamp() {
  const now = new Date();
  const hrs = now.getHours().toString().padStart(2, "0");
  const mins = now.getMinutes().toString().padStart(2, "0");
  const secs = now.getSeconds().toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  return `${hrs}:${mins}:${secs}.${ms}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ── Brutalist Sparkline Component ──────────── */

function BrutalistSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const width = 300;
  const height = 80;
  const padding = 5;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="relative w-full h-[80px] bg-zinc-200 dark:bg-[#111] border border-black dark:border-zinc-700">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
        <div className="w-full h-px bg-zinc-500" />
        <div className="w-full h-px bg-zinc-500" />
        <div className="w-full h-px bg-zinc-500" />
        <div className="w-full h-px bg-zinc-500" />
      </div>
      
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#f97316" /* orange-500 */
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Draw dots on every point */}
        {points.map((p, i) => (
          <circle key={i} cx={p.split(',')[0]} cy={p.split(',')[1]} r="1.5" fill="#f97316" />
        ))}
      </svg>
      <div className="absolute top-1 right-1 text-[10px] text-zinc-500 uppercase">LATENCY (MS)</div>
    </div>
  );
}

/* ── Constants ───────────────────────────────── */

const MAX_LOG_LINES = 1000;
const MAX_LATENCY_HISTORY = 30;

/* ── Main Component ──────────────────────────── */

export default function LiveLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [uptime, setUptime] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const idCounterRef = useRef(0);
  const pausedBufferRef = useRef<LogEntry[]>([]);
  const connectedAtRef = useRef<number | null>(null);

  /* ── Stats ──────────────────────────── */

  const stats = useMemo(() => {
    const latencies = logs
      .map((l) => l.latency)
      .filter((l): l is number => l !== undefined);
    
    const errors = logs.filter((l) => l.type === "error").length;
    const total = logs.filter((l) => l.type === "success" || l.type === "error").length;
    const loss = total > 0 ? ((errors / total) * 100).toFixed(2) : "0.00";

    if (latencies.length === 0) return { current: 0, avg: 0, min: 0, max: 0, loss, total };
    
    const sum = latencies.reduce((a, b) => a + b, 0);
    return {
      current: latencies[latencies.length - 1],
      avg: Math.round(sum / latencies.length),
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      loss,
      total
    };
  }, [logs]);

  /* ── Filtered logs ──────────────────────────── */

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (l) => l.text.toLowerCase().includes(q) || l.timestamp.includes(q)
    );
  }, [logs, searchQuery]);

  /* ── Add log ────────────────────────────────── */

  const addLog = useCallback(
    (text: string) => {
      const latency = parseLatency(text);
      const entry: LogEntry = {
        id: idCounterRef.current++,
        timestamp: getTimestamp(),
        text,
        type: classifyLine(text),
        latency,
      };

      if (paused) {
        pausedBufferRef.current.push(entry);
        return;
      }

      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOG_LINES
          ? next.slice(next.length - MAX_LOG_LINES)
          : next;
      });

      if (latency !== undefined) {
        setLatencyHistory((prev) => {
          const next = [...prev, latency];
          return next.length > MAX_LATENCY_HISTORY
            ? next.slice(next.length - MAX_LATENCY_HISTORY)
            : next;
        });
      }
    },
    [paused]
  );

  /* ── WebSocket connection ───────────────────── */

  const connectWs = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//localhost:8000/api/live-logs/stream`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      connectedAtRef.current = Date.now();
      addLog("SYSTEM_INIT: CONNECTED TO DIAGNOSTIC STREAM (8.8.8.8)");
    };

    ws.onmessage = (event) => {
      addLog(event.data);
    };

    ws.onclose = () => {
      setConnected(false);
      connectedAtRef.current = null;
      addLog("SYSTEM_HALT: CONNECTION TERMINATED");
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return ws;
  }, [addLog]);

  useEffect(() => {
    const ws = connectWs();
    return () => ws.close();
  }, [connectWs]);

  /* ── Uptime timer ───────────────────────────── */

  useEffect(() => {
    const interval = setInterval(() => {
      if (connectedAtRef.current) {
        setUptime(Math.floor((Date.now() - connectedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ── Auto-scroll ────────────────────────────── */

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  /* ── Actions ────────────────────────────────── */

  const handleResume = () => {
    if (pausedBufferRef.current.length > 0) {
      setLogs((prev) => {
        const next = [...prev, ...pausedBufferRef.current];
        return next.length > MAX_LOG_LINES
          ? next.slice(next.length - MAX_LOG_LINES)
          : next;
      });
      pausedBufferRef.current = [];
    }
    setPaused(false);
    setAutoScroll(true);
  };

  const clearLogs = () => {
    setLogs([]);
    setLatencyHistory([]);
  };

  const currentDateTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <div 
      className="flex flex-col h-[calc(100vh-2rem)] bg-white dark:bg-black text-zinc-900 dark:text-zinc-300 font-mono text-[12px] uppercase select-none tracking-tight"
      style={{ fontFamily: "var(--font-jetbrains)" }}
    >
      {/* ── Brutalist Top Header ── */}
      <div className="flex border-b-[3px] border-orange-500 pb-2 mb-4 shrink-0">
        <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center border border-zinc-600 mr-4 shrink-0">
          <div className="w-6 h-6 border-2 border-orange-500" />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex justify-between text-orange-500 font-bold text-sm">
            <span>VPN ANALYZER v1.2 // LIVE LOGS & DIAGNOSTIC STREAM</span>
            <span>{currentDateTime}</span>
          </div>
          <div className="flex gap-4 text-zinc-700 dark:text-zinc-400">
            <span className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">| DASHBOARD |</span>
            <span className="text-black dark:text-white font-bold">LIVE LOGS* |</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">ANALYTICS |</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">CONFIG |</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">SYSTEM</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4">
        
        {/* ── Main Log Table (Left) ── */}
        <div className="flex-[3] flex flex-col border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a]">
          
          {/* Table Toolbar */}
          <div className="flex justify-between items-center px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <span className="text-orange-500 font-bold">[LIVE LOGS]</span>
              <span className="text-zinc-500">// FILTER:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ALL TRAFFIC"
                className="bg-transparent border-none outline-none text-black dark:text-white placeholder:text-zinc-600 dark:text-zinc-500 w-48 uppercase"
              />
            </div>
            <div className="flex gap-3 text-[10px]">
              <button 
                onClick={() => paused ? handleResume() : setPaused(true)}
                className={`px-2 py-0.5 border ${paused ? "bg-orange-500 text-black border-orange-500" : "border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
              >
                {paused ? "[RESUME]" : "[PAUSE]"}
              </button>
              <button onClick={clearLogs} className="px-2 py-0.5 border border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                [CLEAR]
              </button>
              <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2 py-0.5 border ${autoScroll ? "bg-zinc-300 text-black border-zinc-300" : "border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
              >
                [AUTO-SCROLL]
              </button>
            </div>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-[120px_90px_90px_1fr] border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111]">
            <div className="px-2 py-1 border-r border-black dark:border-zinc-700 font-bold">[TIMESTAMP]</div>
            <div className="px-2 py-1 border-r border-black dark:border-zinc-700 font-bold">[TYPE]</div>
            <div className="px-2 py-1 border-r border-black dark:border-zinc-700 font-bold">[LATENCY]</div>
            <div className="px-2 py-1 font-bold">[MESSAGE]</div>
          </div>

          {/* Table Body (Scrollable) */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {filteredLogs.length === 0 && (
              <div className="p-4 text-zinc-500">NO DATA FOUND. AWAITING STREAM...</div>
            )}
            {filteredLogs.map((entry, i) => (
              <div 
                key={entry.id} 
                className={`grid grid-cols-[120px_90px_90px_1fr] border-b border-zinc-300 dark:border-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-[#1a1a1a] ${i % 2 === 0 ? 'bg-zinc-100 dark:bg-[#0a0a0a]' : 'bg-zinc-50 dark:bg-[#0f0f0f]'}`}
              >
                <div className="px-2 py-1 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400">
                  {entry.timestamp}
                </div>
                <div className="px-2 py-1 border-r border-zinc-300 dark:border-zinc-800/50">
                  {entry.type === "success" && <span className="bg-zinc-700 text-black dark:text-white px-1">REPLY</span>}
                  {entry.type === "error" && <span className="bg-red-900 text-red-400 px-1">TIMEOUT</span>}
                  {entry.type === "system" && <span className="text-orange-500">SYSTEM</span>}
                  {entry.type === "info" && <span className="text-zinc-500">INFO</span>}
                  {entry.type === "warning" && <span className="text-yellow-500">WARN</span>}
                </div>
                <div className="px-2 py-1 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-900 dark:text-zinc-300">
                  {entry.latency !== undefined ? `${entry.latency}ms` : '---'}
                </div>
                <div className={`px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis ${
                  entry.type === "error" ? "text-red-400" : 
                  entry.type === "system" ? "text-orange-500" : "text-zinc-900 dark:text-zinc-300"
                }`}>
                  {entry.text}
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Table Footer */}
          <div className="px-3 py-1 border-t border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] flex justify-between text-[10px] text-zinc-500">
            <span>TOTAL ROWS: {logs.length}</span>
            <span>DISPLAYED: {filteredLogs.length}</span>
          </div>

        </div>

        {/* ── Side Panel (Right) ── */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Diagnostic Stream Block */}
          <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a]">
            <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-orange-500 flex justify-between">
              <span>[DIAGNOSTIC STREAM]</span>
              <span className="text-zinc-500">// ICMP: 8.8.8.8</span>
            </div>
            
            <div className="p-3 space-y-3">
              <div className="text-zinc-700 dark:text-zinc-400">
                RAW DIAGNOSTIC AT // {connected ? <span className="text-green-500 bg-green-900/30 px-1">ONLINE</span> : <span className="text-red-500 bg-red-900/30 px-1">OFFLINE</span>}
              </div>
              
              <div className="border border-black dark:border-zinc-700 p-2 bg-zinc-200 dark:bg-[#111]">
                <div className="flex justify-between mb-2">
                  <span>TUNNEL HEALTH:</span>
                  <span>[UPTIME: {formatDuration(uptime)}]</span>
                </div>
                
                <BrutalistSparkline data={latencyHistory} />
                
                <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                  <div className="bg-zinc-200 dark:bg-[#1a1a1a] p-1 border border-zinc-300 dark:border-zinc-800">
                    <div className="text-zinc-500">RTT (AVG)</div>
                    <div className="text-lg text-black dark:text-white">{stats.avg}ms</div>
                  </div>
                  <div className="bg-zinc-200 dark:bg-[#1a1a1a] p-1 border border-zinc-300 dark:border-zinc-800">
                    <div className="text-zinc-500">RTT (CUR)</div>
                    <div className="text-lg text-black dark:text-white">{stats.current}ms</div>
                  </div>
                  <div className="bg-zinc-200 dark:bg-[#1a1a1a] p-1 border border-zinc-300 dark:border-zinc-800">
                    <div className="text-zinc-500">PKT LOSS</div>
                    <div className={`text-lg ${parseFloat(stats.loss) > 0 ? 'text-red-500' : 'text-black dark:text-white'}`}>{stats.loss}%</div>
                  </div>
                  <div className="bg-zinc-200 dark:bg-[#1a1a1a] p-1 border border-zinc-300 dark:border-zinc-800">
                    <div className="text-zinc-500">TOTAL PKTS</div>
                    <div className="text-lg text-black dark:text-white">{stats.total}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts Block */}
          <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex-1 flex flex-col min-h-0">
            <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-300 text-black font-bold">
              SYSTEM ALERTS/EVENTS
            </div>
            <div className="p-2 overflow-y-auto flex-1 space-y-1">
              {logs.filter(l => l.type === 'error' || l.type === 'system').slice(-10).map((log, i) => (
                <div key={i} className="flex gap-2">
                  {log.type === 'error' && (
                    <span className="text-black bg-orange-500 rounded-full w-3 h-3 flex items-center justify-center font-bold text-[8px] mt-0.5 shrink-0">!</span>
                  )}
                  {log.type === 'system' && (
                    <span className="text-black bg-zinc-500 rounded-full w-3 h-3 flex items-center justify-center font-bold text-[8px] mt-0.5 shrink-0">i</span>
                  )}
                  <span className="text-zinc-500 shrink-0">{log.timestamp}</span>
                  <span className={log.type === 'error' ? 'text-orange-500' : 'text-zinc-900 dark:text-zinc-300'}>
                    | {log.type === 'error' ? 'ERROR' : 'EVENT'} | {log.text}
                  </span>
                </div>
              ))}
              {logs.filter(l => l.type === 'error' || l.type === 'system').length === 0 && (
                <div className="text-zinc-600 dark:text-zinc-500 italic">No recent alerts...</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
