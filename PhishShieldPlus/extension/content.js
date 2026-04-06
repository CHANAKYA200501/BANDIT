chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "BLOCK_PAGE") {
    injectPhishShieldBlock(request.url, request.risk, request.reason, request.tactics, request.severity);
  } else if (request.action === "UPDATE_HUD") {
    injectForensicHUD(request.url, request.risk, request.reason, request.explanation);
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
