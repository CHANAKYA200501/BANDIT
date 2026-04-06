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
                className="p-3 bg-darkBg border-b border-gray-700/50 hover:bg-gray-800/50 transition duration-300"
              >
                <div className="text-xs text-gray-500 mb-1 flex justify-between tracking-wider">
                  <span>{feed.source}</span>
                  <span className="font-bold">{feed.geo || 'US'}</span>
                </div>
                <div className="font-bold text-dangerRed truncate mb-1">{feed.domain}</div>
                <div className="text-xs text-gray-400">{feed.risk_type}</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
