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
  Fingerprint
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
            ? `CRITICAL EXPOSURE: This identity was found in ${data.breach_count} separate dark web breaches.`
            : "SAFE: No known dark web breaches found for this identity.",
          tactics: data.breached ? ["Credential Leak", "Dark Web Exposure"] : [],
          confidence: 99,
          action: data.breached ? "change passwords immediately" : "safe"
        });
      } else if (mode === 'Tx') {
        const risk = data.risk_level || Math.round((data.anomaly_score || 0) * 100);
        const explanationDict = data.explanation || {};
        const severity = risk > 70 ? "HIGH" : risk > 40 ? "MEDIUM" : "LOW";
        const sevColor = risk > 70 ? "text-red-400" : risk > 40 ? "text-yellow-400" : "text-accent-primary";
        
        const feats = data.features || {};
        setScanResult({
          type: 'tx',
          risk_level: risk,
          severity, sevColor,
          anomaly_score: data.anomaly_score || (risk / 100),
          features: {
            'amount (₹)': Number(feats.amount || txAmount || 0).toLocaleString('en-IN'),
            'velocity (txn/hr)': feats.velocity || txVelocity || "1",
            'hour of day': feats.hour_of_day ?? new Date().getHours(),
            'geo distance (km)': feats.geo_distance_km ?? "—"
          },
          signals: data.signals || {},
          text: explanationDict.explanation || "Transaction analysis complete.",
          tactics: explanationDict.tactics_detected || [],
          confidence: data.confidence || 99,
          action: explanationDict.recommendation || "verify"
        });
      } else {
        const risk = data.risk_level || 0;
        const explanationDict = data.explanation || data.gemini_explanation || {};
        setScanResult({
          type: 'standard',
          risk_level: Math.floor(risk),
          text: explanationDict.explanation || "No advanced AI explanation provided.",
          tactics: explanationDict.tactics_detected || [],
          confidence: data.confidence || 85,
          action: explanationDict.recommendation || "block"
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
    { id: 'URL', label: 'URL Scan', icon: Globe },
    { id: 'Text', label: 'Content', icon: FileText },
    { id: 'Tx', label: 'Transaction', icon: Activity },
    { id: 'Breach', label: 'Identity', icon: Fingerprint },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Precision Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-2xl border border-white/5">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setScanResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              mode === m.id
                ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shadow-lg"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <m.icon size={14} />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Forensic Input Area */}
      <div className="space-y-4">
        {mode === 'Tx' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Value (INR)</label>
              <input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-4 rounded-2xl focus:outline-none focus:border-accent-primary/40 focus:bg-accent-primary/[0.02] text-sm font-mono transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Velocity Threshold</label>
              <input
                type="number"
                value={txVelocity}
                onChange={(e) => setTxVelocity(e.target.value)}
                placeholder="TXN/HR"
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-4 rounded-2xl focus:outline-none focus:border-accent-primary/40 focus:bg-accent-primary/[0.02] text-sm font-mono transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute left-5 top-5 text-gray-500 group-focus-within:text-accent-primary transition-colors">
              <Search size={18} />
            </div>
            {mode === 'Text' ? (
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder="Inject suspicious text payload for forensic analysis..."
                className="w-full h-28 bg-white/[0.02] border border-white/10 pl-14 pr-4 py-4 rounded-2xl focus:outline-none focus:border-accent-primary/40 focus:bg-accent-primary/[0.02] text-sm resize-none transition-all placeholder:text-gray-700 font-medium"
              />
            ) : (
              <input
                type={mode === 'Breach' ? 'email' : 'text'}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder={mode === 'Breach' ? "Target identity (Email)..." : "Analyze remote origin (URL)..."}
                className="w-full bg-white/[0.02] border border-white/10 pl-14 pr-4 py-5 rounded-2xl focus:outline-none focus:border-accent-primary/40 focus:bg-accent-primary/[0.02] text-sm transition-all placeholder:text-gray-700 font-medium"
              />
            )}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={loading}
          className="w-full h-14 bg-accent-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 shadow-[0_10px_30px_rgba(102,252,241,0.2)] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Activity size={16} strokeWidth={3} />
              Commit Forensic Scan
            </>
          )}
        </button>
      </div>

      {/* Intelligence Reports */}
      <AnimatePresence>
        {scanResult && (
          <div className="space-y-4">
            {/* Header / Summary */}
            <div className={`p-5 rounded-3xl border animate-in fade-in slide-in-from-bottom-4 duration-500 ${
              scanResult.risk_level > 80 ? "bg-red-400/5 border-red-400/20" :
              scanResult.risk_level > 40 ? "bg-yellow-400/5 border-yellow-400/20" :
              "bg-accent-primary/5 border-accent-primary/20"
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    scanResult.risk_level > 80 ? "bg-red-400/10 text-red-400" :
                    scanResult.risk_level > 40 ? "bg-yellow-400/10 text-yellow-400" :
                    "bg-accent-primary/10 text-accent-primary"
                  }`}>
                    {scanResult.risk_level > 80 ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">Threat Diagnostic</h3>
                    <p className={`text-sm font-black ${
                      scanResult.risk_level > 80 ? "text-red-400" :
                      scanResult.risk_level > 40 ? "text-yellow-400" :
                      "text-accent-primary"
                    }`}>
                      {scanResult.risk_level > 80 ? "CRITICAL THREAT DETECTED" : 
                       scanResult.risk_level > 40 ? "SUSPICIOUS ACTIVITY FLAG" : 
                       "CLEAN ORIGIN VERIFIED"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest block mb-1">Risk Quotient</span>
                  <div className={`text-2xl font-black font-mono leading-none ${
                    scanResult.risk_level > 80 ? "text-red-400" :
                    scanResult.risk_level > 40 ? "text-yellow-400" :
                    "text-accent-primary"
                  }`}>
                    {scanResult.risk_level}%
                  </div>
                </div>
              </div>

              {/* Progress Detail */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${
                    scanResult.risk_level > 80 ? "bg-red-400" :
                    scanResult.risk_level > 40 ? "bg-yellow-400" :
                    "bg-accent-primary"
                  }`}
                  style={{ width: `${scanResult.risk_level}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase py-1">
                <span>Diagnostic Accuracy: {scanResult.confidence}%</span>
                <span>Agentic Logic v2.0</span>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 glass-panel rounded-3xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <FileText size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Intelligence</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {scanResult.text}
                </p>
              </div>

              <div className="p-5 glass-panel rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Fingerprint size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Identified Markers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(scanResult.tactics || ["Zero Anomalies"]).map((t, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Offensive Posture */}
            {scanResult.risk_level > 75 && mode === 'URL' && (
              <div className="p-4 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-400 animate-pulse" size={18} />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Operational Alert: Interdiction Recommended</span>
                </div>
                <button 
                  onClick={() => window.location.hash = '/offensive'}
                  className="px-4 py-2 bg-red-500 text-black text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-red-400 transition-colors"
                >
                  Engage offensive retaliation
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
