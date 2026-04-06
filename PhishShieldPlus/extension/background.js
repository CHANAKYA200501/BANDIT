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
        
        // Update HUD for any tabs matching this URL
        broadcastHUDUpdate(data.url, data);

        if (data.risk_level > 90) {
          handleHighRisk(data.url, data);
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

async function handleHighRisk(url, data) {
  console.log("[PhishShield+] Critical threat detected. Engaging countermeasures for: " + url);
  
  const tabs = await chrome.tabs.query({});
  for (let tab of tabs) {
    if (tab.url && tab.url.includes(url)) {
      blockTab(tab.id, url, data);
    }
  }
  
  // Instant Auto-Retaliation (Poison Pill)
  try {
    await fetch(`${BACKEND_URL}/offensive-poison`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_url: url, injection_count: 500 })
    });
  } catch(e) {}

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "PhishShield+: ATTACK NEUTRALIZED",
    message: `Intercepted payload at ${url}. Autonomous Poison Pill deployed instantly.`,
    priority: 2
  });
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

        sendHUDUpdate(tabId, url, data);

        if (data.risk_level > 90) {
          handleHighRisk(url, data);
        }
      } catch (error) {
        console.warn("[PhishShield+] Logic Core Unreachable:", error);
      }
    }
  }
});

// Launch center on icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// Handle Telemetry Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "LAUNCH_OFFENSIVE") {
    const url = `http://localhost:3001/#/offensive?target=${encodeURIComponent(request.target)}`;
    chrome.tabs.create({ url });
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
