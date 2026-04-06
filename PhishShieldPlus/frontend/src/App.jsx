import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { useBlockchain } from './hooks/useBlockchain';
import { useThreatStore } from './store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';

// Layout & Components
import Sidebar from './components/Navigation/Sidebar';
import StatsBar from './components/Dashboard/StatsBar';
import PageTransition from './components/Navigation/PageTransition';

// Pages
import OpsCenter from './pages/OpsCenter';
import Scanner from './pages/Scanner';
import OffensiveSuite from './pages/OffensiveSuite';
import AuditLedger from './pages/AuditLedger';
import AiTMDetector from './pages/AiTMDetector';
import PigButcherDetector from './pages/PigButcherDetector';
import BoomerangHoneypot from './pages/BoomerangHoneypot';
import Settings from './pages/Settings';

export default function App() {
  useSocket();
  useBlockchain();
  const location = useLocation();
  const killSwitchTriggered = useThreatStore((state) => state.killSwitchTriggered);
  const clearKillSwitch = useThreatStore((state) => state.clearKillSwitch);

  return (
    <div className="app-shell">
      
      {/* PERSISTENT COMMAND HUB */}
      <Sidebar />

      {/* CORE OPERATIONAL VIEWPORT */}
      <div className="main-container">
        
        {/* GLOBAL TELEMETRY HEADER */}
        <header className="telemetry-header">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 px-4 py-1.5 bg-white/[0.03] rounded-full border border-white/[0.05]">
                <div className="status-indicator text-accent-primary"></div>
                <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.25em]">Neural Link: Active</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase whitespace-nowrap">
                SOC_ENV: PROD_v4.2.1
             </div>
          </div>
          <StatsBar />
        </header>

        {/* DYNAMIC MODULE ROUTER */}
        <main className="viewport-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/ops" element={<PageTransition><OpsCenter /></PageTransition>} />
              <Route path="/scanner" element={<PageTransition><Scanner /></PageTransition>} />
              <Route path="/offensive" element={<PageTransition><OffensiveSuite /></PageTransition>} />
              <Route path="/ledger" element={<PageTransition><AuditLedger /></PageTransition>} />
              <Route path="/aitm" element={<PageTransition><AiTMDetector /></PageTransition>} />
              <Route path="/pig-butcher" element={<PageTransition><PigButcherDetector /></PageTransition>} />
              <Route path="/honeypot" element={<PageTransition><BoomerangHoneypot /></PageTransition>} />
              <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
              <Route path="/" element={<Navigate to="/ops" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* EMERGENCY INTERCEPTION OVERLAY */}
        <AnimatePresence>
          {killSwitchTriggered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0000]/90 backdrop-blur-2xl p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="max-w-xl w-full p-12 bg-[#050000] rounded-[32px] border border-danger-primary/30 shadow-[0_0_100px_rgba(226, 75, 74, 0.15)] text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-danger-primary to-transparent" />
                
                <div className="w-24 h-24 bg-danger-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-danger-primary/20">
                  <span className="text-5xl">🛡️</span>
                </div>
                
                <h2 className="text-4xl font-outfit font-black mb-3 tracking-tighter text-white uppercase italic">Threat Intercepted</h2>
                <p className="text-danger-primary font-mono text-xs mb-10 opacity-60 tracking-widest uppercase">
                  Autonomous Countermeasures Deployed: {killSwitchTriggered.url}
                </p>
                
                <button
                  onClick={clearKillSwitch}
                  className="group relative px-10 py-4 bg-danger-primary rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300"
                >
                   <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                   <span className="relative text-black font-black uppercase tracking-widest text-xs">Authorize System Reset</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
