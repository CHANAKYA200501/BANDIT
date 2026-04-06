import React, { useState, useEffect, useRef } from 'react';
import { useThreatStore } from '../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, ShieldAlert, Cpu, Database, Zap, Skull } from 'lucide-react';

import { useLocation } from 'react-router-dom';

export default function OffensiveSuite() {
  const { poisonLogs, scammerRecords, offensiveMode, setOffensiveMode, clearPoisonLogs, clearScammerRecords } = useThreatStore();
  const [targetUrl, setTargetUrl] = useState('');
  const [isEngaging, setIsEngaging] = useState(false);
  const logEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Handle deep-linking from blockade overlay
    const params = new URLSearchParams(location.search);
    const target = params.get('target');
    if (target) {
      setTargetUrl(target);
    }
  }, [location.search]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [poisonLogs]);

  const handleEngage = async () => {
    setIsEngaging(true);
    setOffensiveMode(true);
    clearPoisonLogs();
    clearScammerRecords();

    try {
      const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/offensive-poison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: targetUrl, injection_count: 500 })
      });
      if (resp.ok) {
        // Success handled via socket logs
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEngaging(false);
    }
  };

  const handleTerminate = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/terminate-poison`, { method: 'POST' });
      setOffensiveMode(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Check if campaign is effectively running from logs
  const isCurrentlyInjected = poisonLogs.length > 0 && poisonLogs[0].status === 'injecting';

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-gradient-to-br from-red-900/10 to-transparent">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-outfit font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-dangerRed/10 rounded-lg text-dangerRed border border-dangerRed/20">
              <Skull size={24} />
            </span>
            Offensive Intelligence: Poison Pill v2
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl">
            Active Data Poisoning: Injecting thousands of localized synthetic identities into the attacker's database to destroy data ROI.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-lg bg-black/40 border border-gray-800 text-xs flex flex-col justify-center text-right">
            <span className="text-gray-500 uppercase font-bold tracking-widest text-[9px]">Platform Status</span>
            <span className={isCurrentlyInjected ? "text-dangerRed font-mono font-bold animate-pulse" : "text-neonTeal font-mono font-bold"}>
              {isCurrentlyInjected ? "ENGAGED_ATTACK" : "OFFENSIVE_READY"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Terminal Section */}
        <div className="flex-1 flex flex-col bg-black/80 rounded-2xl border border-dangerRed/30 overflow-hidden shadow-[0_0_40px_rgba(255,51,51,0.1)]">
          <div className="px-4 py-2 bg-dangerRed/10 border-b border-dangerRed/20 flex justify-between items-center h-10 shrink-0">
            <div className="flex gap-1.5 items-center">
              <div className={`w-2.5 h-2.5 rounded-full ${isCurrentlyInjected ? 'bg-dangerRed animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-[10px] text-dangerRed font-mono font-bold tracking-widest opacity-80 uppercase ml-2">
                SYNTHETIC_GEN_TERMINAL
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              PID: {Math.floor(Math.random() * 90000 + 10000)}
            </div>
          </div>
          
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 custom-scrollbar bg-black/40">
            {poisonLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                <TerminalIcon size={48} className="mb-4 text-dangerRed" />
                <p>WAITING FOR TARGET INPUT...</p>
                <p className="text-[10px] mt-2">SYSTEM_IDLE:00</p>
              </div>
            ) : (
              poisonLogs.map((log, i) => (
                <div key={i} className={`flex gap-3 
                  ${log.status === 'completed' ? 'text-neonTeal font-bold mt-4 border-t border-neonTeal/20 pt-2' : 
                    log.status === 'terminated' ? 'text-orange-500 font-bold mt-4 border-t border-orange-500/20 pt-2' :
                    'text-dangerRed/90 animate-in fade-in transition-all duration-300'}`}>
                  <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                  {log.status === 'completed' ? (
                    <span>&gt;&gt;&gt; INJECTION SEQUENCE COMPLETED: {log.total} SYNTHETIC IDENTITIES DEPLOYED.</span>
                  ) : log.status === 'terminated' ? (
                    <span>&gt;&gt;&gt; CAMPAIGN TERMINATED: Analyst intervention recorded.</span>
                  ) : (
                    <span>&gt;&gt; POISONING: {log.identity} | LOC: EN_IN | STATUS: {log.status.toUpperCase()}</span>
                  )}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Scammer Database Monitor (Mock) */}
        <div className="w-80 flex flex-col bg-black/60 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 bg-white/5 border-b border-gray-800 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scammer Database Monitor</span>
              <div className="w-2 h-2 rounded-full bg-neonTeal animate-pulse"></div>
            </div>
            <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-mono font-bold text-white">{scammerRecords.length}</span>
                <span className="text-[10px] text-gray-500 mb-1">STOLEN RECORDS</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {scammerRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <Database size={24} className="mb-2" />
                    <p className="text-[10px] uppercase font-bold tracking-tighter">Database empty</p>
                </div>
            ) : (
                <AnimatePresence initial={false}>
                    {scammerRecords.map((rec, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-2 border border-gray-800 bg-white/5 rounded text-[10px] font-mono flex flex-col gap-1 group hover:border-neonTeal/30 transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-[9px] uppercase font-bold tracking-tighter">{rec.bank}</span>
                                <span className="text-neonTeal opacity-60">Verified</span>
                            </div>
                            <div className="text-gray-200 truncate">{rec.identity}</div>
                            <div className="text-gray-500 text-[8px] flex justify-between">
                                <span>{new Date(rec.timestamp).toLocaleTimeString()}</span>
                                <span className="group-hover:text-neonTeal transition-colors">Forensic Leak</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
          </div>
          <div className="p-3 bg-black/40 border-t border-gray-800">
             <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (scammerRecords.length / 500) * 100)}%` }}
                    className="h-full bg-neonTeal shadow-[0_0_10px_#00ffcc]"
                />
             </div>
             <p className="text-[8px] text-gray-500 mt-2 text-center uppercase tracking-widest font-bold">Poison Saturation Level</p>
          </div>
        </div>

        {/* Control Sidebar */}
        <aside className="w-80 flex flex-col gap-6">
          <div className="bg-panelBg border border-gray-800 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Targeting System</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Detection Webhook / URL</label>
                <input 
                  type="text" 
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://scam-site.com/submit..."
                  className="w-full bg-black/40 border border-gray-700 rounded-lg p-2.5 text-xs text-dangerRed font-mono focus:border-dangerRed focus:outline-none transition-all placeholder:opacity-30"
                />
                <p className="text-[8px] text-gray-600 mt-2 italic px-1">
                    * Leave empty to target the mock scammer database for demo purposes.
                </p>
              </div>
              <button 
                onClick={handleEngage}
                disabled={isEngaging}
                className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg
                  ${(isEngaging) 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-dangerRed text-white hover:bg-red-600 active:scale-[0.98] shadow-red-900/20'}`}
              >
                {isEngaging ? <Zap size={14} className="animate-spin" /> : <Skull size={14} />}
                ENGAGE POISON PILL
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <FeatureBox 
              icon={<Cpu size={16} />} 
              label="AI Agent" 
              value="Honeypot-Gen_v2" 
              color="text-dangerRed" 
            />
            <FeatureBox 
              icon={<Database size={16} />} 
              label="DB Load" 
              value="50 req/sec" 
              color="text-warningYellow" 
            />
            <FeatureBox 
              icon={<ShieldAlert size={16} />} 
              label="Detection" 
              value="Stealth" 
              color="text-neonTeal" 
            />
          </div>
          
          <div className="mt-auto p-4 bg-dangerRed/5 border border-dangerRed/10 rounded-xl">
             <p className="text-[11px] text-dangerRed/70 leading-relaxed italic">
               "We don't just protect the user; we bankrupt the operation by flooding it with forensic-grade synthetic data."
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FeatureBox({ icon, label, value, color }) {
  return (
    <div className="bg-panelBg/50 border border-gray-800 p-3 rounded-xl flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-black/30 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider leading-none mb-1">{label}</p>
        <p className={`text-xs font-mono font-bold leading-none ${color}`}>{value}</p>
      </div>
    </div>
  );
}
