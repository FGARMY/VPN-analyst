"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardData } from "@/types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const RISK_COLORS: Record<string, string> = {
  Safe: "#22c55e",
  Medium: "#eab308",
  High: "#f97316",
  Critical: "#ef4444",
};

function getRiskColor(score: number) {
  if (score >= 70) return "#ef4444";
  if (score >= 45) return "#f97316";
  if (score >= 25) return "#eab308";
  return "#22c55e";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [protocolData, setProtocolData] = useState<any[]>([]);
  const [threatData, setThreatData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getProtocolDistribution(),
      api.getThreatGeography()
    ])
      .then(([dashData, protoData, geoData]) => {
        setData(dashData);
        setProtocolData(protoData);
        setThreatData(geoData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-orange-500 font-mono text-sm font-bold uppercase animate-pulse">
        [INITIALIZING SYSTEM TELEMETRY...]
      </div>
    );
  }

  if (!data) return null;

  const pieData = Object.entries(data.risk_distribution).map(([name, value]) => ({
    name,
    value,
  }));

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
    <div className="space-y-4 font-mono text-[11px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300">
      
      {/* ── Top Overview Bar ── */}
      <div className="flex flex-wrap gap-4">
        {/* Risk Score */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] p-3 flex-1 min-w-[200px]">
          <div className="text-zinc-500 font-bold mb-2">// OVERALL RISK</div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold" style={{ color: getRiskColor(data.overall_risk_score) }}>
              {data.overall_risk_score}
            </span>
            <span className="text-zinc-500">[{data.risk_trend}]</span>
          </div>
        </div>

        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] p-3 flex-1 min-w-[200px]">
          <div className="text-zinc-500 font-bold mb-2">// ACTIVE TUNNELS</div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-black dark:text-white">{data.active_tunnels}</span>
            <span className="text-zinc-500">/ {data.total_tunnels} TOTAL</span>
          </div>
        </div>

        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] p-3 flex-1 min-w-[200px]">
          <div className="text-zinc-500 font-bold mb-2">// CRITICAL ALERTS</div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-red-500">{data.critical_alerts}</span>
            <span className="text-zinc-500">UNRESOLVED</span>
          </div>
        </div>
      </div>

      {/* ── AI Insights ── */}
      <div className="border border-orange-500 bg-zinc-200 dark:bg-[#111] p-3">
        <div className="text-orange-500 font-bold mb-2 flex justify-between">
          <span>// AI DIAGNOSTIC INSIGHTS</span>
          <span className="animate-pulse">_</span>
        </div>
        <div className="space-y-1">
          {data.ai_insights.map((insight, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-500 shrink-0">[{i + 1}]</span>
              <span className="text-zinc-900 dark:text-zinc-300">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traffic Line Chart */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [VPN TRAFFIC_THROUGHPUT]
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.traffic_data}>
                <CartesianGrid strokeDasharray="2 2" stroke="#333" />
                <XAxis dataKey="time" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="stepAfter"
                  dataKey="throughput"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="MBPS"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Trend */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [SECURITY_TREND (30D)]
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.security_trend}>
                <CartesianGrid strokeDasharray="2 2" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="stepAfter" dataKey="avgRisk" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} name="AVG RISK" />
                <Line type="stepAfter" dataKey="alerts" stroke="#eab308" strokeWidth={2} dot={false} name="ALERTS" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Deep Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Protocol Distribution */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [PROTOCOL_DISTRIBUTION]
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={protocolData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#333" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#f97316" radius={[0, 2, 2, 0]} name="%" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Geography / Scatter */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [ACTIVE_THREAT_VECTORS_BY_REGION]
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#333" />
                <XAxis dataKey="risk" type="number" name="RISK SCORE" domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="location" type="category" name="REGION" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                <ZAxis dataKey="count" type="number" range={[50, 400]} name="PACKET VOL" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="THREATS" data={threatData} fill="#ef4444" opacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Tunnel Risk & Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        
        {/* Risk Distribution / Tunnels */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [TUNNEL_RISK_DISTRIBUTION]
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#0a0a0a"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#666"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-2 mt-4 text-center">
              {Object.entries(data.tunnel_statuses).map(([status, count]) => (
                <div key={status} className="border border-zinc-300 dark:border-zinc-800 p-2 bg-zinc-200 dark:bg-[#111]">
                  <div className="text-zinc-500">{status}</div>
                  <div className="text-black dark:text-white font-bold">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white flex justify-between">
            <span>[RECENT_ALERTS_LOG]</span>
            <span className="text-zinc-500">LATEST {data.recent_alerts.slice(0, 8).length}</span>
          </div>
          <div className="flex-1 overflow-auto">
            {/* Table Header */}
            <div className="grid grid-cols-[120px_100px_1fr_150px] border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] text-zinc-500 font-bold">
              <div className="px-3 py-2 border-r border-black dark:border-zinc-700">TIMESTAMP</div>
              <div className="px-3 py-2 border-r border-black dark:border-zinc-700">SEVERITY</div>
              <div className="px-3 py-2 border-r border-black dark:border-zinc-700">EVENT_MSG</div>
              <div className="px-3 py-2">TARGET_NODE</div>
            </div>
            
            {/* Table Rows */}
            {data.recent_alerts.slice(0, 8).map((alert, i) => {
              const date = new Date(alert.created_at);
              const ts = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
              return (
                <div key={alert.id} className={`grid grid-cols-[120px_100px_1fr_150px] border-b border-zinc-300 dark:border-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-[#1a1a1a] ${i % 2 === 0 ? 'bg-zinc-100 dark:bg-[#0a0a0a]' : 'bg-zinc-50 dark:bg-[#0f0f0f]'}`}>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-500">{ts}</div>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50">
                    {alert.severity === "Critical" && <span className="text-black bg-red-500 px-1 font-bold">CRIT</span>}
                    {alert.severity === "High" && <span className="text-orange-500 px-1 font-bold">HIGH</span>}
                    {alert.severity === "Medium" && <span className="text-yellow-500 px-1 font-bold">MED</span>}
                    {alert.severity === "Low" && <span className="text-blue-500 px-1 font-bold">LOW</span>}
                  </div>
                  <div className={`px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 truncate ${alert.severity === 'Critical' ? 'text-red-400' : 'text-zinc-900 dark:text-zinc-300'}`}>
                    {alert.title}
                  </div>
                  <div className="px-3 py-2 text-zinc-500 truncate">{alert.tunnel_name}</div>
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
