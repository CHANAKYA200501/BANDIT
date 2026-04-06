import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Globe, AlertTriangle } from 'lucide-react';

export default function AlertFeed() {
  const feedUpdates = useThreatStore((state) => state.feedUpdates);

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="px-2 flex items-center justify-between">
        <h2 className="text-[10px] text-accent-primary font-black uppercase tracking-[0.3em] flex items-center gap-3">
          <Zap size={14} fill="currentColor" />
          Live Signal Intel
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
          <span className="text-[9px] text-gray-500 font-mono">Syncing...</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {feedUpdates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-20 space-y-4">
              <ShieldAlert size={32} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Scanning for ambient signatures...</p>
            </div>
          ) : (
            feedUpdates.map((feed, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                key={feed.timestamp + idx} 
                className="p-4 glass-card rounded-2xl border border-white/5 hover:border-accent-primary/30 hover:bg-white/[0.04] transition-all duration-300 group cursor-default shadow-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-400/10 text-red-400 group-hover:bg-red-400/20 group-hover:scale-110 transition-all duration-300">
                      <AlertTriangle size={12} />
                    </div>
                    <span className="text-[9px] text-gray-500 group-hover:text-white transition-colors duration-300 font-black uppercase tracking-widest truncate max-w-[120px]">{feed.source || 'INTEL_NODE'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 group-hover:border-accent-primary/40 transition-colors">
                    <Globe size={10} className="text-gray-500 group-hover:text-accent-primary transition-colors" />
                    <span className="text-[9px] text-white opacity-80 group-hover:opacity-100 transition-opacity font-black font-mono">{feed.geo || 'IND'}</span>
                  </div>
                </div>
                
                <div className="text-[13px] font-black text-white tracking-tight truncate group-hover:text-accent-primary group-hover:font-black transition-all duration-300 mb-2 font-mono">
                  {feed.domain || feed.url}
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.03] group-hover:border-white/[0.08] transition-colors">
                  <span className="text-[9px] text-red-500 font-black uppercase tracking-widest group-hover:text-red-400 transition-colors">{feed.risk_type || 'Potential Phish'}</span>
                  <span className="text-[8px] text-gray-600 group-hover:text-gray-400 font-mono transition-colors">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
