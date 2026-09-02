"use client";

import { useState } from "react";

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

function generateHexDump(packetId: string, size: number) {
  const lines = Math.min(Math.ceil(size / 16), 8); // Max 8 lines for UI
  let dump = "";
  
  for (let i = 0; i < lines; i++) {
    const offset = (i * 16).toString(16).padStart(4, "0");
    let hexParts = [];
    let asciiParts = "";
    
    for (let j = 0; j < 16; j++) {
      // Fake random bytes deterministic by packet id and position
      const byte = Math.floor(Math.abs(Math.sin((i * 16 + j) * packetId.charCodeAt(0))) * 256);
      hexParts.push(byte.toString(16).padStart(2, "0"));
      
      // Printable ASCII
      if (byte >= 32 && byte <= 126) {
        asciiParts += String.fromCharCode(byte);
      } else {
        asciiParts += ".";
      }
    }
    
    dump += `${offset}  ${hexParts.slice(0, 8).join(" ")}  ${hexParts.slice(8, 16).join(" ")}  |${asciiParts}|\n`;
  }
  return dump;
}

export function PacketInspector({ packet }: { packet: Packet }) {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setActionStatus(`EXECUTING [${action}]...`);
    setTimeout(() => {
      setActionStatus(`[${action}] COMPLETED SUCCESSFULLY`);
      setTimeout(() => setActionStatus(null), 3000);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300">
      
      {/* Risk Summary */}
      <div className={`border p-4 mb-4 ${packet.ai_risk_score > 75 ? 'border-red-500 bg-red-500/10' : packet.ai_risk_score > 50 ? 'border-orange-500 bg-orange-500/10' : 'border-green-500 bg-green-500/10'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">AI_RISK_SCORE</span>
          <span className={`text-2xl font-bold ${packet.ai_risk_score > 75 ? 'text-red-500' : packet.ai_risk_score > 50 ? 'text-orange-500' : 'text-green-500'}`}>
            {packet.ai_risk_score}
          </span>
        </div>
        <div className="flex justify-between items-center text-zinc-500">
          <span>AI_CONFIDENCE</span>
          <span>{packet.ai_confidence}%</span>
        </div>
      </div>

      {/* Packet Metadata */}
      <div className="border border-black dark:border-zinc-700 bg-white dark:bg-black mb-4">
        <div className="border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] p-2 font-bold text-black dark:text-white">
          [PACKET_METADATA]
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between border-b border-zinc-300 dark:border-zinc-800/50 pb-1">
            <span className="text-zinc-500">PACKET_ID</span>
            <span className="font-bold">{packet.id}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-300 dark:border-zinc-800/50 pb-1">
            <span className="text-zinc-500">TIMESTAMP</span>
            <span className="font-bold">{new Date(packet.timestamp * 1000).toISOString()}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-300 dark:border-zinc-800/50 pb-1">
            <span className="text-zinc-500">PROTOCOL</span>
            <span className="font-bold">{packet.protocol}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-300 dark:border-zinc-800/50 pb-1">
            <span className="text-zinc-500">PAYLOAD_SIZE</span>
            <span className="font-bold">{packet.size} BYTES</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-zinc-500">ENTROPY</span>
            <span className="font-bold">{packet.entropy}</span>
          </div>
        </div>
      </div>

      {/* Network Path */}
      <div className="border border-black dark:border-zinc-700 bg-white dark:bg-black mb-4">
        <div className="border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] p-2 font-bold text-black dark:text-white">
          [NETWORK_PATH]
        </div>
        <div className="p-3 flex items-center justify-between">
          <div className="text-center">
            <div className="text-orange-500 font-bold">{packet.src_ip}</div>
            <div className="text-zinc-500 text-[10px]">{packet.src_loc}</div>
          </div>
          <div className="text-zinc-700 dark:text-zinc-500">---&gt;</div>
          <div className="text-center">
            <div className="text-orange-500 font-bold">{packet.dst_ip}</div>
            <div className="text-zinc-500 text-[10px]">{packet.dst_loc}</div>
          </div>
        </div>
      </div>

      {/* Hex Dump */}
      <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-black mb-4">
        <div className="border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] p-2 font-bold text-black dark:text-white">
          [PAYLOAD_HEX_DUMP]
        </div>
        <div className="p-3 overflow-x-auto text-[10px] text-zinc-500 whitespace-pre">
          {generateHexDump(packet.id, packet.size)}
        </div>
      </div>

      {/* AI Analysis Block */}
      <div className="border border-orange-500 bg-orange-500/5 mb-4 flex-1">
        <div className="border-b border-orange-500 bg-orange-500/20 p-2 font-bold text-orange-600 dark:text-orange-500 flex justify-between">
          <span>[AI_ANALYSIS_ENGINE]</span>
          <span className="text-orange-500">{packet.ai_confidence}% CONFIDENCE</span>
        </div>
        <div className="p-3 space-y-3">
          {packet.protocol === 'ESP' || packet.protocol === 'AH' ? (
            <div>
              <div className="text-zinc-500 mb-1">ENCRYPTED_PAYLOAD_INFERENCE:</div>
              <div className="font-bold text-orange-500">
                &gt; {packet.inferred_payload.toUpperCase()}
              </div>
            </div>
          ) : null}
          <div>
            <div className="text-zinc-500 mb-1">THREAT_PATTERN_MATCH:</div>
            <div className={`font-bold ${packet.threat_pattern !== 'None' ? 'text-red-500' : 'text-green-500'}`}>
              {packet.threat_pattern.toUpperCase()}
            </div>
          </div>
          {packet.threat_pattern !== 'None' && (
            <div className="text-zinc-600 dark:text-zinc-400">
              // WARNING: ANOMALOUS BEHAVIOR DETECTED.<br/>
              // PAYLOAD CHARACTERISTICS MATCH KNOWN ATTACK VECTOR.<br/>
              // RECOMMEND IMMEDIATE REMEDIATION.
            </div>
          )}
          {packet.threat_pattern === 'None' && (
            <div className="text-zinc-600 dark:text-zinc-400">
              // PACKET STRUCTURE NOMINAL.<br/>
              // NO KNOWN THREAT SIGNATURES DETECTED.
            </div>
          )}
        </div>
      </div>

      {/* Action Hub */}
      <div className="mt-auto">
        <div className="text-zinc-500 mb-2 font-bold">OPERATOR_ACTIONS:</div>
        <div className="flex flex-col gap-2">
          {actionStatus && (
            <div className="bg-zinc-200 dark:bg-zinc-800 text-orange-500 font-bold p-2 text-center animate-pulse">
              {actionStatus}
            </div>
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction("BLOCK_SRC_IP")}
              className="flex-1 border border-red-500 text-red-500 hover:bg-red-500/10 py-2 font-bold transition-colors"
            >
              [BLOCK_SRC_IP]
            </button>
            <button 
              onClick={() => handleAction("FLAG_FOR_TRAINING")}
              className="flex-1 border border-orange-500 text-orange-500 hover:bg-orange-500/10 py-2 font-bold transition-colors"
            >
              [FLAG_TRAINING]
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
