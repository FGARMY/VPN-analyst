"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function RemediationPage() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [strictness, setStrictness] = useState(50);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = () => {
    setLoading(true);
    api.getRemediationState()
      .then(data => {
        setState(data);
        setStrictness(data.strictness_level);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleAction = async (id: string, action: string) => {
    setActionStatus(`PROCESSING [${id}] -> ${action}`);
    try {
      await api.remediationAction(id, action);
      await fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setActionStatus(null);
    }
  };

  const updateStrictness = async (val: number) => {
    setStrictness(val);
    try {
      await api.updateStrictness(val);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !state) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-3rem)] text-orange-500 animate-pulse font-bold font-mono text-sm uppercase">
        [INITIALIZING REMEDIATION CENTER...]
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] font-mono text-[12px] uppercase tracking-tight text-zinc-900 dark:text-zinc-300 select-none p-4 gap-4 overflow-auto">
      
      {/* Header Block */}
      <div className="border border-orange-500 bg-orange-500/10 p-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-orange-500 font-bold text-lg mb-1">// AI_REMEDIATION_CENTER</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            REVIEW AND MANAGE AUTOMATED THREAT RESPONSES FROM THE AI ENGINE.
          </div>
        </div>
        
        {/* Strictness Slider */}
        <div className="border border-black dark:border-zinc-700 bg-white dark:bg-black p-3 w-full md:w-64">
          <div className="flex justify-between font-bold mb-2">
            <span>AI_STRICTNESS</span>
            <span className={strictness > 75 ? 'text-red-500' : strictness > 40 ? 'text-orange-500' : 'text-green-500'}>
              [{strictness}%]
            </span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={strictness}
            onChange={(e) => setStrictness(parseInt(e.target.value))}
            onMouseUp={(e) => updateStrictness(parseInt(e.currentTarget.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>MONITOR</span>
            <span>AGGRESSIVE</span>
          </div>
        </div>
      </div>

      {actionStatus && (
        <div className="border border-orange-500 bg-orange-500 text-black font-bold p-2 text-center animate-pulse">
          {actionStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        
        {/* Pending Rules */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col min-h-[300px]">
          <div className="px-3 py-2 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [PENDING_FIREWALL_RULES]
          </div>
          <div className="flex-1 overflow-auto bg-white dark:bg-black p-4 space-y-3">
            {state?.pending_rules.map((rule: any) => (
              <div key={rule.id} className="border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111] p-3 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-zinc-300 dark:border-zinc-800/50 pb-2">
                  <div className="font-bold text-black dark:text-white">{rule.id}</div>
                  <div className="text-zinc-500">CONFIDENCE: <span className="text-orange-500 font-bold">{rule.confidence}%</span></div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="text-zinc-500">TARGET: </span>
                    <span className="font-bold">{rule.target}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-zinc-500">ACTION: </span>
                    <span className={`font-bold ${rule.action === 'BLOCK' ? 'text-red-500' : 'text-orange-500'}`}>
                      [{rule.action}]
                    </span>
                  </div>
                </div>
                
                {rule.status === "pending" ? (
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => handleAction(rule.id, "approve")}
                      className="flex-1 border border-green-500 text-green-500 hover:bg-green-500/10 py-1.5 font-bold transition-colors"
                    >
                      [APPROVE]
                    </button>
                    <button 
                      onClick={() => handleAction(rule.id, "reject")}
                      className="flex-1 border border-red-500 text-red-500 hover:bg-red-500/10 py-1.5 font-bold transition-colors"
                    >
                      [REJECT]
                    </button>
                  </div>
                ) : (
                  <div className={`mt-2 py-1.5 font-bold text-center border ${rule.status === 'approve' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
                    [{rule.status.toUpperCase()}D]
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quarantined IPs */}
        <div className="border border-black dark:border-zinc-700 bg-zinc-100 dark:bg-[#0a0a0a] flex flex-col min-h-[300px]">
          <div className="px-3 py-2 border-b border-black dark:border-zinc-700 bg-zinc-200 dark:bg-[#1a1a1a] font-bold text-black dark:text-white">
            [QUARANTINED_IPS]
          </div>
          <div className="flex-1 overflow-auto bg-white dark:bg-black">
            <div className="grid grid-cols-[1fr_1fr_100px] border-b border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-[#111] text-zinc-500 font-bold">
              <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800">IP_ADDRESS</div>
              <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800">AI_REASON</div>
              <div className="px-3 py-2 text-right">TIME</div>
            </div>
            {state?.quarantined_ips.map((q: any, i: number) => {
              const date = new Date(q.timestamp * 1000);
              const ts = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              
              return (
                <div key={i} className={`grid grid-cols-[1fr_1fr_100px] border-b border-zinc-300 dark:border-zinc-800/50 ${i % 2 === 0 ? 'bg-zinc-50 dark:bg-[#0a0a0a]' : 'bg-white dark:bg-[#0f0f0f]'}`}>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 font-bold text-red-500">{q.ip}</div>
                  <div className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-400 truncate">{q.reason}</div>
                  <div className="px-3 py-2 text-zinc-500 text-right">{ts}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
