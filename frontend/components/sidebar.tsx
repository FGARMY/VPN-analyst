"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { DashboardData } from "@/types";

const navItems = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/topology", label: "NETWORK TOPOLOGY" },
  { href: "/tunnels", label: "VPN TUNNELS" },
  { href: "/packet-tracing", label: "PACKET TRACING" },
  { href: "/alerts", label: "ALERTS" },
  { href: "/live-logs", label: "LIVE LOGS" },
  { href: "/remediation", label: "AI REMEDIATION" },
  { href: "/reports", label: "REPORTS" },
  { href: "/settings", label: "SETTINGS" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error);
  }, []);

  return (
    <aside className="flex flex-col w-[250px] shrink-0 border-r border-black dark:border-zinc-700 bg-white dark:bg-black font-mono text-[12px] uppercase select-none tracking-tight text-zinc-700 dark:text-zinc-400">
      
      {/* Logo Block */}
      <div className="flex items-center px-4 h-14 border-b-[3px] border-orange-500 bg-zinc-100 dark:bg-[#0a0a0a]">
        <div className="w-5 h-5 border-2 border-orange-500 flex items-center justify-center mr-3 shrink-0">
          <div className="w-1.5 h-1.5 bg-orange-500" />
        </div>
        <span className="font-bold text-orange-500 tracking-wider">
          VPN_ANALYZER
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-0.5">
        <div className="px-4 mb-2 text-[10px] text-zinc-600 dark:text-zinc-500 font-bold tracking-widest">
          // SYSTEM MODULES
        </div>
        
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          
          let badge = null;
          if (item.href === "/dashboard" && data) {
            badge = <span className="ml-auto text-[10px] bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white px-1">RISK:{data.overall_risk_score}</span>;
          } else if (item.href === "/tunnels" && data) {
            badge = <span className="ml-auto text-[10px] bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white px-1">{data.active_tunnels}/{data.total_tunnels}</span>;
          } else if (item.href === "/alerts" && data && data.critical_alerts > 0) {
            badge = <span className="ml-auto text-[10px] bg-red-500 text-black px-1 font-bold animate-pulse">{data.critical_alerts} CRIT</span>;
          } else if (item.href === "/live-logs" || item.href === "/packet-tracing") {
            badge = <span className="ml-auto text-[10px] text-green-500 animate-pulse">● LIVE</span>;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center px-4 py-2 transition-colors relative",
                isActive
                  ? "bg-zinc-200 dark:bg-[#111] text-black dark:text-white"
                  : "hover:bg-zinc-100 dark:hover:bg-[#0a0a0a] hover:text-zinc-800 dark:hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
              )}
              <span className="w-4 inline-block opacity-50 font-bold group-hover:opacity-100 transition-opacity">
                {isActive ? ">" : "-"}
              </span>
              <span className={isActive ? "font-bold" : ""}>
                {isActive ? `[${item.label}]` : item.label}
              </span>
              {badge}
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a]">
        <div className="text-[10px] text-zinc-600 dark:text-zinc-500 font-bold mb-1">// STATUS</div>
        <div className="flex items-center gap-2 text-green-500 font-bold">
          <div className="w-2 h-2 bg-green-500 animate-pulse" />
          SYSTEM NOMINAL
        </div>
      </div>
    </aside>
  );
}
