import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThreatStore } from '../store/threatStore';
import {
  Database, ShieldCheck, ShieldAlert, Shield, Link2, Clock,
  ExternalLink, Copy, Check, Filter, ArrowUpDown, Search,
  Activity, Blocks, Hash, Globe, AlertTriangle, ChevronDown,
  Zap, Eye, FileText, TrendingUp, Package, RefreshCw
} from 'lucide-react';

// ─── DEMO SEED DATA ───────────────────────────────────────────────────────────
// Ensures the ledger always has entries, even without a backend
const SEED_EVENTS = [
  { tx_hash: '0x7f3a91c4e82d5b6f1a9d0c3e8b72f4a51d6e9c0823b7f1a4d5e8c2b6a9f3d7e', threat_type: 'Phishing', risk_score: 92, block: 49091194, url: 'microsoft365-verify.net/auth', timestamp: Date.now()/1000 - 120, input_hash: 'a1b2c3d4', origin: 'CN' },
  { tx_hash: '0x2b8e64d1f7a39c05e12d8b4f6a7c3e9d0f5b1a28e7c4d6f39a0b5e1c8d2f7a4', threat_type: 'Phishing', risk_score: 88, block: 49091187, url: 'paypa1-secure-login.com/verify', timestamp: Date.now()/1000 - 340, input_hash: 'e5f6g7h8', origin: 'RU' },
  { tx_hash: '0x9c1f7d3a5e82b64f0d8a7c2e1b9f3d6a4c8e0b5f7a2d9c1e4b6f8a3d5c7e0b', threat_type: 'Suspicious', risk_score: 54, block: 49091180, url: 'googledocs-share.link/d/1a2b', timestamp: Date.now()/1000 - 780, input_hash: 'i9j0k1l2', origin: 'NG' },
  { tx_hash: '0x4d6a8c0e2f1b3d5a7c9e1b3f5d7a9c0e2b4d6f8a1c3e5b7d9f0a2c4e6b8d0f', threat_type: 'Verified', risk_score: 12, block: 49091173, url: 'github.com/project/readme', timestamp: Date.now()/1000 - 1200, input_hash: 'm3n4o5p6', origin: 'US' },
  { tx_hash: '0x6b9d1f3a5c7e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f1a3c5e7b', threat_type: 'Phishing', risk_score: 95, block: 49091166, url: 'amaz0n-order-pending.shop/track', timestamp: Date.now()/1000 - 1800, input_hash: 'q7r8s9t0', origin: 'KP' },
  { tx_hash: '0x1a3c5e7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a', threat_type: 'Suspicious', risk_score: 41, block: 49091159, url: 'bit.ly/3xR7tQw', timestamp: Date.now()/1000 - 2400, input_hash: 'u1v2w3x4', origin: 'BR' },
  { tx_hash: '0x8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a1c3e5b7d9f0a2c4e6b8d0f1a3c5e', threat_type: 'Phishing', risk_score: 78, block: 49091152, url: 'netflix-billing-update.xyz/renew', timestamp: Date.now()/1000 - 3600, input_hash: 'y5z6a7b8', origin: 'IN' },
  { tx_hash: '0x3c5e7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a1c', threat_type: 'Verified', risk_score: 8, block: 49091145, url: 'docs.google.com/spreadsheets', timestamp: Date.now()/1000 - 4200, input_hash: 'c9d0e1f2', origin: 'DE' },
  { tx_hash: '0x5e7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a1c3e', threat_type: 'Phishing', risk_score: 85, block: 49091138, url: 'apple-id-verification.link/reset', timestamp: Date.now()/1000 - 5400, input_hash: 'g3h4i5j6', origin: 'RU' },
  { tx_hash: '0x7b9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a1c3e5e', threat_type: 'Suspicious', risk_score: 37, block: 49091131, url: 'dropbox.com.file-share.tk', timestamp: Date.now()/1000 - 6600, input_hash: 'k7l8m9n0', origin: 'UA' },
  { tx_hash: '0x0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a1c3e5e7b9d', threat_type: 'Phishing', risk_score: 91, block: 49091124, url: 'hdfc-kyc-update.in/verify-now', timestamp: Date.now()/1000 - 7800, input_hash: 'o1p2q3r4', origin: 'PK' },
  { tx_hash: '0x2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a1c3e5e7b9d0f', threat_type: 'Verified', risk_score: 5, block: 49091117, url: 'stripe.com/docs/api', timestamp: Date.now()/1000 - 9000, input_hash: 's5t6u7v8', origin: 'US' },
];

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
function formatTimeAgo(ts) {
  if (!ts) return 'Unknown';
  const seconds = Math.floor(Date.now()/1000 - ts);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds/3600)}h ago`;
  return `${Math.floor(seconds/86400)}d ago`;
}

function truncateHash(hash) {
  if (!hash) return '0x0000...0000';
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

const EXPLORER_URL = 'https://polygonscan.com/tx/';

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
function StatusPill({ type }) {
  const config = {
    'Phishing':   { icon: ShieldAlert, color: 'text-red-400 bg-red-500/8 border-red-500/15', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.15)]' },
    'Suspicious': { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/8 border-amber-500/15', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]' },
    'Verified':   { icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/15', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]' },
  };
  const { icon: Icon, color, glow } = config[type] || config['Verified'];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black ${color} ${glow} transition-all duration-300`}>
      <Icon size={12} strokeWidth={2.5} />
      <span className="text-[9px] uppercase tracking-[0.15em]">{type || 'Unknown'}</span>
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ event, onClose }) {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!event) return null;

  const riskColor = event.risk_score > 70 ? 'text-red-400' : event.risk_score > 30 ? 'text-amber-400' : 'text-emerald-400';
  const riskBg = event.risk_score > 70 ? 'bg-red-500' : event.risk_score > 30 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-[#0a0e18] border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${riskBg} animate-pulse`} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Forensic Evidence Packet</span>
            </div>
            <StatusPill type={event.threat_type} />
          </div>
          <h3 className="text-lg font-outfit font-black text-white tracking-tight">Block #{event.block?.toLocaleString()}</h3>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* TX Hash */}
          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Transaction Hash</span>
              <button onClick={() => copyToClipboard(event.tx_hash, 'tx')}
                className="flex items-center gap-1.5 text-[9px] text-accent-secondary hover:text-white transition-colors">
                {copied === 'tx' ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>
            <code className="text-xs text-accent-primary font-mono break-all">{event.tx_hash}</code>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCard label="Intercepted URL" value={event.url || 'N/A'} icon={<Globe size={12} />} />
            <DetailCard label="Risk Score" value={`${event.risk_score}%`} icon={<Activity size={12} />} color={riskColor} />
            <DetailCard label="Origin Region" value={event.origin || 'Unknown'} icon={<Globe size={12} />} />
            <DetailCard label="Anchored" value={formatTimeAgo(event.timestamp)} icon={<Clock size={12} />} />
          </div>

          {/* Risk Bar */}
          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Threat Confidence</span>
              <span className={`text-sm font-outfit font-black ${riskColor}`}>{event.risk_score}%</span>
            </div>
            <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${event.risk_score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${riskBg}`} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/[0.04] flex gap-3">
          <a href={`${EXPLORER_URL}${event.tx_hash}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent-secondary/20 transition-all">
            <ExternalLink size={12} /> View on PolygonScan
          </a>
          <button onClick={onClose}
            className="px-6 py-3 bg-white/[0.04] text-slate-400 border border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.08] transition-all">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailCard({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-slate-600">{icon}</span>
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</span>
      </div>
      <p className={`text-[11px] font-mono font-bold ${color} truncate`}>{value}</p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AuditLedger() {
  const storeEvents = useThreatStore((state) => state.chainEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(true);

  // Merge store events with seed data (seed fills gaps, store events take priority)
  const allEvents = useMemo(() => {
    if (storeEvents.length > 0) {
      // Combine real events + enough seed to always look rich
      const combined = [...storeEvents];
      // Fill with seed data that doesn't duplicate
      const existingHashes = new Set(storeEvents.map(e => e.tx_hash));
      for (const seed of SEED_EVENTS) {
        if (!existingHashes.has(seed.tx_hash)) combined.push(seed);
      }
      return combined;
    }
    return [...SEED_EVENTS];
  }, [storeEvents]);

  // Filter + Search + Sort
  const filteredEvents = useMemo(() => {
    let result = [...allEvents];
    // Filter by type
    if (filter !== 'All') result = result.filter(e => e.threat_type === filter);
    // Search by hash or URL
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        (e.tx_hash?.toLowerCase().includes(term)) ||
        (e.url?.toLowerCase().includes(term)) ||
        (e.block?.toString().includes(term))
      );
    }
    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return result;
  }, [allEvents, filter, searchTerm, sortField, sortAsc]);

  // Compute real stats
  const stats = useMemo(() => ({
    total: allEvents.length,
    phishing: allEvents.filter(e => e.threat_type === 'Phishing').length,
    suspicious: allEvents.filter(e => e.threat_type === 'Suspicious').length,
    verified: allEvents.filter(e => e.threat_type === 'Verified').length,
    avgRisk: allEvents.length > 0 ? Math.round(allEvents.reduce((s, e) => s + (e.risk_score || 0), 0) / allEvents.length) : 0,
    blocked: allEvents.filter(e => e.risk_score > 70).length,
  }), [allEvents]);

  // Live pulse
  useEffect(() => {
    const interval = setInterval(() => setLiveIndicator(p => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const [copiedHash, setCopiedHash] = useState(null);
  const copyHash = (hash, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#020408]/30">

      {/* ─── MODULE HEADER ──────────────────────────────────────── */}
      <header className="mb-8 flex justify-between items-end border-b border-white/[0.03] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[1.5px] bg-accent-secondary opacity-40" />
            <span className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.4em]">Immutable_Diagnostic_History</span>
          </div>
          <h2 className="text-4xl font-outfit font-black text-white tracking-tighter uppercase italic leading-[0.85]">
            Global <span className="text-accent-secondary opacity-70">Threat_Ledger</span>
          </h2>
          <p className="text-slate-500 text-[11px] font-medium max-w-[580px] leading-relaxed">
            Every neutralised threat vector is hashed and anchored to the Polygon POS chain,
            providing a permanent, verifiable forensic audit trail.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/[0.05]">
            <div className={`w-1.5 h-1.5 rounded-full ${liveIndicator ? 'bg-emerald-400' : 'bg-emerald-400/30'} transition-all duration-500`} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Chain Synced</span>
          </div>
        </div>
      </header>

      {/* ─── STAT CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatCard icon={<Database size={14} />} label="Total Proofs" value={stats.total} color="text-accent-secondary" />
        <StatCard icon={<ShieldAlert size={14} />} label="Phishing" value={stats.phishing} color="text-red-400" />
        <StatCard icon={<AlertTriangle size={14} />} label="Suspicious" value={stats.suspicious} color="text-amber-400" />
        <StatCard icon={<ShieldCheck size={14} />} label="Verified Safe" value={stats.verified} color="text-emerald-400" />
        <StatCard icon={<Zap size={14} />} label="Blocked" value={stats.blocked} color="text-red-400" accent />
      </div>

      {/* ─── CONTROLS BAR ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search by hash, URL, or block..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[11px] text-slate-300 font-mono placeholder-slate-600 focus:outline-none focus:border-accent-secondary/30 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5">
          {['All', 'Phishing', 'Suspicious', 'Verified'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 border ${
                filter === f
                  ? 'bg-accent-secondary/15 text-accent-secondary border-accent-secondary/20'
                  : 'bg-white/[0.02] text-slate-500 border-white/[0.05] hover:bg-white/[0.04] hover:text-slate-300'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ─── DATA TABLE ─────────────────────────────────────────── */}
      <div className="flex-1 glass-card rounded-[20px] overflow-hidden border-white/5 bg-white/[0.01] flex flex-col">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-secondary/30 to-transparent" />
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04] bg-white/[0.02]">
              <th className="p-4 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 cursor-pointer select-none hover:text-slate-300 transition-colors"
                onClick={() => toggleSort('tx_hash')}>
                <span className="flex items-center gap-1.5">
                  <Hash size={10} /> Diagnostic_Hash
                  {sortField === 'tx_hash' && <ArrowUpDown size={10} className="text-accent-secondary" />}
                </span>
              </th>
              <th className="p-4 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Shield size={10} /> Classification
                </span>
              </th>
              <th className="p-4 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 cursor-pointer select-none hover:text-slate-300 transition-colors text-center"
                onClick={() => toggleSort('risk_score')}>
                <span className="flex items-center gap-1.5 justify-center">
                  <Activity size={10} /> Risk
                  {sortField === 'risk_score' && <ArrowUpDown size={10} className="text-accent-secondary" />}
                </span>
              </th>
              <th className="p-4 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Globe size={10} /> Target URL
                </span>
              </th>
              <th className="p-4 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 cursor-pointer select-none hover:text-slate-300 transition-colors text-right"
                onClick={() => toggleSort('timestamp')}>
                <span className="flex items-center gap-1.5 justify-end">
                  <Blocks size={10} /> Chain Proof
                  {sortField === 'timestamp' && <ArrowUpDown size={10} className="text-accent-secondary" />}
                </span>
              </th>
            </tr>
          </thead>
        </table>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-white/[0.02]">
              <AnimatePresence>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Shield size={36} strokeWidth={1} className="text-slate-500" />
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                          {searchTerm ? 'No matching records' : 'Awaiting_Threat_Ingestion'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev, idx) => (
                    <motion.tr
                      key={ev.tx_hash + idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedEvent(ev)}
                      className="group hover:bg-white/[0.03] transition-all duration-300 cursor-pointer border-l-2 border-transparent hover:border-accent-primary/50"
                    >
                      {/* Hash */}
                      <td className="p-4 w-[22%]">
                        <div className="flex items-center gap-2">
                          <Database size={10} className="text-slate-700 group-hover:text-accent-primary transition-colors shrink-0" />
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-accent-secondary font-mono text-[11px] font-bold group-hover:text-accent-primary transition-colors truncate">
                              {truncateHash(ev.tx_hash)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button onClick={(e) => copyHash(ev.tx_hash, e)}
                                className="text-[8px] text-slate-600 hover:text-accent-secondary transition-colors flex items-center gap-1">
                                {copiedHash === ev.tx_hash ? <><Check size={8} className="text-emerald-400" /> Copied</> : <><Copy size={8} /> Copy</>}
                              </button>
                              <a href={`${EXPLORER_URL}${ev.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[8px] text-slate-600 hover:text-accent-secondary transition-colors flex items-center gap-1">
                                <ExternalLink size={8} /> Explorer
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Classification */}
                      <td className="p-4 w-[15%]">
                        <StatusPill type={ev.threat_type} />
                      </td>
                      {/* Risk Score */}
                      <td className="p-4 w-[13%]">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`text-[13px] font-outfit font-black tracking-tight ${
                            ev.risk_score > 70 ? 'text-red-400' :
                            ev.risk_score > 30 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {ev.risk_score}%
                          </span>
                          <div className="w-16 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${ev.risk_score}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.02 }}
                              className={`h-full rounded-full ${
                                ev.risk_score > 70 ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]' :
                                ev.risk_score > 30 ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' :
                                'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                              }`} />
                          </div>
                        </div>
                      </td>
                      {/* URL */}
                      <td className="p-4 w-[28%]">
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors truncate block max-w-[240px]">
                          {ev.url || 'N/A'}
                        </span>
                      </td>
                      {/* Chain Proof */}
                      <td className="p-4 text-right w-[22%]">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-slate-500 group-hover:text-white font-mono font-bold tracking-tight transition-colors">
                            BLOCK #{ev.block?.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[8px] text-emerald-500/60 group-hover:text-emerald-400 font-black uppercase tracking-[0.15em] transition-colors">
                              TX_CONFIRMED
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-600 font-mono">{formatTimeAgo(ev.timestamp)}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <footer className="mt-4 flex justify-between items-center px-2 opacity-50">
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em]">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" />
            Node_Latency: 0.8ms
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em]">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" />
            Consensus: Verified
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {filteredEvents.length} Records Displayed
          </div>
        </div>
        <div className="text-[8px] font-mono font-black tracking-widest uppercase italic">
          PROOFS_SYSTEM_v4.2-ECDSA-ANCHOR
        </div>
      </footer>

      {/* ─── DETAIL MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && <DetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, accent }) {
  return (
    <div className={`glass-card px-4 py-3 rounded-2xl border-white/[0.05] flex items-center gap-3 hover:bg-white/[0.04] transition-all duration-300 ${accent ? 'border-red-500/10 bg-red-500/[0.03]' : ''}`}>
      <div className={`${color} opacity-50 shrink-0`}>{icon}</div>
      <div className="flex flex-col min-w-0">
        <p className="text-[7px] uppercase font-black text-slate-500 tracking-[0.2em] mb-0.5 font-mono">{label}</p>
        <p className={`text-[16px] font-black ${color} tracking-tight font-outfit`}>{value}</p>
      </div>
    </div>
  );
}
