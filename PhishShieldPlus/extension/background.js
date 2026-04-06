// Background Service Worker
let socketUrl = "ws://localhost:8000/ws/monitor";
let socket = null;

function connectWebsocket() {
  socket = new WebSocket(socketUrl);

  socket.onopen = () => {
    console.log("Connected to PhishShield+ Backend");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Verdict received:", data);
      
      if (data.action === "warn") {
        chrome.notifications.create({
          iconUrl: "icon.png", 
          title: "PhishShield+ Warning",
          message: `This site scored ${data.risk_level}% phishing risk`,
          type: "basic"
        });
      }
      
      if (data.action === "block" && data.risk_level >= 90 && data.url) {
        // Block natively via Chrome's intercept layer
        try {
          const urlObj = new URL(data.url);
          chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [{
              "id": Math.floor(Math.random() * 1000000) + 1,
              "priority": 1,
              "action": { "type": "block" },
              "condition": { "urlFilter": urlObj.hostname, "resourceTypes": ["main_frame"] }
            }],
            removeRuleIds: []
          });
        } catch (err) {}

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if(tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "KILL_SWITCH", risk: data.risk_level });
          }
        });
      }
    } catch (e) {}
  };

  socket.onclose = () => {
    setTimeout(connectWebsocket, 5000);
  };
}

// Start connection
connectWebsocket();

// Monitor navigation
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0 && socket && socket.readyState === WebSocket.OPEN) {
    if (details.url.startsWith("http")) {
      socket.send(details.url);
    }
  }
});
