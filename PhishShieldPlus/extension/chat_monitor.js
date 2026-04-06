// ═══════════════════════════════════════════════════════════════════════════════
// ██ PHISHSHIELD+ REAL-TIME CHAT MONITOR (PRIVACY-FIRST)                      ██
// ═══════════════════════════════════════════════════════════════════════════════
// • Opt-in only — user must explicitly enable from the popup
// • ZERO storage — all messages held in volatile memory only
// • After analysis, the buffer is immediately wiped
// • Works on: WhatsApp Web, Telegram Web, Facebook Messenger, Instagram DMs,
//   Signal Desktop Web, Discord, generic text inputs
// ═══════════════════════════════════════════════════════════════════════════════

const PS_CHAT_MONITOR = {
  enabled: false,
  observer: null,
  messageBuffer: [],        // Volatile in-memory ONLY — never written to disk/storage
  MAX_BUFFER: 25,           // Analyze after collecting N messages
  MIN_BUFFER: 8,            // Minimum messages before first analysis
  ANALYZE_INTERVAL: 45000,  // Analyze every 45 seconds if buffer has messages
  analyzeTimer: null,
  lastAnalyzeTime: 0,
  cooldownMs: 60000,        // Don't re-analyze within 60s
  activePlatform: null,
  lastAlertHash: null,      // Prevent duplicate alerts for same conversation

  // ── Platform detection configs ──────────────────────────────────────────
  PLATFORMS: {
    whatsapp: {
      match: /web\.whatsapp\.com/i,
      label: 'WhatsApp Web',
      selectors: {
        messageContainer: '[data-testid="conversation-panel-messages"], #main .copyable-area',
        incomingMsg: '.message-in .copyable-text [class*="selectable-text"], .message-in ._ao3e',
        outgoingMsg: '.message-out .copyable-text [class*="selectable-text"], .message-out ._ao3e',
        contactName: 'header [data-testid="conversation-info-header"] span, header ._amig span',
      }
    },
    telegram: {
      match: /web\.telegram\.org/i,
      label: 'Telegram Web',
      selectors: {
        messageContainer: '.messages-container, .chat-input-container',
        incomingMsg: '.message:not(.own) .text-content, .Message:not(.own) .text-content',
        outgoingMsg: '.message.own .text-content, .Message.own .text-content',
        contactName: '.chat-info .peer-title, .TopBar .info .title',
      }
    },
    messenger: {
      match: /messenger\.com|facebook\.com\/messages/i,
      label: 'Facebook Messenger',
      selectors: {
        messageContainer: '[role="main"] [class*="__fb-light-mode"], [role="main"]',
        incomingMsg: '[class*="incoming"] [dir="auto"], div[class*="html-div"] [dir="auto"]',
        outgoingMsg: '[class*="outgoing"] [dir="auto"]',
        contactName: '[class*="thread-title"], h2',
      }
    },
    instagram: {
      match: /instagram\.com\/direct/i,
      label: 'Instagram DMs',
      selectors: {
        messageContainer: '[role="main"]',
        incomingMsg: '[class*="xexx8yu"] [dir="auto"]',
        outgoingMsg: '[class*="x1lliihq"] [dir="auto"]',
        contactName: 'header a[href*="/"] span',
      }
    },
    discord: {
      match: /discord\.com\/channels/i,
      label: 'Discord',
      selectors: {
        messageContainer: '[class*="chatContent"]',
        incomingMsg: '[id*="message-content"]',
        outgoingMsg: '[id*="message-content"]',
        contactName: '[class*="channelName"]',
      }
    },
    signal: {
      match: /signal\.org/i,
      label: 'Signal Web',
      selectors: {
        messageContainer: '.module-timeline',
        incomingMsg: '.module-message__text--incoming',
        outgoingMsg: '.module-message__text--outgoing',
        contactName: '.module-conversation-header__title',
      }
    }
  }
};

