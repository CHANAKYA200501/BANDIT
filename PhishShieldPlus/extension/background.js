const BACKEND_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/monitor";

// URL Scan Cache to avoid redundant requests
const scanCache = new Map();
let ws = null;

console.log("[PhishShield+] Extension Background Service Initialized.");

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => console.log("[PhishShield+] WebSocket Connected for realtime telemetry.");
  
  ws.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.url) {
        scanCache.set(data.url, data);
        persistScanCache(data.url, data);
        
        // Update HUD for any tabs matching this URL
        broadcastHUDUpdate(data.url, data);

        if (data.risk_level > 90) {
          handleHighRisk(data.url, data);
        } else if (data.risk_level >= 30) {
          handleElevatedRisk(data.url, data);
        }
      }
    } catch(e) {}
  };

  ws.onclose = () => {
    console.log("[PhishShield+] WebSocket disconnected, retrying...");
    setTimeout(connectWebSocket, 5000);
  };
}

connectWebSocket();

// ─── Persist threat event to storage log ──────────────────────────────────────
async function saveThreatLog(url, risk, reason) {
  return new Promise(resolve => {
    chrome.storage.local.get(['threatLog'], (result) => {
      const log = result.threatLog || [];
      log.push({ url, risk, reason, ts: Date.now() });
      // Keep last 50 entries
      const trimmed = log.slice(-50);
      chrome.storage.local.set({ threatLog: trimmed }, resolve);
    });
  });
}

// ─── Persist scan result to cache in storage ──────────────────────────────────
function persistScanCache(url, data) {
  chrome.storage.local.get(['scanCache'], (result) => {
    const cache = result.scanCache || {};
    cache[url] = data;
    // Keep cache size bounded (50 entries)
    const keys = Object.keys(cache);
    if (keys.length > 50) delete cache[keys[0]];
    chrome.storage.local.set({ scanCache: cache });
  });
}

async function handleHighRisk(url, data) {
  console.log("[PhishShield+] Critical threat detected. Engaging countermeasures for: " + url);
  
  const tabs = await chrome.tabs.query({});
  for (let tab of tabs) {
    if (tab.url && tab.url.includes(url)) {
      blockTab(tab.id, url, data);
    }
  }
  
  // Save to threat log
  await saveThreatLog(url, data.risk_level, data.reason || data.explanation?.explanation || 'Critical phishing threat detected.');

  // Instant Auto-Retaliation (Poison Pill)
  try {
    await fetch(`${BACKEND_URL}/offensive-poison`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_url: url, injection_count: 500 })
    });
  } catch(e) {}

  // System notification
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "🚨 PhishShield+: ATTACK NEUTRALIZED",
    message: `Critical threat at ${url.slice(0, 60)}. Poison Pill deployed.`,
    priority: 2
  });
}

// ─── Alert for moderate & high risk (non-blocking toast) ─────────────────────
async function handleElevatedRisk(url, data) {
  const risk = data.risk_level;
  if (risk < 30) return; // Safe, no alert needed

  // Save to threat log
  await saveThreatLog(url, risk, data.reason || 'Suspicious activity detected.');

  const tabs = await chrome.tabs.query({});
  for (let tab of tabs) {
    if (tab.url && (tab.url === url || tab.url.includes(new URL(url).hostname))) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'SHOW_ALERT',
        url,
        risk,
        reason: data.reason || data.explanation?.explanation || 'Suspicious signals detected on this page.',
        explanation: data.explanation || {},
        tactics: data.explanation?.tactics_detected || []
      }).catch(() => {});
    }
  }

  // System notification only for high risk (not critical, as blockTab handles those)
  if (risk >= 70 && risk < 90) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "⚠️ PhishShield+: High Risk Detected",
      message: `Risk ${risk}% at ${url.slice(0, 60)}. Proceed with caution.`,
      priority: 1
    });
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && (changeInfo.url.startsWith("http://") || changeInfo.url.startsWith("https://"))) {
    const url = changeInfo.url;
    
    if (url.includes("localhost") || url.includes("127.0.0.1") || url.startsWith("chrome://")) return;

    // Check cache
    if (scanCache.has(url)) {
      const cached = scanCache.get(url);
      sendHUDUpdate(tabId, url, cached);
      if (cached.risk_level > 90) {
        blockTab(tabId, url, cached);
      }
      return;
    }

    console.log(`[PhishShield+] Forensic Analysis: ${url}`);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(url);
    } else {
      try {
        const response = await fetch(`${BACKEND_URL}/scan-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        data.url = url;
        scanCache.set(url, data);
        persistScanCache(url, data);

        sendHUDUpdate(tabId, url, data);

        if (data.risk_level > 90) {
          handleHighRisk(url, data);
        } else if (data.risk_level >= 30) {
          handleElevatedRisk(url, data);
        }
      } catch (error) {
        console.warn("[PhishShield+] Logic Core Unreachable:", error);
      }
    }
  }
});

// Handle Telemetry Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "LAUNCH_OFFENSIVE") {
    const url = `http://localhost:3001/#/offensive?target=${encodeURIComponent(request.target)}`;
    chrome.tabs.create({ url });
  }

  // Popup requests a fresh scan or cached result
  if (request.action === "POPUP_SCAN_REQUEST") {
    const cached = scanCache.get(request.url);
    if (cached) {
      sendResponse(cached);
      return true;
    }
    // Trigger a live scan
    fetch(`${BACKEND_URL}/scan-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: request.url })
    })
    .then(r => r.json())
    .then(data => {
      data.url = request.url;
      scanCache.set(request.url, data);
      persistScanCache(request.url, data);
      sendResponse(data);
    })
    .catch(() => sendResponse({}));
    return true; // Keep message channel open for async response
  }
});

async function broadcastHUDUpdate(url, data) {
  const tabs = await chrome.tabs.query({});
  for (let tab of tabs) {
    if (tab.url && tab.url.includes(url)) {
      sendHUDUpdate(tab.id, url, data);
    }
  }
}

function sendHUDUpdate(tabId, url, forensicData) {
  chrome.tabs.sendMessage(tabId, {
    action: "UPDATE_HUD",
    url: url,
    risk: forensicData.risk_level,
    reason: forensicData.reason,
    explanation: forensicData.explanation || {}
  }).catch(() => {}); // Ignore errors for tabs without content scripts
}

function blockTab(tabId, url, forensicData) {
  chrome.tabs.sendMessage(tabId, {
    action: "BLOCK_PAGE",
    url: url,
    risk: forensicData.risk_level,
    reason: forensicData.reason || forensicData.explanation?.explanation || "High-confidence phishing detection triggered by autonomous AI agent.",
    tactics: forensicData.explanation?.tactics_detected || [],
    severity: forensicData.explanation?.severity || "critical"
  }).catch(() => {});
}
