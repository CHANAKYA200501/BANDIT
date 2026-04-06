import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export default function BlockchainLog({ fullView = false }) {
  const chainEvents = useThreatStore((state) => state.chainEvents);

  return (
    <div className={`flex flex-col gap-4 ${fullView ? 'flex-1' : 'mt-6'}`}>
      {!fullView && (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm text-accent-primary font-black uppercase tracking-[0.2em] flex items-center gap-3">
            <Database size={16} />
            Forensic Ledger
          </h2>
          <span className="text-[10px] text-gray-500 font-mono">{chainEvents.length} Verified Proofs</span>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.03]">
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Forensic Proof (Hash)</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Classification</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Threat Level</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Chain Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            <AnimatePresence>
              {chainEvents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-600">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Shield size={32} strokeWidth={1} />
                      <p className="text-xs font-medium tracking-wide">Awaiting threat ingestion... Ledger clear.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (fullView ? chainEvents : chainEvents.slice(0, 10)).map((ev, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={ev.tx_hash + idx} 
                    className="group hover:bg-white/[0.04] transition-colors cursor-default"
                  >
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-accent-primary font-mono text-xs font-bold transition-all group-hover:tracking-wider">
                          {ev.tx_hash?.slice(0, 14)}...{ev.tx_hash?.slice(-6)}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono uppercase">Polygon POS Hydrated</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusPill type={ev.threat_type} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-black font-mono ${
                            ev.risk_score > 70 ? 'text-red-400' :
                            ev.risk_score > 30 ? 'text-yellow-400' :
                            'text-accent-primary'
                          }`}>
                            {ev.risk_score}%
                          </span>
                          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                ev.risk_score > 70 ? 'bg-red-400' :
                                ev.risk_score > 30 ? 'bg-yellow-400' :
                                'bg-accent-primary'
                              }`} 
                              style={{ width: `${ev.risk_score}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-[10px] text-gray-500 font-mono font-bold">Block #{ev.block?.toString().slice(-6)}</span>
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
    'Phishing': { icon: ShieldAlert, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    'Suspicious': { icon: Shield, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    'Verified': { icon: ShieldCheck, color: 'text-accent-primary bg-accent-primary/10 border-accent-primary/20' },
    'default': { icon: Shield, color: 'text-gray-400 bg-white/5 border-white/10' }
  };

  const { icon: Icon, color } = config[type] || config.default;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${color}`}>
      <Icon size={12} />
      <span className="text-[10px] font-black uppercase tracking-wider">{type || 'Analyzed'}</span>
    </div>
  );
}