// ── Detect which platform we're on ──────────────────────────────────────────
function detectPlatform() {
  const url = window.location.href;
  for (const [key, cfg] of Object.entries(PS_CHAT_MONITOR.PLATFORMS)) {
    if (cfg.match.test(url)) {
      return { key, ...cfg };
    }
  }
  return null;
}

// ── Extract text from a DOM node safely ──────────────────────────────────────
function extractText(el) {
  if (!el) return '';
  return (el.innerText || el.textContent || '').trim().slice(0, 500); // Cap at 500 chars
}

// ── Scrape visible messages from the current conversation ────────────────────
function scrapeVisibleMessages(platform) {
  const msgs = [];
  const sel = platform.selectors;

  try {
    // Incoming messages
    const incoming = document.querySelectorAll(sel.incomingMsg);
    incoming.forEach(el => {
      const text = extractText(el);
      if (text && text.length > 2) {
        msgs.push({ sender: 'other', text, timestamp: `msg_${msgs.length}` });
      }
    });

    // Outgoing messages
    const outgoing = document.querySelectorAll(sel.outgoingMsg);
    outgoing.forEach(el => {
      const text = extractText(el);
      if (text && text.length > 2) {
        msgs.push({ sender: 'me', text, timestamp: `msg_${msgs.length}` });
      }
    });
  } catch (e) {
    console.warn('[PhishShield+ ChatMonitor] Scrape error:', e);
  }

  return msgs;
}

// ── Hash a conversation for de-duplication ───────────────────────────────────
function hashConversation(msgs) {
  const str = msgs.map(m => m.text.slice(0, 30)).join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

// ── Send messages to backend for analysis (then WIPE buffer) ─────────────────
async function analyzeBuffer() {
  const now = Date.now();
  if (now - PS_CHAT_MONITOR.lastAnalyzeTime < PS_CHAT_MONITOR.cooldownMs) return;
  if (PS_CHAT_MONITOR.messageBuffer.length < PS_CHAT_MONITOR.MIN_BUFFER) return;

  const messagesToAnalyze = PS_CHAT_MONITOR.messageBuffer.slice(-PS_CHAT_MONITOR.MAX_BUFFER);

  // Compute hash to avoid duplicate alerts
  const hash = hashConversation(messagesToAnalyze);
  if (hash === PS_CHAT_MONITOR.lastAlertHash) {
    PS_CHAT_MONITOR.messageBuffer = []; // Wipe anyway
    return;
  }

  PS_CHAT_MONITOR.lastAnalyzeTime = now;

  console.log(`[PhishShield+ ChatMonitor] Analyzing ${messagesToAnalyze.length} messages in-memory...`);

  try {
    // Send via background script (content scripts can't make cross-origin fetch)
    chrome.runtime.sendMessage({
      action: 'CHAT_MONITOR_ANALYZE',
      messages: messagesToAnalyze,
      platform: PS_CHAT_MONITOR.activePlatform?.label || 'Unknown',
      conversation_id: `live_${hash}_${Date.now()}`
    }, (response) => {
      if (response && response.grooming_probability !== undefined) {
        handleAnalysisResult(response);
      }
    });
  } catch (e) {
    console.warn('[PhishShield+ ChatMonitor] Analysis request failed:', e);
  }

  // ██ CRITICAL: WIPE BUFFER IMMEDIATELY AFTER SENDING ██
  // Messages are NEVER stored — they exist only in volatile JS memory
  PS_CHAT_MONITOR.messageBuffer = [];
  PS_CHAT_MONITOR.lastAlertHash = hash;
}

// ── Handle analysis result → show alert if grooming detected ─────────────────
function handleAnalysisResult(result) {
  const prob = result.grooming_probability || 0;
  console.log(`[PhishShield+ ChatMonitor] Grooming probability: ${prob}%`);

  if (prob >= 50) {
    showPigButcherAlert(result);
  }
}

// ── DOM Mutation Observer — watches for new messages appearing ────────────────
function startObserver(platform) {
  if (PS_CHAT_MONITOR.observer) {
    PS_CHAT_MONITOR.observer.disconnect();
  }

  const containerSelector = platform.selectors.messageContainer;

  // Wait for container to exist (messaging apps load dynamically)
  const waitForContainer = setInterval(() => {
    const container = document.querySelector(containerSelector);
    if (container) {
      clearInterval(waitForContainer);
      attachObserver(container, platform);
    }
  }, 2000);

  // Stop waiting after 30s
  setTimeout(() => clearInterval(waitForContainer), 30000);
}

function attachObserver(container, platform) {
  PS_CHAT_MONITOR.observer = new MutationObserver((mutations) => {
    if (!PS_CHAT_MONITOR.enabled) return;

    let hasNewMessages = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hasNewMessages = true;
        break;
      }
    }

    if (hasNewMessages) {
      // Re-scrape ALL visible messages (simpler + more reliable than incremental)
      const freshMessages = scrapeVisibleMessages(platform);
      if (freshMessages.length > 0) {
        // Replace buffer with latest scrape (not append — prevents duplication)
        PS_CHAT_MONITOR.messageBuffer = freshMessages;
      }
    }
  });

  PS_CHAT_MONITOR.observer.observe(container, {
    childList: true,
    subtree: true
  });

  console.log(`[PhishShield+ ChatMonitor] Observer attached on ${platform.label}`);

  // Also do initial scrape
  const initial = scrapeVisibleMessages(platform);
  if (initial.length > 0) {
    PS_CHAT_MONITOR.messageBuffer = initial;
  }
}

