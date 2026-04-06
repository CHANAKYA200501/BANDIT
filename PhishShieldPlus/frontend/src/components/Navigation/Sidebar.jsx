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
    { to: '/ops', icon: Globe, label: 'Ops Center' },
    { to: '/scanner', icon: ShieldAlert, label: 'Forensic Lab' },
    { to: '/offensive', icon: Terminal, label: 'Offensive Suite' },
    { to: '/ledger', icon: Database, label: 'Audit Ledger' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#05080d] border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group hover:sidebar-expanded relative z-50">
      
      {/* BRANDING HUB */}
      <div className="h-16 flex items-center px-6 overflow-hidden border-b border-white/[0.03]">
        <div className="min-w-[32px] h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(102,252,241,0.1)] hover:border-accent-primary/50 transition-all duration-300">
          <div className="status-indicator text-accent-primary shadow-[0_0_8px_rgba(102,252,241,0.4)]" />
        </div>
        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <span className="text-[10px] font-black text-white hover:text-accent-primary transition-colors cursor-default uppercase tracking-[0.3em] italic">PhishShield<span className="text-accent-primary">+</span></span>
        </div>
      </div>

      {/* CORE NAVIGATION */}
      <nav className="flex-1 mt-8 px-3 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              group/item flex items-center h-12 rounded-xl transition-all duration-300 relative overflow-hidden
              ${isActive 
                ? 'bg-accent-primary/10 text-accent-primary active-link ring-1 ring-accent-primary/20 shadow-[0_0_15px_rgba(102,252,241,0.05)]' 
                : 'text-slate-500 hover:text-white hover:bg-white/[0.05] hover:shadow-lg'}
            `}
          >
            <div className="min-w-[54px] flex justify-center items-center">
              <item.icon size={18} className="transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-accent-primary" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
              {item.label}
            </span>
            
            {/* Active Glow Bar */}
            <div className="absolute left-0 w-1 h-6 bg-accent-primary rounded-r-full opacity-0 [.active-link_&]:opacity-100 transition-opacity shadow-[0_0_8px_rgba(102,252,241,0.5)]" />
          </NavLink>
        ))}
      </nav>

      {/* SYSTEM UTILS */}
      <div className="p-3 border-t border-white/5 space-y-3">
        <button className="flex items-center h-12 w-full rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.05] hover:shadow-md transition-all overflow-hidden group/btn">
          <div className="min-w-[54px] flex justify-center items-center">
            <Settings size={16} className="group-hover/btn:rotate-45 transition-transform duration-500" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity">Global_Config</span>
        </button>

        {/* ANALYST IDENT SHELL */}
        <div className="flex items-center h-14 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-accent-primary/30 hover:bg-accent-primary/[0.02] transition-all duration-500 overflow-hidden group/profile cursor-pointer">
          <div className="min-w-[54px] flex justify-center items-center">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0c0f14] to-[#1a1f26] border border-white/10 flex items-center justify-center text-[10px] font-black text-accent-primary group-hover/profile:border-accent-primary/50 transition-all shadow-inner">
              CH
            </div>
          </div>
          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[6px] text-accent-primary/60 font-black uppercase tracking-[0.2em] mb-0.5">L3_OPERATOR</span>
            <span className="text-[10px] text-white font-black tracking-tighter uppercase italic">CHANAKYA01</span>
          </div>
        </div>
      </div>
    </div>
  );
}
