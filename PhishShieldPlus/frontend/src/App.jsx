import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { useBlockchain } from './hooks/useBlockchain';
import { useThreatStore } from './store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';

// Layout & Components
import Sidebar from './components/Navigation/Sidebar';
import StatsBar from './components/Dashboard/StatsBar';

// Pages
import OpsCenter from './pages/OpsCenter';
import Scanner from './pages/Scanner';
import OffensiveSuite from './pages/OffensiveSuite';
import AuditLedger from './pages/AuditLedger';

export default function App() {
  useSocket();
  useBlockchain();
  const killSwitchTriggered = useThreatStore((state) => state.killSwitchTriggered);
  const clearKillSwitch = useThreatStore((state) => state.clearKillSwitch);

  return (
    <Router>
      <div className="w-screen h-screen bg-darkBg text-white flex overflow-hidden font-inter select-none">
        
        {/* Persistent Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Global Header */}
          <header className="px-6 border-b border-gray-800/60 bg-panelBg/50 backdrop-blur-md flex justify-between items-center h-14 shrink-0 z-20">
            <div className="flex items-center gap-4">
               {/* Breadcrumb style indicator could go here */}
               <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-neonTeal animate-pulse"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Operational</span>
               </div>
            </div>
            <StatsBar />
          </header>

          {/* Page Router */}
          <main className="flex-1 overflow-hidden relative flex">
            <Routes>
              <Route path="/ops" element={<OpsCenter />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/offensive" element={<OffensiveSuite />} />
              <Route path="/ledger" element={<AuditLedger />} />
              <Route path="/" element={<Navigate to="/ops" replace />} />
            </Routes>
          </main>

          {/* Kill Switch Overlay */}
          <AnimatePresence>
            {killSwitchTriggered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-dangerRed/90 backdrop-blur-md p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="max-w-md w-full text-center p-10 bg-black/90 rounded-2xl border-2 border-dangerRed shadow-[0_0_50px_rgba(255,51,51,0.5)]"
                >
                  <div className="w-20 h-20 bg-dangerRed/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-dangerRed/30">
                    <span className="text-4xl">🛡️</span>
                  </div>
                  <h2 className="text-3xl font-outfit font-bold mb-2 tracking-tight text-white">THREAT INTERCEPTED</h2>
                  <p className="text-dangerRed font-mono text-sm mb-8 opacity-80 break-all px-4">
                    BLOCK_ID: {killSwitchTriggered.url}
                  </p>
                  <button
                    onClick={clearKillSwitch}
                    className="w-full bg-dangerRed text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-[0.98]"
                  >
                    DISMISS LOCKDOWN
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Router>
  );
}
