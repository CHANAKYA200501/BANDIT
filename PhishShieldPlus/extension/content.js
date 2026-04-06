chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "BLOCK_PAGE") {
    injectPhishShieldBlock(request.url, request.risk, request.reason, request.tactics, request.severity);
  } else if (request.action === "UPDATE_HUD") {
    injectForensicHUD(request.url, request.risk, request.reason, request.explanation);
    // Fire toast popup for elevated risk levels (non-blocking)
    if (request.risk !== undefined && request.risk !== null) {
      if (request.risk >= 30 && request.risk < 90) {
        showThreatToast(request.url, request.risk, request.reason, request.explanation);
      }
    }
  } else if (request.action === "SHOW_ALERT") {
    showThreatToast(request.url, request.risk, request.reason, request.explanation, request.tactics);
  }
});

/**
 * CLINICAL INTERCEPTION LAYER (KILL SWITCH)
 * Modernized with depth-glows and high-precision forensic reports.
 */
function injectPhishShieldBlock(url, risk, reason, tactics = [], severity = "critical") {
  if (document.getElementById("phishshield-interception-layer")) return;

  const overlay = document.createElement("div");
  overlay.id = "phishshield-interception-layer";
  overlay.style.all = "unset";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.zIndex = "2147483647";
  overlay.style.background = "radial-gradient(circle at 50% 50%, #0a0e17 0%, #000 100%)";
  overlay.style.color = "#fff";
  overlay.style.fontFamily = "'Outfit', 'Inter', system-ui, -apple-system, sans-serif";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "40px";
  overlay.style.overflow = "hidden";

  // Prevent host-page CSS from leaking in
  const shadow = overlay.attachShadow({ mode: 'open' });

  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 720px;
    width: 100%;
    position: relative;
    animation: ps-fade-in 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  `;

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
      
      @keyframes ps-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes ps-pulse-red { 0% { box-shadow: 0 0 0 0 rgba(226, 75, 74, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(226, 75, 74, 0); } 100% { box-shadow: 0 0 0 0 rgba(226, 75, 74, 0); } }
      @keyframes ps-scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
      
      .clinical-panel {
        background: rgba(10, 14, 23, 0.6);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        border: 1px solid rgba(226, 75, 74, 0.2);
        border-radius: 40px;
        padding: 60px;
        width: 100%;
        box-shadow: 0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(226, 75, 74, 0.05);
        position: relative;
        overflow: hidden;
      }
      
      .scanline {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(to bottom, transparent, rgba(226, 75, 74, 0.03), transparent);
        animation: ps-scanline 4s linear infinite;
        pointer-events: none;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: rgba(226, 75, 74, 0.1);
        border: 1px solid rgba(226, 75, 74, 0.3);
        border-radius: 100px;
        color: #e24b4a;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 24px;
      }

      .indicator {
        width: 8px; height: 8px;
        background: #e24b4a;
        border-radius: 50%;
        animation: ps-pulse-red 1.5s infinite;
      }

      h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 48px;
        font-weight: 900;
        margin: 0 0 12px 0;
        letter-spacing: -0.04em;
        text-transform: uppercase;
        line-height: 0.9;
        color: #fff;
        text-align: center;
      }

      .threat-highlight { color: #e24b4a; font-style: italic; }

      p.subtext {
        font-size: 16px;
        color: #6b7280;
        margin-bottom: 40px;
        max-width: 500px;
        text-align: center;
        line-height: 1.5;
        font-weight: 500;
      }

      .report-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 24px;
        padding: 32px;
        text-align: left;
        margin-bottom: 40px;
      }

      .report-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 16px;
      }

      .report-label {
        font-size: 9px;
        font-weight: 900;
        color: #4b5563;
        text-transform: uppercase;
        letter-spacing: 0.3em;
      }

      .risk-gauge {
        font-family: monospace;
        font-size: 11px;
        color: #e24b4a;
        font-weight: bold;
      }

      .reason-text {
        font-size: 13px;
        color: #d1d5db;
        line-height: 1.6;
        font-family: 'Inter', sans-serif;
        margin-bottom: 20px;
      }

      .tactic-tag {
        display: inline-block;
        font-size: 9px;
        background: rgba(226, 75, 74, 0.05);
        border: 1px solid rgba(226, 75, 74, 0.2);
        color: #e24b4a;
        padding: 4px 10px;
        border-radius: 8px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin: 0 8px 8px 0;
      }

      .button-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
      }

      button {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        height: 60px;
        border-radius: 100px;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        width: 100%;
        box-sizing: border-box;
      }

      .primary-btn {
        background: #e24b4a;
        color: #000;
      }
      .primary-btn:hover {
        transform: scale(1.02);
        box-shadow: 0 20px 40px rgba(226, 75, 74, 0.3);
      }

      .secondary-btn {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #9ca3af;
      }
      .secondary-btn:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.2);
      }

      .bypass-link {
        font-size: 10px;
        color: #374151;
        background: none;
        border: none;
        margin-top: 24px;
        cursor: pointer;
        text-decoration: underline;
        opacity: 0.5;
        transition: opacity 0.3s;
      }
      .bypass-link:hover { opacity: 1; }
    </style>

    <div class="clinical-panel">
      <div class="scanline"></div>
      <div class="status-pill">
        <div class="indicator"></div>
        Interception_Active
      </div>
      
      <h1>Operational <span class="threat-highlight">Neutralization</span></h1>
      <p class="subtext">
        Real-time telemetry anchors identified this vector as a high-velocity phishing threat. 
        Access is restricted to maintain organizational data integrity.
      </p>

      <div class="report-card">
        <div class="report-header">
          <span class="report-label">AI_FORENSIC_DIAGNOSTIC</span>
          <span class="risk-gauge">THREAT_LEVEL: ${risk}%</span>
        </div>
        <div class="reason-text">
          ${reason}
        </div>
        <div class="tactics-container">
          ${tactics.map(t => `<span class="tactic-tag">${t}</span>`).join('')}
        </div>
      </div>

      <div class="button-group">
        <button class="primary-btn" onclick="window.history.back()">
          Exit Dangerous Environment
        </button>
        <button class="secondary-btn" id="phishshield-offensive-btn">
          Open Strategic Dashboard
        </button>
      </div>

      <button class="bypass-link" onclick="document.getElementById('phishshield-interception-layer').remove()">
        Bypass Interdiction (Not Recommended)
      </button>
    </div>
  `;

  shadow.appendChild(container);
  document.body.appendChild(overlay);

  // Handle Strategic Button Click
  shadow.getElementById("phishshield-offensive-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ 
      action: "LAUNCH_OFFENSIVE", 
      target: url 
    });
  });

  document.body.style.overflow = "hidden";
  
  // Prevent any zoom issues on focus
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  document.getElementsByTagName('head')[0].appendChild(meta);
}

