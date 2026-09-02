"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AlertsResponse } from "@/types";

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .getAlerts({
        severity: severity !== "all" ? severity : undefined,
        search: search || undefined,
        page,
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, severity, page]);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300 select-none">
      
      {/* ── Top Summary & Filters ── */}
      <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col mb-4 shrink-0">
        
        {/* Severity Summary */}
        <div className="flex border-b border-black dark:border-zinc-700 bg-white dark:bg-black">
          <div className="flex-1 px-4 py-2 border-r border-black dark:border-zinc-700 text-center">
            <div className="text-zinc-600 dark:text-zinc-500 font-bold mb-1">TOTAL</div>
            <div className="text-2xl text-black dark:text-white font-bold">{data?.counts?.total ?? "-"}</div>
          </div>
          <div className="flex-1 px-4 py-2 border-r border-black dark:border-zinc-700 text-center">
            <div className="text-zinc-600 dark:text-zinc-500 font-bold mb-1">CRIT</div>
            <div className="text-2xl text-red-500 font-bold">{data?.counts?.critical ?? "-"}</div>
          </div>
          <div className="flex-1 px-4 py-2 border-r border-black dark:border-zinc-700 text-center">
            <div className="text-zinc-600 dark:text-zinc-500 font-bold mb-1">HIGH</div>
            <div className="text-2xl text-orange-500 font-bold">{data?.counts?.high ?? "-"}</div>
          </div>
          <div className="flex-1 px-4 py-2 border-r border-black dark:border-zinc-700 text-center">
            <div className="text-zinc-600 dark:text-zinc-500 font-bold mb-1">MED</div>
            <div className="text-2xl text-yellow-500 font-bold">{data?.counts?.medium ?? "-"}</div>
          </div>
          <div className="flex-1 px-4 py-2 text-center">
            <div className="text-zinc-600 dark:text-zinc-500 font-bold mb-1">LOW</div>
            <div className="text-2xl text-blue-500 font-bold">{data?.counts?.low ?? "-"}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row p-3 gap-3">
          {/* Search */}
          <div className="flex flex-1 items-center border border-black dark:border-zinc-700 bg-white dark:bg-black">
            <span className="px-3 text-zinc-600 dark:text-zinc-500 border-r border-black dark:border-zinc-700 font-bold">Q_</span>
            <input
              type="text"
              placeholder="SEARCH ALERTS, IPs, TUNNELS..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-transparent border-none outline-none text-black dark:text-white px-3 placeholder:text-zinc-600 dark:text-zinc-500 uppercase"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center border border-black dark:border-zinc-700 bg-white dark:bg-black">
            <span className="px-3 text-zinc-600 dark:text-zinc-500 border-r border-black dark:border-zinc-700 font-bold">SEV</span>
            <select 
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-black dark:text-white px-3 uppercase appearance-none cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900 py-2 min-w-[120px]"
            >
              <option value="all">ALL SEVERITY</option>
              <option value="Critical">CRITICAL</option>
              <option value="High">HIGH</option>
              <option value="Medium">MEDIUM</option>
              <option value="Low">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Alert List ── */}
      <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex-1 flex flex-col min-h-0">
        <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
          [SYSTEM_SECURITY_LOG]
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-black p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32 text-orange-500 animate-pulse font-bold">
              [FETCHING SECURITY ALERTS...]
            </div>
          ) : data?.alerts.length === 0 ? (
            <div className="text-zinc-500">NO ALERTS FOUND MATCHING CRITERIA.</div>
          ) : (
            data?.alerts.map((alert) => {
              const date = new Date(alert.created_at);
              const ts = `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
              
              let sevColor = "text-zinc-500";
              let sevBg = "bg-zinc-900";
              if (alert.severity === "Critical") { sevColor = "text-black"; sevBg = "bg-red-500"; }
              else if (alert.severity === "High") { sevColor = "text-black"; sevBg = "bg-orange-500"; }
              else if (alert.severity === "Medium") { sevColor = "text-black"; sevBg = "bg-yellow-500"; }
              else if (alert.severity === "Low") { sevColor = "text-black"; sevBg = "bg-blue-500"; }

              return (
                <div key={alert.id} className={`border border-black dark:border-zinc-700 bg-zinc-50 dark:bg-[#0f0f0f] flex flex-col ${alert.severity === "Critical" ? "border-red-900" : ""}`}>
                  
                  {/* Alert Header */}
                  <div className="flex flex-wrap items-center justify-between border-b border-zinc-300 dark:border-zinc-800/50 bg-zinc-200 dark:bg-[#1a1a1a] p-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-0.5 font-bold ${sevBg} ${sevColor}`}>
                        [{alert.severity.toUpperCase()}]
                      </div>
                      <div className={`font-bold ${alert.severity === "Critical" ? "text-red-500" : "text-black dark:text-white"}`}>
                        {alert.title}
                      </div>
                    </div>
                    <div className="flex gap-4 text-zinc-500">
                      <span>TARGET: <span className="text-zinc-900 dark:text-zinc-300 font-bold">{alert.tunnel_name}</span></span>
                      <span>TS: {ts}</span>
                    </div>
                  </div>

                  {/* Alert Body */}
                  <div className="p-3">
                    <div className="text-zinc-700 dark:text-zinc-400 mb-3 leading-relaxed">
                      {alert.description}
                    </div>
                    <div className="border border-orange-900/50 bg-orange-500/5 p-2 text-orange-500">
                      <span className="font-bold">// AI_RECOMMENDATION: </span>
                      {alert.recommendation}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer / Pagination */}
        {data && (
          <div className="px-3 py-1.5 border-t border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] flex justify-between items-center text-[10px] font-bold shrink-0">
            <span className="text-zinc-500">
              PAGE {data.page} OF {data.total_pages} [{data.total} TOTAL]
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2 border border-black dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 text-black dark:text-white"
              >
                [PREV]
              </button>
              <button 
                disabled={page >= data.total_pages}
                onClick={() => setPage(page + 1)}
                className="px-2 border border-black dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 text-black dark:text-white"
              >
                [NEXT]
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
