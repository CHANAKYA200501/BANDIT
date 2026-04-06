import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThreatStore } from '../../store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingCards() {
  const liveThreats = useThreatStore((state) => state.liveThreats);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (liveThreats.length > 0) {
      const latest = liveThreats[0];
      const newCard = {
        id: Date.now(),
        ...latest,
        pos: [(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]
      };
      setCards(prev => [...prev, newCard]);

      // Remove after 8 seconds
      setTimeout(() => {
        setCards(prev => prev.filter(c => c.id !== newCard.id));
      }, 8000);
    }
  }, [liveThreats]);

  return (
    <group>
      {cards.map(card => (
        <Html key={card.id} position={card.pos} center>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className={`w-64 p-3 rounded shadow-lg border backdrop-blur-md font-inter ${
              card.risk_level > 80 ? 'bg-dangerRed/20 border-dangerRed text-red-100' : 'bg-warningAmber/20 border-warningAmber text-yellow-100'
            }`}
          >
            <div className="font-bold truncate">{card.url || 'Unknown Target'}</div>
            <div className="text-xs mt-1">Risk: {card.risk_level}% | Confidence: {card.confidence}%</div>
            <div className="text-xs uppercase bg-black/40 inline-block px-1 mt-2 rounded">{card.source}</div>
          </motion.div>
        </Html>
      ))}
    </group>
  );
}
