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
    <div className="flex-1 flex overflow-hidden relative w-full h-full">
      {/* 3D Globe Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 50 }}>
          <ambientLight intensity={1.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={2} color="#66fcf1" />
          <directionalLight position={[0, 0, 8]} intensity={1} />
          <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
          <Globe threats={liveThreats} />
          <NeuralShield />
          <OrbitControls autoRotate enableZoom={false} enablePan={false} zoomSpeed={0} autoRotateSpeed={0.4} />
        </Canvas>
      </div>

      {/* Institutional HUD Telemetry */}
      <div className="absolute bottom-8 left-8 z-10 pointer-events-none flex flex-col gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-card px-6 py-5 rounded-3xl flex flex-col gap-4 min-w-[280px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-primary animate-pulse shadow-[0_0_12px_rgba(102,252,241,1)]"></div>
              <span className="text-[10px] text-accent-primary font-black uppercase tracking-[0.3em]">Live Geostat</span>
            </div>
            <span className="text-[9px] text-gray-500 font-mono">RC-Alpha/04</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Latitude</span>
              <p className="text-sm text-white font-mono font-black">{lat.toFixed(6)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Longitude</span>
              <p className="text-sm text-white font-mono font-black">{lng.toFixed(6)}</p>
            </div>
          </div>
          
          <div className="pt-3 border-t border-white/5 space-y-1">
            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Current Active Target</span>
            <p className="text-xs text-accent-primary font-black font-mono truncate tracking-tight">{latestThreat.domain || latestThreat.url || 'AWAITING_INGESTION'}</p>
          </div>
        </motion.div>
        
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div>
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.25em]">Neural Defense: SYNCHRONIZED</span>
        </div>
      </div>

      {/* Live Threat Feed Overlay */}
      <aside className="relative z-10 w-[420px] ml-auto mr-8 my-8 glass-card rounded-3xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent opacity-50"></div>
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <AlertFeed />
        </div>
      </aside>
    </div>
  );
}