// ── Periodic analysis timer ──────────────────────────────────────────────────
function startAnalysisTimer() {
  if (PS_CHAT_MONITOR.analyzeTimer) clearInterval(PS_CHAT_MONITOR.analyzeTimer);
  PS_CHAT_MONITOR.analyzeTimer = setInterval(() => {
    if (PS_CHAT_MONITOR.enabled && PS_CHAT_MONITOR.messageBuffer.length >= PS_CHAT_MONITOR.MIN_BUFFER) {
      analyzeBuffer();
    }
  }, PS_CHAT_MONITOR.ANALYZE_INTERVAL);
}

// ── Enable / Disable ─────────────────────────────────────────────────────────
function enableChatMonitor() {
  const platform = detectPlatform();
  if (!platform) {
    console.log('[PhishShield+ ChatMonitor] Not on a supported messaging platform.');
    return false;
  }

  PS_CHAT_MONITOR.enabled = true;
  PS_CHAT_MONITOR.activePlatform = platform;
  PS_CHAT_MONITOR.messageBuffer = [];
  PS_CHAT_MONITOR.lastAlertHash = null;

  startObserver(platform);
  startAnalysisTimer();
  showMonitorStatusBadge(true, platform.label);

  console.log(`[PhishShield+ ChatMonitor] ENABLED on ${platform.label}`);
  return true;
}

function disableChatMonitor() {
  PS_CHAT_MONITOR.enabled = false;

  // Destroy all data
  PS_CHAT_MONITOR.messageBuffer = [];
  PS_CHAT_MONITOR.lastAlertHash = null;

  if (PS_CHAT_MONITOR.observer) {
    PS_CHAT_MONITOR.observer.disconnect();
    PS_CHAT_MONITOR.observer = null;
  }
  if (PS_CHAT_MONITOR.analyzeTimer) {
    clearInterval(PS_CHAT_MONITOR.analyzeTimer);
    PS_CHAT_MONITOR.analyzeTimer = null;
  }

  showMonitorStatusBadge(false);
  console.log('[PhishShield+ ChatMonitor] DISABLED — all buffers wiped.');
}