/**
 * REAL-TIME FORENSIC HUD
 * Floating telemetry layer for non-blocked pages.
 */
function injectForensicHUD(url, risk, reason, explanation = {}) {
  let hud = document.getElementById("phishshield-forensic-hud");
  const isScanning = risk === undefined || risk === null;
  
  if (!hud) {
    hud = document.createElement("div");
    hud.id = "phishshield-forensic-hud";
    hud.style.all = "unset";
    hud.style.position = "fixed";
    hud.style.bottom = "24px";
    hud.style.right = "24px";
    hud.style.zIndex = "2147483646";
    hud.style.fontFamily = "'Outfit', sans-serif";
    
    const shadow = hud.attachShadow({ mode: 'open' });
    
    const container = document.createElement("div");
    container.id = "hud-container";
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      background: rgba(5, 8, 13, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(102, 252, 241, 0.2);
      border-radius: 100px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(102, 252, 241, 0.05);
      color: #fff;
      cursor: pointer;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
      animation: hud-slide-in 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    `;
    
    container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@900&family=Inter:wght@700&display=swap');
        @keyframes hud-slide-in { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes hud-pulse { 0% { opacity: 0.4; } 100% { opacity: 1; } }
        
        .status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #66fcf1;
          box-shadow: 0 0 10px rgba(102, 252, 241, 0.5);
        }
        .status-dot.scanning { animation: hud-pulse 0.8s infinite alternate; }
        
        .status-text {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #66fcf1;
        }
        .divider { width: 1px; height: 16px; background: rgba(255,255,255,0.1); }
        .risk-value {
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s;
        }
        .scanning-text { font-size: 9px; opacity: 0.6; font-style: italic; letter-spacing: 0.1em; }
        .safe-tag { color: #10b981; }
        .danger-tag { color: #e24b4a; }
      </style>
      <div class="status-dot ${isScanning ? 'scanning' : ''}"></div>
      <span class="status-text">Shield_Live</span>
      <div class="divider"></div>
      <span class="risk-value ${isScanning ? 'scanning-text' : risk < 30 ? 'safe-tag' : risk > 70 ? 'danger-tag' : ''}">
        ${isScanning ? 'ANALYZING_THREAT_VECTORS...' : risk < 10 ? 'VERIFIED_SECURE' : `RISK: ${risk}%`}
      </span>
    `;
    
    shadow.appendChild(container);
    document.body.appendChild(hud);
    
    container.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "LAUNCH_OFFENSIVE", target: url });
    });
  } else {
    // Update existing HUD
    const shadow = hud.shadowRoot;
    const dot = shadow.querySelector('.status-dot');
    const riskElem = shadow.querySelector('.risk-value');
    
    if (dot) dot.className = `status-dot ${isScanning ? 'scanning' : ''}`;
    if (riskElem) {
      riskElem.className = `risk-value ${isScanning ? 'scanning-text' : risk < 30 ? 'safe-tag' : risk > 70 ? 'danger-tag' : ''}`;
      riskElem.textContent = isScanning ? 'ANALYZING_THREAT_VECTORS...' : risk < 10 ? 'VERIFIED_SECURE' : `RISK: ${risk}%`;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ███████████  THREAT ALERT TOAST SYSTEM  ████████████████████████████████████
// Tiered animated popup cards that slide in from top-right on malicious activity
// ─────────────────────────────────────────────────────────────────────────────

const PS_TOAST_QUEUE = [];
let PS_TOAST_VISIBLE_COUNT = 0;
const PS_TOAST_MAX = 3;

function getThreatTier(risk) {
  if (risk >= 90) return { tier: 'critical', label: 'CRITICAL THREAT', color: '#e24b4a', glow: 'rgba(226,75,74,0.4)', icon: '🚨' };
  if (risk >= 70) return { tier: 'high',     label: 'HIGH RISK',       color: '#ef4444', glow: 'rgba(239,68,68,0.3)',  icon: '⚠️' };
  if (risk >= 50) return { tier: 'moderate', label: 'SUSPICIOUS',      color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', icon: '🔶' };
  return                 { tier: 'low',      label: 'LOW RISK',        color: '#10b981', glow: 'rgba(16,185,129,0.2)', icon: '🔵' };
}

function showThreatToast(url, risk, reason, explanation = {}, tactics = []) {
  if (PS_TOAST_VISIBLE_COUNT >= PS_TOAST_MAX) {
    PS_TOAST_QUEUE.push({ url, risk, reason, explanation, tactics });
    return;
  }
  _renderToast(url, risk, reason, explanation, tactics);
}

function _renderToast(url, risk, reason, explanation, tactics) {
  PS_TOAST_VISIBLE_COUNT++;

  const { label, color, glow, icon } = getThreatTier(risk);
  const truncUrl = url.length > 48 ? url.slice(0, 48) + '…' : url;
  const tacticTags = (tactics || []).slice(0, 3).map(t => `<span class="ps-tactic">${t}</span>`).join('');
  const barWidth = Math.min(100, risk);

  // ── Host element (outside shadow so it gets positioned on page) ──
  const host = document.createElement('div');
  host.style.cssText = `
    all: unset;
    position: fixed;
    top: 80px;
    right: 24px;
    z-index: 2147483645;
    width: 340px;
    pointer-events: auto;
    font-family: 'Outfit', 'Inter', system-ui, sans-serif;
  `;

  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;600&display=swap');

      @keyframes ps-toast-in {
        from { opacity: 0; transform: translateX(60px) scale(0.96); }
        to   { opacity: 1; transform: translateX(0)   scale(1); }
      }
      @keyframes ps-toast-out {
        from { opacity: 1; transform: translateX(0) scale(1); max-height: 300px; margin-bottom: 0; }
        to   { opacity: 0; transform: translateX(60px) scale(0.94); max-height: 0; margin-bottom: -10px; }
      }
      @keyframes ps-progress {
        from { width: 100%; } to { width: 0%; }
      }
      @keyframes ps-scanline-toast {
        0%   { transform: translateY(-100%); opacity: 0; }
        30%  { opacity: 1; }
        100% { transform: translateY(200%); opacity: 0; }
      }
      @keyframes ps-pulse-icon {
        0%, 100% { transform: scale(1); }
        50%       { transform: scale(1.15); }
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      .toast {
        background: rgba(5, 8, 13, 0.92);
        backdrop-filter: blur(28px);
        -webkit-backdrop-filter: blur(28px);
        border: 1px solid ${color}33;
        border-radius: 18px;
        padding: 0;
        overflow: hidden;
        box-shadow:
          0 20px 60px rgba(0,0,0,0.7),
          0 0 0 1px rgba(255,255,255,0.04),
          0 0 40px ${glow};
        animation: ps-toast-in 0.5s cubic-bezier(0.23, 1, 0.32, 1) both;
        position: relative;
        margin-bottom: 10px;
        transition: transform 0.2s;
      }
      .toast:hover { transform: scale(1.01); }

      /* Accent bar on left */
      .accent-bar {
        position: absolute;
        top: 0; left: 0;
        width: 3px; height: 100%;
        background: linear-gradient(to bottom, ${color}, transparent);
        border-radius: 18px 0 0 18px;
      }

      /* Subtle scanline sweep */
      .sweep {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 40%, ${color}08, transparent 60%);
        animation: ps-scanline-toast 3s ease-in-out infinite;
        pointer-events: none;
      }

      /* Progress bar auto-dismiss */
      .progress-track {
        height: 2px;
        background: ${color}22;
      }
      .progress-bar {
        height: 2px;
        background: ${color};
        animation: ps-progress 8s linear forwards;
        box-shadow: 0 0 6px ${color};
      }

      .body {
        padding: 14px 16px 14px 20px;
        position: relative;
      }

      .top-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }

      .left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .icon-badge {
        width: 34px; height: 34px;
        background: ${color}18;
        border: 1px solid ${color}33;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
        animation: ps-pulse-icon 2s ease-in-out infinite;
      }

      .title-group {}
      .threat-label {
        font-size: 9px;
        font-weight: 900;
        color: ${color};
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 2px;
      }
      .threat-brand {
        font-size: 11px;
        font-weight: 700;
        color: rgba(255,255,255,0.85);
        letter-spacing: -0.01em;
      }

      .close-btn {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 7px;
        width: 24px; height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: rgba(255,255,255,0.4);
        font-size: 12px;
        flex-shrink: 0;
        transition: all 0.2s;
        font-family: monospace;
      }
      .close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

      .url-chip {
        font-size: 10px;
        font-family: 'Inter', monospace;
        color: rgba(255,255,255,0.45);
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 6px;
        padding: 3px 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 8px;
        max-width: 100%;
        display: block;
      }

      .reason-p {
        font-size: 11px;
        color: rgba(255,255,255,0.55);
        line-height: 1.5;
        font-family: 'Inter', sans-serif;
        margin-bottom: 10px;
      }

      /* Risk bar */
      .risk-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      .risk-track {
        flex: 1;
        height: 4px;
        background: rgba(255,255,255,0.06);
        border-radius: 100px;
        overflow: hidden;
      }
      .risk-fill {
        height: 100%;
        width: ${barWidth}%;
        background: ${color};
        border-radius: 100px;
        box-shadow: 0 0 8px ${color};
        transition: width 0.6s cubic-bezier(0.23, 1, 0.32, 1);
      }
      .risk-pct {
        font-size: 11px;
        font-weight: 900;
        color: ${color};
        min-width: 36px;
        text-align: right;
      }

      /* Tactic tags */
      .tactics { display: flex; flex-wrap: wrap; gap: 4px; }
      .ps-tactic {
        font-size: 8px;
        font-weight: 900;
        background: ${color}10;
        border: 1px solid ${color}28;
        color: ${color};
        border-radius: 5px;
        padding: 2px 7px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      /* Action buttons */
      .actions {
        display: flex;
        gap: 6px;
        margin-top: 10px;
      }
      .act-btn {
        flex: 1;
        height: 30px;
        border-radius: 8px;
        border: none;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
        font-family: 'Outfit', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        transition: all 0.2s;
      }
      .act-primary {
        background: ${color};
        color: #000;
      }
      .act-primary:hover { filter: brightness(1.1); transform: scale(1.02); }
      .act-ghost {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.5);
      }
      .act-ghost:hover { background: rgba(255,255,255,0.08); color: #fff; }
    </style>

    <div class="toast" id="ps-toast-card">
      <div class="accent-bar"></div>
      <div class="sweep"></div>
      <div class="progress-track"><div class="progress-bar" id="ps-progress"></div></div>
      <div class="body">
        <div class="top-row">
          <div class="left">
            <div class="icon-badge">${icon}</div>
            <div class="title-group">
              <div class="threat-label">${label}</div>
              <div class="threat-brand">PhishShield+ Alert</div>
            </div>
          </div>
          <div class="close-btn" id="ps-close">✕</div>
        </div>

        <span class="url-chip">${truncUrl}</span>

        <p class="reason-p">${reason || 'Anomalous behaviour detected on this page.'}</p>

        <div class="risk-row">
          <div class="risk-track"><div class="risk-fill"></div></div>
          <span class="risk-pct">${risk}%</span>
        </div>

        ${tacticTags ? `<div class="tactics">${tacticTags}</div>` : ''}

        <div class="actions">
          <button class="act-btn act-primary" id="ps-go-back">← Leave Page</button>
          <button class="act-btn act-ghost"  id="ps-dismiss">Dismiss</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  // Reposition below other visible toasts
  _repositionToasts();

  function dismiss() {
    const card = shadow.getElementById('ps-toast-card');
    if (!card) return;
    card.style.animation = 'ps-toast-out 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards';
    setTimeout(() => {
      host.remove();
      PS_TOAST_VISIBLE_COUNT = Math.max(0, PS_TOAST_VISIBLE_COUNT - 1);
      _repositionToasts();
      if (PS_TOAST_QUEUE.length > 0) {
        const next = PS_TOAST_QUEUE.shift();
        _renderToast(next.url, next.risk, next.reason, next.explanation, next.tactics);
      }
    }, 400);
  }

  // Auto-dismiss after 8s (matches progress bar)
  const autoDismiss = setTimeout(dismiss, 8000);

  shadow.getElementById('ps-close').addEventListener('click', () => { clearTimeout(autoDismiss); dismiss(); });
  shadow.getElementById('ps-dismiss').addEventListener('click', () => { clearTimeout(autoDismiss); dismiss(); });
  shadow.getElementById('ps-go-back').addEventListener('click', () => {
    clearTimeout(autoDismiss);
    dismiss();
    window.history.back();
  });
}

function _repositionToasts() {
  const hosts = document.querySelectorAll('[data-ps-toast]');
  let top = 80;
  hosts.forEach(h => {
    h.style.top = top + 'px';
    top += (h.offsetHeight || 0) + 10;
  });
}
