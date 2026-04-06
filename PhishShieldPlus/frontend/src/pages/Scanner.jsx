import React from 'react';
import ScanPanel from '../components/Dashboard/ScanPanel';
import { motion } from 'framer-motion';
import { Activity, Cpu } from 'lucide-react';

export default function Scanner() {
  return (
    <div className="flex flex-col h-full bg-[#020408]/30">
      
      {/* MODULE HEADER: DIAGNOSTIC COMMAND BAR */}
      <header className="mb-12 flex justify-between items-end border-b border-white/[0.05] pb-10">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[1.5px] bg-accent-primary" />
            <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.4em]">Forensic_Intelligence_Lab</span>
          </div>
          <h2 className="text-5xl font-outfit font-black text-white tracking-tighter uppercase italic leading-[0.85]">
            Advanced <span className="text-accent-primary">Heuristic_Scanner</span>
          </h2>
          <p className="text-slate-300 text-[12px] font-medium max-w-[590px] leading-relaxed">
            Autonomous multi-engine diagnostic suite. Integrating real-time heuristic modeling,
            LLM threat categorization, and immutable cryptographic anchoring.
          </p>
        </div>

        <div className="flex gap-4">
           <StatBox icon={<Activity size={14} />} label="Operational_State" value="Active" color="text-accent-primary" />
           <StatBox icon={<Cpu size={14} />} label="Heuristic_Core" value="v4.2.1" color="text-accent-primary" />
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden items-stretch">
        
        {/* PRIMARY FORENSIC DOCK */}
        <div className="flex-1 clinical-panel p-8 overflow-y-auto relative bg-white/[0.01] custom-scrollbar">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
           <ScanPanel />
        </div>

        {/* SUBSYSTEM TELEMETRY SIDEBAR */}
        <aside className="w-80 flex flex-col gap-8 overflow-hidden">
          <div className="clinical-panel p-8 space-y-6 bg-white/[0.01]">
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-white/[0.03] pb-4">Scanner_Integrity</h3>
            <div className="space-y-4">
              <StatusItem label="VT_Engine" status="Sync" color="text-accent-primary" />
              <StatusItem label="Heuristic_V4" status="Ops" color="text-accent-primary" />
              <StatusItem label="Gemini_LLM" status="Engaged" color="text-accent-primary" />
              <StatusItem label="Chain_Proxy" status="Anchored" color="text-accent-primary" />
            </div>
          </div>

          <div className="flex-1 clinical-panel p-8 relative overflow-hidden group flex flex-col bg-accent-primary/[0.01]">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-primary/2 duration-700 blur-[80px] group-hover:bg-accent-primary/5 transition-all pointer-events-none" />
            <div className="flex items-center gap-3 mb-6">
               <div className="w-1 h-6 bg-accent-primary/40 rounded-full" />
               <h3 className="text-[9px] font-black text-accent-primary uppercase tracking-[0.2em]">Forensic Protocol</h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold opacity-60">
              Every diagnostic operation triggers automated hash generation. Results are anchored to 
              the decentralized ledger to maintain strict chain of custody for enterprise response.
            </p>
            <div className="mt-auto pt-6 border-t border-white/[0.03] flex flex-col gap-2">
              <span className="text-[7px] text-slate-700 font-mono font-black italic tracking-widest uppercase">Hash: 0x82...f92a</span>
              <span className="text-[7px] text-slate-700 font-mono font-black italic tracking-widest uppercase">Kernel: MISSION_L3</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="glass-card px-5 py-4 rounded-2xl border border-white/[0.08] flex items-center gap-4 hover:bg-white/[0.05] hover:border-accent-primary/20 transition-all duration-300">
      <div className={`${color} shrink-0`}>{icon}</div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[8px] uppercase font-black text-slate-400 tracking-[0.2em] font-mono">{label}</p>
        <p className={`text-[13px] font-black ${color} tracking-tight font-outfit uppercase`}>{value}</p>
      </div>
    </div>
  );
}

function StatusItem({ label, status, color }) {
  return (
    <div className="flex justify-between items-center py-1 group/status">
      <span className="text-[9px] text-slate-400 font-black tracking-tight group-hover/status:text-white transition-colors uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[9px] ${color} font-mono font-black tracking-tighter uppercase`}>{status}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary shadow-[0_0_5px_rgba(102,252,241,0.6)] animate-pulse" />
      </div>
    </div>
  );
}
