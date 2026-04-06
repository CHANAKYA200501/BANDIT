import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Lock, Cpu, Eye, Bell, Key, Database, Server } from 'lucide-react';

export default function Settings() {
  const [configs, setConfigs] = useState({
    autoKillSwitch: true,
    telemetryBroadcast: true,
    strictHsts: true,
    aggressiveAiTM: false,
    aiHeuristicMode: 'Ensemble',
    retentionDays: 30,
    notificationLevel: 'Critical Only'
  });

  const toggle = (key) => setConfigs(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-400/10 border border-slate-500/20 flex items-center justify-center">
              <Server size={20} className="text-slate-400" />
            </div>
            <h1 className="text-3xl font-outfit font-black tracking-tighter text-white uppercase italic">
              Global <span className="text-slate-400">Configuration</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed font-inter">
            Modify core system parameters, AI heuristic aggressiveness, and operational thresholds for the SOC environment.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/10 border border-slate-500/20 rounded-full">
          <Lock size={12} className="text-slate-400" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">L3 Access Required</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        
        {/* CORE ENGINE */}
        <div className="clinical-panel p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Cpu size={14} className="text-accent-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Detection Engine</span>
          </div>

          <div className="space-y-5">
            <ToggleRow 
              label="Autonomous Kill Switch" 
              desc="Automatically block requests when Neural-Shield confidence exceeds 90%" 
              state={configs.autoKillSwitch} 
              onToggle={() => toggle('autoKillSwitch')} 
            />
            <ToggleRow 
              label="Aggressive AiTM Detection" 
              desc="Flag minor TLS anomalies (e.g. SNI mismatches) as critical proxies" 
              state={configs.aggressiveAiTM} 
              onToggle={() => toggle('aggressiveAiTM')} 
            />
            
            <div className="pt-2">
               <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">AI Heuristic Model</span>
               <div className="flex gap-2">
                 {['Strict', 'Ensemble', 'Permissive'].map(m => (
                   <button 
                     key={m}
                     onClick={() => setConfigs(prev => ({...prev, aiHeuristicMode: m}))}
                     className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                       configs.aiHeuristicMode === m 
                       ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary border' 
                       : 'bg-white/[0.02] border border-white/5 text-slate-500 hover:text-white'
                     }`}
                   >
                     {m}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* TELEMETRY & NETWORK */}
        <div className="clinical-panel p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Globe size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Network & Telemetry</span>
          </div>

          <div className="space-y-5">
            <ToggleRow 
              label="Global Intelligence Broadcast" 
              desc="Share anonymized threat hashes with external SOC nodes and Polygon chain" 
              state={configs.telemetryBroadcast} 
              onToggle={() => toggle('telemetryBroadcast')} 
            />
            <ToggleRow 
              label="Strict HSTS Validation" 
              desc="Drop connections instantly if strict transport security headers are missing" 
              state={configs.strictHsts} 
              onToggle={() => toggle('strictHsts')} 
            />

            <div className="pt-2 border-t border-white/5 mt-4">
               <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-4">Ledger Retention</span>
               <div className="flex items-center gap-4">
                 <input 
                   type="range" 
                   min="1" max="90" 
                   value={configs.retentionDays} 
                   onChange={(e) => setConfigs(prev => ({...prev, retentionDays: parseInt(e.target.value)}))}
                   className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-accent-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                 />
                 <span className="text-[10px] font-mono text-accent-primary w-12 text-right">{configs.retentionDays}D</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function ToggleRow({ label, desc, state, onToggle }) {
  return (
    <div className="flex items-center justify-between">
      <div className="pr-4">
        <div className="text-[10px] font-black text-white uppercase tracking-wider mb-1">{label}</div>
        <div className="text-[9px] text-slate-500 leading-relaxed max-w-sm">{desc}</div>
      </div>
      <button 
        onClick={onToggle}
        className={`relative w-10 h-5 rounded-full transition-colors duration-300 flex-shrink-0 ${state ? 'bg-accent-primary/20 border border-accent-primary/30' : 'bg-white/5 border border-white/10'}`}
      >
        <motion.div 
          initial={false}
          animate={{ x: state ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${state ? 'bg-accent-primary' : 'bg-slate-400'}`}
        />
      </button>
    </div>
  );
}
