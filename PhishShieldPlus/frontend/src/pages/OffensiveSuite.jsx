import React, { useState, useEffect, useRef } from 'react';
import { useThreatStore } from '../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  Database, 
  Zap, 
  Skull,
  Crosshair,
  Activity,
  Flame
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function OffensiveSuite() {
  const { poisonLogs, scammerRecords, setOffensiveMode, clearPoisonLogs, clearScammerRecords } = useThreatStore();
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

  const handleTerminate = async () => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/terminate-poison`, {
        method: 'POST'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const isCurrentlyInjected = poisonLogs.length > 0 && poisonLogs[0].status === 'injecting';

  return (
    <div className="flex flex-col h-full bg-[#020408]/30">
      
      {/* MODULE HEADER: WAR ROOM COMMAND BAR */}
      <header className="mb-12 flex justify-between items-end border-b border-white/[0.05] pb-10">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[1.5px] bg-danger-primary" />
            <span className="text-[10px] font-black text-danger-primary uppercase tracking-[0.4em]">Autonomous_Countermeasures_Suite</span>
          </div>
          <h2 className="text-5xl font-outfit font-black text-white tracking-tighter uppercase italic leading-[0.85]">
            Operational <span className="text-danger-primary">Interdiction</span>
          </h2>
          <p className="text-slate-300 text-[12px] font-medium max-w-[590px] leading-relaxed">
            High-velocity synthetic artifact generation system. Deploying autonomous payloads 
            to neutralise malicious infrastructure and disrupt fraudulent data collection cycles.
          </p>
        </div>

        <div className="flex gap-4">
           <StatBox icon={<Activity size={14} />} label="Injection_Velocity" value={isCurrentlyInjected ? "42.8 Req/s" : "0.0 Req/s"} color="text-danger-primary" active={isCurrentlyInjected} />
           <StatBox icon={<Skull size={14} />} label="Operational_Status" value={isCurrentlyInjected ? "ENGAGED" : "STANDBY"} color="text-danger-primary" active={isCurrentlyInjected} />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-8 items-stretch overflow-hidden">
        
        {/* PRIMARY OPERATIONAL TERMINAL */}
        <div className="col-span-8 clinical-panel flex flex-col relative bg-white/[0.01]">
           <div className={`absolute top-0 left-0 w-full h-[1px] transition-all duration-700 ${isCurrentlyInjected ? 'bg-danger-primary shadow-[0_0_10px_rgba(226,75,74,0.5)]' : 'bg-white/[0.05]'}`} />
           
           <div className="px-8 py-5 border-b border-white/[0.03] flex justify-between items-center bg-white/[0.02]">
             <div className="flex gap-4 items-center">
               <TerminalIcon size={12} className={isCurrentlyInjected ? 'text-danger-primary animate-pulse' : 'text-slate-600'} />
               <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isCurrentlyInjected ? 'text-danger-primary' : 'text-slate-600'}`}>
                 Synthetic_Generation_Matrix
               </span>
             </div>
             <span className="text-[8px] text-slate-700 font-mono font-black italic tracking-widest uppercase">K_CORE_v4.2-STRIKE</span>
           </div>
           
           <div className="flex-1 p-8 font-mono text-[10px] overflow-y-auto space-y-2 custom-scrollbar bg-black/20">
             {poisonLogs.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-20 filter grayscale">
                 <TerminalIcon size={40} strokeWidth={1} className="text-slate-400 mb-4" />
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Awaiting_Command_Authorization</p>
               </div>
             ) : (
               poisonLogs.map((log, i) => (
                 <div key={i} className={`flex gap-4 p-3 rounded-xl border transition-all duration-300
                   ${log.status === 'completed' ? 'bg-success-primary/[0.02] text-success-primary border-success-primary/10' : 
                     log.status === 'terminated' ? 'bg-warning-primary/[0.02] text-warning-primary border-warning-primary/10' :
                     'bg-danger-primary/[0.02] text-danger-primary border-danger-primary/10'}`}>
                   <span className="opacity-30 font-bold">[{new Date().toLocaleTimeString()}]</span>
                   <span className="font-bold tracking-tight">
                     {log.status === 'completed' ? `>> SEQUENCE_FINALIZED | ${log.total} ARTIFACTS_ANCHORED` : 
                      log.status === 'terminated' ? `>> CAMPAIGN_HALTED_BY_OPERATOR` :
                      `>> INJECTING: ${log.identity} | ${log.status.toUpperCase()}`}
                   </span>
                 </div>
               ))
             )}
             <div ref={logEndRef} />
           </div>
        </div>

        {/* INTERDICTION CONTROLS & MONITORING */}
        <aside className="col-span-4 flex flex-col gap-8 overflow-hidden">
          
          {/* TARGETING ARRAY */}
          <div className="clinical-panel p-8 space-y-8 flex flex-col bg-danger-primary/[0.01]">
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-danger-primary opacity-60">
                <Crosshair size={18} />
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em]">Operational_Targeting</h4>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="text" 
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="MALICIOUS_ORIGIN_URL..."
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 text-[11px] text-danger-primary font-mono font-bold focus:border-danger-primary/40 focus:bg-danger-primary/[0.03] outline-none transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>

              <button 
                onClick={handleEngage}
                disabled={isEngaging || isCurrentlyInjected}
                className={`w-full h-14 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 transition-all duration-500 relative overflow-hidden group
                  ${(isEngaging || isCurrentlyInjected) 
                    ? 'bg-danger-primary/10 text-white border border-danger-primary/30 shadow-[0_0_20px_rgba(226,75,74,0.2)] font-black' 
                    : 'bg-danger-primary text-white hover:bg-danger-primary/90 hover:scale-[1.02] active:scale-95 shadow-[0_15px_30px_rgba(226,75,74,0.3)]'}`}
              >
                {isEngaging ? <Zap size={16} className="animate-spin" /> : <Flame size={16} />}
                {isCurrentlyInjected ? "Campaign_Engaged" : "Initialize_Counterstrike"}
              </button>

              <AnimatePresence>
                {isCurrentlyInjected && (
                  <motion.button
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 56, marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    onClick={handleTerminate}
                    className="w-full rounded-xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 bg-warning-primary text-black hover:bg-white transition-all duration-300 shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.2)]"
                  >
                    <Skull size={16} />
                    Terminate_Engagement
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SINKHOLE DATABASE MONITOR */}
          <div className="flex-1 clinical-panel flex flex-col overflow-hidden bg-white/[0.01]">
             <div className="p-8 border-b border-white/[0.03] flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.3em]">Sinkhole_Buffer</span>
                  <p className="text-4xl font-outfit font-black text-white leading-none tracking-tighter">
                    {scammerRecords.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-500">
                  <Database size={16} />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-black/10">
               {scammerRecords.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-10 filter grayscale scale-75">
                   <Database size={32} strokeWidth={1} className="text-slate-400" />
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Database_Idle</p>
                 </div>
               ) : (
                 <AnimatePresence initial={false}>
                   {scammerRecords.slice(0, 20).map((rec, i) => (
                     <motion.div 
                       key={i}
                       initial={{ opacity: 0, x: 10 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="p-4 glass-card rounded-xl flex flex-col gap-2 hover:border-accent-primary/20 transition-all border-white/[0.02]"
                     >
                        <div className="flex justify-between items-center">
                          <span className="text-accent-primary text-[9px] font-black uppercase tracking-[0.2em] italic opacity-60">{rec.bank || 'RECONSTRUCTED_IND'}</span>
                          <div className="w-1 h-1 rounded-full bg-accent-primary shadow-[0_0_5px_rgba(102,252,241,0.5)]" />
                        </div>
                        <p className="text-[11px] text-slate-200 font-bold tracking-tight truncate font-mono">{rec.identity}</p>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               )}
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color, active }) {
  return (
    <div className={`glass-card px-5 py-3 rounded-2xl border-white/[0.05] flex items-center gap-4 transition-all duration-500 ${active ? 'border-danger-primary/40 bg-danger-primary/[0.03]' : ''}`}>
      <div className={`${active ? 'text-danger-primary' : 'text-slate-600'} transition-colors`}>{icon}</div>
      <div className="flex flex-col">
        <p className="text-[7px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1 font-mono italic">{label}</p>
        <p className={`text-[12px] font-black ${active ? 'text-danger-primary' : 'text-white/80'} tracking-tight font-outfit uppercase`}>{value}</p>
      </div>
    </div>
  );
}
