import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Upload, FileText, Monitor, Terminal as TermIcon,
  Crosshair, Zap, Radar, MapPin, AlertTriangle, Eye,
  ChevronRight, Server, Lock, Fingerprint, Skull, Camera,
  RefreshCw, Globe, Activity, ArrowRight, CheckCircle2,
  Image, CreditCard, User, X, Check, AlertOctagon, Wifi
} from 'lucide-react';

// ─── WORLD MAP SVG ──────────────────────────────────────────────────────────
function WorldMap({ marker, beaconActive }) {
  return (
    <div className="relative w-full h-full min-h-[200px] overflow-hidden rounded-2xl bg-[#020508] border border-white/[0.04]">
      <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* Grid */}
        {Array.from({length: 17}, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i*25} x2="800" y2={i*25} stroke="#66fcf1" strokeWidth="0.2" opacity="0.06" />
        ))}
        {Array.from({length: 33}, (_, i) => (
          <line key={`v${i}`} x1={i*25} y1="0" x2={i*25} y2="400" stroke="#66fcf1" strokeWidth="0.2" opacity="0.06" />
        ))}
        {/* Stylized continents */}
        <g fill="none" stroke="#66fcf1" strokeWidth="0.6" opacity="0.18">
          <path d="M100,100 C120,70 180,55 210,75 C240,60 260,70 270,90 C280,80 300,85 290,110 C300,130 280,160 250,165 C240,180 210,190 190,175 C170,185 140,175 130,155 C110,160 95,140 100,120 Z"/>
          <path d="M175,210 C195,195 220,195 230,215 C245,210 250,230 245,250 C250,270 240,300 225,320 C210,335 195,330 185,310 C175,320 160,305 165,280 C155,265 160,240 165,225 Z"/>
          <path d="M340,70 C355,60 380,55 400,65 C415,55 435,60 440,80 C445,70 460,75 455,95 C460,110 445,125 430,120 C425,130 410,135 395,125 C385,130 365,125 355,110 C345,115 335,100 340,85 Z"/>
          <path d="M375,145 C395,135 420,140 430,155 C440,150 450,165 445,185 C450,205 440,230 425,250 C415,270 400,278 385,270 C375,280 360,270 355,250 C345,240 350,215 355,200 C348,185 355,165 365,155 Z"/>
          <path d="M430,55 C460,40 510,35 550,45 C580,35 620,45 650,65 C670,55 695,70 690,90 C700,105 690,130 670,140 C680,155 665,175 640,170 C625,180 600,178 580,170 C560,185 530,178 510,165 C490,170 465,160 455,145 C445,150 430,140 435,120 C425,110 420,85 430,70 Z"/>
          <path d="M610,240 C635,230 665,230 685,245 C700,240 710,255 705,270 C710,285 695,300 675,298 C660,305 640,300 630,285 C620,290 608,280 610,265 Z"/>
        </g>
        {/* Connection lines from beacon to target */}
        {beaconActive && marker && (
          <g>
            <motion.line
              x1="500" y1="140" x2={marker.x * 8} y2={marker.y * 4}
              stroke="#e24b4a" strokeWidth="0.8" strokeDasharray="4,4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle cx="500" cy="140" r="3" fill="#66fcf1" opacity="0.5"
              animate={{ r: [3, 5, 3] }} transition={{ duration: 1.5, repeat: Infinity }}
            />
          </g>
        )}
      </svg>

      {/* Scan line */}
      {beaconActive && (
        <motion.div
          className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent"
          animate={{ y: [0, 200, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Target marker */}
      <AnimatePresence>
        {marker && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute"
            style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%,-50%)' }}
          >
            <motion.div className="absolute w-20 h-20 -ml-10 -mt-10 rounded-full border border-red-500/20"
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }} transition={{ duration: 2.5, repeat: Infinity }} />
            <motion.div className="absolute w-14 h-14 -ml-7 -mt-7 rounded-full border border-red-500/30"
              animate={{ scale: [1, 2], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
            <motion.div className="w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 shadow-[0_0_25px_rgba(226,75,74,0.9)]"
              animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <div className="absolute top-5 left-5 whitespace-nowrap bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md border border-red-500/30">
              <div className="text-[7px] font-black text-red-400 uppercase tracking-[0.15em]">55.76°N, 37.62°E</div>
              <div className="text-[6px] text-red-400/50 font-mono">Moscow, RU • ASN44546</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Origin point (India) */}
      {beaconActive && (
        <div className="absolute" style={{ left: '62%', top: '35%' }}>
          <motion.div className="w-2.5 h-2.5 -ml-1 -mt-1 rounded-full bg-cyan-400/60 shadow-[0_0_10px_rgba(102,252,241,0.5)]"
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>
      )}

      <div className="absolute bottom-2 left-3 text-[6px] font-mono text-white/15 uppercase tracking-widest">
        PhishShield+ GeoTrace v4.2 • Satellite Feed
      </div>
      <div className="absolute top-2 right-3 text-[6px] font-mono text-white/15 uppercase">
        {beaconActive ? '● LIVE TRACKING' : 'STANDBY'}
      </div>
    </div>
  );
}

// ─── FORENSIC TERMINAL ──────────────────────────────────────────────────────
function ForensicTerminal({ lines, isActive }) {
  const termRef = useRef(null);
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [lines]);

  return (
    <div className={`relative h-full rounded-2xl border transition-all duration-500 ${
      isActive ? 'bg-[#020508] border-red-500/15 shadow-[0_0_40px_rgba(226,75,74,0.06)]' : 'bg-[#020508] border-white/[0.04]'
    }`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500' : 'bg-red-500/30'}`} />
            <div className="w-2 h-2 rounded-full bg-yellow-500/30" />
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-green-500/30'}`} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">
            Live Threat Intelligence
          </span>
        </div>
        {isActive && <motion.div className="w-1.5 h-1.5 rounded-full bg-red-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
      </div>
      <div ref={termRef} className="p-4 font-mono text-[10px] leading-[1.7] overflow-y-auto max-h-[175px] space-y-px">
        {lines.length === 0 ? (
          <div className="text-slate-600/50">
            {`root@phishshield:~# `}
            <span className="text-slate-600">awaiting beacon callback...</span>
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }} className="text-accent-primary">▌</motion.span>
          </div>
        ) : lines.map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.1 }}
            className={`${line.type === 'success' ? 'text-emerald-400' : line.type === 'danger' ? 'text-red-400' :
              line.type === 'warning' ? 'text-amber-400' : line.type === 'info' ? 'text-cyan-400/80' :
              line.type === 'header' ? 'text-red-500 font-bold' : 'text-slate-500'}`}
          >{line.text}</motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── DOCUMENT UPLOAD SLOT ────────────────────────────────────────────────────
function DocSlot({ icon: Icon, label, status, fileName, onUpload }) {
  const isUploaded = status === 'uploaded';
  const isProcessing = status === 'processing';
  const isCanary = status === 'canary';

  return (
    <motion.div
      whileHover={status === 'idle' ? { scale: 1.01 } : {}}
      onClick={status === 'idle' ? onUpload : undefined}
      className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-500 group ${
        isCanary ? 'bg-emerald-500/[0.04] border-emerald-500/20'
        : isProcessing ? 'bg-amber-500/[0.04] border-amber-500/20'
        : isUploaded ? 'bg-blue-500/[0.04] border-blue-500/20'
        : 'bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/10'
      }`}
    >
      {/* Icon area */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
        isCanary ? 'bg-emerald-500/10 border border-emerald-500/20'
        : isProcessing ? 'bg-amber-500/10 border border-amber-500/20'
        : isUploaded ? 'bg-blue-500/10 border border-blue-500/20'
        : 'bg-white/[0.03] border border-white/5 group-hover:border-blue-500/20'
      }`}>
        {isCanary ? <CheckCircle2 size={15} className="text-emerald-400" /> :
         isProcessing ? <motion.div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"
           animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /> :
         isUploaded ? <Check size={15} className="text-blue-400" /> :
         <Icon size={15} className="text-slate-500 group-hover:text-blue-400 transition-colors" />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] font-bold transition-colors ${
          isCanary ? 'text-emerald-400' : isProcessing ? 'text-amber-400' : isUploaded ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
        }`}>
          {label}
        </div>
        <div className={`text-[8px] font-mono truncate ${
          isCanary ? 'text-emerald-500/50' : isProcessing ? 'text-amber-400/50' : isUploaded ? 'text-blue-400/50' : 'text-slate-600'
        }`}>
          {isCanary ? `✓ canary_${fileName} (Weaponized)` :
           isProcessing ? 'Injecting beacon...' :
           isUploaded ? fileName :
           'Click to select or drag file'}
        </div>
      </div>

      {/* Status badge */}
      {(isCanary || isProcessing) && (
        <div className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
          isCanary ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {isCanary ? 'TRAP READY' : 'INJECTING'}
        </div>
      )}
    </motion.div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function BoomerangHoneypot() {
  const [missionPhase, setMissionPhase] = useState(0);
  const [logMessages, setLogMessages] = useState([]);
  const [mapMarker, setMapMarker] = useState(null);
  const [fileTransferProgress, setFileTransferProgress] = useState(0);
  const [beaconActive, setBeaconActive] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);
  const [docSlots, setDocSlots] = useState([
    { id: 'aadhar_front', icon: CreditCard, label: 'Aadhar Card (Front)', status: 'idle', fileName: '' },
    { id: 'aadhar_back', icon: CreditCard, label: 'Aadhar Card (Back)', status: 'idle', fileName: '' },
    { id: 'pan', icon: FileText, label: 'PAN Card', status: 'idle', fileName: '' },
    { id: 'selfie', icon: Camera, label: 'Live Selfie / Photo ID', status: 'idle', fileName: '' },
  ]);
  const [attackerFiles, setAttackerFiles] = useState([
    { name: 'stolen_creds_batch_07.csv', size: '2.4 MB', perm: '-rw-r--r--', date: 'Apr  2 14:31' },
    { name: 'phishing_kit_v3/', size: '4096', perm: 'drwxr-xr-x', date: 'Mar 28 09:12' },
    { name: 'victim_db_india.sqlite', size: '18.7 MB', perm: '-rw-------', date: 'Apr  1 22:07' },
    { name: 'sms_gateway_config.json', size: '847 B', perm: '-rw-r--r--', date: 'Mar 30 16:45' },
  ]);
  const [canaryDeployed, setCanaryDeployed] = useState(false);
  const timeoutsRef = useRef([]);
  const intervalsRef = useRef([]);

  const addLog = useCallback((text, type = 'default', delay = 0) => {
    const id = setTimeout(() => setLogMessages(prev => [...prev, { text, type }]), delay);
    timeoutsRef.current.push(id);
  }, []);

  function resetMission() {
    timeoutsRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timeoutsRef.current = [];
    intervalsRef.current = [];
    setMissionPhase(0);
    setLogMessages([]);
    setMapMarker(null);
    setFileTransferProgress(0);
    setBeaconActive(false);
    setFlashScreen(false);
    setCanaryDeployed(false);
    setDocSlots([
      { id: 'aadhar_front', icon: CreditCard, label: 'Aadhar Card (Front)', status: 'idle', fileName: '' },
      { id: 'aadhar_back', icon: CreditCard, label: 'Aadhar Card (Back)', status: 'idle', fileName: '' },
      { id: 'pan', icon: FileText, label: 'PAN Card', status: 'idle', fileName: '' },
      { id: 'selfie', icon: Camera, label: 'Live Selfie / Photo ID', status: 'idle', fileName: '' },
    ]);
    setAttackerFiles([
      { name: 'stolen_creds_batch_07.csv', size: '2.4 MB', perm: '-rw-r--r--', date: 'Apr  2 14:31' },
      { name: 'phishing_kit_v3/', size: '4096', perm: 'drwxr-xr-x', date: 'Mar 28 09:12' },
      { name: 'victim_db_india.sqlite', size: '18.7 MB', perm: '-rw-------', date: 'Apr  1 22:07' },
      { name: 'sms_gateway_config.json', size: '847 B', perm: '-rw-r--r--', date: 'Mar 30 16:45' },
    ]);
  }

  // Simulate a single file "upload"
  function handleDocUpload(docId) {
    const fileNames = {
      aadhar_front: 'aadhar_front_scan.jpg',
      aadhar_back: 'aadhar_back_scan.jpg',
      pan: 'PAN_CARD_ABCDE1234F.pdf',
      selfie: 'selfie_verification.jpg',
    };
    setDocSlots(prev => prev.map(s => s.id === docId ? { ...s, status: 'uploaded', fileName: fileNames[docId] || 'document.pdf' } : s));
  }

  function allDocsUploaded() {
    return docSlots.every(s => s.status !== 'idle');
  }

  // ─── START MISSION ─────────────────────────────────────────────────────────
  function startMission() {
    setMissionPhase(1);

    // Phase 1: Intercept — sequentially process each uploaded doc into a canary
    addLog('> [PHISHSHIELD] Upload interception triggered.', 'warning', 100);
    addLog('> [INTERCEPT] Blocking real documents from reaching attacker...', 'warning', 400);
    addLog('> [CANARY-GEN] Initializing Canary Token Document Forge...', 'info', 800);

    const docs = docSlots.filter(s => s.status === 'uploaded');
    let cumulativeDelay = 1200;

    docs.forEach((doc, idx) => {
      // Mark as processing
      const processDelay = cumulativeDelay;
      setTimeout(() => {
        setDocSlots(prev => prev.map(s => s.id === doc.id ? { ...s, status: 'processing' } : s));
        addLog(`> [CANARY-GEN] Processing ${doc.fileName}...`, 'info', 0);
      }, processDelay);
      timeoutsRef.current.push(processDelay);

      // Mark as canary (done)
      const doneDelay = processDelay + 800;
      setTimeout(() => {
        setDocSlots(prev => prev.map(s => s.id === doc.id ? { ...s, status: 'canary' } : s));
        addLog(`> [CANARY-GEN] ✓ Beacon embedded: ${doc.fileName} → trap ready`, 'success', 0);
      }, doneDelay);
      timeoutsRef.current.push(doneDelay);

      cumulativeDelay = doneDelay + 400;
    });

    // After all docs processed → Phase 2
    const phase2Start = cumulativeDelay + 500;
    setTimeout(() => {
      addLog('> [CANARY-GEN] All documents weaponized. Steganographic beacons active.', 'success', 0);
      addLog('> [TRANSFER] Initiating delivery to attacker C2 server...', 'warning', 400);

      setMissionPhase(2);
      setCanaryDeployed(true);

      // Animate transfer
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress >= 100) { progress = 100; clearInterval(progressInterval); }
        setFileTransferProgress(Math.min(100, Math.round(progress)));
      }, 120);
      intervalsRef.current.push(progressInterval);

      // Files appear on attacker side
      setTimeout(() => {
        const newFiles = docs.map(d => ({
          name: `canary_${d.fileName}`,
          size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
          perm: '-rw-r--r--',
          date: 'Just now',
          isCanary: true,
        }));
        setAttackerFiles(prev => [...newFiles, ...prev]);
        addLog(`> [TRANSFER] ${docs.length} canary documents delivered to attacker.`, 'success', 0);
        addLog('> [TRAP] All traps armed. Awaiting attacker file access...', 'info', 300);
      }, 2500);
    }, phase2Start);

    // Phase 3: Beacon trigger
    const phase3Start = phase2Start + 5000;
    setTimeout(() => {
      setMissionPhase(3);
      setFlashScreen(true);
      setTimeout(() => setFlashScreen(false), 350);

      addLog('>', 'default', 0);
      addLog('> ╔══════════════════════════════════════════════╗', 'header', 50);
      addLog('> ║  ██ BEACON TRIGGERED — CRITICAL ALERT  ██   ║', 'header', 100);
      addLog('> ╚══════════════════════════════════════════════╝', 'header', 150);
      addLog('>', 'default', 200);
      addLog('> [BEACON] Attacker opened canary_aadhar_front_scan.jpg', 'danger', 300);
      addLog('> [BEACON] Steganographic callback fired successfully', 'danger', 500);
      addLog('> [BEACON] WebRTC leak captured — real IP exposed', 'danger', 700);
    }, phase3Start);

    // Phase 4: Forensics
    const phase4Start = phase3Start + 1500;
    setTimeout(() => {
      setBeaconActive(true);
      setMapMarker({ x: 52, y: 25 });

      addLog('>', 'default', 0);
      addLog('> ─── FORENSIC INTELLIGENCE PACKAGE ───', 'info', 100);
      addLog('> Connection established via beacon callback.', 'success', 300);
      addLog('> Pinging embedded tracking pixel...', 'info', 600);
      addLog('>', 'default', 800);
      addLog('> Target IP:     185.15.XX.XX (Masked for display)', 'warning', 1000);
      addLog('> Real IP:       185.15.43.127 (WebRTC Leak)', 'danger', 1300);
      addLog('> MAC Address:   4C:ED:FB:9A:3B:7F', 'warning', 1600);
      addLog('> OS:            Kali Linux 2023.3 (kernel 6.1.0)', 'warning', 1900);
      addLog('> Browser:       Tor Browser 12.5.6 (Fingerprinted)', 'warning', 2200);
      addLog('> Screen:        1920x1080 | GPU: Intel UHD 630', 'info', 2400);
      addLog('> Timezone:      MSK (UTC+3) | Locale: ru-RU', 'info', 2600);
      addLog('> Coordinates:   55.7558° N, 37.6173° E', 'danger', 2900);
      addLog('> GeoIP:         Moscow, Russian Federation', 'danger', 3200);
      addLog('> ISP:           LLC "Cyber Operations Group"', 'danger', 3400);
      addLog('> ASN:           AS44546 — FRAUD-COMPOUND-NETWORK', 'danger', 3600);
      addLog('>', 'default', 3800);
      addLog('> Forwarding telemetry to Polygon Threat Ledger...', 'info', 4000);
      addLog('> TX Hash: 0x7f3a...c8d2 — CONFIRMED ✓', 'success', 4300);
      addLog('> Evidence package sealed on-chain.', 'success', 4500);
      addLog('>', 'default', 4700);
      addLog('> ██ MISSION COMPLETE — ATTACKER FULLY COMPROMISED ██', 'success', 4900);
    }, phase4Start);
  }

  const STATUS_CONFIG = {
    0: { label: 'AWAITING TRIGGER', color: 'text-slate-500', bg: 'bg-white/[0.02]', border: 'border-white/[0.04]', icon: Shield, glow: '' },
    1: { label: 'INTERCEPTING UPLOAD', color: 'text-amber-400', bg: 'bg-amber-500/[0.04]', border: 'border-amber-500/15', icon: Zap, glow: 'shadow-[0_0_30px_rgba(245,158,11,0.06)]' },
    2: { label: 'CANARY DEPLOYED', color: 'text-cyan-400', bg: 'bg-cyan-500/[0.04]', border: 'border-cyan-500/15', icon: Crosshair, glow: 'shadow-[0_0_30px_rgba(102,252,241,0.06)]' },
    3: { label: 'BEACON TRIGGERED — CRITICAL', color: 'text-red-400', bg: 'bg-red-500/[0.04]', border: 'border-red-500/15', icon: Skull, glow: 'shadow-[0_0_40px_rgba(226,75,74,0.08)]' },
  };
  const status = STATUS_CONFIG[missionPhase];
  const StatusIcon = status.icon;

  const uploadedCount = docSlots.filter(s => s.status !== 'idle').length;
  const canStart = uploadedCount >= 1 && missionPhase === 0;

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
    <div className="space-y-4 pb-12 relative p-6">
      {/* Screen flash */}
      <AnimatePresence>
        {flashScreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[200] bg-red-500 pointer-events-none" />
        )}
      </AnimatePresence>

      {/* ─── HEADER ─── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 flex items-center justify-center">
              <Radar size={20} className="text-orange-400" />
            </div>
            <h1 className="text-3xl font-outfit font-black tracking-tighter text-white uppercase italic">
              Boomerang <span className="text-orange-400">Honeypot</span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 max-w-2xl leading-relaxed">
            Active defense simulation — scammer asks victim for KYC documents. PhishShield+ intercepts the upload, injects
            canary tokens with steganographic beacons, and captures the attacker's real identity when they open the files.
          </p>
        </div>
        <button onClick={resetMission}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] hover:text-white hover:border-white/10 transition-all">
          <RefreshCw size={12} /> Reset Mission
        </button>
      </div>

      {/* ─── MISSION STATUS BAR ─── */}
      <motion.div layout className={`${status.bg} ${status.border} ${status.glow} border rounded-2xl px-5 py-3 flex items-center justify-between transition-all duration-700`}>
        <div className="flex items-center gap-3">
          <motion.div animate={missionPhase === 3 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.6, repeat: missionPhase === 3 ? Infinity : 0 }}>
            <StatusIcon size={15} className={status.color} />
          </motion.div>
          <div>
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${status.color}`}>
              Mission Status: {status.label}
            </div>
            <div className="text-[7px] text-slate-600 font-mono uppercase tracking-wider mt-0.5">
              Operation_Boomerang // Active Defense Protocol v2.1
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[0,1,2,3].map(p => (
            <React.Fragment key={p}>
              <motion.div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                missionPhase >= p ? p === 3 ? 'bg-red-500 shadow-[0_0_8px_rgba(226,75,74,0.6)]' : 'bg-accent-primary shadow-[0_0_6px_rgba(102,252,241,0.4)]' : 'bg-white/5'
              }`} animate={missionPhase === p ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 1, repeat: missionPhase === p ? Infinity : 0 }} />
              {p < 3 && <div className={`w-5 h-px ${missionPhase > p ? 'bg-accent-primary/30' : 'bg-white/[0.04]'}`} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* ─── SPLIT VIEW: VICTIM PORTAL + ATTACKER C2 ─── */}
      <div className="grid grid-cols-12 gap-3">

        {/* ─ LEFT: REALISTIC PHISHING KYC PORTAL ─ */}
        <div className="col-span-5">
          <div className="clinical-panel p-0 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1d24] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
                <div className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
                <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-1.5 px-3 py-[3px] bg-[#0d0f14] rounded-lg border border-white/[0.06] max-w-[260px] w-full">
                  <Lock size={8} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-[8px] text-slate-400 font-mono truncate">https://kyc-verification.rbi-secure.in/upload</span>
                </div>
              </div>
            </div>

            {/* Site body */}
            <div className="bg-gradient-to-b from-[#0c1018] to-[#080c14]" >
              {/* Top bar - fake branding */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Shield size={12} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-white tracking-wide">Digi Secure KYC</div>
                    <div className="text-[6px] text-blue-400/60 uppercase tracking-wider">RBI Certified Partner</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/15">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-[6px] font-bold text-emerald-400 uppercase">256-bit Encrypted</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Urgency banner */}
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/[0.06] border border-amber-500/15 rounded-lg">
                  <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
                  <span className="text-[8px] text-amber-400/80">Your account will be suspended in <strong className="text-amber-400">23:47:12</strong> — Complete KYC now to avoid interruption.</span>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[7px] font-bold text-blue-400">1</div>
                    <span className="text-[7px] text-blue-400 font-bold uppercase">Personal</span>
                  </div>
                  <div className="w-4 h-px bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[7px] font-bold text-white">2</div>
                    <span className="text-[7px] text-white font-bold uppercase">Documents</span>
                  </div>
                  <div className="w-4 h-px bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[7px] text-slate-600">3</div>
                    <span className="text-[7px] text-slate-600 uppercase">Verify</span>
                  </div>
                </div>

                {/* Section title */}
                <div>
                  <h3 className="text-xs font-bold text-white mb-0.5">Upload Identity Documents</h3>
                  <p className="text-[8px] text-slate-500 leading-relaxed">As per RBI KYC norms, please upload clear scans of the following documents. All files are encrypted end-to-end.</p>
                </div>

                {/* Document upload slots */}
                <div className="space-y-2">
                  {docSlots.map(slot => (
                    <DocSlot
                      key={slot.id}
                      icon={slot.icon}
                      label={slot.label}
                      status={slot.status}
                      fileName={slot.fileName}
                      onUpload={() => handleDocUpload(slot.id)}
                    />
                  ))}
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={canStart ? { scale: 1.01 } : {}}
                  whileTap={canStart ? { scale: 0.99 } : {}}
                  onClick={canStart ? startMission : undefined}
                  disabled={!canStart}
                  className={`w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.15em] transition-all duration-300 ${
                    missionPhase > 0
                      ? missionPhase === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                      : canStart
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_25px_rgba(79,70,229,0.25)] cursor-pointer border border-blue-500/25'
                      : 'bg-white/[0.03] text-slate-600 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {missionPhase === 0
                    ? uploadedCount === 0 ? 'Select documents above to proceed' : `Submit ${uploadedCount} Document${uploadedCount > 1 ? 's' : ''} for Verification`
                    : missionPhase === 1 ? '⏳ Processing documents...'
                    : '✓ Documents submitted successfully'}
                </motion.button>

                {/* Fine print */}
                <div className="text-[7px] text-center text-slate-700 leading-relaxed font-mono">
                  {missionPhase === 0 ? '⚠ Simulated phishing portal — no real data is transmitted' : '✓ PhishShield+ intercepted — canary tokens injected in all documents'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─ CENTER: TRANSFER VISUALIZATION ─ */}
        <div className="col-span-2 flex flex-col items-center justify-center gap-2 relative py-8">
          {/* Transfer line */}
          {missionPhase >= 2 && (
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="relative w-full mx-2">
                <div className="h-px bg-white/5 w-full" />
                <motion.div className="absolute top-0 left-0 h-px bg-gradient-to-r from-cyan-500 to-red-500"
                  initial={{ width: '0%' }} animate={{ width: `${fileTransferProgress}%` }} transition={{ duration: 0.3 }}
                  style={{ boxShadow: '0 0 8px rgba(102,252,241,0.4)' }} />
              </div>
            </div>
          )}

          {/* Animated file icons during transfer */}
          <AnimatePresence>
            {missionPhase === 2 && fileTransferProgress < 100 && (
              <>
                {[0, 1, 2].map(i => (
                  <motion.div key={`f${i}`} className="absolute"
                    initial={{ x: -40, opacity: 0, y: i * 12 - 12 }}
                    animate={{ x: [- 40, 40], opacity: [0, 0.8, 0.8, 0] }}
                    transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity, repeatDelay: 0.5 }}>
                    <div className="w-5 h-6 bg-red-500/15 border border-red-500/25 rounded flex items-center justify-center">
                      <FileText size={9} className="text-red-400" />
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Status text */}
          {missionPhase >= 2 && (
            <div className="absolute bottom-6 text-center">
              <div className={`text-[7px] font-black uppercase tracking-[0.2em] ${fileTransferProgress >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {fileTransferProgress >= 100 ? '✓ DELIVERED' : `${fileTransferProgress}%`}
              </div>
              <div className="text-[6px] text-slate-600 font-mono mt-0.5">
                {uploadedCount} document{uploadedCount > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* ─ RIGHT: ATTACKER C2 SERVER ─ */}
        <div className="col-span-5">
          <div className={`clinical-panel p-0 overflow-hidden relative transition-all duration-700 ${
            missionPhase === 3 ? 'ring-1 ring-red-500/15 shadow-[0_0_50px_rgba(226,75,74,0.08)]' : ''
          }`}>
            {/* Terminal header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#0c0e14] border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]/60" />
                  <div className="w-[9px] h-[9px] rounded-full bg-[#febc2e]/60" />
                  <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]/60" />
                </div>
                <span className="text-[8px] text-slate-500 font-mono ml-1">
                  root@kali — ~/collected_docs
                </span>
              </div>
              <div className="flex items-center gap-2">
                {missionPhase >= 2 && <motion.div className="w-1.5 h-1.5 rounded-full bg-red-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
                <span className="text-[7px] font-mono text-slate-600">
                  {missionPhase >= 3 ? 'COMPROMISED' : missionPhase >= 2 ? 'ACTIVE' : '192.168.1.105'}
                </span>
              </div>
            </div>

            {/* Terminal body */}
            <div className="p-3 font-mono text-[9px] leading-[1.8] bg-[#080a10] min-h-[340px] overflow-y-auto max-h-[400px]">
              <div className="text-slate-600 mb-1">
                <span className="text-emerald-500">root</span>
                <span className="text-slate-600">@</span>
                <span className="text-blue-400">kali</span>
                <span className="text-slate-600">:</span>
                <span className="text-indigo-400">~/collected_docs</span>
                <span className="text-slate-600">$ ls -lah</span>
              </div>
              <div className="text-slate-700 mb-2 text-[8px]">
                total {attackerFiles.length > 4 ? '28M' : '24M'}
              </div>

              {attackerFiles.map((file, i) => (
                <motion.div key={`${file.name}-${i}`}
                  initial={file.isCanary ? { opacity: 0, backgroundColor: 'rgba(226,75,74,0.08)' } : false}
                  animate={{ opacity: 1 }}
                  className={`flex items-start gap-0 py-px ${file.isCanary
                    ? missionPhase === 3 ? 'bg-red-500/[0.06] rounded px-1 -mx-1' : 'bg-cyan-500/[0.04] rounded px-1 -mx-1'
                    : ''}`}
                >
                  <span className="text-slate-700 w-[80px] flex-shrink-0">{file.perm}</span>
                  <span className="text-slate-700 w-[50px] flex-shrink-0">{file.size}</span>
                  <span className="text-slate-700 w-[85px] flex-shrink-0">{file.date}</span>
                  <span className={file.isCanary ? (missionPhase === 3 ? 'text-red-400 font-bold' : 'text-cyan-400') : 'text-slate-400'}>
                    {file.name}
                  </span>
                  {file.isCanary && missionPhase === 3 && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="ml-2 text-[7px] bg-red-500/20 text-red-400 px-1.5 py-px rounded font-bold uppercase border border-red-500/30">
                      CANARY
                    </motion.span>
                  )}
                </motion.div>
              ))}

              {/* Attacker actions */}
              {missionPhase >= 2 && (
                <div className="mt-3 pt-2 border-t border-white/[0.03]">
                  <div className="text-slate-600">
                    <span className="text-emerald-500">root</span><span className="text-slate-600">@</span><span className="text-blue-400">kali</span>
                    <span className="text-slate-600">:~$ </span>
                    {missionPhase < 3 ? (
                      <span className="text-slate-500">
                        # new files received - checking...
                        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }} className="text-slate-400">▌</motion.span>
                      </span>
                    ) : (
                      <span className="text-slate-400">xdg-open canary_aadhar_front_scan.jpg</span>
                    )}
                  </div>
                  {missionPhase === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                      <div className="text-amber-400 text-[8px] mt-1">Opening canary_aadhar_front_scan.jpg...</div>
                      <motion.div className="text-red-500 font-bold mt-1"
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }} transition={{ duration: 0.4, delay: 0.5 }}>
                        ⚠ WARNING: Outbound connection detected on port 443
                      </motion.div>
                      <motion.div className="text-red-400 text-[8px] mt-0.5"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                        [CRITICAL] Steganographic beacon callback to phishshield-trap.io
                      </motion.div>
                      <motion.div className="text-red-500/60 text-[8px] mt-0.5"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
                        Connection fingerprint: IP, MAC, GPU, Timezone, Screen — ALL LEAKED
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM: FORENSIC DASHBOARD ─── */}
      <div className="grid grid-cols-2 gap-3">
        <ForensicTerminal lines={logMessages} isActive={missionPhase === 3} />
        <WorldMap marker={mapMarker} beaconActive={beaconActive} />
      </div>

      {/* ─── CAPTURED INTEL CARDS ─── */}
      <AnimatePresence>
        {missionPhase === 3 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5 }}
            className="grid grid-cols-5 gap-3">
            {[
              { icon: Globe, label: 'GeoIP Location', value: 'Moscow, RU', sub: '55.76°N, 37.62°E', color: 'text-red-400', accent: 'border-red-500/15' },
              { icon: Monitor, label: 'System Fingerprint', value: 'Kali Linux 2023.3', sub: 'Tor Browser 12.5.6', color: 'text-amber-400', accent: 'border-amber-500/15' },
              { icon: Fingerprint, label: 'Hardware ID', value: '4C:ED:FB:9A:3B', sub: 'Intel UHD 630 GPU', color: 'text-violet-400', accent: 'border-violet-500/15' },
              { icon: Wifi, label: 'Network Intel', value: 'AS44546', sub: 'Fraud Compound Net', color: 'text-cyan-400', accent: 'border-cyan-500/15' },
              { icon: Activity, label: 'Blockchain Proof', value: '0x7f3a...c8d2', sub: 'Polygon TX ✓', color: 'text-emerald-400', accent: 'border-emerald-500/15' },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5 + i * 0.15 }}
                className={`bg-white/[0.015] border ${card.accent} rounded-2xl p-3.5 hover:bg-white/[0.025] transition-all group`}>
                <div className="flex items-center justify-between mb-2">
                  <card.icon size={13} className={`${card.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-[6px] font-black text-slate-600 uppercase tracking-[0.2em]">{card.label}</span>
                </div>
                <div className={`text-[11px] font-black ${card.color} tracking-tight leading-none`}>{card.value}</div>
                <div className="text-[7px] text-slate-600 mt-1">{card.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
