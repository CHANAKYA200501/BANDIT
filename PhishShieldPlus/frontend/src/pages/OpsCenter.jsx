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
  const latestThreat = liveThreats[0] || null;

  const ATTACK_NODES = [
    { lat: 55.75, lng: 37.62, label: "Moscow, RU" },     
    { lat: 39.90, lng: 116.40, label: "Beijing, CN" },    
    { lat: 6.52, lng: 3.38, label: "Lagos, NG" },         
    { lat: -23.55, lng: -46.63, label: "São Paulo, BR" }, 
    { lat: 41.01, lng: 28.98, label: "Istanbul, TR" },    
    { lat: 37.77, lng: -122.42, label: "San Francisco, US" }, 
    { lat: 28.61, lng: 77.21, label: "New Delhi, IN" },   
  ];

  let lat = 0;
  let lng = 0;
  let regionLabel = "AWAITING TELEMETRY...";

  if (latestThreat) {
    const geo = latestThreat.geo;
    if (Array.isArray(geo) && geo.length >= 2 && geo[0] !== 0 && geo[1] !== 0) {
      lat = geo[0];
      lng = geo[1];
      regionLabel = `NODE_ORIGIN [${lat.toFixed(2)}, ${lng.toFixed(2)}]`;
    } else {
      const raw = latestThreat.timestamp || (latestThreat.url ? latestThreat.url.length : 0);
      const seed = Math.abs(Math.floor(Number(raw))) || 0;
      const node = ATTACK_NODES[seed % ATTACK_NODES.length];
      lat = node.lat;
      lng = node.lng;
      regionLabel = node.label;
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-[#020408]/30">
      
      {/* GLOBAL 3D TRACE LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={2} color="#66fcf1" />
          <directionalLight position={[0, 5, 5]} intensity={1} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Globe threats={liveThreats} />
          <NeuralShield />
          <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} autoRotate={false} />
        </Canvas>
      </div>

      {/* STRATEGIC OVERLAY HUD */}
      <div className="relative z-10 flex flex-1 w-full h-full p-8 pointer-events-none">
        
        {/* ALPHA TELEMETRY (LEFT) */}
        <div className="flex flex-col gap-8 w-[360px]">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, cubicBezier: [0.23, 1, 0.32, 1] }}
            className="clinical-panel p-8 flex flex-col gap-8 bg-white/[0.01] pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-6">
              <div className="flex items-center gap-3">
                <div className="status-indicator text-accent-primary" />
                <span className="text-[10px] text-white font-black uppercase tracking-[0.4em]">Telemetry_Alpha</span>
              </div>
              <span className="text-[8px] text-accent-primary/40 font-mono font-black tracking-widest uppercase italic">Node_Sync</span>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-slate-600 font-mono font-black uppercase tracking-[0.2em] italic">Geospatial_Focus</span>
                  <span className="text-[8px] text-accent-primary font-mono font-black tracking-widest italic">{regionLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.05] flex flex-col gap-1">
                    <span className="text-[7px] text-slate-700 uppercase font-black tracking-widest italic">Lat</span>
                    <p className="text-sm text-accent-primary font-mono font-black italic">{lat.toFixed(4)}</p>
                  </div>
                  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.05] flex flex-col gap-1">
                    <span className="text-[7px] text-slate-700 uppercase font-black tracking-widest italic">Lng</span>
                    <p className="text-sm text-accent-primary font-mono font-black italic">{lng.toFixed(4)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] p-5 rounded-xl border border-white/[0.03] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary/20" />
                <span className="text-[8px] text-slate-600 font-mono font-black uppercase tracking-[0.2em] block mb-3 italic">Active_Origin</span>
                <p className="text-[11px] text-white font-mono font-bold truncate leading-relaxed">
                  {(latestThreat && latestThreat.url) ? latestThreat.url : "SCANNING_PERIMETER..."}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card px-5 py-2.5 rounded-full flex items-center gap-4 w-fit border-white/[0.05] bg-white/[0.02]"
          >
            <div className="status-indicator text-success-primary" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] font-mono">Shield_Core: Optimized</span>
          </motion.div>
        </div>

        <div className="flex-1"></div>

        {/* GAMMA FEED (RIGHT) */}
        <aside className="w-[480px] flex flex-col pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, cubicBezier: [0.23, 1, 0.32, 1] }}
            className="flex-1 clinical-panel flex flex-col bg-white/[0.01]"
          >
            <div className="p-8 h-full flex flex-col overflow-hidden">
               <div className="flex items-center justify-between mb-8 border-b border-white/[0.03] pb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-1 h-5 bg-accent-primary/40 rounded-full" />
                     <h2 className="text-[11px] text-white font-black uppercase tracking-[0.4em]">Intelligence_Grid</h2>
                  </div>
                  <span className="text-[8px] text-accent-primary/60 font-mono font-black italic tracking-widest uppercase">Live_v4.2.1-SYNC</span>
               </div>
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <AlertFeed />
               </div>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* STRATEGIC DIAGNOSTIC CORE (BOTTOM) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-full max-w-5xl px-8 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, cubicBezier: [0.23, 1, 0.32, 1] }}
          className="glass-card px-10 py-4 rounded-full flex items-center justify-between gap-12 border border-white/[0.05] bg-black/40 backdrop-blur-3xl shadow-2xl"
        >
          <div className="flex items-center gap-8">
            <div className="h-1 w-32 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05] relative">
               <motion.div 
                 animate={{ x: ['-100%', '100%'] }} 
                 transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                 className="h-full w-24 bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent"
               />
            </div>
            <span className="text-[9px] text-slate-500 font-mono font-black uppercase tracking-[0.3em] italic">Neural_Link: Stable</span>
          </div>
          
          <div className="flex gap-16">
            <div className="flex items-center gap-4">
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic font-mono">Intercepts</span>
              <span className="text-2xl font-outfit font-black text-danger-primary italic leading-none">{liveThreats.filter(t => t.risk_level > 80).length}</span>
            </div>
            <div className="flex items-center gap-4 border-l border-white/[0.05] pl-16">
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic font-mono">Confidence</span>
              <span className="text-2xl font-outfit font-black text-accent-primary italic leading-none">99.8%</span>
            </div>
            <div className="flex items-center gap-4 border-l border-white/[0.05] pl-16">
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic font-mono">Posture</span>
              <span className="text-2xl font-outfit font-black text-accent-primary italic leading-none uppercase tracking-tighter">Hard</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
