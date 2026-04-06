import React from 'react';
import BlockchainLog from '../components/Dashboard/BlockchainLog';
import { Database, ShieldCheck, Link2, Clock } from 'lucide-react';

export default function AuditLedger() {
  return (
    <div className="flex-1 flex flex-col p-6 w-full h-full overflow-hidden">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-outfit font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-mutedTeal/10 rounded-lg text-mutedTeal border border-mutedTeal/20">
              <Database size={24} />
            </span>
            Global Immutable Threat Ledger
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl">
            Live cryptographic anchoring of detected threats to the Polygon network. Ensuring chain-of-custody for incident response.
          </p>
        </div>
        <div className="flex gap-4">
          <StatBox icon={<Link2 size={16} />} label="Chain State" value="Polygon Mainnet" color="text-neonTeal" />
          <StatBox icon={<ShieldCheck size={16} />} label="Integrity" value="Verified" color="text-neonTeal" />
        </div>
      </header>

      <div className="flex-1 bg-panelBg/40 border border-gray-800 rounded-2xl p-6 overflow-hidden flex flex-col shadow-2xl relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neonTeal/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-neonTeal/10 transition-all duration-700"></div>
        <div className="flex-1 overflow-y-auto">
          <BlockchainLog fullView={true} />
        </div>
      </div>

      <footer className="mt-4 flex justify-between items-center px-2">
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <Clock size={12} />
            Sync Latency: 1.2s
            </div>
            <div className="h-1 w-1 rounded-full bg-gray-700"></div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Block Time: ~2.1s
            </div>
        </div>
        <div className="text-[10px] text-mutedTeal/60 font-mono tracking-tighter">
            PROOFS_V2-ECDSA-POLYGON-ANCHOR
        </div>
      </footer>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-black/40 border border-gray-800 flex items-center gap-3">
      <div className={`${color} opacity-80`}>{icon}</div>
      <div>
        <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">{label}</p>
        <p className={`text-xs font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