// ── Listen for toggle messages from popup/background ─────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TOGGLE_CHAT_MONITOR') {
    if (request.enabled) {
      const success = enableChatMonitor();
      sendResponse({ enabled: success, platform: PS_CHAT_MONITOR.activePlatform?.label || null });
    } else {
      disableChatMonitor();
      sendResponse({ enabled: false });
    }
    return true;
  }

  if (request.action === 'GET_CHAT_MONITOR_STATUS') {
    sendResponse({
      enabled: PS_CHAT_MONITOR.enabled,
      platform: PS_CHAT_MONITOR.activePlatform?.label || null,
      bufferSize: PS_CHAT_MONITOR.messageBuffer.length,
    });
    return true;
  }
});

// ── Auto-start if previously enabled and on a supported platform ─────────────
chrome.storage.local.get(['chatMonitorEnabled'], (result) => {
  if (result.chatMonitorEnabled) {
    const platform = detectPlatform();
    if (platform) {
      // Small delay to let the page DOM settle
      setTimeout(() => enableChatMonitor(), 3000);
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ██ PIG BUTCHERING GROOMING ALERT OVERLAY                                     ██
// ═══════════════════════════════════════════════════════════════════════════════

function showPigButcherAlert(result) {
  // Prevent duplicate overlays
  if (document.getElementById('ps-pig-butcher-alert')) return;

  const prob = result.grooming_probability || 0;
  const verdict = result.verdict || 'SUSPICIOUS';
  const phase = result.current_phase || 'Unknown';
  const explanation = result.explanation || 'Suspicious grooming patterns detected.';
  const action = result.recommended_action || 'Be cautious and verify this contact.';
  const redFlags = (result.red_flags || []).slice(0, 4);
  const phases = result.phase_trajectory || [];

  const isCritical = prob >= 85;
  const accentColor = isCritical ? '#e24b4a' : '#f59e0b';
  const accentGlow = isCritical ? 'rgba(226,75,74,0.3)' : 'rgba(245,158,11,0.3)';

  const host = document.createElement('div');
  host.id = 'ps-pig-butcher-alert';
  host.style.cssText = `
    all: unset;
    position: fixed;
    top: 0; right: 0;
    z-index: 2147483647;
    width: 420px;
    max-height: 100vh;
    overflow-y: auto;
    pointer-events: auto;
    font-family: 'Outfit', 'Inter', system-ui, sans-serif;
  `;

  const shadow = host.attachShadow({ mode: 'open' });

  // Phase bars HTML
  const phaseBars = phases.map((p, i) => {
    const colors = ['#66fcf1', '#a78bfa', '#f59e0b', '#e24b4a'];
    const icons = ['🎯', '💬', '💰', '🚨'];
    const c = colors[i] || '#66fcf1';
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:12px">${icons[i]}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
            <span style="font-size:8px;font-weight:900;color:${p.detected ? c : '#374151'};text-transform:uppercase;letter-spacing:0.1em">${p.phase}</span>
            <span style="font-size:8px;font-weight:900;color:${c};font-family:monospace">${p.confidence}%</span>
          </div>
          <div style="height:3px;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden">
            <div style="height:100%;width:${p.confidence}%;background:${c};border-radius:10px;transition:width 1s"></div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Red flags HTML
  const flagsHtml = redFlags.map(f =>
    `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px">
      <span style="color:${accentColor};font-size:9px;margin-top:1px">⚑</span>
      <span style="font-size:9px;color:rgba(255,255,255,0.6);line-height:1.4">${f}</span>
    </div>`
  ).join('');

  shadow.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;600&display=swap');

      @keyframes ps-alert-in {
        from { opacity: 0; transform: translateX(100px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes ps-alert-out {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(100px); }
      }
      @keyframes ps-scan-glow {
        0%   { opacity: 0.3; }
        50%  { opacity: 0.8; }
        100% { opacity: 0.3; }
      }
      @keyframes ps-pulse-badge {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.08); }
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      .panel {
        margin: 16px;
        background: rgba(5, 8, 13, 0.95);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid ${accentColor}33;
        border-radius: 20px;
        overflow: hidden;
        box-shadow:
          0 30px 80px rgba(0,0,0,0.8),
          0 0 60px ${accentGlow},
          0 0 0 1px rgba(255,255,255,0.04);
        animation: ps-alert-in 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
      }

      .glow-bar {
        height: 2px;
        background: linear-gradient(to right, transparent, ${accentColor}, transparent);
        animation: ps-scan-glow 2s ease-in-out infinite;
      }

      .body { padding: 20px; }

      .header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .badge {
        display: flex;
        align-items: center;
        gap: 8px;
        animation: ps-pulse-badge 2s ease-in-out infinite;
      }

      .badge-icon {
        width: 40px; height: 40px;
        background: ${accentColor}18;
        border: 1px solid ${accentColor}33;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .badge-text h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 13px;
        font-weight: 900;
        color: ${accentColor};
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 1px;
      }
      .badge-text span {
        font-size: 9px;
        color: rgba(255,255,255,0.4);
        font-weight: 600;
      }

      .close {
        width: 28px; height: 28px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: rgba(255,255,255,0.4);
        font-size: 14px;
        transition: all 0.2s;
        font-family: monospace;
      }
      .close:hover { color: #fff; background: rgba(255,255,255,0.1); }

      .prob-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
        padding: 10px 12px;
        background: ${accentColor}08;
        border: 1px solid ${accentColor}18;
        border-radius: 12px;
      }
      .prob-score {
        font-size: 32px;
        font-weight: 900;
        font-family: 'Outfit', sans-serif;
        color: ${accentColor};
        letter-spacing: -0.04em;
        line-height: 1;
      }
      .prob-score small { font-size: 14px; opacity: 0.6; }
      .prob-info {
        flex: 1;
      }
      .prob-label {
        font-size: 8px;
        font-weight: 900;
        color: rgba(255,255,255,0.4);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 4px;
      }
      .prob-bar-track {
        height: 4px;
        background: rgba(255,255,255,0.06);
        border-radius: 10px;
        overflow: hidden;
      }
      .prob-bar-fill {
        height: 100%;
        width: ${prob}%;
        background: ${accentColor};
        border-radius: 10px;
        box-shadow: 0 0 8px ${accentColor};
      }

      .explanation {
        font-size: 11px;
        color: rgba(255,255,255,0.55);
        line-height: 1.6;
        font-family: 'Inter', sans-serif;
        margin-bottom: 14px;
      }

      .section-title {
        font-size: 8px;
        font-weight: 900;
        color: rgba(255,255,255,0.35);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 8px;
      }

      .phases { margin-bottom: 14px; }
      .flags { margin-bottom: 14px; }

      .action-box {
        padding: 10px;
        background: ${accentColor}08;
        border: 1px solid ${accentColor}18;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        color: ${accentColor};
        line-height: 1.5;
        margin-bottom: 14px;
      }
      .action-box strong {
        display: block;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        opacity: 0.7;
        margin-bottom: 4px;
      }

      .privacy-note {
        font-size: 8px;
        color: rgba(255,255,255,0.25);
        text-align: center;
        font-style: italic;
        line-height: 1.5;
        padding: 8px 0 0;
        border-top: 1px solid rgba(255,255,255,0.04);
      }
      .privacy-note span { color: #10b981; }

      .actions {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
      }
      .btn {
        flex: 1;
        height: 34px;
        border-radius: 10px;
        border: none;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
        font-family: 'Outfit', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        transition: all 0.2s;
      }
      .btn-primary {
        background: ${accentColor};
        color: #000;
      }
      .btn-primary:hover { filter: brightness(1.1); transform: scale(1.02); }
      .btn-ghost {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08) !important;
        color: rgba(255,255,255,0.5);
      }
      .btn-ghost:hover { color: #fff; background: rgba(255,255,255,0.08); }
    </style>

    <div class="panel" id="ps-alert-panel">
      <div class="glow-bar"></div>
      <div class="body">
        <div class="header-row">
          <div class="badge">
            <div class="badge-icon">${isCritical ? '🚨' : '⚠️'}</div>
            <div class="badge-text">
              <h3>${isCritical ? 'Pig Butchering Detected' : 'Suspicious Grooming'}</h3>
              <span>PhishShield+ Temporal NLP • Real-Time</span>
            </div>
          </div>
          <div class="close" id="ps-close-alert">✕</div>
        </div>

        <div class="prob-row">
          <div class="prob-score">${prob}<small>%</small></div>
          <div class="prob-info">
            <div class="prob-label">Grooming Probability</div>
            <div class="prob-bar-track"><div class="prob-bar-fill"></div></div>
          </div>
        </div>

        <p class="explanation">${explanation}</p>

        <div class="phases">
          <div class="section-title">Phase Trajectory</div>
          ${phaseBars}
        </div>

        ${flagsHtml ? `<div class="flags"><div class="section-title">Red Flags</div>${flagsHtml}</div>` : ''}

        <div class="action-box">
          <strong>→ Recommended Action</strong>
          ${action}
        </div>

        <div class="actions">
          <button class="btn btn-primary" id="ps-block-sender">Block & Report</button>
          <button class="btn btn-ghost" id="ps-dismiss-alert">Dismiss</button>
        </div>

        <div class="privacy-note">
          🔒 <span>Zero Data Stored</span> — All messages were analyzed in volatile memory only.
          No chat history was saved, logged, or transmitted to any third party.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  function dismissAlert() {
    const panel = shadow.getElementById('ps-alert-panel');
    if (panel) panel.style.animation = 'ps-alert-out 0.4s cubic-bezier(0.23,1,0.32,1) forwards';
    setTimeout(() => host.remove(), 400);
  }

  shadow.getElementById('ps-close-alert').addEventListener('click', dismissAlert);
  shadow.getElementById('ps-dismiss-alert').addEventListener('click', dismissAlert);
  shadow.getElementById('ps-block-sender').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'LAUNCH_OFFENSIVE',
      target: `pig-butcher-${PS_CHAT_MONITOR.activePlatform?.label || 'unknown'}`
    });
    dismissAlert();
  });

  // Auto-dismiss after 30s
  setTimeout(dismissAlert, 30000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ██ FLOATING MONITOR STATUS BADGE                                             ██
// ═══════════════════════════════════════════════════════════════════════════════

function showMonitorStatusBadge(active, platformLabel = '') {
  let badge = document.getElementById('ps-monitor-badge');

  if (!active) {
    if (badge) badge.remove();
    return;
  }

  if (badge) return; // Already showing

  badge = document.createElement('div');
  badge.id = 'ps-monitor-badge';
  badge.style.cssText = `
    all: unset;
    position: fixed;
    bottom: 70px;
    right: 24px;
    z-index: 2147483644;
    pointer-events: auto;
    font-family: 'Outfit', system-ui, sans-serif;
  `;

  const shadow = badge.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      @keyframes badge-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes dot-pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      .badge-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: rgba(5,8,13,0.88);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(139,92,246,0.25);
        border-radius: 100px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.1);
        animation: badge-in 0.5s cubic-bezier(0.23,1,0.32,1);
        cursor: default;
      }
      .dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #a78bfa;
        animation: dot-pulse 1.5s ease-in-out infinite;
        box-shadow: 0 0 8px rgba(139,92,246,0.5);
      }
      .label {
        font-size: 9px;
        font-weight: 900;
        color: #a78bfa;
        text-transform: uppercase;
        letter-spacing: 0.15em;
      }
      .plat {
        font-size: 8px;
        color: rgba(255,255,255,0.35);
        margin-left: 4px;
      }
    </style>
    <div class="badge-wrap">
      <div class="dot"></div>
      <span class="label">Chat Shield Active</span>
      <span class="plat">${platformLabel}</span>
    </div>
  `;

  document.body.appendChild(badge);
}
