import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  ShieldAlert, 
  Terminal, 
  Database, 
  Globe 
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', icon: Globe, label: 'Ops Center' },
    { to: '/scanner', icon: ShieldAlert, label: 'Advanced Scanner' },
    { to: '/offensive', icon: Terminal, label: 'Offensive Suite' },
    { to: '/ledger', icon: Database, label: 'Audit Ledger' },
  ];

  return (
    <div className="w-16 hover:w-56 transition-all duration-300 bg-panelBg border-r border-gray-800 flex flex-col h-full z-20 group relative overflow-hidden backdrop-blur-xl">
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 h-14 overflow-hidden whitespace-nowrap">
        <span className="text-neonTeal text-2xl font-bold min-w-[24px]">◉</span>
        <span className="font-outfit font-bold text-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">PhishShield+</span>
      </div>

      <nav className="flex-1 mt-4 px-2 space-y-2 overflow-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-4 p-3 rounded-lg transition-all
              ${isActive 
                ? 'bg-neonTeal/10 text-neonTeal border border-neonTeal/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon size={20} className="min-w-[20px]" />
            <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 mb-2 overflow-hidden items-center flex gap-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neonTeal to-mutedTeal flex items-center justify-center text-xs font-bold text-darkBg shrink-0">
          SOC
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Role</p>
          <p className="text-xs text-white font-medium">Lead Analyst</p>
        </div>
      </div>
    </div>
  );
}
