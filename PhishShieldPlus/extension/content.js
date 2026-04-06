chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "KILL_SWITCH") {
    injectKillSwitchOverlay(msg.risk);
    disableAllInputs();
  }
});

function injectKillSwitchOverlay(risk) {
  if (document.getElementById("ps-kill-switch")) return;

  const overlay = document.createElement("div");
  overlay.id = "ps-kill-switch";
  overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(226,75,74,0.95);z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;color:white;backdrop-filter:blur(10px);";
  
  overlay.innerHTML = `
    <div style="text-align:center;max-width:600px;padding:40px;background:#1a1a1a;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:2px solid #ff4444;">
      <div style="font-size:48px;margin-bottom:20px;">🛡️</div>
      <h1 style="font-size:28px;margin:0 0 10px 0;font-weight:bold;">PhishShield+ Blocked This Page</h1>
      <p style="font-size:18px;margin:0 0 30px 0;opacity:0.9;">
        Risk score: <strong>${risk}%</strong> — Possible phishing site detected
      </p>
      <div style="background:#2a2a2a;padding:15px;border-radius:8px;font-size:14px;color:#aaa;margin-bottom:30px;">
        This threat has been automatically logged to the Polygon blockchain for forensic analysis.
      </div>
      <button id="ps-proceed-anyway" style="background:transparent;border:1px solid #ff4444;color:#ff4444;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;transition:0.2s;">
        Proceed anyway (not recommended)
      </button>
    </div>
  `;
  
  document.body.prepend(overlay);

  document.getElementById("ps-proceed-anyway").addEventListener("click", () => {
    overlay.remove();
    enableInputs();
  });
}

function disableAllInputs() {
  document.querySelectorAll("input,textarea,select,button:not(#ps-proceed-anyway)")
    .forEach(el => { el.disabled = true; el.dataset.psDisabled = "1"; });
}

function enableInputs() {
  document.querySelectorAll("[data-ps-disabled]")
    .forEach(el => { el.disabled = false; delete el.dataset.psDisabled; });
}
