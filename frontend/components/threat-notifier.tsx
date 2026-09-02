"use client";

import { useState, useEffect, useCallback } from "react";

export interface ThreatAlert {
  id: string; // The packet ID
  src_ip: string;
  risk_score: number;
  threat_pattern: string;
  timestamp: number;
}

interface ThreatNotifierProps {
  alerts: ThreatAlert[];
  onDismiss: (id: string) => void;
}

export function ThreatNotifier({ alerts, onDismiss }: ThreatNotifierProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-8 z-50 flex flex-col gap-2 pointer-events-none w-80">
      {alerts.map((alert) => (
        <div 
          key={alert.id}
          className="pointer-events-auto border-2 border-black dark:border-zinc-700 bg-red-600 text-white p-3 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#333] animate-in slide-in-from-right-10 fade-in duration-200"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold text-[14px] uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse block"></span>
              CRITICAL THREAT
            </div>
            <button 
              onClick={() => onDismiss(alert.id)}
              className="text-white hover:text-black font-bold text-[12px] uppercase"
            >
              [X]
            </button>
          </div>
          
          <div className="font-mono text-[11px] uppercase space-y-1 opacity-90">
            <div className="flex justify-between">
              <span>TARGET:</span>
              <span className="font-bold">{alert.src_ip}</span>
            </div>
            <div className="flex justify-between">
              <span>PATTERN:</span>
              <span className="font-bold truncate ml-2 text-right">{alert.threat_pattern}</span>
            </div>
            <div className="flex justify-between">
              <span>RISK SCORE:</span>
              <span className="font-bold">{alert.risk_score}/100</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
