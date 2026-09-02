"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { api } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [criticalAlerts, setCriticalAlerts] = useState(0);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace("T", " ").slice(0, 19) + " UTC"
      );
    }, 1000);

    // Fetch initial alert count
    api.getDashboard().then(data => {
      setCriticalAlerts(data.critical_alerts);
    }).catch(console.error);

    return () => clearInterval(timer);
  }, []);

  const routeName = pathname?.substring(1).toUpperCase() || "DASHBOARD";

  return (
    <header className="h-12 border-b border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex items-center justify-between px-4 sticky top-0 z-50 font-mono text-[12px] uppercase tracking-tight text-zinc-700 dark:text-zinc-400 select-none shrink-0">
      
      {/* Left — Breadcrumb / Route */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-zinc-600 dark:text-zinc-500">SYS_VIEW //</span>
          <span className="text-orange-500 font-bold">[{routeName}]</span>
        </div>
      </div>

      {/* Center — Search (Raw Input) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="flex w-full items-center border border-black dark:border-zinc-700 bg-white dark:bg-black">
          <span className="px-2 text-zinc-600 dark:text-zinc-500 border-r border-black dark:border-zinc-700">&gt;</span>
          <input
            type="text"
            placeholder="QUERY SYSTEM..."
            className="flex-1 bg-transparent border-none outline-none text-black dark:text-white px-2 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 uppercase"
          />
        </div>
      </div>

      {/* Right — Actions / Time */}
      <div className="flex items-center gap-4">
        {mounted && (
          <div className="text-zinc-500">
            {currentTime}
          </div>
        )}
        
        <div className="flex gap-2">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-2 border border-black dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors uppercase text-zinc-700 dark:text-zinc-400 font-bold"
            >
              [{theme === 'dark' ? 'LIGHT' : 'DARK'}]
            </button>
          )}
          <Link href="/alerts" className="px-2 border border-black dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-400 flex items-center">
            [ALERTS: <span className="text-orange-500 font-bold ml-1">{mounted ? criticalAlerts : '-'}</span>]
          </Link>
          <div className="px-2 border border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#111] font-bold text-black dark:text-white">
            [USER: SA]
          </div>
        </div>
      </div>
    </header>
  );
}
