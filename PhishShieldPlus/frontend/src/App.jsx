import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Globe from './components/Scene3D/Globe';
import NeuralShield from './components/Scene3D/NeuralShield';
import ThreatParticles from './components/Scene3D/ThreatParticles';
import ShadowAvatar from './components/Scene3D/ShadowAvatar';
import TxFlowGraph from './components/Scene3D/TxFlowGraph';
import FloatingCards from './components/Scene3D/FloatingCards';
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
      {/* Kill Switch Overlay Layer */}
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
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Globe />
          <NeuralShield />
          <TxFlowGraph />
          
          <OrbitControls autoRotate enableZoom={false} autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col w-full h-full pointer-events-none">
        <header className="pointer-events-auto p-4 border-b border-gray-800 bg-panelBg/80 backdrop-blur-md flex justify-between items-center h-16">
          <h1 className="text-2xl font-outfit font-bold text-neonTeal">PhishShield+</h1>
          <StatsBar />
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <aside className="w-96 border-r border-gray-800 p-4 bg-panelBg/80 backdrop-blur-md flex flex-col gap-6 overflow-y-auto pointer-events-auto shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
            <ScanPanel />
            <BlockchainLog />
          </aside>
          
          {/* Transparent Main Area allows 3D interactions */}
          <div className="flex-1 pointer-events-none"></div>

          {/* Right Panel */}
          <aside className="w-96 border-l border-gray-800 p-4 bg-panelBg/80 backdrop-blur-md flex flex-col gap-4 overflow-y-auto pointer-events-auto shadow-[-5px_0_15px_rgba(0,0,0,0.5)]">
            <AlertFeed />
          </aside>
        </main>
      </div>
    </div>
  );
}
