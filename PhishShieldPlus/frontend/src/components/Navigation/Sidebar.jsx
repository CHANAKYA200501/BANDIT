import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  Terminal, 
  Database, 
  Globe,
  Settings,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const navItems = [
    { to: '/', icon: Globe, label: 'Ops Center' },
    { to: '/scanner', icon: ShieldAlert, label: 'Forensic Scanner' },
    { to: '/offensive', icon: Terminal, label: 'Offensive Suite' },
    { to: '/ledger', icon: Database, label: 'Audit Ledger' },
  ];

  return (
    <div className="w-16 hover:w-60 transition-all duration-500 ease-in-out bg-[#0d0d0f]/80 border-r border-white/5 flex flex-col h-full z-50 group relative overflow-hidden backdrop-blur-2xl">
      {/* Platform Branding */}
      <div className="flex items-center gap-4 p-4 h-16 border-b border-white/5 overflow-hidden">
        <div className="min-w-[32px] h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center relative">
          <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          <div className="absolute inset-0 rounded-lg border border-accent-primary/40 animate-ping opacity-20" />
        </div>
        <span className="font-outfit font-bold text-lg text-white tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          PhishShield<span className="text-accent-primary">+</span>
        </span>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 mt-6 px-3 space-y-1">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Modules
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-4 p-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shadow-[0_0_15px_rgba(102,252,241,0.05)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon size={20} className="shrink-0" />
            <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* System Settings & User */}
      <div className="mt-auto px-3 space-y-1 border-t border-white/5 pt-4">
        <button className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <Settings size={20} className="shrink-0" />
          <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Settings</span>
        </button>
      </div>

      <div className="p-3 mb-6 mt-2">
        <div className="p-2 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 group-hover:bg-white/10 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center text-[10px] font-bold text-black shrink-0 shadow-lg">
            CH
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <p className="text-[10px] text-accent-primary uppercase tracking-widest font-bold">L3 Analyst</p>
            <p className="text-xs text-white font-bold truncate">CHANAKYA01</p>
          </div>
        </div>
      </div>
    </div>
  );
}
