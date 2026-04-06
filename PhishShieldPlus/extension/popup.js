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
}

document.addEventListener('DOMContentLoaded', init);
