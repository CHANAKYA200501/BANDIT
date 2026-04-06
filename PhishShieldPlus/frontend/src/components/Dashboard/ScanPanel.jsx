import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScanPanel() {
  const [payload, setPayload] = useState('');
  const [mode, setMode] = useState('URL'); // URL, Text, Tx
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  const handleScan = async () => {
    if (!payload) return;
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
        const amtMatch = payload.match(/\d+/);
        bodyData = { amount: amtMatch ? parseInt(amtMatch[0]) : 500 };
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
          risk_level: data.breached ? 100 : 0,
          text: data.breached 
            ? `CRITICAL EXPOSURE: This identity was found in ${data.breach_count} separate dark web breaches.` 
            : "SAFE: No known dark web breaches found for this identity.",
          tactics: data.breached ? ["Credential Leak", "Dark Web Exposure"] : [],
          confidence: 99,
          action: data.breached ? "change passwords immediately" : "safe"
        });
      } else {
        const risk = data.risk_level || (data.anomaly_score * 100) || 0;
        const explanationDict = data.explanation || data.gemini_explanation || {};
        
        setScanResult({
          risk_level: Math.floor(risk),
          text: explanationDict.explanation || "No advanced AI explanation provided.",
          tactics: explanationDict.tactics_detected || [],
          confidence: data.confidence || 85,
          action: explanationDict.recommendation || "verify"
        });
      }
      setPayload('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 font-inter">
      <h2 className="text-lg text-neonTeal font-bold font-outfit">Multi-Modal Scan Core</h2>
      <div className="flex gap-2 mb-2">
        {['URL', 'Text', 'Tx', 'Breach'].map(m => (
          <button 
            key={m}
            onClick={() => {
              setMode(m);
              setScanResult(null);
            }}
            className={`flex-1 text-xs border py-1 rounded transition ${
              mode === m 
                ? "bg-neonTeal/20 border-neonTeal text-neonTeal shadow-[0_0_8px_rgba(0,255,204,0.3)]" 
                : "bg-darkBg border-gray-700 hover:bg-gray-800 text-gray-400"
            }`}
          >
            {m === 'Tx' ? 'Tx Analysis' : m}
          </button>
        ))}
      </div>

      {mode === 'Breach' ? (
         <input 
            type="email" 
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Enter email address (e.g. test@example.com)..." 
            className="w-full bg-darkBg border border-gray-700 px-3 py-3 rounded focus:outline-none focus:border-neonTeal text-sm tracking-wide" 
         />
      ) : mode === 'Tx' ? (
         <input 
            type="number" 
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Enter mock USD amount..." 
            className="w-full bg-darkBg border border-gray-700 px-3 py-3 rounded focus:outline-none focus:border-neonTeal text-sm tracking-wide" 
         />
      ) : mode === 'Text' ? (
         <textarea 
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Paste suspicious SMS, Email, or raw text..." 
            className="w-full h-24 resize-none bg-darkBg border border-gray-700 px-3 py-3 rounded focus:outline-none focus:border-neonTeal text-sm tracking-wide"
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
        className="w-full bg-neonTeal text-darkBg font-bold py-3 rounded hover:bg-mutedTeal transition cursor-pointer text-sm shadow-[0_0_10px_rgba(0,255,204,0.3)] disabled:opacity-50"
      >
        {loading ? "Routing AI Analyzers..." : `Scan ${mode} Payload`}
      </button>

      {/* RENDER THE NORMALIZED GEN-AI RESULT INLINE */}
      <AnimatePresence>
        {scanResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded border flex flex-col gap-2 relative overflow-hidden backdrop-blur-md ${
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
            
            <p className="text-sm text-gray-200 leading-relaxed">
              {scanResult.text}
            </p>
            
            {(scanResult.tactics || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {scanResult.tactics.map((tactic, idx) => (
                  <span key={idx} className="bg-darkBg border border-gray-600 rounded px-2 py-1 text-[10px] text-gray-300">
                    {tactic}
                  </span>
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
