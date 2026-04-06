import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlockchainLog({ fullView = false }) {
  const chainEvents = useThreatStore((state) => state.chainEvents);

  return (
    <div className={`flex flex-col gap-3 ${fullView ? 'h-full' : 'mt-4'}`}>
      {!fullView && (
        <h2 className="text-lg text-neonTeal font-bold font-outfit flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-neonTeal rounded-full animate-pulse"></span>
          Blockchain Ledger ({chainEvents.length})
        </h2>
      )}
      <div className="bg-darkBg rounded border border-gray-700 overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-[#151c24] text-gray-400">
            <tr>
              <th className="p-2 font-normal">TX Hash</th>
              <th className="p-2 font-normal">Threat</th>
              <th className="p-2 font-normal">Risk</th>
              <th className="p-2 font-normal">Block</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {chainEvents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-600">
                    <div className="flex flex-col items-center gap-2 py-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Scan a URL to generate immutable records
                    </div>
                  </td>
                </tr>
              ) : (
                chainEvents.slice(0, 8).map((ev, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, backgroundColor: 'rgba(102, 252, 241, 0.15)' }}
                    animate={{ opacity: 1, backgroundColor: 'transparent' }}
                    transition={{ duration: 1.2 }}
                    key={ev.tx_hash + idx} 
                    className="border-t border-gray-800 hover:bg-gray-800/30 transition"
                  >
                    <td className="p-2 truncate max-w-[90px] text-neonTeal font-mono" title={ev.tx_hash}>
                      {ev.tx_hash?.slice(0, 10)}...{ev.tx_hash?.slice(-4)}
                    </td>
                    <td className={`p-2 font-bold ${
                      ev.threat_type === 'Phishing' ? 'text-dangerRed' :
                      ev.threat_type === 'Suspicious' ? 'text-warningYellow' :
                      'text-neonTeal'
                    }`}>
                      {ev.threat_type || 'Hash Match'}
                    </td>
                    <td className={`p-2 font-bold font-mono ${
                      ev.risk_score > 70 ? 'text-dangerRed' :
                      ev.risk_score > 40 ? 'text-warningYellow' :
                      'text-neonTeal'
                    }`}>
                      {ev.risk_score}%
                    </td>
                    <td className="p-2 text-gray-500 font-mono">
                      #{ev.block}
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {chainEvents.length > 0 && (
        <div className="text-xs text-neonTeal flex items-center gap-1 mt-1 justify-center opacity-80">
          <span className="inline-block w-2 h-2 bg-neonTeal rounded-full animate-pulse"></span>
          {chainEvents.length} record{chainEvents.length > 1 ? 's' : ''} verified on Polygon Mumbai · Immutable
        </div>
      )}
    </div>
  );
}
