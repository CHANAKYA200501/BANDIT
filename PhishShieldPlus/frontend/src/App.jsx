import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Globe from './components/Scene3D/Globe';
import NeuralShield from './components/Scene3D/NeuralShield';
import TxFlowGraph from './components/Scene3D/TxFlowGraph';
import ScanPanel from './components/Dashboard/ScanPanel';
import AlertFeed from './components/Dashboard/AlertFeed';
import BlockchainLog from './components/Dashboard/BlockchainLog';
import StatsBar from './components/Dashboard/StatsBar';
import { useSocket } from './hooks/useSocket';
import { useBlockchain } from './hooks/useBlockchain';
import { useThreatStore } from './store/threatStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  useSocket();
  useBlockchain();
  const killSwitchTriggered = useThreatStore((state) => state.killSwitchTriggered);
  const clearKillSwitch = useThreatStore((state) => state.clearKillSwitch);

  return (
    <div className="w-screen h-screen bg-darkBg text-white flex overflow-hidden">
      {/* Kill Switch Overlay */}
      <AnimatePresence>
        {killSwitchTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dangerRed/90 backdrop-blur-md"
          >
            <div className="text-center p-10 bg-black/80 rounded-xl border-4 border-dangerRed">
              <h1 className="text-5xl mb-4">🛡️</h1>
              <h2 className="text-3xl font-bold mb-2">THREAT INTERCEPTED</h2>
              <p className="mb-6">URL: {killSwitchTriggered.url}</p>
              <button
                onClick={clearKillSwitch}
                className="bg-transparent border-2 border-dangerRed text-dangerRed px-6 py-2 rounded hover:bg-dangerRed hover:text-white transition"
              >
                DISMISS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />

          <Globe />
          <NeuralShield />

          <OrbitControls autoRotate enableZoom={false} autoRotateSpeed={0.4} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col w-full h-full pointer-events-none">
        {/* Header */}
        <header className="pointer-events-auto px-5 border-b border-gray-800/60 bg-panelBg/90 backdrop-blur-md flex justify-between items-center h-14">
          <div className="flex items-center gap-2">
            <span className="text-neonTeal text-xl">◉</span>
            <h1 className="text-xl font-outfit font-bold text-neonTeal tracking-wide">PhishShield+</h1>
          </div>
          <StatsBar />
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Left Panel - Scanner */}
          <aside className="w-80 border-r border-gray-800/50 p-4 bg-panelBg/85 backdrop-blur-md flex flex-col gap-4 overflow-y-auto pointer-events-auto shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
            <ScanPanel />
          </aside>

          {/* Transparent center for 3D globe */}
          <div className="flex-1 pointer-events-none"></div>

          {/* Right Panel - Feed + Blockchain */}
          <aside className="w-80 border-l border-gray-800/50 p-4 bg-panelBg/85 backdrop-blur-md flex flex-col overflow-y-auto pointer-events-auto shadow-[-5px_0_15px_rgba(0,0,0,0.5)]">
            <div className="flex-1 overflow-y-auto">
              <AlertFeed />
            </div>
            <div className="border-t border-gray-700/50 pt-2 mt-2">
              <BlockchainLog />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
