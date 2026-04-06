import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export default function BlockchainLog({ fullView = false }) {
  const chainEvents = useThreatStore((state) => state.chainEvents);

  return (
    <div className={`flex flex-col gap-6 ${fullView ? 'flex-1' : 'mt-8'}`}>
      {!fullView && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-4 bg-accent-secondary/40 rounded-full" />
             <h2 className="text-[11px] text-white font-black uppercase tracking-[0.3em] flex items-center gap-3">
               Immutable Forensic Ledger
             </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] rounded-full border border-white/5">
             <div className="w-1 h-1 rounded-full bg-accent-secondary animate-pulse" />
             <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">{chainEvents.length} PROOFS_ANCHORED</span>
          </div>
        </div>
      )}

      <div className="glass-card rounded-[24px] overflow-hidden border-white/5 bg-white/[0.01]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.03] bg-white/[0.02]">
              <th className="p-5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Diagnostic_Hash</th>
              <th className="p-5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Forensic_Classification</th>
              <th className="p-5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Risk_Quotient</th>
              <th className="p-5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-right">Chain_Telemetry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            <AnimatePresence>
              {chainEvents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Shield size={40} strokeWidth={1} className="text-slate-400" />
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Awaiting_Threat_Ingestion</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (fullView ? chainEvents : chainEvents.slice(0, 10)).map((ev, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={ev.tx_hash + idx} 
                    className="group hover:bg-white/[0.05] transition-all duration-300 cursor-default border-l-2 border-transparent hover:border-accent-primary/50"
                  >
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-accent-secondary font-mono text-xs font-bold transition-all duration-300 group-hover:text-accent-primary group-hover:scale-[1.01] flex items-center gap-2">
                          <Database size={10} className="opacity-40 group-hover:opacity-100 group-hover:text-accent-primary transition-all" />
                          {ev.tx_hash?.slice(0, 16).toUpperCase()}...{ev.tx_hash?.slice(-8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-accent-primary transition-colors duration-500" />
                           <span className="text-[8px] text-slate-600 group-hover:text-slate-400 font-black uppercase tracking-widest transition-colors">Polygon POS Verified</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <StatusPill type={ev.threat_type} />
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform duration-300">
                          <span className={`text-[14px] font-outfit font-black tracking-tight drop-shadow-sm ${
                            ev.risk_score > 70 ? 'text-danger-primary' :
                            ev.risk_score > 30 ? 'text-warning-primary' :
                            'text-success-primary'
                          }`}>
                            {ev.risk_score}%
                          </span>
                          <div className="w-20 h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05] group-hover:border-white/10 transition-colors">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${ev.risk_score}%` }}
                              className={`h-full ${
                                ev.risk_score > 70 ? 'bg-danger-primary shadow-[0_0_8px_rgba(226,75,74,0.4)]' :
                                ev.risk_score > 30 ? 'bg-warning-primary shadow-[0_0_8px_rgba(245,158,11,0.4)]' :
                                'bg-success-primary shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                              }`} 
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                         <span className="text-[10px] text-slate-500 group-hover:text-white font-mono font-bold tracking-tighter italic transition-colors">BLOCK #{ev.block?.toString().slice(-8)}</span>
                         <span className="text-[8px] text-slate-700 group-hover:text-accent-secondary font-black uppercase tracking-[0.2em] transition-colors">TX_CONFIRMED</span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ type }) {
  const config = {
    'Phishing': { icon: ShieldAlert, color: 'text-danger-primary bg-danger-primary/5 border-danger-primary/10' },
    'Suspicious': { icon: Shield, color: 'text-warning-primary bg-warning-primary/5 border-warning-primary/10' },
    'Verified': { icon: ShieldCheck, color: 'text-success-primary bg-success-primary/5 border-success-primary/10' },
    'default': { icon: Shield, color: 'text-slate-500 bg-white/5 border-white/10' }
  };

  const { icon: Icon, color } = config[type] || config.default;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border italic font-black ${color} group-hover:scale-105 transition-transform duration-500`}>
      <Icon size={12} strokeWidth={3} />
      <span className="text-[9px] uppercase tracking-[0.15em]">{type || 'Diagnostic'}</span>
    </div>
  );
}
