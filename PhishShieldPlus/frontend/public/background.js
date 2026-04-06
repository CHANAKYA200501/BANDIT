const BACKEND_URL = "http://localhost:8000";

// URL Scan Cache to avoid redundant requests
const scanCache = new Map();

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

    console.log(`[PhishShield+] Analyzing: ${url}`);
    
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
        
        // AGENTIC RESPONSE: Automatically open the SOC Dashboard in a full tab for the analyst
        chrome.tabs.create({ url: chrome.runtime.getURL("index.html#/ops") });

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "PhishShield+: CRITICAL THREAT INTERCEPTED",
          message: `Neutralizing ${url}. Dashboard launched for offensive engagement.`,
          priority: 2
        });
      }
    } catch (error) {
      console.warn("[PhishShield+] Backend scanning unavailable:", error);
    }
  }
});

// Allow opening the full dashboard by clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "LAUNCH_OFFENSIVE") {
    // Open the dashboard directly on the offensive page with target pre-filled
    const url = chrome.runtime.getURL(`index.html#/offensive?target=${encodeURIComponent(request.target)}`);
    chrome.tabs.create({ url });
  }
});

function blockTab(tabId, url, forensicData) {
  chrome.tabs.sendMessage(tabId, {
    action: "BLOCK_PAGE",
    url: url,
    risk: forensicData.risk_level,
    reason: forensicData.explanation?.explanation || "High-confidence phishing detection."
  });
}
