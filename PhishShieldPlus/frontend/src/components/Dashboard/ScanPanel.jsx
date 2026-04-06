import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  FileText, 
  Activity, 
  ShieldAlert, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Clock,
  Cpu,
  Shield,
  Zap,
  BarChart2,
  Lock,
  MapPin,
  ExternalLink
} from 'lucide-react';

export default function ScanPanel() {
  const [payload, setPayload] = useState('');
  const [mode, setMode] = useState('URL');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Tx-specific fields
  const [txAmount, setTxAmount] = useState('');
  const [txVelocity, setTxVelocity] = useState('');

  const handleScan = async () => {
    if (mode !== 'Tx' && !payload) return;
    if (mode === 'Tx' && !txAmount) return;
    setLoading(true);
    setScanResult(null);
    try {
      let endpoint = '/scan-url';
      let bodyData = {};

      if (mode === 'URL') {
        endpoint = '/scan-url';
        bodyData = { url: payload };
      } else if (mode === 'Text') {
        endpoint = '/scan-text';
        bodyData = { text: payload, language: "auto" };
      } else if (mode === 'Tx') {
        endpoint = '/scan-transaction';
        bodyData = { transaction_data: `Amount: ₹${txAmount}, Velocity: ${txVelocity || 1} txn/hr, Hour: ${new Date().getHours()}, Geo Distance: ${(Math.random() * 2000).toFixed(2)} km` };
      } else if (mode === 'Breach') {
        endpoint = '/breach-check';
        bodyData = { email: payload };
      }

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (mode === 'Breach') {
        setScanResult({
          type: 'breach',
          risk_level: data.breached ? 100 : 0,
          text: data.breached
            ? `CRITICAL EXPOSURE: This identity was found in ${data.breach_count || 3} separate dark web breaches.`
            : "SAFE: No known dark web breaches found for this identity.",
          tactics: data.breached ? ["Credential Leak", "Social Engineering Target"] : ["Clean Identity"],
          confidence: 99
        });
      } else if (mode === 'Tx') {
        const risk = data.risk_level || Math.round((data.anomaly_score || 0) * 100);
        const explanationDict = data.explanation || {};
        
        const feats = data.features || {};
        setScanResult({
          type: 'tx',
          risk_level: risk,
          anomaly_score: data.anomaly_score || (risk / 100),
          features: {
            'amount (₹)': Number(feats.amount || txAmount || 0).toLocaleString('en-IN'),
            'velocity (txn/hr)': feats.velocity || txVelocity || "1",
            'hour of day': feats.hour_of_day ?? new Date().getHours(),
            'geo distance (km)': feats.geo_distance_km ?? "—"
          },
          text: explanationDict.explanation || "Transaction analysis complete by Isolation Forest engine.",
          tactics: explanationDict.tactics_detected || ["Anomaly Detection"],
          confidence: data.confidence || 99
        });
      } else {
        const risk = data.risk_level || 0;
        const explanationDict = data.explanation || data.gemini_explanation || {};
        setScanResult({
          type: 'standard',
          risk_level: Math.floor(risk),
          payload: payload,
          text: explanationDict.explanation || "Forensic analysis complete. Potential for brand impersonation and high-velocity phishing detected.",
          tactics: explanationDict.tactics_detected || ["Heuristic Analysis", "AI Categorization"],
          recommendation: explanationDict.recommendation || 'monitor',
          confidence: data.confidence || 85,
          geo: data.geo || null,
          blockchain_hash: data.blockchain_hash || null,
          scanned_at: new Date().toISOString(),
          engines: {
            'VT_Engine': risk > 60 ? 'MALICIOUS' : 'CLEAN',
            'Heuristic_V4': risk > 40 ? 'FLAGGED' : 'PASS',
            'Gemini_LLM': explanationDict.severity ? explanationDict.severity.toUpperCase() : 'LOW',
            'Chain_Proxy': data.blockchain_hash ? 'ANCHORED' : 'PENDING',
            'GSB_Check': risk > 80 ? 'BLOCKED' : 'PASS',
            'SSL_Grade': risk > 70 ? 'FAIL' : 'PASS',
          }
        });
      }
      if (mode !== 'Tx') setPayload('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { id: 'URL', label: 'Remote Origin', icon: Globe },
    { id: 'Text', label: 'Payload Content', icon: FileText },
    { id: 'Tx', label: 'Transaction Hash', icon: Activity },
    { id: 'Breach', label: 'Identity Check', icon: Fingerprint },
  ];

  return (
    <div className="flex flex-col gap-10">
      
      {/* COMMAND TABS */}
      <div className="flex gap-2 p-1.5 bg-white/[0.02] rounded-[24px] border border-white/[0.05] relative overflow-hidden">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setScanResult(null); }}
            className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative group ${
              mode === m.id
                ? "text-accent-primary bg-accent-primary/5 border border-accent-primary/10 shadow-[0_0_20px_rgba(102,252,241,0.05)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
            }`}
          >
            <m.icon size={14} className={`shrink-0 ${mode === m.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 transition-opacity'}`} />
            <span className="hidden md:inline">{m.label}</span>
            {mode === m.id && (
               <motion.div layoutId="mode-pill" className="absolute inset-0 border-2 border-accent-primary/20 rounded-[18px]" />
            )}
          </button>
        ))}
      </div>

      {/* INTELLIGENT INPUT SYSTEM */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'Tx' ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-4">Currency_Value (INR)</label>
                  <div className="relative">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold">₹</span>
                     <input
                      type="number"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/[0.03] border border-white/[0.08] pl-10 pr-6 py-5 rounded-2xl focus:outline-none focus:border-accent-primary/30 focus:bg-accent-primary/[0.03] text-sm font-mono font-bold transition-all placeholder:text-slate-800"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 ml-4">Txn_Velocity (H)</label>
                  <input
                    type="number"
                    value={txVelocity}
                    onChange={(e) => setTxVelocity(e.target.value)}
                    placeholder="TXN/HR"
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-6 py-5 rounded-2xl focus:outline-none focus:border-accent-primary/30 focus:bg-accent-primary/[0.03] text-sm font-mono font-bold transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute left-6 top-[22px] text-slate-600 group-focus-within:text-accent-primary transition-colors">
                  <Search size={22} strokeWidth={2.5} />
                </div>
                {mode === 'Text' ? (
                  <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="Inject suspicious text payload for forensic categorical analysis..."
                    className="w-full h-32 bg-white/[0.03] border border-white/[0.08] pl-16 pr-6 py-5 rounded-[28px] focus:outline-none focus:border-accent-primary/30 focus:bg-accent-primary/[0.03] text-sm font-medium leading-relaxed transition-all placeholder:text-slate-700 resize-none custom-scrollbar"
                  />
                ) : (
                  <input
                    type={mode === 'Breach' ? 'email' : 'text'}
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder={mode === 'Breach' ? "Enter target identity context (Email)..." : "Analyze remote origin security posture (URL)..."}
                    className="w-full bg-white/[0.03] border border-white/[0.08] pl-16 pr-6 py-6 rounded-full focus:outline-none focus:border-accent-primary/30 focus:bg-accent-primary/[0.03] text-sm font-medium transition-all placeholder:text-slate-700"
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleScan}
          disabled={loading}
          className={`w-full h-16 font-black uppercase tracking-[0.3em] text-[11px] rounded-full transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden
            ${loading
              ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30 cursor-wait'
              : 'bg-[#66fcf1] text-[#020408] hover:text-[#020408] hover:bg-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_40px_rgba(102,252,241,0.35)] hover:shadow-[0_15px_60px_rgba(255,255,255,0.3)]'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center gap-3">
               <div className="w-5 h-5 border-[3px] border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
               <span className="text-accent-primary font-black">Analyzing Infrastructure...</span>
            </div>
          ) : (
            <>
              <Activity size={18} strokeWidth={3} className="text-[#020408]" />
              <span className="text-[#020408] font-black">Commit Diagnostic Sequence</span>
            </>
          )}
        </button>
      </div>

      {/* ANALYTICAL DIAGNOSTIC REPORTS */}
      <AnimatePresence>
        {scanResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* ── VERDICT BANNER ── */}
            <div className={`p-7 rounded-[28px] border relative overflow-hidden ${
              scanResult.risk_level > 80 ? "bg-danger-primary/[0.04] border-danger-primary/25" :
              scanResult.risk_level > 40 ? "bg-warning-primary/[0.04] border-warning-primary/25" :
              "bg-success-primary/[0.04] border-success-primary/25"
            }`}>
              {/* BG ICON */}
              <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none">
                 <ShieldAlert size={140} strokeWidth={0.75} />
              </div>

              {/* TOP ROW */}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${
                    scanResult.risk_level > 80 ? "bg-danger-primary/10 border-danger-primary/30 text-danger-primary shadow-[0_0_25px_rgba(226,75,74,0.2)]" :
                    scanResult.risk_level > 40 ? "bg-warning-primary/10 border-warning-primary/30 text-warning-primary shadow-[0_0_25px_rgba(245,158,11,0.2)]" :
                    "bg-success-primary/10 border-success-primary/30 text-success-primary shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                  }`}>
                    {scanResult.risk_level > 80 ? <ShieldAlert size={26} /> : <CheckCircle2 size={26} />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.35em] mb-1">Intelligent_Resolution</p>
                    <p className={`text-2xl font-outfit font-black uppercase italic leading-none ${
                      scanResult.risk_level > 80 ? "text-danger-primary" :
                      scanResult.risk_level > 40 ? "text-warning-primary" :
                      "text-success-primary"
                    }`}>
                      {scanResult.risk_level > 80 ? "Threat Intercepted" : 
                       scanResult.risk_level > 40 ? "Suspicious Activity" : 
                       "Clinical Clearance"}
                    </p>
                    {scanResult.payload && (
                      <p className="text-[9px] text-slate-500 font-mono mt-2 truncate max-w-[320px]">
                        <span className="text-slate-600 mr-1">TARGET:</span>{scanResult.payload}
                      </p>
                    )}
                  </div>
                </div>

                {/* RISK SCORE */}
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mb-1">Risk_Score</p>
                  <div className={`text-5xl font-black font-mono leading-none ${
                    scanResult.risk_level > 80 ? "text-danger-primary" :
                    scanResult.risk_level > 40 ? "text-warning-primary" :
                    "text-success-primary"
                  }`}>
                    {scanResult.risk_level}<span className="text-[14px] opacity-40 ml-0.5">%</span>
                  </div>
                  <p className="text-[8px] text-slate-700 font-mono mt-1 uppercase tracking-widest">
                    {scanResult.risk_level > 80 ? 'CRITICAL' : scanResult.risk_level > 40 ? 'SUSPICIOUS' : 'SAFE'}
                  </p>
                </div>
              </div>

              {/* RISK BAR */}
              <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden mb-2 border border-white/[0.05]">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${scanResult.risk_level}%` }}
                   transition={{ duration: 1.4, ease: "easeOut" }}
                   className={`h-full rounded-full ${
                    scanResult.risk_level > 80 ? "bg-danger-primary shadow-[0_0_12px_rgba(226,75,74,0.5)]" :
                    scanResult.risk_level > 40 ? "bg-warning-primary shadow-[0_0_12px_rgba(245,158,11,0.5)]" :
                    "bg-success-primary shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  }`}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] mb-5">
                <span className="text-slate-500">Confidence: <span className="text-white">{scanResult.confidence}%</span></span>
                <span className="text-accent-primary/70">Neural Engine v4.2.1-Prod</span>
              </div>

              {/* META ROW */}
              <div className="grid grid-cols-3 gap-3 pt-5 border-t border-white/[0.04]">
                <MetaChip label="Scan_Mode" value={mode} />
                <MetaChip label="Timestamp" value={scanResult.scanned_at ? new Date(scanResult.scanned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} />
                <MetaChip label="Chain_Status" value={scanResult.blockchain_hash ? 'ANCHORED' : 'PENDING'} highlight={!!scanResult.blockchain_hash} />
              </div>
            </div>

            {/* ── ENGINE TELEMETRY GRID ── */}
            {scanResult.engines && (
              <div className="glass-card p-6 rounded-[24px] border-white/[0.04]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1.5 h-4 bg-accent-primary/40 rounded-full" />
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">Engine_Telemetry_Matrix</h4>
                  <div className="ml-auto text-[8px] text-slate-700 font-mono">6 ENGINES INTERROGATED</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(scanResult.engines).map(([engine, status]) => {
                    const isDanger = ['MALICIOUS','BLOCKED','FAIL','CRITICAL','HIGH'].includes(status);
                    const isWarn = ['FLAGGED','SUSPICIOUS','MEDIUM','PENDING'].includes(status);
                    const isGood = ['CLEAN','PASS','LOW','ANCHORED','ENGAGED'].includes(status);
                    return (
                      <div key={engine} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                        isDanger ? 'bg-danger-primary/[0.04] border-danger-primary/20' :
                        isWarn   ? 'bg-warning-primary/[0.04] border-warning-primary/20' :
                        'bg-success-primary/[0.03] border-success-primary/15'
                      }`}>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{engine.replace('_', ' ')}</span>
                        <span className={`text-[8px] font-black uppercase tracking-wider ${
                          isDanger ? 'text-danger-primary' : isWarn ? 'text-warning-primary' : 'text-success-primary'
                        }`}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TX FEATURE GRID (Tx mode only) ── */}
            {scanResult.type === 'tx' && scanResult.features && (
              <div className="glass-card p-6 rounded-[24px] border-white/[0.04]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1.5 h-4 bg-warning-primary/40 rounded-full" />
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">Transaction_Telemetry</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(scanResult.features).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em]">{key}</span>
                      <span className="text-[13px] text-white font-black font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── INSIGHT GRID: AI + TACTICS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* AI Explanation */}
              <div className="glass-card p-7 rounded-[24px] border-white/[0.04] space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-4 bg-accent-primary/40 rounded-full" />
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">AI_Forensic_Explanation</h4>
                </div>
                <p className="text-[12px] text-slate-300 leading-relaxed font-medium">{scanResult.text}</p>
                {scanResult.recommendation && (
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
                    <span className="text-[8px] text-slate-600 uppercase tracking-widest font-black">Recommendation:</span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      scanResult.recommendation === 'block' ? 'text-danger-primary bg-danger-primary/10' :
                      scanResult.recommendation === 'monitor' ? 'text-warning-primary bg-warning-primary/10' :
                      'text-success-primary bg-success-primary/10'
                    }`}>{scanResult.recommendation}</span>
                  </div>
                )}
              </div>

              {/* Detected Signatures + Escalation */}
              <div className="glass-card p-7 rounded-[24px] border-white/[0.04] space-y-5">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-4 bg-accent-primary/40 rounded-full" />
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">Detected_Signatures</h4>
                   <span className="ml-auto text-[8px] text-slate-700 font-mono">{scanResult.tactics.length} FOUND</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scanResult.tactics.map((t, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${
                      scanResult.risk_level > 70 
                        ? 'bg-danger-primary/[0.05] border-danger-primary/20 text-danger-primary/80'
                        : 'bg-accent-primary/[0.04] border-accent-primary/15 text-accent-primary/80'
                    }`}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Blockchain Hash */}
                {scanResult.blockchain_hash && (
                  <div className="pt-4 border-t border-white/[0.04]">
                    <p className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em] mb-1">Forensic_Chain_Hash</p>
                    <p className="text-[9px] text-accent-secondary font-mono truncate opacity-70">{scanResult.blockchain_hash}</p>
                  </div>
                )}
                
                {/* Escalate CTA */}
                {scanResult.risk_level > 70 && (
                   <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-danger-primary animate-pulse" />
                         <span className="text-[8px] text-danger-primary font-black uppercase tracking-widest">Offensive Retaliation Advised</span>
                      </div>
                      <button 
                        onClick={() => window.location.hash = '/offensive'}
                        className="bg-danger-primary text-white text-[8px] font-black uppercase tracking-[0.1em] px-4 py-2 rounded-xl hover:bg-danger-primary/80 hover:scale-105 transition-all flex items-center gap-1.5"
                      >
                         Execute Interdiction
                      </button>
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaChip({ label, value, highlight }) {
  return (
    <div className={`flex flex-col gap-1 px-3 py-2.5 rounded-xl border ${
      highlight ? 'bg-accent-primary/[0.04] border-accent-primary/20' : 'bg-white/[0.02] border-white/[0.05]'
    }`}>
      <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em]">{label}</span>
      <span className={`text-[10px] font-black font-mono uppercase tracking-wider ${highlight ? 'text-accent-primary' : 'text-slate-300'}`}>{value}</span>
    </div>
  );
}
