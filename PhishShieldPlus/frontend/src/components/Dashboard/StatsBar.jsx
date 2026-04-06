import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsBar() {
  const stats = useThreatStore((state) => state.stats);

  return (
    <div className="flex gap-8 items-center">
      {/* SYSTEM CORE INDICATOR */}
      <div className="flex items-center gap-3 border-r border-white/5 pr-8 overflow-hidden h-10">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
             <Cpu size={10} className="text-accent-primary opacity-40 shrink-0" />
             <span className="text-[8px] text-white/70 font-black uppercase tracking-[0.2em] whitespace-nowrap">Neural_Core_v4.2</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
             <div className="status-indicator w-1 h-1 text-accent-primary opacity-60" />
             <span className="text-[7px] text-accent-primary/40 font-mono tracking-tighter uppercase whitespace-nowrap">Synchronizing...</span>
          </div>
        </div>
      </div>
      
      {/* REAL-TIME METRICS */}
      <div className="flex gap-8">
        <StatItem label="Threats" value={stats.threats_today || 0} color="text-danger-primary" />
        <StatItem label="Scans" value={stats.scans_total || 0} color="text-accent-primary" />
        <StatItem label="Blocked" value={stats.blocked_count || 0} color="text-warning-primary" />
      </div>
      
      {/* SHIELD VELOCITY */}
      <div className="flex flex-col gap-1 border-l border-white/5 pl-8 h-10 justify-center">
        <div className="flex justify-between items-center w-28">
           <span className="text-[7px] text-slate-500 font-black uppercase tracking-[0.15em]">Confidence</span>
           <span className="text-[9px] text-accent-primary font-black font-mono">88.4%</span>
        </div>
        <div className="w-28 h-0.5 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '88.4%' }}
            transition={{ duration: 1.5, ease: "linear" }}
            className="h-full bg-accent-primary shadow-[0_0_8px_rgba(102,252,241,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <motion.div 
      key={value}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-start min-w-[50px]"
    >
      <span className="text-[7px] text-slate-500 font-black uppercase tracking-[0.1em] leading-none mb-1 opacity-60">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`${color} font-black text-sm font-outfit tracking-tighter leading-none`}>
          {value.toLocaleString()}
        </span>
        <span className="text-[6px] text-slate-600 font-mono leading-none opacity-40 uppercase">u</span>
      </div>
    </motion.div>
  );
}
