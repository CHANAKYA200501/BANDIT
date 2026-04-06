import React from 'react';
import ScanPanel from '../components/Dashboard/ScanPanel';
import { motion } from 'framer-motion';

export default function Scanner() {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <header className="mb-6">
        <h2 className="text-2xl font-outfit font-bold text-white flex items-center gap-3">
          <span className="p-2 bg-neonTeal/10 rounded-lg text-neonTeal border border-neonTeal/20">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          Advanced Threat Intelligence Scanner
        </h2>
        <p className="text-gray-400 text-sm mt-1 max-w-2xl">
          Multi-engine analysis suite combining VirusTotal, AbuseIPDB, whois forensics, and Isolation Forest transaction anomaly detection.
        </p>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Panel */}
        <div className="flex-1 bg-panelBg/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 overflow-y-auto relative shadow-2xl">
          <ScanPanel />
        </div>

        {/* Intelligence Sidebar */}
        <aside className="w-80 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-panelBg/30 border border-gray-800 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Scanner Status</h3>
            <div className="space-y-4">
              <StatusItem label="VT Engine" status="Online" color="text-neonTeal" />
              <StatusItem label="Heuristic Engine" status="Optimized" color="text-neonTeal" />
              <StatusItem label="Gemini AI" status="Analyzing" color="text-warningYellow" />
              <StatusItem label="Blockchain Proxy" status="Signed" color="text-mutedTeal" />
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-br from-neonTeal/5 to-transparent border border-neonTeal/10 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-neonTeal/10 rounded-full blur-3xl group-hover:bg-neonTeal/20 transition-all duration-700"></div>
            <h3 className="text-xs font-bold text-neonTeal uppercase tracking-widest mb-3">Threat Context</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every scan is cryptographically hashed and anchored to the Polygon testnet to ensure forensic integrity during incident response operations. 
            </p>
            <div className="mt-4 pt-4 border-t border-neonTeal/10">
              <p className="text-[10px] text-gray-500 font-mono tracking-tighter">PHISHSHIELD-CORE_v2.4</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusItem({ label, status, color }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`${color} font-mono font-bold flex items-center gap-2`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
        {status}
      </span>
    </div>
  );
}
