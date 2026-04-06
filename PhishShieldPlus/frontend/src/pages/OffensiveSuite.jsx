import React, { useState, useEffect, useRef } from 'react';
import { useThreatStore } from '../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  Cpu, 
  Database, 
  Zap, 
  Skull,
  Crosshair,
  Activity,
  Flame
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function OffensiveSuite() {
  const { poisonLogs, scammerRecords, offensiveMode, setOffensiveMode, clearPoisonLogs, clearScammerRecords } = useThreatStore();
  const [targetUrl, setTargetUrl] = useState('');
  const [isEngaging, setIsEngaging] = useState(false);
  const logEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('target');
    if (target) setTargetUrl(target);
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
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/offensive-poison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: targetUrl, injection_count: 500 })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsEngaging(false);
    }
  };

  const isCurrentlyInjected = poisonLogs.length > 0 && poisonLogs[0].status === 'injecting';

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-gradient-to-br from-red-500/[0.03] to-transparent w-full h-full custom-scrollbar">
      <header className="mb-8 flex justify-between items-start">
        <div className="flex items-center gap-6">
          <div className="p-4 glass-card rounded-3xl text-red-500 shadow-[0_0_20px_rgba(255,100,100,0.1)]">
            <Skull size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Poison Pill <span className="text-red-500">v4.0</span>
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                <div className={`w-1.5 h-1.5 rounded-full ${isCurrentlyInjected ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none">
                  Status: {isCurrentlyInjected ? "Engaged" : "Ready"}
                </span>
              </div>
              <span className="text-gray-600 text-xs font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[400px]">
                Target: {targetUrl || "AWAITING_VECTOR_ASSIGNMENT"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="glass-panel px-6 py-4 rounded-3xl flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Bot Cluster Load</span>
            <span className="text-xl font-black font-mono text-white leading-none">42.8<span className="text-xs text-gray-600 ml-0.5">REQ/S</span></span>
          </div>
        </div>
      </header>

      <div className="flex-1 gap-8 grid grid-cols-12 min-h-[500px]">
        {/* Terminal Section */}
        <div className="col-span-8 flex flex-col glass-card rounded-[32px] overflow-hidden border-red-500/10 transition-all duration-700">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex gap-3 items-center">
              <TerminalIcon size={16} className="text-red-500" />
              <span className="text-[10px] text-red-500 font-black tracking-[0.3em] uppercase">Synthetic_Gen_Pipeline</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
            </div>
          </div>
          
          <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto space-y-2 custom-scrollbar bg-black/20">
            {poisonLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-red-500/20">
                  <TerminalIcon size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 font-bold uppercase tracking-widest">Awaiting Targeting Vector</p>
                  <p className="text-[9px] text-gray-700 font-black">SYSTEM_STANDBY_MODE_ACTIVE</p>
                </div>
              </div>
            ) : (
              poisonLogs.map((log, i) => (
                <div key={i} className={`flex gap-4 p-2 rounded-lg transition-colors
                  ${log.status === 'completed' ? 'bg-accent-primary/5 text-accent-primary border border-accent-primary/20' : 
                    log.status === 'terminated' ? 'bg-orange-500/5 text-orange-400 border border-orange-400/20' :
                    'text-red-400/80 hover:bg-white/[0.02]'}`}>
                  <span className="opacity-30 flex-shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className="font-bold tracking-tight">
                    {log.status === 'completed' ? `>> SEQUENCE COMPLETED: ${log.total} ARTIFACTS DEPLOYED` : 
                     log.status === 'terminated' ? `>> CAMPAIGN TERMINATED BY ANALYST` :
                     `>> POISONING: ${log.identity} | EN_IN | ${log.status.toUpperCase()}`}
                  </span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Intelligence Context */}
        <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
          {/* Target Capture */}
          <div className="glass-card rounded-[32px] p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <Crosshair size={18} />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Targeting Array</span>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-600 ml-2">Target Webhook Origin</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://malicious-origin.xyz/api/v1/..."
                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-xs text-red-400 font-mono focus:border-red-500/40 focus:outline-none transition-all placeholder:text-gray-800"
                  />
                  <div className="absolute right-4 top-4 text-red-500/20 group-hover:text-red-500 transition-colors">
                    <Activity size={16} />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleEngage}
                disabled={isEngaging || isCurrentlyInjected}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 transition-all duration-300
                  ${(isEngaging || isCurrentlyInjected) 
                    ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5' 
                    : 'bg-red-500 text-black hover:scale-[1.02] shadow-[0_15px_30px_rgba(239,68,68,0.2)]'}`}
              >
                {isEngaging ? <Zap size={14} className="animate-spin" /> : <Flame size={14} strokeWidth={3} />}
                {isCurrentlyInjected ? "Campaign Engaged" : "Deploy Poison Pill"}
              </button>
            </div>
          </div>

          {/* Database Monitor */}
          <div className="flex-1 glass-card rounded-[32px] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Live Database Bleed</span>
                <p className="text-2xl font-black font-mono text-white leading-none">
                  {scammerRecords.length} <span className="text-xs text-gray-600 font-medium">RECS</span>
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                <Database size={20} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {scammerRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                  <Database size={24} strokeWidth={1.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Sinkhole Empty</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {scammerRecords.slice(0, 15).map((rec, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 glass-panel rounded-xl flex flex-col gap-2 group hover:border-accent-primary/20 transition-all cursor-default"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-accent-primary text-[9px] font-black uppercase tracking-widest">{rec.bank}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                      </div>
                      <p className="text-xs text-white font-bold tracking-tight truncate">{rec.identity}</p>
                      <div className="flex justify-between items-center text-[8px] font-black text-gray-600 uppercase tracking-tighter">
                        <span>{new Date(rec.timestamp).toLocaleTimeString()}</span>
                        <span className="group-hover:text-accent-primary/60 transition-colors">Forensic Leak Reconstructed</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
