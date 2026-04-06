import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, ShieldAlert, ShieldCheck, Server, Laptop, Landmark,
  AlertTriangle, CheckCircle2, Activity, Lock, Zap, Radio,
  RefreshCw, Clock, Eye, BookOpen, Target, Key, Globe,
  ArrowRight, AlertOctagon, Fingerprint, Network, Shield,
  Info, ChevronRight, Database, Terminal, GitBranch
} from 'lucide-react';

export default function AiTMDetector() {
  const [mode, setMode] = useState('simulate');      // 'simulate' | 'real'
  const [scenario, setScenario] = useState('A');     // simulate only: A=direct B=aitm
  const [targetUrl, setTargetUrl] = useState('');    // real mode URL
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);        // null | 'safe' | 'aitm' | 'suspicious'
  const [latency, setLatency] = useState('0ms');
  const [tlsStatus, setTlsStatus] = useState('Pending');
  const [riskScore, setRiskScore] = useState(0);
  const [packetPhase, setPacketPhase] = useState(null);
  const [proxyVisible, setProxyVisible] = useState(false);
  const [pulseProxy, setPulseProxy] = useState(false);
  const [logLines, setLogLines] = useState([]);
  const [hopCount, setHopCount] = useState('—');
  const [certIssuer, setCertIssuer] = useState('—');
  const [certExpiry, setCertExpiry] = useState('—');
  const [certSan, setCertSan] = useState([]);
  const [hsts, setHsts] = useState(null);
  const [resolvedIp, setResolvedIp] = useState('—');
  const [probeData, setProbeData] = useState(null);

  const addLog = (line, type = 'info') =>
    setLogLines(prev => [{ text: line, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type }, ...prev].slice(0, 30));

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  const resetAll = () => {
    setResult(null); setPacketPhase(null); setLatency('0ms'); setTlsStatus('Pending');
    setRiskScore(0); setHopCount('—'); setCertIssuer('—'); setCertExpiry('—');
    setCertSan([]); setHsts(null); setResolvedIp('—'); setLogLines([]); setProbeData(null);
    setProxyVisible(false); setPulseProxy(false);
  };

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // ── REAL PROBE MODE ──
  const handleRealProbe = async () => {
    if (!targetUrl.trim()) return;
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    resetAll();
    setLatency('...');
    setTlsStatus('Probing...');
    setHopCount('...');
    setCertIssuer('...');
    setLogLines([]);

    addLog(`Initiating deep network probe → ${targetUrl}`, 'info');
    addLog('Measuring real TTFB and TLS certificate chain...', 'info');

    // Animate packet while waiting
    setPacketPhase('user-to-bank');

    try {
      const res = await fetch(`${BACKEND}/probe-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      setProbeData(data);
      setPacketPhase(null);

      // Populate metrics
      const ttfb = data.ttfb_ms;
      setLatency(ttfb !== null ? `${ttfb}ms` : 'N/A');
      setHsts(data.hsts_present);
      setResolvedIp(data.resolved_ip || '—');
      setCertExpiry(data.cert_expiry || '—');
      setCertSan(data.cert_san || []);

      const issuer = data.cert_issuer || 'N/A';
      setCertIssuer(issuer);

      const isSelfSigned = data.is_self_signed;
      const certVerFailed = issuer === 'VERIFICATION FAILED' || issuer === 'SSL Error';
      if (isSelfSigned || certVerFailed) {
        setTlsStatus(`CRITICAL MISMATCH: ${issuer}`);
      } else if (issuer === 'N/A' || issuer === 'Unknown') {
        setTlsStatus('Pending — No TLS Data');
      } else {
        setTlsStatus(`Verified: ${issuer}`);
      }

      const risk = data.aitm_risk_score || 0;
      setRiskScore(risk);

      const hops = data.estimated_hops;
      setHopCount(hops !== null && hops !== undefined
        ? (risk >= 60 ? `${hops} (ANOMALOUS)` : `${hops} (DIRECT)`)
        : '—');

      const verdict = data.verdict || 'CLEAN';
      if (verdict === 'AITM_PROXY_LIKELY') {
        setResult('aitm');
        setProxyVisible(true);
        setPulseProxy(true);
      } else if (verdict === 'SUSPICIOUS') {
        setResult('suspicious');
        setProxyVisible(true);
        setPulseProxy(false);
      } else {
        setResult('safe');
        setProxyVisible(false);
      }

      // Populate log from real indicators
      const indicators = data.aitm_indicators || [];
      indicators.forEach(ind => {
        const isAlert = ind.includes('CRITICAL') || ind.includes('mismatch') || ind.includes('High TTFB') || ind.includes('Self-signed');
        const isGood  = ind.includes('Trusted CA') || ind.includes('Normal TTFB') || ind.includes('direct');
        addLog(ind, isAlert ? 'alert' : isGood ? 'safe' : 'info');
      });

      if (data.redirect_chain?.length > 0) {
        addLog(`Redirect chain detected (${data.redirect_chain.length} hop(s)): ${data.redirect_chain.join(' → ')}`, 'warn');
      }
      if (data.error) {
        addLog(`Probe error: ${data.error}`, 'alert');
      }
      addLog(`Verdict: ${data.verdict_label || 'Unknown'} — AiTM Risk Score: ${risk}%`, risk >= 60 ? 'alert' : risk >= 35 ? 'warn' : 'safe');

    } catch (err) {
      setPacketPhase(null);
      addLog(`Probe failed: ${err.message}`, 'alert');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── SIMULATION MODE ──
  const handleSimulate = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    resetAll();
    setLatency('...');
    setTlsStatus('Probing...');
    setHopCount('...');
    setCertIssuer('...');

    addLog('Initiating network trace sequence...');

    if (scenario === 'B') {
      setProxyVisible(true);
      await delay(400);
      addLog('ALERT: Unknown hop detected between User and Target.', 'alert');
      addLog('Routing table anomaly found. Injected proxy identified at 192.168.0.1:8443.', 'alert');
      addLog('Intercepting TLS handshake metadata...', 'info');
      setPacketPhase('user-to-proxy');
      await delay(900);
      addLog('Data packet intercepted at proxy layer [POST /login — credentials exposed].', 'alert');
      setPacketPhase('proxy-to-bank');
      await delay(900);
      addLog('Re-encrypted packet forwarded to Target Server. Session cookies cloned.', 'alert');
      const lat = Math.floor(Math.random() * 150) + 350;
      setLatency(`${lat}ms`); setTlsStatus('CRITICAL MISMATCH: Self-Signed');
      setRiskScore(99); setHopCount('3 (ANOMALOUS)'); setCertIssuer('SELF_SIGNED_CERT');
      setResult('aitm'); setPulseProxy(true);
      addLog(`TLS fingerprint mismatch. Expected: DigiCert Inc, Got: SELF_SIGNED_CERT.`, 'alert');
      addLog(`TTFB: ${lat}ms — anomalous latency confirms relay interception.`, 'alert');
      addLog('CRITICAL: Session token theft risk. Passkey Enforcer triggered.', 'alert');
    } else {
      setProxyVisible(false); setPulseProxy(false);
      await delay(400);
      addLog('Direct connection path confirmed. No intermediate hops detected.', 'safe');
      addLog('Validating TLS certificate chain against trusted root CAs...', 'info');
      setPacketPhase('user-to-bank');
      await delay(1200);
      const lat = Math.floor(Math.random() * 26) + 20;
      setLatency(`${lat}ms`); setTlsStatus('Verified: DigiCert Inc');
      setRiskScore(0); setHopCount('1 (DIRECT)'); setCertIssuer('DigiCert Inc (SHA-256)');
      setResult('safe');
      addLog(`TLS CA: DigiCert Inc — Trusted Root CA.`, 'safe');
      addLog(`TTFB: ${lat}ms — nominal latency profile.`, 'safe');
      addLog('Secure E2E tunnel established. Connection authorized.', 'safe');
    }

    await delay(300);
    setPacketPhase(null);
    setIsAnalyzing(false);
  };

  const handleTrace = () => mode === 'real' ? handleRealProbe() : handleSimulate();

  return (
    // KEY FIX: overflow-y-auto on the outer container makes it scrollable
    <div className="overflow-y-auto h-full custom-scrollbar">
      <div className="flex flex-col min-h-full bg-[#020408]/30 pb-12">

        {/* ── HEADER ── */}
        <header className="mb-10 flex justify-between items-end border-b border-white/[0.05] pb-10">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[1.5px] bg-accent-primary" />
              <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.4em]">Zero_Trust_Proxy_Shield</span>
            </div>
            <h2 className="text-5xl font-outfit font-black text-white tracking-tighter uppercase italic leading-[0.85]">
              AiTM <span className="text-accent-primary">Detection</span>
            </h2>
            <p className="text-slate-300 text-[12px] font-medium max-w-[600px] leading-relaxed">
              Simulate and detect Adversary-in-the-Middle proxy phishing attacks using network
              latency profiling, TLS fingerprint analysis, hop-count telemetry, and certificate
              authority chain validation. Based on real-world AiTM frameworks used against MFA-protected accounts.
            </p>
          </div>
          <div className="flex gap-4">
            <StatBox icon={<Radio size={14} />} label="Probe_Engine" value="Active" color="text-accent-primary" />
            <StatBox icon={<Eye size={14} />} label="Inspection_Mode" value="Deep_Packet" color="text-accent-primary" />
            <StatBox icon={<Network size={14} />} label="TLS_Inspector" value="Engaged" color="text-accent-primary" />
          </div>
        </header>

        {/* ── MODE TOGGLE + CONTROL BAR ── */}
        <div className="space-y-4 mb-8">

          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-white/[0.02] rounded-2xl border border-white/[0.06] gap-1">
              {[{ id: 'simulate', label: 'Simulate', icon: Zap }, { id: 'real', label: 'Real Probe', icon: Globe }].map(({ id, label, icon: Icon }) => (
                <button key={id}
                  onClick={() => { setMode(id); resetAll(); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    mode === id
                      ? id === 'real'
                        ? 'bg-warning-primary/10 text-warning-primary border border-warning-primary/25'
                        : 'bg-accent-primary/10 text-accent-primary border border-accent-primary/25'
                      : 'text-slate-600 hover:text-white hover:bg-white/[0.03]'
                  }`}>
                  <Icon size={11} />{label}
                  {id === 'real' && <span className="ml-1 text-[6px] font-black bg-warning-primary/15 text-warning-primary px-1.5 py-0.5 rounded-md border border-warning-primary/20">LIVE</span>}
                </button>
              ))}
            </div>

            {/* Real mode URL input */}
            {mode === 'real' && (
              <div className="flex-1 flex items-center gap-3 bg-white/[0.02] border border-white/[0.08] rounded-2xl px-5 h-14 focus-within:border-accent-primary/40 focus-within:bg-accent-primary/[0.02] transition-all">
                <Globe size={15} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTrace()}
                  placeholder="Enter target URL to probe (e.g. https://google.com)"
                  className="flex-1 bg-transparent text-[12px] text-white font-mono placeholder-slate-600 outline-none"
                />
                {targetUrl && (
                  <button onClick={() => { setTargetUrl(''); resetAll(); }} className="text-slate-600 hover:text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-white/[0.05]">
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Simulate scenario toggles */}
            {mode === 'simulate' && (
              <div className="flex p-1 bg-white/[0.02] rounded-2xl border border-white/[0.06] gap-2">
                {[
                  { id: 'A', label: 'Scenario A: Direct Secure Connection', icon: ShieldCheck },
                  { id: 'B', label: 'Scenario B: AiTM Proxy Link', icon: ShieldAlert },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id}
                    onClick={() => { setScenario(id); resetAll(); setProxyVisible(id === 'B'); }}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                      scenario === id
                        ? id === 'B'
                          ? 'bg-danger-primary/10 text-danger-primary border border-danger-primary/25'
                          : 'bg-accent-primary/10 text-accent-primary border border-accent-primary/25'
                        : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
                    }`}>
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>
            )}

            {/* Trace button */}
            <button
              onClick={handleTrace}
              disabled={isAnalyzing || (mode === 'real' && !targetUrl.trim())}
              className={`flex items-center gap-3 px-8 h-14 rounded-xl font-black uppercase tracking-[0.25em] text-[11px] transition-all duration-300 ${
                isAnalyzing
                  ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30 cursor-wait'
                  : (mode === 'real' && !targetUrl.trim())
                  ? 'bg-white/[0.03] text-slate-600 border border-white/[0.06] cursor-not-allowed'
                  : 'bg-[#66fcf1] text-[#020408] hover:bg-white hover:scale-[1.02] active:scale-95 shadow-[0_8px_30px_rgba(102,252,241,0.3)]'
              }`}
            >
              {isAnalyzing
                ? <><RefreshCw size={16} className="animate-spin text-accent-primary" /><span className="text-accent-primary">{mode === 'real' ? 'Probing...' : 'Tracing...'}</span></>
                : <><Zap size={16} strokeWidth={3} />{mode === 'real' ? 'Run Live Probe' : 'Trace Network'}</>
              }
            </button>
          </div>

          {/* Real mode hint */}
          {mode === 'real' && (
            <div className="flex items-start gap-3 px-5 py-3 rounded-2xl bg-warning-primary/[0.04] border border-warning-primary/15">
              <Info size={13} className="text-warning-primary mt-0.5 shrink-0" />
              <p className="text-[10px] text-warning-primary/80 font-medium leading-relaxed">
                <span className="font-black">Real Probe Mode:</span> Performs a live network request from the PhishShield+ backend to the target URL. Measures actual TTFB, extracts real TLS certificate data (issuer, expiry, SANs), checks HSTS headers, and computes a composite AiTM risk score. Works on any public URL — try <span className="font-mono text-warning-primary">https://google.com</span> vs <span className="font-mono text-warning-primary">http://example.com</span>.
              </p>
            </div>
          )}
        </div>

        {/* ── MAIN DETECTOR GRID ── */}
        <div className="grid grid-cols-12 gap-6 mb-8">

          {/* LEFT: Network Graph + Result Banner */}
          <div className="col-span-7 flex flex-col gap-6">

            {/* NETWORK MAP */}
            <div className="clinical-panel p-8 relative bg-white/[0.01] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 bg-accent-primary/40 rounded-full" />
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">Live_Network_Topology</h3>
                <div className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all ${
                  isAnalyzing ? 'border-accent-primary/40 text-accent-primary bg-accent-primary/5' : 'border-white/[0.06] text-slate-600'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-accent-primary animate-pulse' : 'bg-slate-700'}`} />
                  {isAnalyzing ? 'Tracing Active' : 'Idle'}
                </div>
              </div>

              {/* NODE GRAPH */}
              <div className="relative flex items-center justify-between h-44 px-4 mt-4">
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: 'radial-gradient(circle, #66fcf1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <NetworkNode icon={<Laptop size={24} />} label="User Device" sublabel="Chrome Extension" color="text-accent-primary" borderColor="border-accent-primary/30" glow="shadow-[0_0_20px_rgba(102,252,241,0.15)]" active />

                <div className="flex-1 relative flex items-center justify-center h-full mx-4">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
                    <line x1="0" y1="30" x2="100" y2="30"
                      stroke={proxyVisible ? 'rgba(255,255,255,0.06)' : 'rgba(102,252,241,0.3)'}
                      strokeWidth="1" strokeDasharray={proxyVisible ? '2 8' : '4 4'}
                      className="transition-all duration-700"
                    />
                    {proxyVisible && (
                      <>
                        <line x1="0" y1="30" x2="50" y2="30" stroke="rgba(226,75,74,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
                        <line x1="50" y1="30" x2="100" y2="30" stroke="rgba(226,75,74,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
                      </>
                    )}
                  </svg>
                  <AnimatePresence>
                    {proxyVisible && (
                      <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 0.5, type: 'spring' }} className="absolute z-10">
                        <NetworkNode icon={<Server size={20} />} label="Proxy Server" sublabel="UNKNOWN HOST" color="text-danger-primary" borderColor="border-danger-primary/50" glow="shadow-[0_0_25px_rgba(226,75,74,0.5)]" danger pulse={pulseProxy} mini />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {packetPhase === 'user-to-bank' && (
                      <motion.div key="direct-packet" initial={{ left: '0%' }} animate={{ left: '100%' }} transition={{ duration: 1.0, ease: 'easeInOut' }}
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent-primary shadow-[0_0_15px_rgba(102,252,241,0.9)] z-20" />
                    )}
                    {packetPhase === 'user-to-proxy' && (
                      <motion.div key="p1" initial={{ left: '0%' }} animate={{ left: '50%' }} transition={{ duration: 0.7, ease: 'easeIn' }}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-danger-primary shadow-[0_0_15px_rgba(226,75,74,0.9)] z-20" />
                    )}
                    {packetPhase === 'proxy-to-bank' && (
                      <motion.div key="p2" initial={{ left: '50%' }} animate={{ left: '100%' }} transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-danger-primary shadow-[0_0_15px_rgba(226,75,74,0.9)] z-20" />
                    )}
                  </AnimatePresence>
                </div>

                <NetworkNode icon={<Landmark size={24} />} label="Target Server" sublabel="Bank Production" color="text-accent-secondary" borderColor="border-accent-secondary/30" glow="shadow-[0_0_20px_rgba(69,162,158,0.15)]" active />
              </div>

              <div className="flex gap-6 mt-4 pt-4 border-t border-white/[0.04]">
                <LegendItem color="bg-accent-primary" label="Encrypted Packet" />
                {proxyVisible && <LegendItem color="bg-danger-primary" label="Intercepted Packet" />}
                {proxyVisible && <LegendItem color="bg-danger-primary/50" label="AiTM Relay Path" />}
              </div>
            </div>

            {/* RESULT BANNER */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                  className={`p-6 rounded-[24px] border relative overflow-hidden flex items-start gap-5 ${
                    result === 'aitm' ? 'bg-danger-primary/[0.06] border-danger-primary/30'
                    : result === 'suspicious' ? 'bg-warning-primary/[0.05] border-warning-primary/25'
                    : 'bg-success-primary/[0.05] border-success-primary/25'
                  }`}
                >
                  {result === 'aitm' && (
                    <motion.div initial={{ top: '-100%' }} animate={{ top: '200%' }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                      className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-danger-primary/60 to-transparent pointer-events-none" />
                  )}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${
                    result === 'aitm' ? 'bg-danger-primary/10 border-danger-primary/30 text-danger-primary shadow-[0_0_25px_rgba(226,75,74,0.3)]'
                    : result === 'suspicious' ? 'bg-warning-primary/10 border-warning-primary/30 text-warning-primary shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : 'bg-success-primary/10 border-success-primary/30 text-success-primary shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                  }`}>
                    {result === 'aitm' ? <ShieldAlert size={26} />
                     : result === 'suspicious' ? <AlertTriangle size={26} />
                     : <ShieldCheck size={26} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] mb-1 text-slate-500">
                      {result === 'aitm' ? 'Critical_Security_Alert' : result === 'suspicious' ? 'Warning_Investigation_Required' : 'Connection_Verification'}
                    </p>
                    <p className={`text-xl font-outfit font-black uppercase italic leading-tight mb-2 ${
                      result === 'aitm' ? 'text-danger-primary' : result === 'suspicious' ? 'text-warning-primary' : 'text-success-primary'
                    }`}>
                      {result === 'aitm' ? 'AiTM Proxy Detected! Connection Intercepted.'
                       : result === 'suspicious' ? `Suspicious Signals Detected — Risk: ${riskScore}%`
                       : 'Secure Connection Established.'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {result === 'aitm'
                        ? 'A man-in-the-middle proxy has been identified. TLS fingerprint mismatch confirms active session hijacking. Session cookies are at risk of cloning. Hardware Passkey Enforcer triggered — credential submission blocked.'
                        : result === 'suspicious'
                        ? `Multiple anomalous indicators suggest potential AiTM infrastructure. Risk score ${riskScore}% warrants manual investigation. Review the diagnostic log for detailed indicator breakdown.`
                        : mode === 'real' && probeData
                        ? `Direct TLS tunnel confirmed. Certificate issued by ${certIssuer}. TTFB: ${latency}. No proxy relay indicators detected. Connection is safe.`
                        : 'Direct end-to-end TLS tunnel confirmed. Certificate authority verified as DigiCert Inc. No intermediate proxy hops. No interception indicators. Connection is safe to proceed.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Telemetry + Log */}
          <div className="col-span-5 flex flex-col gap-5">

            {/* METRIC CARDS */}
            <div className="space-y-3">
              <MetricCard icon={<Clock size={16} />} label="Network Latency (TTFB)" value={latency}
                subtext={latency === '...' ? 'Measuring...' : latency === '0ms' ? 'No trace active' : parseInt(latency) > 100 ? 'ANOMALOUS — Relay hop confirmed' : 'Nominal — Direct path confirmed'}
                color={parseInt(latency) > 100 ? 'danger' : parseInt(latency) > 0 ? 'safe' : 'neutral'}
                isLoading={isAnalyzing && latency === '...'}
              />
              <MetricCard icon={<Lock size={16} />} label="TLS Certificate Status" value={tlsStatus}
                subtext={tlsStatus === 'Pending' ? 'Awaiting trace' : tlsStatus === 'Probing...' ? 'Interrogating certificate chain...' : tlsStatus.includes('CRITICAL') ? 'Self-signed cert — MITM confirmed' : 'Root CA chain verified and trusted'}
                color={tlsStatus.includes('CRITICAL') ? 'danger' : tlsStatus.includes('Verified') ? 'safe' : 'neutral'}
                isLoading={isAnalyzing && tlsStatus === 'Probing...'}
              />
              <MetricCard icon={<Activity size={16} />} label="Risk Score" value={`${riskScore}%`}
                subtext={riskScore === 0 && latency === '0ms' ? 'No active scan' : riskScore >= 90 ? 'CRITICAL — Immediate lockdown required' : riskScore > 0 ? 'Moderate risk' : 'No threat indicators'}
                color={riskScore >= 90 ? 'danger' : riskScore > 40 ? 'warn' : riskScore === 0 && latency !== '0ms' ? 'safe' : 'neutral'}
                showBar barValue={riskScore}
              />
              {/* Extra Metrics Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`glass-card p-4 rounded-[18px] border transition-all ${hopCount === '3 (ANOMALOUS)' ? 'border-danger-primary/25 bg-danger-primary/[0.04]' : 'border-white/[0.06] bg-white/[0.01]'}`}>
                  <p className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em] mb-1">Hop_Count</p>
                  <p className={`text-[14px] font-black font-mono ${hopCount === '3 (ANOMALOUS)' ? 'text-danger-primary' : hopCount === '1 (DIRECT)' ? 'text-success-primary' : 'text-slate-500'}`}>{hopCount}</p>
                </div>
                <div className={`glass-card p-4 rounded-[18px] border transition-all ${certIssuer === 'SELF_SIGNED_CERT' ? 'border-danger-primary/25 bg-danger-primary/[0.04]' : 'border-white/[0.06] bg-white/[0.01]'}`}>
                  <p className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em] mb-1">Cert_Issuer</p>
                  <p className={`text-[10px] font-black font-mono truncate ${certIssuer === 'SELF_SIGNED_CERT' ? 'text-danger-primary' : certIssuer.includes('DigiCert') ? 'text-success-primary' : 'text-slate-500'}`}>{certIssuer}</p>
                </div>
              </div>
            </div>

            {/* LIVE DIAGNOSTIC LOG */}
            <div className="clinical-panel flex flex-col bg-black/20" style={{ minHeight: '220px' }}>
              <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-accent-primary animate-pulse' : 'bg-slate-700'}`} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Diagnostic_Log</span>
                </div>
                <span className="text-[7px] text-slate-700 font-mono">{mode === 'real' ? 'LIVE_PROBE_ENGINE_v3.0' : 'TRACE_ENGINE_v2.1'}</span>
              </div>
              <div className="overflow-y-auto p-4 space-y-2 font-mono text-[10px]" style={{ maxHeight: '220px' }}>
                {logLines.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center opacity-20">
                    <Radio size={28} strokeWidth={1} className="text-slate-400 mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Awaiting_{mode === 'real' ? 'URL_Input' : 'Trace_Command'}</p>
                  </div>
                ) : (
                  logLines.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-3 p-2 rounded-lg border ${
                        log.type === 'alert'
                          ? 'border-danger-primary/15 bg-danger-primary/[0.03] text-danger-primary'
                          : log.type === 'safe'
                          ? 'border-success-primary/15 bg-success-primary/[0.02] text-success-primary'
                          : log.type === 'warn'
                          ? 'border-warning-primary/15 bg-warning-primary/[0.02] text-warning-primary'
                          : 'border-white/[0.04] text-slate-400'
                      }`}
                    >
                      <span className="opacity-30 shrink-0">[{log.ts}]</span>
                      <span className="font-bold leading-tight">{log.text}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* REAL PROBE: Extended Data Panel */}
            <AnimatePresence>
              {probeData && mode === 'real' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="glass-card p-5 rounded-[20px] border border-white/[0.08] bg-white/[0.01] space-y-4">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.35em] mb-3">Raw_Probe_Data</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: 'Resolved IP', val: resolvedIp },
                      { label: 'HTTP Status', val: probeData.status_code || 'N/A' },
                      { label: 'Server Header', val: probeData.server_header || 'Unknown' },
                      { label: 'HSTS', val: hsts === true ? `Enabled (${probeData.hsts_max_age ? probeData.hsts_max_age + 's' : 'set'})` : hsts === false ? 'Not Present' : '—' },
                      { label: 'Cert Expiry', val: certExpiry },
                      { label: 'Redirect Hops', val: probeData.redirect_chain?.length || 0 },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em] mb-0.5">{label}</p>
                        <p className="text-[10px] text-slate-300 font-mono truncate">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                  {certSan.length > 0 && (
                    <div>
                      <p className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em] mb-2">Cert_SANs ({certSan.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {certSan.map(san => (
                          <span key={san} className="px-2 py-1 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[8px] font-mono text-slate-400">{san}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            INFORMATIONAL SECTIONS BELOW
        ═══════════════════════════════════════════════════ */}

        {/* ── HOW AITM ATTACKS WORK ── */}
        <section className="mb-8">
          <SectionHeader icon={<BookOpen size={16} />} label="Attack_Anatomy" title="How AiTM Proxy Phishing Works" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { step: '01', icon: <Globe size={20} />, title: 'Lure Delivery', desc: 'A phishing email delivers a link pointing to an adversary-controlled reverse-proxy server, visually identical to the real target site.', color: 'text-accent-primary', border: 'border-accent-primary/20', bg: 'bg-accent-primary/[0.03]' },
              { step: '02', icon: <Server size={20} />, title: 'Proxy Relay', desc: 'The browser connects to the proxy, which relays all traffic to the legitimate site — stripping TLS, injecting code, and cloning session cookies.', color: 'text-warning-primary', border: 'border-warning-primary/20', bg: 'bg-warning-primary/[0.03]' },
              { step: '03', icon: <Key size={20} />, title: 'MFA Bypass', desc: 'Even if the victim completes MFA, the authenticated session token is captured by the proxy — bypassing the second factor entirely.', color: 'text-danger-primary', border: 'border-danger-primary/20', bg: 'bg-danger-primary/[0.03]' },
              { step: '04', icon: <Terminal size={20} />, title: 'Account Takeover', desc: 'The attacker replays the stolen session token to access the target account with full privileges, without needing the password or OTP.', color: 'text-danger-primary', border: 'border-danger-primary/35', bg: 'bg-danger-primary/[0.05]' },
            ].map(({ step, icon, title, desc, color, border, bg }) => (
              <div key={step} className={`glass-card p-6 rounded-[20px] border ${border} ${bg} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${border} ${color} bg-white/[0.02]`}>{icon}</div>
                  <span className={`text-[9px] font-black font-mono ${color} opacity-40`}>STEP_{step}</span>
                </div>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.15em] mb-2 ${color}`}>{title}</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DETECTION SIGNALS ── */}
        <section className="mb-8">
          <SectionHeader icon={<Target size={16} />} label="Detection_Methodology" title="How PhishShield+ Detects AiTM" />
          <div className="grid grid-cols-3 gap-5 mt-6">
            {[
              {
                icon: <Clock size={18} />, title: 'Latency Fingerprinting', color: 'text-accent-primary', border: 'border-accent-primary/20',
                points: ['Direct connections: 20–50ms TTFB', 'AiTM proxy adds 200–500ms hop delay', 'Threshold alert: >100ms on trusted domains', 'Continuous baseline tracking per domain'],
              },
              {
                icon: <Lock size={18} />, title: 'TLS Certificate Analysis', color: 'text-warning-primary', border: 'border-warning-primary/20',
                points: ['Root CA fingerprint validation on each connection', 'Self-signed or unknown CA triggers CRITICAL alert', 'Certificate transparency log cross-check', 'HPKP hash pinning for known financial domains'],
              },
              {
                icon: <GitBranch size={18} />, title: 'Routing Topology Scan', color: 'text-danger-primary', border: 'border-danger-primary/20',
                points: ['Traceroute hop-count comparison vs. baseline', 'ASN ownership verification for intermediate nodes', 'BGP route injection detection', 'Real-time threat feed correlation for known proxy IPs'],
              },
            ].map(({ icon, title, color, border, points }) => (
              <div key={title} className={`glass-card p-6 rounded-[20px] border ${border} bg-white/[0.01]`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`${color} opacity-80`}>{icon}</div>
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${color}`}>{title}</h4>
                </div>
                <div className="space-y-2.5">
                  {points.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight size={10} className={`${color} opacity-60 mt-0.5 shrink-0`} />
                      <span className="text-[10px] text-slate-400 font-medium leading-relaxed">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── REAL WORLD CASES + MITIGATION ── */}
        <div className="grid grid-cols-2 gap-6 mb-8">

          {/* Real World Cases */}
          <section>
            <SectionHeader icon={<AlertOctagon size={16} />} label="Threat_Intelligence" title="Known AiTM Frameworks" />
            <div className="space-y-3 mt-6">
              {[
                { name: 'EvilGinx2', year: '2018–Present', targets: 'Google, Microsoft 365, GitHub', method: 'Nginx-based reverse proxy with credential harvesting and session token cloning.', severity: 'CRITICAL' },
                { name: 'Modlishka', year: '2019–Present', targets: 'Generic OAuth Providers', method: 'Single-binary reverse proxy tool capable of defeating 2FA for any website.', severity: 'HIGH' },
                { name: 'Muraena', year: '2020–Present', targets: 'Enterprise SSO, ADFS', method: 'GoLang-based phishing framework targeting corporate SSO with JavaScript injection.', severity: 'HIGH' },
                { name: 'Microsoft 365 Campaigns', year: '2022 (10,000+ orgs)', targets: 'Office 365 Users', method: 'Mass AiTM campaign targeting MFA-enabled accounts — bypassed Authenticator app OTPs.', severity: 'CRITICAL' },
              ].map(({ name, year, targets, method, severity }) => (
                <div key={name} className={`glass-card p-5 rounded-[18px] border flex items-start gap-4 ${severity === 'CRITICAL' ? 'border-danger-primary/20 bg-danger-primary/[0.02]' : 'border-warning-primary/15 bg-warning-primary/[0.02]'}`}>
                  <div className={`mt-0.5 shrink-0 px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider ${severity === 'CRITICAL' ? 'bg-danger-primary/10 text-danger-primary' : 'bg-warning-primary/10 text-warning-primary'}`}>{severity}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[11px] font-black text-white uppercase tracking-[0.1em]">{name}</p>
                      <span className="text-[8px] text-slate-600 font-mono">{year}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono mb-1.5 truncate">Targets: {targets}</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{method}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mitigation Strategies */}
          <section>
            <SectionHeader icon={<Shield size={16} />} label="Zero_Trust_Countermeasures" title="Mitigation Strategies" />
            <div className="space-y-3 mt-6">
              {[
                { icon: <Key size={16} />, title: 'FIDO2 Hardware Passkeys', desc: 'Phishing-resistant authentication tied to the origin domain. A proxy cannot relay a hardware-bound WebAuthn challenge.', badge: 'GOLD STANDARD', color: 'text-accent-primary', border: 'border-accent-primary/20' },
                { icon: <Fingerprint size={16} />, title: 'Certificate Pinning (HPKP)', desc: 'Pin expected TLS certificate hashes for sensitive domains. Self-signed proxy certs trigger immediate block.', badge: 'RECOMMENDED', color: 'text-success-primary', border: 'border-success-primary/20' },
                { icon: <Database size={16} />, title: 'Conditional Access Policies', desc: 'Block sign-ins from unknown IP ranges, unfamiliar device fingerprints, and anomalous session patterns.', badge: 'ENTERPRISE', color: 'text-warning-primary', border: 'border-warning-primary/20' },
                { icon: <Network size={16} />, title: 'Real-Time Latency Monitoring', desc: 'Continuously baseline TTFB per domain. Automated alerts when latency spikes beyond 2x the baseline with active sessions.', badge: 'PHISHSHIELD+', color: 'text-accent-primary', border: 'border-accent-primary/20' },
                { icon: <Info size={16} />, title: 'User Awareness Training', desc: 'Train users to verify URL bar domains and reject any MFA prompt not initiated by them — even if the site looks identical.', badge: 'ESSENTIAL', color: 'text-slate-400', border: 'border-white/[0.08]' },
              ].map(({ icon, title, desc, badge, color, border }) => (
                <div key={title} className={`glass-card p-5 rounded-[18px] border ${border} bg-white/[0.01] flex items-start gap-4`}>
                  <div className={`${color} shrink-0 mt-0.5`}>{icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${color}`}>{title}</p>
                      <span className={`text-[7px] font-black px-2 py-0.5 rounded-md border ${color} ${border} bg-white/[0.02] opacity-80`}>{badge}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── COMPARISON TABLE ── */}
        <section>
          <SectionHeader icon={<Activity size={16} />} label="Telemetry_Reference" title="Signal Comparison: Direct vs AiTM" />
          <div className="mt-6 clinical-panel overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="text-left px-6 py-4 text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Signal</th>
                  <th className="text-left px-6 py-4 text-[8px] font-black text-success-primary uppercase tracking-[0.3em]">Direct Connection (Safe)</th>
                  <th className="text-left px-6 py-4 text-[8px] font-black text-danger-primary uppercase tracking-[0.3em]">AiTM Proxy (Attack)</th>
                  <th className="text-left px-6 py-4 text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Detection Method</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Network Latency (TTFB)', '20–50ms', '350–600ms', 'Baseline deviation threshold'],
                  ['Hop Count', '1 (direct)', '3+ (user→proxy→server)', 'Traceroute analysis'],
                  ['TLS Certificate Issuer', 'DigiCert / Let\'s Encrypt', 'Self-Signed / Unknown CA', 'CA fingerprint validation'],
                  ['Certificate Transparency', 'Logged in public CT logs', 'Not present in CT logs', 'CT log lookup'],
                  ['HSTS Header Present', 'Yes (strict)', 'Often stripped by proxy', 'Header inspection'],
                  ['WebAuthn Challenge Origin', 'Matches visited domain', 'Proxy domain mismatch', 'FIDO2 origin binding'],
                  ['Session Cookie Flags', 'HttpOnly + Secure + SameSite', 'May be cloned/modified', 'Cookie attribute audit'],
                ].map(([signal, safe, attack, method], i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-slate-300 font-black">{signal}</td>
                    <td className="px-6 py-4 text-success-primary font-mono">{safe}</td>
                    <td className="px-6 py-4 text-danger-primary font-mono">{attack}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SectionHeader({ icon, label, title }) {
  return (
    <div className="flex items-end gap-4 border-b border-white/[0.05] pb-5">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-accent-primary opacity-70">{icon}</div>
          <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em]">{label}</span>
        </div>
        <h3 className="text-2xl font-outfit font-black text-white tracking-tight uppercase italic">{title}</h3>
      </div>
    </div>
  );
}

function NetworkNode({ icon, label, sublabel, color, borderColor, glow, danger, pulse, mini }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${mini ? 'scale-90' : ''}`}>
      <motion.div
        animate={pulse ? { boxShadow: ['0 0 15px rgba(226,75,74,0.3)', '0 0 40px rgba(226,75,74,0.8)', '0 0 15px rgba(226,75,74,0.3)'] } : {}}
        transition={{ duration: 1.2, repeat: Infinity }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center border bg-white/[0.03] ${borderColor} ${glow} ${color} transition-all duration-500 relative`}
      >
        {danger && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger-primary flex items-center justify-center">
            <AlertTriangle size={9} className="text-black" />
          </div>
        )}
        {icon}
      </motion.div>
      <div className="text-center">
        <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${color}`}>{label}</p>
        <p className="text-[7px] text-slate-600 font-mono uppercase tracking-widest">{sublabel}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subtext, color, isLoading, showBar, barValue }) {
  const colors = {
    danger:  { text: 'text-danger-primary', border: 'border-danger-primary/25', bg: 'bg-danger-primary/[0.04]', bar: 'bg-danger-primary shadow-[0_0_10px_rgba(226,75,74,0.4)]' },
    safe:    { text: 'text-success-primary', border: 'border-success-primary/20', bg: 'bg-success-primary/[0.03]', bar: 'bg-success-primary shadow-[0_0_10px_rgba(16,185,129,0.4)]' },
    warn:    { text: 'text-warning-primary', border: 'border-warning-primary/25', bg: 'bg-warning-primary/[0.04]', bar: 'bg-warning-primary' },
    neutral: { text: 'text-slate-400', border: 'border-white/[0.06]', bg: 'bg-white/[0.01]', bar: 'bg-slate-700' },
  };
  const c = colors[color] || colors.neutral;
  return (
    <div className={`glass-card p-5 rounded-[20px] border transition-all duration-500 ${c.border} ${c.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`${c.text} opacity-70`}>{icon}</div>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</span>
      </div>
      <div className={`text-[18px] font-black font-mono tracking-tighter mb-1 transition-all ${c.text} ${isLoading ? 'animate-pulse' : ''}`}>{value}</div>
      <p className="text-[9px] text-slate-500 font-medium leading-relaxed mb-2">{subtext}</p>
      {showBar && (
        <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.05]">
          <motion.div initial={{ width: 0 }} animate={{ width: `${barValue}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className={`h-full rounded-full ${c.bar}`} />
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="glass-card px-5 py-4 rounded-2xl border border-white/[0.08] flex items-center gap-4 hover:bg-white/[0.05] hover:border-accent-primary/20 transition-all duration-300">
      <div className={`${color} shrink-0`}>{icon}</div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[8px] uppercase font-black text-slate-400 tracking-[0.2em] font-mono">{label}</p>
        <p className={`text-[13px] font-black ${color} tracking-tight font-outfit uppercase`}>{value}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}
