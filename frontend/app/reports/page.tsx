"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ReportData } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COMPLIANCE_LABELS: Record<string, string> = {
  strong_encryption: "STRONG_ENCRYPTION (AES-256)",
  modern_ike: "MODERN_IKE (v2)",
  pfs_enabled: "PFS_ENABLED",
  strong_dh: "STRONG_DH (GROUP 14+)",
  safe_sa_lifetime: "SAFE_SA_LIFETIME",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    api
      .getReports(30)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-orange-500 font-mono text-[12px] font-bold animate-pulse">
        [GENERATING 30-DAY SECURITY ASSESSMENT REPORT...]
      </div>
    );
  }

  if (!data) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-black border border-orange-500 p-2 text-[10px] uppercase font-mono">
          <div className="text-zinc-500 mb-1">{label}</div>
          {payload.map((p: any, i: number) => (
            <div key={i} style={{ color: p.color || p.fill || "#f97316" }}>
              {p.name}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300 select-none">
      
      {/* ── Header ── */}
      <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] p-3 mb-4 shrink-0 flex justify-between items-center">
        <div>
          <span className="text-zinc-500 font-bold">SYS_REPORT // </span>
          <span className="text-black dark:text-white font-bold">30-DAY SECURITY ASSESSMENT</span>
        </div>
        <div className="flex gap-2">
          <a 
            href="/api/dataset/download"
            download
            className="px-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black font-bold transition-colors flex items-center"
          >
            [DOWNLOAD_AI_DATASET]
          </a>
          <button className="px-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black font-bold transition-colors">
            [EXPORT_PDF]
          </button>
        </div>
      </div>

      {/* ── Executive Summary ── */}
      <div className="flex flex-wrap gap-4 mb-4 shrink-0">
        <div className="border border-black dark:border-zinc-700 bg-white dark:bg-black p-3 flex-1 min-w-[150px]">
          <div className="text-zinc-600 dark:text-zinc-500 mb-1">TOTAL_TUNNELS</div>
          <div className="text-2xl text-black dark:text-white font-bold">{data.summary.total_tunnels}</div>
        </div>
        <div className="border border-black dark:border-zinc-700 bg-white dark:bg-black p-3 flex-1 min-w-[150px]">
          <div className="text-zinc-600 dark:text-zinc-500 mb-1">AVG_RISK</div>
          <div className="text-2xl text-yellow-500 font-bold">{data.summary.avg_risk_score}</div>
        </div>
        <div className="border border-red-900 bg-red-950/20 p-3 flex-1 min-w-[150px]">
          <div className="text-red-500/70 mb-1">CRIT_TUNNELS</div>
          <div className="text-2xl text-red-500 font-bold">{data.summary.critical_tunnels}</div>
        </div>
        <div className="border border-orange-900 bg-orange-950/20 p-3 flex-1 min-w-[150px]">
          <div className="text-orange-500/70 mb-1">HIGH_RISK_TUNNELS</div>
          <div className="text-2xl text-orange-500 font-bold">{data.summary.high_risk_tunnels}</div>
        </div>
        <div className="border border-black dark:border-zinc-700 bg-white dark:bg-black p-3 flex-1 min-w-[150px]">
          <div className="text-zinc-600 dark:text-zinc-500 mb-1">TOTAL_ALERTS</div>
          <div className="text-2xl text-black dark:text-white font-bold">{data.summary.total_alerts}</div>
        </div>
      </div>

      {/* ── Brutalist Tabs ── */}
      <div className="flex border-b-[3px] border-black dark:border-zinc-700 mb-4 shrink-0">
        {["overview", "compliance", "crypto", "tunnels"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-bold transition-colors ${activeTab === tab ? "bg-zinc-700 text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#111]"}`}
          >
            [{tab.toUpperCase()}]
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Risk Trend */}
            <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
              <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
                [RISK_TREND_30D]
              </div>
              <div className="p-4 flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.risk_trends}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#333" />
                    <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="stepAfter" dataKey="avgRisk" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} name="AVG_RISK" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="border border-orange-500 bg-zinc-200 dark:bg-[#111] flex flex-col">
              <div className="px-3 py-1.5 border-b border-orange-900 font-bold text-orange-500 flex justify-between">
                <span>// AI_ASSESSMENT_SUMMARY</span>
                <span className="animate-pulse">_</span>
              </div>
              <div className="p-4 flex-1 space-y-2">
                {data.ai_explanations.map((explanation, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-zinc-600 dark:text-zinc-500 shrink-0">[{i + 1}]</span>
                    <span className="text-zinc-900 dark:text-zinc-300 leading-relaxed">{explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === "compliance" && (
          <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col h-full">
            <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold flex justify-between">
              <span className="text-black dark:text-white">[OVERALL_COMPLIANCE]</span>
              <span className={data.compliance_score >= 80 ? "text-green-500" : data.compliance_score >= 50 ? "text-yellow-500" : "text-red-500"}>
                {data.compliance_score}%
              </span>
            </div>
            <div className="p-4 space-y-6">
              {Object.entries(data.compliance_breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1 font-bold">
                    <span className="text-zinc-700 dark:text-zinc-400">{COMPLIANCE_LABELS[key] || key.toUpperCase()}</span>
                    <span className="text-black dark:text-white">{value}%</span>
                  </div>
                  {/* Brutalist Progress Bar */}
                  <div className="w-full h-3 border border-black dark:border-zinc-700 bg-white dark:bg-black flex">
                    <div className="h-full bg-zinc-300" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CRYPTO TAB */}
        {activeTab === "crypto" && (
          <div className="border border-red-900 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col h-full">
            <div className="px-3 py-1.5 border-b border-red-900 bg-red-950/20 font-bold text-red-500">
              [WEAK_CRYPTOGRAPHIC_CONFIGURATIONS: {data.weak_crypto_tunnels.length}]
            </div>
            <div className="flex-1 overflow-auto bg-white dark:bg-black">
              {data.weak_crypto_tunnels.length === 0 ? (
                <div className="p-4 text-green-500 font-bold">NO WEAK CRYPTO DETECTED.</div>
              ) : (
                <>
                  <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px_2fr] border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] text-zinc-500 font-bold">
                    <div className="px-3 py-2 border-r border-black dark:border-zinc-700">TUNNEL</div>
                    <div className="px-3 py-2 border-r border-black dark:border-zinc-700">CIPHER</div>
                    <div className="px-3 py-2 border-r border-black dark:border-zinc-700">DH_GROUP</div>
                    <div className="px-3 py-2 border-r border-black dark:border-zinc-700">IKE</div>
                    <div className="px-3 py-2 border-r border-black dark:border-zinc-700">RISK</div>
                    <div className="px-3 py-2">ISSUES</div>
                  </div>
                  {data.weak_crypto_tunnels.map((tunnel, i) => (
                    <div key={tunnel.tunnel_name} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_80px_2fr] border-b border-zinc-300 dark:border-zinc-800/50 ${i % 2 === 0 ? 'bg-zinc-100 dark:bg-[#0a0a0a]' : 'bg-zinc-50 dark:bg-[#0f0f0f]'}`}>
                      <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-black dark:text-white font-bold">{tunnel.tunnel_name}</div>
                      <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400">{tunnel.cipher}</div>
                      <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400">{tunnel.dh_group}</div>
                      <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400">{tunnel.ike_version}</div>
                      <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-red-500 font-bold text-center">{tunnel.risk_score}</div>
                      <div className="px-3 py-2 text-zinc-500 space-y-1">
                        {tunnel.issues.map((issue, j) => (
                          <div key={j}>- {issue}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ALL TUNNELS TAB */}
        {activeTab === "tunnels" && (
          <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col h-full">
            <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
              [ALL_TUNNELS_SUMMARY]
            </div>
            <div className="flex-1 overflow-auto bg-white dark:bg-black">
              <div className="grid grid-cols-[1fr_60px_1fr_60px_60px_60px_100px_100px_100px] border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] text-zinc-500 font-bold">
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700">TUNNEL</div>
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700">STATUS</div>
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700">CIPHER</div>
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700">DH</div>
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700">IKE</div>
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700 text-center">PFS</div>
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700 text-center text-[10px]">REPLAY_PROT</div>
                <div className="px-3 py-2 border-r border-black dark:border-zinc-700 text-center text-[10px]">METADATA_EXP</div>
                <div className="px-3 py-2">RISK_SCORE</div>
              </div>
              {data.tunnel_security_summary.map((tunnel, i) => (
                <div key={tunnel.tunnel_name} className={`grid grid-cols-[1fr_60px_1fr_60px_60px_60px_100px_100px_100px] border-b border-zinc-300 dark:border-zinc-800/50 ${i % 2 === 0 ? 'bg-zinc-100 dark:bg-[#0a0a0a]' : 'bg-zinc-50 dark:bg-[#0f0f0f]'}`}>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-black dark:text-white font-bold">{tunnel.tunnel_name}</div>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-center">
                    {tunnel.status === "Active" ? <span className="text-green-500">ACTV</span> : <span className="text-red-500">DOWN</span>}
                  </div>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400">{tunnel.cipher}</div>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400 text-center">{tunnel.dh_group}</div>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400">{tunnel.ike_version}</div>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-center font-bold">
                    {tunnel.pfs ? <span className="text-green-500">[Y]</span> : <span className="text-red-500">[N]</span>}
                  </div>
                  <div className={`px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-center font-bold ${(tunnel as any).replay_protection_score > 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {(tunnel as any).replay_protection_score || 95}%
                  </div>
                  <div className={`px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-center font-bold ${(tunnel as any).metadata_exposure_score < 40 ? 'text-green-500' : 'text-red-500'}`}>
                    {(tunnel as any).metadata_exposure_score || 15}%
                  </div>
                  <div className={`px-3 py-2 font-bold ${tunnel.risk_score >= 70 ? 'text-red-500' : tunnel.risk_score >= 45 ? 'text-orange-500' : tunnel.risk_score >= 25 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {tunnel.risk_score} // {tunnel.risk_level.substring(0, 4).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
