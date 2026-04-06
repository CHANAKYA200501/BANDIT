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

  // ─── REAL-TIME CHAT MONITOR: Analyze conversation in-memory ────────────
  // NOTE: Messages are NEVER stored — they come from volatile content script
  // memory and are sent directly to the backend for analysis, then discarded.
  if (request.action === "CHAT_MONITOR_ANALYZE") {
    console.log(`[PhishShield+ ChatMonitor] Analyzing ${request.messages?.length || 0} messages from ${request.platform}`);

    fetch(`${BACKEND_URL}/analyze-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: request.messages,
        conversation_id: request.conversation_id || `live_${Date.now()}`
      })
    })
    .then(r => r.json())
    .then(result => {
      // If high grooming probability, fire system notification
      if (result.grooming_probability >= 85) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "🚨 PhishShield+: PIG BUTCHERING DETECTED",
          message: `${result.grooming_probability}% grooming probability detected on ${request.platform}. This conversation matches a known scam pattern.`,
          priority: 2
        });
      } else if (result.grooming_probability >= 50) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "⚠️ PhishShield+: Suspicious Chat Pattern",
          message: `${result.grooming_probability}% grooming indicators on ${request.platform}. Monitor this conversation carefully.`,
          priority: 1
        });
      }
      sendResponse(result);
    })
    .catch(err => {
      console.warn("[PhishShield+ ChatMonitor] Backend unreachable:", err);
      sendResponse({ grooming_probability: 0, error: "Backend unreachable" });
    });

    return true; // Keep channel open for async response
  }

  // ─── TOGGLE CHAT MONITOR (persists opt-in preference only) ─────────────
  if (request.action === "TOGGLE_CHAT_MONITOR_SETTING") {
    chrome.storage.local.set({ chatMonitorEnabled: request.enabled });
    // Forward toggle to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TOGGLE_CHAT_MONITOR',
          enabled: request.enabled
        }, (response) => {
          sendResponse(response || { enabled: request.enabled });
        });
      } else {
        sendResponse({ enabled: request.enabled });
      }
    });
    return true;
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
