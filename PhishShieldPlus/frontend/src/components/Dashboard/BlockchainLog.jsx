import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion } from 'framer-motion';

export default function BlockchainLog() {
  const chainEvents = useThreatStore((state) => state.chainEvents);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <h2 className="text-lg text-neonTeal font-bold font-outfit">Blockchain Logs</h2>
      <div className="bg-darkBg rounded border border-gray-700 overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-[#151c24] text-gray-400">
            <tr>
              <th className="p-2 font-normal">TX Hash</th>
              <th className="p-2 font-normal">Type</th>
              <th className="p-2 font-normal">Score</th>
            </tr>
          </thead>
          <tbody>
            {chainEvents.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-600">Awaiting block verifications...</td>
              </tr>
            ) : (
              chainEvents.slice(0, 5).map((ev, idx) => (
                <motion.tr 
                  initial={{ backgroundColor: 'rgba(102, 252, 241, 0.4)' }}
                  animate={{ backgroundColor: 'transparent' }}
                  transition={{ duration: 1 }}
                  key={idx} className="border-t border-gray-800"
                >
                  <td className="p-2 truncate max-w-[100px] text-neonTeal" title={ev.tx_hash}>{ev.tx_hash}</td>
                  <td className="p-2 text-gray-300">Hash Match</td>
                  <td className="p-2 text-dangerRed font-bold">{ev.risk_score}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {chainEvents.length > 0 && (
        <div className="text-xs text-neonTeal flex items-center gap-1 mt-1 justify-center">
          <span className="inline-block w-2 h-2 bg-neonTeal rounded-full animate-pulse"></span> Verified on Polygon Mumbai
        </div>
      )}
    </div>
  );
}
