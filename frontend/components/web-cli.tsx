"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

interface HistoryEntry {
  id: string;
  type: "input" | "output";
  content: string;
}

export function WebCLI() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([
    { id: "init", type: "output", content: "VPN ANALYZER SECURE SHELL v2.4.1\nTYPE 'help' FOR A LIST OF COMMANDS." }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input.trim();
    setInput("");
    
    setHistory(prev => [...prev, { id: Date.now().toString(), type: "input", content: `> ${cmd}` }]);
    
    if (cmd.toLowerCase() === "clear") {
      setHistory([]);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.executeCLICommand(cmd);
      setHistory(prev => [...prev, { id: (Date.now() + 1).toString(), type: "output", content: res.output }]);
    } catch (e) {
      setHistory(prev => [...prev, { id: (Date.now() + 1).toString(), type: "output", content: "ERROR: CONNECTION REFUSED." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`fixed bottom-0 left-[250px] right-0 border-t-4 border-orange-500 bg-black font-mono text-[12px] uppercase transition-all duration-300 z-50 flex flex-col ${isOpen ? 'h-[350px]' : 'h-10'}`}>
      {/* Header Bar */}
      <div 
        className="flex justify-between items-center px-4 h-10 bg-zinc-900 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-orange-500">
          <span className={isProcessing ? "animate-spin" : ""}>_</span>
          <span>TERMINAL_EMULATOR</span>
        </div>
        <div className="text-zinc-500 font-bold hover:text-white transition-colors">
          {isOpen ? "[_MINIMIZE]" : "[^EXPAND]"}
        </div>
      </div>

      {/* Terminal Body */}
      {isOpen && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
          
          {/* Background Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <svg width="100%" height="100%">
              <pattern id="cli-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#cli-grid)" />
            </svg>
          </div>

          {/* Output Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-auto whitespace-pre-wrap flex flex-col gap-1 pb-4 z-10"
            onClick={() => inputRef.current?.focus()}
          >
            {history.map(entry => (
              <div 
                key={entry.id} 
                className={`${entry.type === 'input' ? 'text-zinc-400 font-bold' : 'text-green-500'}`}
              >
                {entry.content}
              </div>
            ))}
            {isProcessing && (
              <div className="text-orange-500 animate-pulse">PROCESSING...</div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-2 z-10">
            <span className="text-orange-500 font-bold">&gt;</span>
            <input 
              ref={inputRef}
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              className="flex-1 bg-transparent border-none outline-none text-green-500 font-bold caret-orange-500 disabled:opacity-50"
              placeholder="ENTER COMMAND..."
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </div>
      )}
    </div>
  );
}
