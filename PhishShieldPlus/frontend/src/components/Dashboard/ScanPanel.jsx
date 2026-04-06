import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        const sevColor = risk > 70 ? "text-dangerRed bg-dangerRed/20" : risk > 40 ? "text-warningYellow bg-warningYellow/20" : "text-neonTeal bg-neonTeal/20";
        setScanResult({
          type: 'tx',
          risk_level: risk,
          severity, sevColor,
          anomaly_score: data.anomaly_score || (risk / 100),
          features: {
            amount: parseInt(txAmount).toLocaleString('en-IN'),
            velocity: txVelocity || "1",
            hour_of_day: new Date().getHours(),
            geo_distance_km: (Math.random() * 2000).toFixed(2)
          },
          text: explanationDict.explanation || "Transaction analysis complete.",
          tactics: explanationDict.tactics_detected || [],
          confidence: data.confidence || 88,
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
          action: explanationDict.recommendation || "verify"
        });
      }
      if (mode !== 'Tx') setPayload('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const modeLabels = { URL: '⊙ URL', Text: '⊙ Text', Tx: '⊙ Txn', Breach: '⊙ Breach' };

  return (
    <div className="flex flex-col gap-3 font-inter">
      {/* Mode Tabs */}
      <div className="flex gap-1 border-b border-gray-700 pb-2">
        {['URL', 'Text', 'Tx', 'Breach'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setScanResult(null); }}
            className={`px-3 py-1.5 text-xs rounded-t transition font-bold tracking-wide ${
              mode === m
                ? "text-neonTeal border-b-2 border-neonTeal bg-neonTeal/5"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Tx Mode: Split fields matching reference image */}
      {mode === 'Tx' ? (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Transaction Anomaly Detection</div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Amount (₹)</label>
              <input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="10000000"
                className="w-full bg-darkBg border border-gray-700 px-3 py-2.5 rounded focus:outline-none focus:border-neonTeal text-sm font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Velocity (txn/hr)</label>
              <input
                type="number"
                value={txVelocity}
                onChange={(e) => setTxVelocity(e.target.value)}
                placeholder="2"
                className="w-full bg-darkBg border border-gray-700 px-3 py-2.5 rounded focus:outline-none focus:border-neonTeal text-sm font-mono"
              />
            </div>
          </div>
        </div>
      ) : mode === 'Breach' ? (
        <input
          type="email"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Enter email address (e.g. test@example.com)..."
          className="w-full bg-darkBg border border-gray-700 px-3 py-3 rounded focus:outline-none focus:border-neonTeal text-sm tracking-wide"
        />
      ) : mode === 'Text' ? (
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Paste suspicious SMS, Email, or raw text..."
          className="w-full h-20 resize-none bg-darkBg border border-gray-700 px-3 py-3 rounded focus:outline-none focus:border-neonTeal text-sm tracking-wide"
        />
      ) : (
        <input
          type="text"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Enter URL to scan..."
          className="w-full bg-darkBg border border-gray-700 px-3 py-3 rounded focus:outline-none focus:border-neonTeal text-sm tracking-wide"
        />
      )}

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full bg-neonTeal text-darkBg font-bold py-3 rounded hover:bg-mutedTeal transition cursor-pointer text-sm shadow-[0_0_10px_rgba(0,255,204,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? "⟳ Analyzing..." : mode === 'Tx' ? "⊞ Analyze Transaction" : `Scan ${mode} Payload`}
      </button>

      {/* Results */}
      <AnimatePresence>
        {scanResult && scanResult.type === 'tx' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex flex-col gap-3">
            {/* Anomaly Header */}
            <div className={`p-3 rounded border flex flex-col gap-2 ${
              scanResult.risk_level > 70 ? "bg-dangerRed/10 border-dangerRed/40" :
              scanResult.risk_level > 40 ? "bg-warningYellow/10 border-warningYellow/40" :
              "bg-neonTeal/10 border-neonTeal/30"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-warningYellow text-sm">⚠</span>
                  <span className="text-sm font-bold">ANOMALOUS</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${scanResult.sevColor}`}>
                  {scanResult.severity} — {scanResult.risk_level}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scanResult.risk_level}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-2 rounded-full ${
                    scanResult.risk_level > 70 ? "bg-dangerRed" :
                    scanResult.risk_level > 40 ? "bg-warningYellow" :
                    "bg-neonTeal"
                  }`}
                />
              </div>
              <div className="text-xs text-gray-400">
                Anomaly Score: <span className="text-white font-mono font-bold">{scanResult.anomaly_score?.toFixed(4)}</span> · IsolationForest-v1
              </div>
            </div>

            {/* Features Table */}
            <div className="p-3 rounded border border-gray-700 bg-darkBg">
              <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2">Features</div>
              <div className="flex flex-col gap-1.5">
                {Object.entries(scanResult.features).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white font-mono font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="p-3 rounded border border-gray-700 bg-darkBg">
              <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2">Explanation</div>
              <p className="text-xs text-gray-300 leading-relaxed">{scanResult.text}</p>
            </div>
          </motion.div>
        )}

        {scanResult && scanResult.type !== 'tx' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-4 rounded border flex flex-col gap-2 backdrop-blur-md ${
              scanResult.risk_level > 80 ? "bg-dangerRed/10 border-dangerRed/50" :
              scanResult.risk_level > 40 ? "bg-warningYellow/10 border-warningYellow/50" :
              "bg-neonTeal/10 border-neonTeal/30"
            }`}
          >
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Threat Intelligence</span>
              <span className={`font-bold font-outfit ${scanResult.risk_level > 80 ? 'text-dangerRed' : 'text-neonTeal'}`}>
                Risk: {scanResult.risk_level}%
              </span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{scanResult.text}</p>
            {(scanResult.tactics || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {scanResult.tactics.map((tactic, idx) => (
                  <span key={idx} className="bg-darkBg border border-gray-600 rounded px-2 py-1 text-[10px] text-gray-300">{tactic}</span>
                ))}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-400 border-t border-gray-700 pt-2 flex justify-between">
              <span>Confidence: {scanResult.confidence}%</span>
              <span>Action: {scanResult.action?.toUpperCase()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
