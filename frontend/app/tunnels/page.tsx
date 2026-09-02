"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { VPNTunnel } from "@/types";

function getRiskColor(score: number) {
  if (score >= 70) return "text-red-500";
  if (score >= 45) return "text-orange-500";
  if (score >= 25) return "text-yellow-500";
  return "text-green-500";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Active": return <span className="text-black bg-green-500 px-1 font-bold">ACTIVE</span>;
    case "Down": return <span className="text-black bg-red-500 px-1 font-bold">DOWN</span>;
    case "Rekeying": return <span className="text-black bg-orange-500 px-1 font-bold">REKEY</span>;
    case "Investigating": return <span className="text-black bg-blue-500 px-1 font-bold">INVSTG</span>;
    default: return <span className="text-black bg-zinc-500 px-1 font-bold">{status.toUpperCase()}</span>;
  }
}

export default function TunnelsPage() {
  const [tunnels, setTunnels] = useState<VPNTunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getTunnels({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        risk_level: riskFilter !== "all" ? riskFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      .then((res) => setTunnels(res.tunnels))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter, riskFilter, sortBy, sortOrder]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortBy !== field) return <span className="opacity-30">[-]</span>;
    return sortOrder === "desc" ? <span>[v]</span> : <span>[^]</span>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300 select-none">
      
      {/* ── Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] p-3 shrink-0">
        
        {/* Search */}
        <div className="flex flex-1 items-center border border-black dark:border-zinc-700 bg-white dark:bg-black">
          <span className="px-3 text-zinc-600 dark:text-zinc-500 border-r border-black dark:border-zinc-700 font-bold">Q_</span>
          <input
            type="text"
            placeholder="SEARCH TUNNELS, IP, CIPHER..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-black dark:text-white px-3 placeholder:text-zinc-600 dark:text-zinc-500 uppercase"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center border border-black dark:border-zinc-700 bg-white dark:bg-black">
          <span className="px-3 text-zinc-600 dark:text-zinc-500 border-r border-black dark:border-zinc-700 font-bold">STAT</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-black dark:text-white px-3 uppercase appearance-none cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900 py-2 min-w-[120px]"
          >
            <option value="all">ALL STATUS</option>
            <option value="Active">ACTIVE</option>
            <option value="Down">DOWN</option>
            <option value="Rekeying">REKEYING</option>
            <option value="Investigating">INVESTIGATING</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div className="flex items-center border border-black dark:border-zinc-700 bg-white dark:bg-black">
          <span className="px-3 text-zinc-600 dark:text-zinc-500 border-r border-black dark:border-zinc-700 font-bold">RISK</span>
          <select 
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-black dark:text-white px-3 uppercase appearance-none cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900 py-2 min-w-[120px]"
          >
            <option value="all">ALL RISK</option>
            <option value="Critical">CRITICAL</option>
            <option value="High">HIGH</option>
            <option value="Medium">MEDIUM</option>
            <option value="Low">LOW</option>
          </select>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex-1 flex flex-col min-h-0">
        
        {/* Table Headers */}
        <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_80px_1fr_60px_80px_80px] border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] text-zinc-700 dark:text-zinc-400 font-bold shrink-0">
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700">#</div>
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700 cursor-pointer hover:text-black dark:hover:text-white transition-colors" onClick={() => handleSort("tunnel_name")}>
            TUNNEL_NAME <SortIcon field="tunnel_name" />
          </div>
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700">SRC_IP</div>
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700">DST_IP</div>
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700 cursor-pointer hover:text-black dark:hover:text-white transition-colors" onClick={() => handleSort("ike_version")}>
            IKE <SortIcon field="ike_version" />
          </div>
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700">CIPHER</div>
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700 cursor-pointer hover:text-black dark:hover:text-white transition-colors" onClick={() => handleSort("dh_group")}>
            DH <SortIcon field="dh_group" />
          </div>
          <div className="px-2 py-2 border-r border-black dark:border-zinc-700 text-center">STATUS</div>
          <div className="px-2 py-2 cursor-pointer hover:text-black dark:hover:text-white transition-colors text-center" onClick={() => handleSort("risk_score")}>
            RISK <SortIcon field="risk_score" />
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto bg-white dark:bg-black">
          {loading ? (
            <div className="flex justify-center items-center h-32 text-orange-500 animate-pulse font-bold">
              [FETCHING TUNNEL CONFIGURATIONS...]
            </div>
          ) : tunnels.length === 0 ? (
            <div className="p-4 text-zinc-500">NO TUNNELS FOUND MATCHING CRITERIA.</div>
          ) : (
            tunnels.map((tunnel, i) => (
              <div key={tunnel.id}>
                {/* Main Row */}
                <div 
                  className={`grid grid-cols-[40px_1.5fr_1fr_1fr_80px_1fr_60px_80px_80px] border-b border-zinc-300 dark:border-zinc-800/50 cursor-pointer hover:bg-zinc-200 dark:hover:bg-[#1a1a1a] ${i % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-zinc-50 dark:bg-[#0f0f0f]'}`}
                  onClick={() => setExpandedRow(expandedRow === tunnel.id ? null : tunnel.id)}
                >
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-500 font-bold flex items-center justify-center">
                    {expandedRow === tunnel.id ? "[-]" : "[+]"}
                  </div>
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 font-bold text-black dark:text-white truncate flex items-center">
                    {tunnel.tunnel_name}
                  </div>
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400 flex items-center truncate">
                    {tunnel.source_ip}
                  </div>
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400 flex items-center truncate">
                    {tunnel.destination_ip}
                  </div>
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 flex items-center">
                    {tunnel.ike_version}
                  </div>
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 flex items-center truncate">
                    {tunnel.cipher}
                  </div>
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 flex items-center justify-center">
                    {tunnel.dh_group}
                  </div>
                  <div className="px-2 py-2 border-r border-zinc-300 dark:border-zinc-800/50 flex items-center justify-center">
                    {getStatusBadge(tunnel.status)}
                  </div>
                  <div className="px-2 py-2 flex items-center justify-center font-bold text-lg">
                    <span className={getRiskColor(tunnel.risk_score)}>{tunnel.risk_score}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRow === tunnel.id && (
                  <div className="border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] p-4 text-zinc-700 dark:text-zinc-400">
                    <div className="text-orange-500 font-bold mb-3">// EXTENDED TUNNEL DIAGNOSTICS: {tunnel.tunnel_name}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      
                      <div className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black p-2">
                        <div className="text-zinc-600 dark:text-zinc-500 mb-1">SA_LIFETIME</div>
                        <div className="text-black dark:text-white font-bold">{(tunnel.sa_lifetime / 3600).toFixed(1)} HRS</div>
                      </div>
                      
                      <div className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black p-2">
                        <div className="text-zinc-600 dark:text-zinc-500 mb-1">PFS_STATUS</div>
                        <div className="font-bold">
                          {tunnel.pfs ? (
                            <span className="text-green-500">[ENABLED]</span>
                          ) : (
                            <span className="text-red-500">[DISABLED]</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black p-2">
                        <div className="text-zinc-600 dark:text-zinc-500 mb-1">LAST_REKEY</div>
                        <div className="text-black dark:text-white font-bold truncate">
                          {new Date(tunnel.last_rekey).toISOString().replace("T", " ").slice(0, 19)}
                        </div>
                      </div>
                      
                      <div className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black p-2">
                        <div className="text-zinc-600 dark:text-zinc-500 mb-1">RISK_LEVEL_CLASS</div>
                        <div className={`font-bold ${getRiskColor(tunnel.risk_score)}`}>
                          [{tunnel.risk_level.toUpperCase()}]
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] flex justify-between text-[10px] text-zinc-500 font-bold shrink-0">
          <span>TOTAL_RECORDS: {tunnels.length}</span>
          <span>// END_OF_FILE</span>
        </div>
      </div>
    </div>
  );
}
