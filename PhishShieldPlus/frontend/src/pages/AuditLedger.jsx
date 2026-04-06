import React from 'react';
import BlockchainLog from '../components/Dashboard/BlockchainLog';
import { Database, ShieldCheck, Link2, Clock } from 'lucide-react';

export default function AuditLedger() {
  return (
    <div className="flex flex-col h-full bg-[#020408]/30">
      
      {/* MODULE HEADER: RIGID TOP CONTROL AREA */}
      <header className="mb-12 flex justify-between items-end border-b border-white/[0.03] pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[1.5px] bg-accent-secondary opacity-40" />
            <span className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.4em]">Immutable_Diagnostic_History</span>
          </div>
          <h2 className="text-5xl font-outfit font-black text-white tracking-tighter uppercase italic leading-[0.85]">
            Global <span className="text-secondary opacity-70">Threat_Ledger</span>
          </h2>
          <p className="text-slate-400 text-[11px] font-medium max-w-[580px] leading-relaxed opacity-60">
            Forensic cryptographic mapping system. Every neutralised vector is hashed and anchored 
            to the Polygon_POS chain, providing a permanent and verifiable audit trail.
          </p>
        </div>

        <div className="flex gap-4">
           <StatBox icon={<Link2 size={14} />} label="Chain_Protocol" value="Polygon_V4" color="text-accent-secondary" />
           <StatBox icon={<ShieldCheck size={14} />} label="Data_Integrity" value="Secured" color="text-accent-secondary" />
        </div>
      </header>

      {/* OPERATIONAL MATRIX AREA */}
      <div className="flex-1 clinical-panel p-8 flex flex-col relative bg-white/[0.01]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-secondary/30 to-transparent" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <BlockchainLog />
        </div>
      </div>

      <footer className="mt-8 flex justify-between items-center px-2 opacity-50">
        <div className="flex gap-8 items-center">
            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em]">
              <div className="status-indicator w-1 h-1 text-accent-secondary" />
              Node_Latency: 0.8ms
            </div>
            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em]">
              <div className="status-indicator w-1 h-1 text-accent-secondary" />
              Consensus: Verified
            </div>
        </div>
        <div className="text-[8px] font-mono font-black tracking-widest uppercase italic">
            PROOFS_SYSTEM_v4.2-ECDSA-ANCHOR
        </div>
      </footer>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="glass-card px-5 py-3 rounded-2xl border-white/[0.05] flex items-center gap-4 hover:bg-white/[0.04] transition-all">
      <div className={`${color} opacity-50 shrink-0`}>{icon}</div>
      <div className="flex flex-col">
        <p className="text-[7px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1 font-mono italic">{label}</p>
        <p className={`text-[12px] font-black ${color} tracking-tight font-outfit uppercase`}>{value}</p>
      </div>
    </div>
  );
}
