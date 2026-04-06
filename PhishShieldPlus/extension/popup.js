// ─── PhishShield+ Popup Controller ───────────────────────────────────────────

const RISK_COLORS = {
  safe:     '#10b981',  // green  — risk < 30
  moderate: '#f59e0b',  // amber  — risk 30–70
  high:     '#ef4444',  // red    — risk 70–90
  critical: '#e24b4a'   // deep red — risk > 90
};

function getRiskTier(risk) {
  if (risk < 30)  return { tier: 'safe',     label: 'SECURE',   color: RISK_COLORS.safe };
  if (risk < 70)  return { tier: 'moderate', label: 'MODERATE', color: RISK_COLORS.moderate };
  if (risk < 90)  return { tier: 'high',     label: 'HIGH',     color: RISK_COLORS.high };
  return                 { tier: 'critical', label: 'CRITICAL', color: RISK_COLORS.critical };
}

function truncateUrl(url, maxLen = 46) {
  if (!url || url.length <= maxLen) return url || '—';
  return url.slice(0, maxLen) + '…';
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── Render current page scan ─────────────────────────────────────────────────
function renderMeter(url, risk, reason) {
  const card   = document.getElementById('meterCard');
  const urlEl  = document.getElementById('currentUrl');
  const score  = document.getElementById('riskScore');
  const bar    = document.getElementById('riskBar');
  const reason_ = document.getElementById('reasonText');
  const scanBar = document.getElementById('scanningBar');

  urlEl.textContent = truncateUrl(url);

  if (risk === null || risk === undefined) {
    // Scanning state
    score.innerHTML = '—';
    bar.style.width = '0%';
    reason_.textContent = 'Analyzing threat vectors…';
    card.style.setProperty('--meter-color', '#66fcf1');
    return;
  }

  scanBar.style.display = 'none';

  const { label, color } = getRiskTier(risk);
  card.style.setProperty('--meter-color', color);
  score.innerHTML = `${risk}<span class="unit">%</span>`;
  bar.style.width = `${risk}%`;
  bar.style.background = color;
  bar.style.boxShadow  = `0 0 10px ${color}`;
  reason_.textContent = reason || 'No anomalies detected.';
}

// ─── Render threat history ────────────────────────────────────────────────────
function renderHistory(events) {
  const list = document.getElementById('historyList');
  if (!events || events.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        No threats recorded this session.
      </div>`;
    return;
  }

  list.innerHTML = events
    .slice()
    .reverse()
    .slice(0, 20)
    .map(e => {
      const { color, label } = getRiskTier(e.risk);
      return `
      <div class="history-item" data-url="${encodeURIComponent(e.url)}">
        <div class="hist-dot" style="background:${color}; box-shadow: 0 0 6px ${color};"></div>
        <div class="hist-content">
          <div class="hist-url">${truncateUrl(e.url, 38)}</div>
          <div class="hist-meta">
            <span class="hist-risk" style="color:${color}">${label} — ${e.risk}%</span>
            <span class="hist-time">${timeAgo(e.ts)}</span>
          </div>
        </div>
      </div>`;
    })
    .join('');
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function init() {
  // 1. Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
    renderMeter('chrome internal page', null, 'Extension not active on this page.');
  } else {
    renderMeter(tab.url, null, 'Analyzing…');

    // Check scan cache in background
    chrome.storage.local.get(['scanCache'], (result) => {
      const cache = result.scanCache || {};
      const cached = cache[tab.url];
      if (cached) {
        renderMeter(tab.url, cached.risk_level, cached.reason);
      } else {
        // Request fresh scan from background
        chrome.runtime.sendMessage({ action: 'POPUP_SCAN_REQUEST', url: tab.url }, (res) => {
          if (res && res.risk_level !== undefined) {
            renderMeter(tab.url, res.risk_level, res.reason);
          }
        });
      }
    });
  }

  // 2. Load history
  chrome.storage.local.get(['threatLog'], (result) => {
    renderHistory(result.threatLog || []);
  });

  // 3. Launch dashboard button
  document.getElementById('launchDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3001' });
    window.close();
  });

  // 4. Clear log
  document.getElementById('clearHistory').addEventListener('click', () => {
    chrome.storage.local.set({ threatLog: [] }, () => {
      renderHistory([]);
    });
  });

  // 5. Chat Monitor toggle
  initChatMonitor(tab);
}

// ─── Chat Monitor Toggle Logic ───────────────────────────────────────────────
function initChatMonitor(tab) {
  const toggle = document.getElementById('chatMonitorToggle');
  const card = document.getElementById('monitorCard');
  const statusEl = document.getElementById('monitorStatus');

  if (!toggle || !card || !statusEl) return;

  // Supported platform detection (popup-side for visual feedback)
  const SUPPORTED_PLATFORMS = [
    { match: /web\.whatsapp\.com/i, label: 'WhatsApp Web' },
    { match: /web\.telegram\.org/i, label: 'Telegram Web' },
    { match: /messenger\.com|facebook\.com\/messages/i, label: 'Messenger' },
    { match: /instagram\.com\/direct/i, label: 'Instagram DMs' },
    { match: /discord\.com\/channels/i, label: 'Discord' },
    { match: /signal\.org/i, label: 'Signal Web' },
  ];

  const tabUrl = tab?.url || '';
  const detectedPlatform = SUPPORTED_PLATFORMS.find(p => p.match.test(tabUrl));

  // Load saved preference
  chrome.storage.local.get(['chatMonitorEnabled'], (result) => {
    const savedEnabled = !!result.chatMonitorEnabled;
    toggle.checked = savedEnabled;

    if (savedEnabled && detectedPlatform) {
      card.classList.add('active');
    }

    // Also query the content script for live status
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'GET_CHAT_MONITOR_STATUS' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded — show platform info only
          updateMonitorStatus(statusEl, card, detectedPlatform, false, savedEnabled);
          return;
        }
        if (response) {
          updateMonitorStatus(statusEl, card, detectedPlatform, response.enabled, savedEnabled, response.platform, response.bufferSize);
          toggle.checked = response.enabled;
        }
      });
    } else {
      updateMonitorStatus(statusEl, card, detectedPlatform, false, savedEnabled);
    }
  });

  // Handle toggle change
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;

    chrome.runtime.sendMessage({
      action: 'TOGGLE_CHAT_MONITOR_SETTING',
      enabled
    }, (response) => {
      if (response) {
        const isActive = response.enabled;
        toggle.checked = isActive;

        if (isActive) {
          card.classList.add('active');
          const plat = response.platform || detectedPlatform?.label;
          if (plat) {
            statusEl.innerHTML = `<span class="platform-tag">● ${plat}</span> Monitoring active — analyzing conversation trajectory in real-time.`;
          } else {
            statusEl.textContent = 'Enabled but no supported messaging platform detected on this tab.';
          }
        } else {
          card.classList.remove('active');
          statusEl.textContent = 'Chat monitoring disabled. All memory buffers have been wiped.';
        }
      }
    });
  });
}

function updateMonitorStatus(statusEl, card, detectedPlatform, isLive, isSaved, livePlatform, bufferSize) {
  if (isLive && livePlatform) {
    card.classList.add('active');
    statusEl.innerHTML = `<span class="platform-tag">● ${livePlatform}</span> Actively monitoring — ${bufferSize || 0} messages in volatile buffer.`;
  } else if (isSaved && detectedPlatform) {
    card.classList.add('active');
    statusEl.innerHTML = `<span class="platform-tag">${detectedPlatform.label}</span> detected — monitoring will start when messages appear.`;
  } else if (detectedPlatform) {
    statusEl.innerHTML = `<span class="platform-tag">${detectedPlatform.label}</span> detected — toggle to enable real-time NLP monitoring.`;
  } else {
    statusEl.textContent = 'Navigate to WhatsApp Web, Telegram, Messenger, or Instagram DMs to use this feature.';
  }
}

document.addEventListener('DOMContentLoaded', init);

