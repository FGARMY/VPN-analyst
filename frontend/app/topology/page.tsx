"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function TopologyPage() {
  const [topology, setTopology] = useState<{ nodes: any[]; links: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  useEffect(() => {
    api.getTopology()
      .then(setTopology)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !topology) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)] text-orange-500 font-mono text-sm font-bold uppercase animate-pulse">
        [SCANNING NETWORK TOPOLOGY...]
      </div>
    );
  }

  // Circular layout parameters
  const width = 800;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 220;

  const hqNode = topology.nodes.find(n => n.type === "gateway");
  const remoteNodes = topology.nodes.filter(n => n.type === "remote");

  return (
    <div className="flex h-[calc(100vh-3rem)] font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300 select-none overflow-hidden">
      
      {/* Top Bar / Status */}
      <div className="absolute top-12 left-0 right-0 p-4 pointer-events-none z-10 flex justify-between">
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-black p-3 pointer-events-auto">
          <div className="text-orange-500 font-bold mb-1">// NETWORK_TOPOLOGY_MAP</div>
          <div className="text-zinc-500">ACTIVE NODES: {topology.nodes.length}</div>
          <div className="text-zinc-500">ACTIVE LINKS: {topology.links.length}</div>
        </div>
      </div>

      {/* Main SVG Area */}
      <div className="flex-1 bg-white dark:bg-[#050505] relative flex items-center justify-center">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full max-w-5xl"
          style={{ cursor: "crosshair" }}
        >
          {/* Grid Background */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(249, 115, 22, 0.1)" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Links */}
          {topology.links.map((link, i) => {
            const isTargetSelected = selectedNode?.id === link.target;
            const targetNode = remoteNodes.find(n => n.id === link.target);
            const targetIndex = remoteNodes.findIndex(n => n.id === link.target);
            const angle = (targetIndex / remoteNodes.length) * 2 * Math.PI - Math.PI / 2;
            const tx = cx + radius * Math.cos(angle);
            const ty = cy + radius * Math.sin(angle);
            
            const isHighRisk = targetNode && targetNode.risk > 70;
            const linkColor = isHighRisk ? "rgba(239, 68, 68, 0.5)" : "rgba(249, 115, 22, 0.3)";
            
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={tx}
                y2={ty}
                stroke={isTargetSelected ? "#f97316" : linkColor}
                strokeWidth={isTargetSelected ? 3 : 1}
                strokeDasharray={link.status === "Down" ? "5,5" : "none"}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Remote Nodes */}
          {remoteNodes.map((node, i) => {
            const angle = (i / remoteNodes.length) * 2 * Math.PI - Math.PI / 2;
            const nx = cx + radius * Math.cos(angle);
            const ny = cy + radius * Math.sin(angle);
            const isHighRisk = node.risk > 70;
            const isSelected = selectedNode?.id === node.id;

            return (
              <g 
                key={node.id} 
                transform={`translate(${nx}, ${ny})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Pulse Ring for High Risk */}
                {isHighRisk && (
                  <circle r="15" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping opacity-75" />
                )}
                
                {/* Node Box */}
                <rect 
                  x="-8" 
                  y="-8" 
                  width="16" 
                  height="16" 
                  fill={isHighRisk ? "#ef4444" : "#111"} 
                  stroke={isSelected ? "#f97316" : isHighRisk ? "#ef4444" : "#333"}
                  strokeWidth="2"
                  className="transition-colors group-hover:stroke-orange-500"
                />
                
                {/* Node Label */}
                <text 
                  x={nx > cx ? 15 : -15} 
                  y="4" 
                  fill={isHighRisk ? "#ef4444" : "#666"} 
                  textAnchor={nx > cx ? "start" : "end"}
                  className="text-[10px] font-bold group-hover:fill-orange-500 transition-colors"
                >
                  {node.name}
                </text>
              </g>
            );
          })}

          {/* HQ Gateway Node */}
          {hqNode && (
            <g transform={`translate(${cx}, ${cy})`} onClick={() => setSelectedNode(hqNode)} className="cursor-pointer">
              <polygon 
                points="0,-20 20,0 0,20 -20,0" 
                fill="#f97316" 
                stroke="#000" 
                strokeWidth="2" 
                className="hover:scale-110 transition-transform"
              />
              <text y="-25" fill="#f97316" textAnchor="middle" className="text-[12px] font-bold">HQ_GATEWAY</text>
            </g>
          )}
        </svg>
      </div>

      {/* Right Sidebar: Selected Node Info */}
      <div className={`w-1/3 max-w-[400px] border-l border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col transition-transform duration-300 ${selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 bottom-0'}`}>
        {selectedNode && (
          <>
            <div className="border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] p-3 flex justify-between items-center">
              <span className="font-bold text-black dark:text-white">[NODE_DIAGNOSTICS]</span>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-zinc-500 hover:text-black dark:hover:text-white font-bold"
              >
                [X]
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black p-3">
                <div className="text-zinc-500 mb-1">NODE_ID</div>
                <div className="font-bold text-lg">{selectedNode.id}</div>
              </div>
              
              <div className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black p-3">
                <div className="text-zinc-500 mb-1">NODE_NAME</div>
                <div className="font-bold">{selectedNode.name}</div>
              </div>
              
              <div className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black p-3 flex justify-between items-center">
                <div className="text-zinc-500">TYPE</div>
                <div className="font-bold">{selectedNode.type}</div>
              </div>

              {selectedNode.type !== "gateway" && (
                <div className={`border p-3 flex justify-between items-center ${selectedNode.risk > 70 ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black text-green-500'}`}>
                  <div className="font-bold">RISK_SCORE</div>
                  <div className="font-bold text-xl">{selectedNode.risk}</div>
                </div>
              )}

              {/* Mock Actions */}
              <div className="mt-8">
                <div className="text-zinc-500 font-bold mb-2">NODE_ACTIONS:</div>
                <button className="w-full border border-orange-500 text-orange-500 hover:bg-orange-500/10 py-2 font-bold transition-colors mb-2">
                  [RUN_DIAGNOSTICS]
                </button>
                <button className="w-full border border-red-500 text-red-500 hover:bg-red-500/10 py-2 font-bold transition-colors">
                  [FORCE_REKEY]
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
