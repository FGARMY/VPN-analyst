"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PacketInspector } from "@/components/packet-inspector";
import { ThreatNotifier, ThreatAlert } from "@/components/threat-notifier";

interface Packet {
  id: string;
  timestamp: number;
  src_ip: string;
  dst_ip: string;
  src_loc: string;
  dst_loc: string;
  protocol: string;
  size: number;
  entropy: number;
  inferred_payload: string;
  ai_risk_score: number;
  ai_confidence: number;
  threat_pattern: string;
  action_taken: string;
}

export default function PacketTracingPage() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("DISCONNECTED");
  const [activeAlerts, setActiveAlerts] = useState<ThreatAlert[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    const connectWs = () => {
      const wsUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace("http", "ws") 
        : "ws://localhost:8000";
      
      ws.current = new WebSocket(`${wsUrl}/api/packets/ws`);

      ws.current.onopen = () => setConnectionStatus("CONNECTED");
      ws.current.onclose = () => {
        setConnectionStatus("DISCONNECTED");
        setTimeout(connectWs, 3000); // Reconnect loop
      };
      ws.current.onerror = () => setConnectionStatus("ERROR");
      
      ws.current.onmessage = (event) => {
        if (!isPaused) {
          const newPackets: Packet[] = JSON.parse(event.data);
          setPackets(prev => [...newPackets, ...prev].slice(0, 100)); // Keep last 100
          
          // Trigger notifications for high-risk packets
          const alerts: ThreatAlert[] = [];
          newPackets.forEach(p => {
            if (p.ai_risk_score > 75) {
              alerts.push({
                id: p.id,
                src_ip: p.src_ip,
                risk_score: p.ai_risk_score,
                threat_pattern: p.threat_pattern,
                timestamp: Date.now()
              });
            }
          });

          if (alerts.length > 0) {
            setActiveAlerts(prev => [...prev, ...alerts]);
            // Auto-dismiss after 5 seconds
            alerts.forEach(alert => {
              setTimeout(() => {
                dismissAlert(alert.id);
              }, 5000);
            });
          }
        }
      };
    };

    connectWs();
    return () => ws.current?.close();
  }, [isPaused]);

  const handlePacketClick = (packet: Packet) => {
    setIsPaused(true);
    setSelectedPacket(packet);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300 select-none relative">
      <ThreatNotifier alerts={activeAlerts} onDismiss={dismissAlert} />
      
      {/* Left: Stream */}
      <div className={`flex flex-col border-r border-black dark:border-zinc-700 ${selectedPacket ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
        
        {/* Stream Header */}
        <div className="border-b border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] p-3 shrink-0 flex justify-between items-center">
          <div>
            <span className="text-zinc-600 dark:text-zinc-500 font-bold">STREAM // </span>
            <span className="text-black dark:text-white font-bold">LIVE PACKET CAPTURE</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className={`font-bold ${connectionStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`}>
              [{connectionStatus}]
            </div>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1 border font-bold transition-colors ${isPaused ? 'border-orange-500 text-orange-500 hover:bg-orange-500/10' : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-black dark:hover:border-white'}`}
            >
              {isPaused ? "[RESUME_STREAM]" : "[PAUSE_STREAM]"}
            </button>
          </div>
        </div>

        {/* Stream Table Header */}
        <div className="grid grid-cols-[80px_1fr_1fr_60px_60px_60px_100px] border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] text-zinc-600 dark:text-zinc-500 font-bold shrink-0">
          <div className="px-3 py-2 border-r border-black dark:border-zinc-700">ID</div>
          <div className="px-3 py-2 border-r border-black dark:border-zinc-700">SRC_IP</div>
          <div className="px-3 py-2 border-r border-black dark:border-zinc-700">DST_IP</div>
          <div className="px-3 py-2 border-r border-black dark:border-zinc-700">PROTO</div>
          <div className="px-3 py-2 border-r border-black dark:border-zinc-700">SIZE</div>
          <div className="px-3 py-2 border-r border-black dark:border-zinc-700">RISK</div>
          <div className="px-3 py-2">ACTION</div>
        </div>

        {/* Stream Data */}
        <div className="flex-1 overflow-auto bg-white dark:bg-black">
          {packets.map((packet, i) => (
            <div 
              key={`${packet.id}-${i}`}
              onClick={() => handlePacketClick(packet)}
              className={`grid grid-cols-[80px_1fr_1fr_60px_60px_60px_100px] border-b border-zinc-300 dark:border-zinc-800/50 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${selectedPacket?.id === packet.id ? 'bg-zinc-200 dark:bg-zinc-800 border-l-[3px] border-l-orange-500' : i % 2 === 0 ? 'bg-zinc-50 dark:bg-[#0a0a0a]' : 'bg-white dark:bg-[#0f0f0f]'}`}
            >
              <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 font-bold text-zinc-500">{packet.id}</div>
              <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50">{packet.src_ip}</div>
              <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50">{packet.dst_ip}</div>
              <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-400">{packet.protocol}</div>
              <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-400">{packet.size}</div>
              <div className={`px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 font-bold text-center ${packet.ai_risk_score > 75 ? 'text-red-500 bg-red-500/10' : packet.ai_risk_score > 50 ? 'text-orange-500' : 'text-green-500'}`}>
                {packet.ai_risk_score}
              </div>
              <div className="px-3 py-2 font-bold text-zinc-500">{packet.action_taken}</div>
            </div>
          ))}
          {packets.length === 0 && (
            <div className="p-4 text-zinc-500 font-bold animate-pulse text-center mt-10">
              WAITING FOR PACKETS...
            </div>
          )}
        </div>
      </div>

      {/* Right: Inspector Panel */}
      {selectedPacket && (
        <div className="w-1/3 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col overflow-auto">
          <div className="border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] p-3 shrink-0 flex justify-between items-center">
            <span className="font-bold text-black dark:text-white">[INSPECTOR_VIEW]</span>
            <button 
              onClick={() => setSelectedPacket(null)}
              className="text-zinc-500 hover:text-black dark:hover:text-white font-bold"
            >
              [X]
            </button>
          </div>
          <div className="flex-1 p-4">
            <PacketInspector packet={selectedPacket} />
          </div>
        </div>
      )}

    </div>
  );
}
