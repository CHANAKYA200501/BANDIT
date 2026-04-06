import React from 'react';
import { useThreatStore } from '../../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function AlertFeed() {
  const feedUpdates = useThreatStore((state) => state.feedUpdates);

  return (
    <div className="flex flex-col gap-3 h-full">
      <h2 className="text-lg text-neonTeal font-bold font-outfit">Live Threat Feed</h2>
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-2">
        <AnimatePresence>
          {feedUpdates.length === 0 ? (
            <div className="text-sm text-gray-500">Listening for ambient threats...</div>
          ) : (
            feedUpdates.map((feed, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={feed.timestamp + idx} 
                className="p-3 bg-darkBg border border-dangerRed rounded shadow-[0_0_10px_rgba(226,75,74,0.2)]"
              >
                <div className="text-xs text-gray-400 mb-1 flex justify-between">
                  <span>{new Date(feed.timestamp * 1000).toLocaleTimeString()}</span>
                  <span className="text-dangerRed">{feed.source}</span>
                </div>
                <div className="font-bold text-gray-100 truncate">{feed.domain}</div>
                <div className="text-sm mt-1 uppercase text-xs text-dangerRed font-bold bg-dangerRed/10 inline-block px-1 rounded">{feed.risk_type}</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
