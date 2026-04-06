import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Globe from '../components/Scene3D/Globe';
import NeuralShield from '../components/Scene3D/NeuralShield';
import AlertFeed from '../components/Dashboard/AlertFeed';
import { useThreatStore } from '../store/threatStore';
import { motion } from 'framer-motion';

export default function OpsCenter() {
  const liveThreats = useThreatStore((state) => state.liveThreats);
  const latestThreat = liveThreats[0] || {};
  const lat = latestThreat.geo?.[0] || 0;
  const lng = latestThreat.geo?.[1] || 0;

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* 3D Globe Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
          <Globe threats={liveThreats} />
          <NeuralShield />
          <OrbitControls autoRotate enableZoom={false} autoRotateSpeed={0.4} />
        </Canvas>
      </div>

      {/* HUD Telemetry Labels */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none flex flex-col gap-3">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/60 backdrop-blur-md border border-gray-800 px-4 py-3 rounded-lg flex flex-col gap-2 min-w-[200px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-neonTeal animate-pulse shadow-[0_0_8px_rgba(0,255,204,1)]"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Live Telemetry</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500 uppercase tracking-widest">Lat:</span>
              <span className="text-neonTeal font-mono font-bold">{lat.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500 uppercase tracking-widest">Lng:</span>
              <span className="text-neonTeal font-mono font-bold">{lng.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500 uppercase tracking-widest">Target:</span>
              <span className="text-white font-mono font-bold truncate max-w-[120px]">{latestThreat.domain || latestThreat.url || 'None'}</span>
            </div>
          </div>
        </motion.div>
        
        <div className="bg-black/40 backdrop-blur-md border border-gray-800 px-4 py-2 rounded flex items-center gap-3 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-neonTeal"></div>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Neural Shield: ACTIVE</span>
        </div>
      </div>

      {/* Live Threat Feed Overlay */}
      <aside className="relative z-10 w-96 ml-auto mr-4 my-4 border border-gray-800/80 p-4 bg-panelBg/80 backdrop-blur-xl flex flex-col rounded-xl overflow-hidden shadow-2xl pointer-events-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neonTeal to-transparent opacity-30"></div>
        <AlertFeed />
      </aside>
    </div>
  );
}
