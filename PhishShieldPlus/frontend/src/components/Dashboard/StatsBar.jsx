import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion } from 'framer-motion';

export default function StatsBar() {
  const stats = useThreatStore((state) => state.stats);

  return (
    <div className="flex gap-6 text-sm font-inter">
      <motion.div key={stats.threats_today} initial={{ scale: 1.2, color: '#e24b4a' }} animate={{ scale: 1, color: '#c5c6c7' }}>
        <span>Threats Today: <b className="text-dangerRed">{stats.threats_today}</b></span>
      </motion.div>
      <motion.div key={stats.scans_total} initial={{ scale: 1.2, color: '#66fcf1' }} animate={{ scale: 1, color: '#c5c6c7' }}>
        <span>Scans: <b className="text-neonTeal">{stats.scans_total}</b></span>
      </motion.div>
      <motion.div key={stats.blocked_count} initial={{ scale: 1.2, color: '#f0ad4e' }} animate={{ scale: 1, color: '#c5c6c7' }}>
        <span>Blocked: <b className="text-warningAmber">{stats.blocked_count}</b></span>
      </motion.div>
    </div>
  );
}
