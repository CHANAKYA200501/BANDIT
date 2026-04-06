chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "BLOCK_PAGE") {
    injectPhishShieldBlock(request.url, request.risk, request.reason);
  }
});

function injectPhishShieldBlock(url, risk, reason) {
  // Prevent duplicate injection
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
  overlay.style.backgroundColor = "#000";
  overlay.style.color = "#fff";
  overlay.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.textAlign = "center";
  overlay.style.padding = "40px";

  overlay.innerHTML = `
    <div style="max-width: 600px; padding: 60px; border: 2px solid #e24b4a; border-radius: 24px; background: rgba(226, 75, 74, 0.05); box-shadow: 0 0 100px rgba(226, 75, 74, 0.1);">
      <div style="font-size: 80px; margin-bottom: 24px;">🛡️</div>
      <h1 style="font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 16px; color: #e24b4a;">PhishShield+ Intercept</h1>
      <p style="font-size: 18px; color: #9ca3af; margin-bottom: 32px; line-height: 1.6;">
        This page has been neutralized by the local autonomous AI agent. Access is restricted to prevent credential theft and malware propagation.
      </p>
      
      <div style="background: rgba(0,0,0,0.4); border: 1px solid #374151; border-radius: 12px; padding: 20px; margin-bottom: 32px; text-align: left;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Threat Analysis</span>
          <span style="font-size: 11px; font-family: monospace; color: #e24b4a; font-weight: bold;">RISK: ${risk}%</span>
        </div>
        <p style="font-size: 13px; color: #d1d5db; margin: 0; line-height: 1.5; font-family: monospace;">
          ${reason}
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
         <button 
           onclick="window.history.back()" 
           style="background: #111; color: #9ca3af; border: 1px solid #374151; padding: 14px 28px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em;"
           onmouseover="this.style.background='#1a1a1a'; this.style.color='#fff';"
           onmouseout="this.style.background='#111'; this.style.color='#9ca3af';"
         >
           SAFE RETURN (EXIT SITE)
         </button>
         
         <button 
           id="phishshield-offensive-btn"
           style="background: #e24b4a; color: white; border: none; padding: 16px 28px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 20px rgba(226, 75, 74, 0.4);"
           onmouseover="this.style.transform='scale(1.02)'; this.style.background='#ff4d4d';"
           onmouseout="this.style.transform='scale(1)'; this.style.background='#e24b4a';"
         >
           ⚡ ENGAGE OFFENSIVE RETALIATION
         </button>

         <button 
           onclick="document.getElementById('phishshield-interception-layer').remove()" 
           style="background: transparent; color: #4b5563; border: none; padding: 10px; font-size: 10px; cursor: pointer; text-decoration: underline;"
         >
           Bypass block (Security Risk)
         </button>
      </div>
    </div>
    
    <div style="position: absolute; bottom: 40px; font-size: 11px; color: #4b5563; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em;">
      Autonomous AI Infrastructure: ACTIVE | SOC_LINK_READY
    </div>
  `;

  document.body.appendChild(overlay);
  
  // Handle Offensive Button Click
  document.getElementById("phishshield-offensive-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ 
      action: "LAUNCH_OFFENSIVE", 
      target: url 
    });
  });

  document.body.style.overflow = "hidden";
}
