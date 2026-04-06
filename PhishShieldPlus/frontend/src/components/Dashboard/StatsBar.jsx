import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion } from 'framer-motion';
import { Shield, Activity, Zap, Cpu } from 'lucide-react';

export default function StatsBar() {
  const stats = useThreatStore((state) => state.stats);

  return (
    <div className="flex gap-8 text-[11px] font-mono items-center py-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">
          <Cpu size={12} className="text-accent-primary" />
          <span className="text-accent-primary font-bold uppercase tracking-wider">Neural Engine v4.2</span>
        </div>
        <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
      </div>
      
      <StatItem icon={Shield} label="Threats" value={stats.threats_today} color="text-red-400" />
      <StatItem icon={Zap} label="Scans" value={stats.scans_total} color="text-accent-primary" />
      <StatItem icon={Activity} label="Blocked" value={stats.blocked_count} color="text-yellow-400" />
      
      <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

      <div className="flex items-center gap-4 group">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Shield Confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '88%' }}
                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary shadow-[0_0_8px_rgba(102,252,241,0.5)]"
              />
            </div>
            <span className="text-accent-primary font-black text-[10px]">88.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <motion.div 
      key={value}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-0.5"
    >
      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">{label}</span>
      <div className="flex items-center gap-2">
        <Icon size={12} className={color} />
        <span className={`${color} font-black text-sm tracking-tighter`}>{value.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}
