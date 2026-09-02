"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300 select-none">
      
      {/* ── Header ── */}
      <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-100 dark:bg-[#0a0a0a] p-3 mb-4 shrink-0 flex justify-between items-center">
        <div>
          <span className="text-zinc-500 dark:text-zinc-500 font-bold">SYS_CONFIG // </span>
          <span className="text-black dark:text-white font-bold">APPLICATION PREFERENCES</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        
        {/* Appearance */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [APPEARANCE_CONFIG]
          </div>
          <div className="p-4 space-y-4">
            <div className="text-zinc-500 dark:text-zinc-500">
              SYSTEM UI SUPPORTS <span className="text-orange-500 font-bold">BRUTALIST_DARK</span> AND <span className="text-orange-500 font-bold">BRUTALIST_LIGHT</span> THEMES.
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setTheme("dark")}
                className={`flex-1 border-2 p-4 text-center font-bold ${theme === "dark" ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-[#111] text-zinc-600 dark:text-zinc-500 hover:border-orange-500"}`}
              >
                [DARK_MODE]
              </button>
              <button 
                onClick={() => setTheme("light")}
                className={`flex-1 border-2 p-4 text-center font-bold ${theme === "light" ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-[#111] text-zinc-600 dark:text-zinc-500 hover:border-orange-500"}`}
              >
                [LIGHT_MODE]
              </button>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [API_CONFIGURATION]
          </div>
          <div className="p-0 flex flex-col">
            <div className="grid grid-cols-[150px_1fr] border-b border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0f0f0f]">
              <div className="p-3 border-r border-zinc-300 dark:border-zinc-800 text-zinc-500 font-bold">BACKEND_URL</div>
              <div className="p-3 text-black dark:text-white font-bold">HTTP://LOCALHOST:8000</div>
            </div>
            <div className="grid grid-cols-[150px_1fr] border-b border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black">
              <div className="p-3 border-r border-zinc-300 dark:border-zinc-800 text-zinc-500 font-bold">API_STATUS</div>
              <div className="p-3 text-green-500 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 animate-pulse" />
                CONNECTED
              </div>
            </div>
            <div className="grid grid-cols-[150px_1fr] bg-zinc-50 dark:bg-[#0f0f0f]">
              <div className="p-3 border-r border-zinc-300 dark:border-zinc-800 text-zinc-500 font-bold">DATA_MODE</div>
              <div className="p-3 text-orange-500 font-bold">[IN-MEMORY_DEMO]</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="px-3 py-1.5 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [SYSTEM_INFORMATION]
          </div>
          <div className="p-4 space-y-3">
            <div className="text-zinc-900 dark:text-zinc-300">
              <span className="font-bold text-black dark:text-white">IPSEC_VPN_ANALYZER</span> // AI-POWERED SECURITY ASSESSMENT FRAMEWORK
            </div>
            <div className="text-zinc-500">
              BUILD: VERSION 1.2.0 (BRUTALIST_EDITION)
            </div>
            
            <div className="pt-2">
              <div className="text-zinc-600 dark:text-zinc-500 mb-2 font-bold">TECH_STACK:</div>
              <div className="flex flex-wrap gap-2">
                {["NEXT.JS", "TYPESCRIPT", "TAILWIND_CSS", "FASTAPI", "RECHARTS"].map((tech) => (
                  <div key={tech} className="border border-black dark:border-zinc-700 bg-white dark:bg-black px-2 py-1 text-zinc-700 dark:text-zinc-400 font-bold">
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
