import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion } from 'framer-motion';

export default function StatsBar() {
  const stats = useThreatStore((state) => state.stats);

  return (
    <div className="flex gap-6 text-[11px] font-mono items-center">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 uppercase tracking-widest font-bold">Network Stats</span>
        <div className="h-4 w-[1px] bg-gray-800 mx-1"></div>
      </div>
      
      <StatItem icon="⚠" label="Threats" value={stats.threats_today} color="text-dangerRed" glow="bg-dangerRed" />
      <StatItem icon="⊙" label="Scans" value={stats.scans_total} color="text-neonTeal" glow="bg-neonTeal" />
      <StatItem icon="⊘" label="Blocked" value={stats.blocked_count} color="text-warningYellow" glow="bg-warningYellow" />
      
      <div className="flex items-center gap-2 group">
        <span className="text-gray-500 font-bold uppercase tracking-widest">Conf:</span>
        <span className="text-neonTeal font-bold">88%</span>
        <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '88%' }}
            className="h-full bg-neonTeal"
          />
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, color, glow }) {
  return (
    <motion.div 
      key={value}
      initial={{ opacity: 0.5, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5"
    >
      <span className={`${color} text-[10px]`}>{icon}</span>
      <span className="text-gray-400 uppercase tracking-[0.15em] text-[10px]">{label}:</span>
      <b className={`${color} tracking-widest shadow-sm`}>{value}</b>
    </motion.div>
  );
}
