import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion } from 'framer-motion';

export default function StatsBar() {
  const stats = useThreatStore((state) => state.stats);

  return (
    <div className="flex gap-5 text-sm font-inter items-center">
      <motion.div key={stats.threats_today} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
        <span className="text-dangerRed text-xs">⚠</span>
        <span className="text-gray-400">Threats:</span>
        <b className="text-dangerRed font-mono">{stats.threats_today}</b>
      </motion.div>
      <motion.div key={stats.scans_total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
        <span className="text-neonTeal text-xs">⊙</span>
        <span className="text-gray-400">Scans:</span>
        <b className="text-neonTeal font-mono">{stats.scans_total}</b>
      </motion.div>
      <motion.div key={stats.blocked_count} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
        <span className="text-warningYellow text-xs">⊘</span>
        <span className="text-gray-400">Blocked:</span>
        <b className="text-warningYellow font-mono">{stats.blocked_count}</b>
      </motion.div>
      <div className="flex items-center gap-1.5">
        <span className="text-neonTeal text-xs">✦</span>
        <span className="text-gray-400">Conf:</span>
        <b className="text-neonTeal font-mono">88%</b>
      </div>
    </div>
  );
}
