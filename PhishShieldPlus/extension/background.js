const BACKEND_URL = "http://localhost:8000";

// URL Scan Cache to avoid redundant requests
const scanCache = new Map();

console.log("[PhishShield+] Extension Background Service Initialized.");

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && (changeInfo.url.startsWith("http://") || changeInfo.url.startsWith("https://"))) {
    const url = changeInfo.url;
    
    // Check cache
    if (scanCache.has(url)) {
      const cached = scanCache.get(url);
      if (cached.risk_level > 90) {
        blockTab(tabId, url, cached);
      }
      return;
    }

    console.log(`[PhishShield+] Forensic Analysis: ${url}`);
    
    try {
      const response = await fetch(`${BACKEND_URL}/scan-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      scanCache.set(url, data);

      if (data.risk_level > 90) {
        blockTab(tabId, url, data);
        
        // AGENTIC RESPONSE: Automatically launch SOC Dashboard for the analyst
        chrome.tabs.create({ url: chrome.runtime.getURL("index.html#/ops") });

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "PhishShield+: ATTACK NEUTRALIZED",
          message: `Intercepted malicious payload at ${url}. Engagement ready.`,
          priority: 2
        });
      }
    } catch (error) {
      console.warn("[PhishShield+] Logic Core Unreachable:", error);
    }
  }
});

// Launch center on icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// Handle Retaliation Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "LAUNCH_OFFENSIVE") {
    const url = chrome.runtime.getURL(`index.html#/offensive?target=${encodeURIComponent(request.target)}`);
    chrome.tabs.create({ url });
  }
});

function blockTab(tabId, url, forensicData) {
  chrome.tabs.sendMessage(tabId, {
    action: "BLOCK_PAGE",
    url: url,
    risk: forensicData.risk_level,
    reason: forensicData.explanation?.explanation || "High-confidence phishing detection triggered by AI engine."
  });
}
