<p align="center">
  <img src="extension/icon.png" width="120" alt="PhishShield+ Logo"/>
</p>

<h1 align="center">PhishShield+ &nbsp;🛡️</h1>
<h3 align="center">AI-Powered Anti-Phishing SOC Platform with Blockchain Audit Trail</h3>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini%20AI-v1beta-4285F4?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Polygon-Blockchain-8247E5?logo=polygon&logoColor=white" />
  <img src="https://img.shields.io/badge/Chrome%20Ext-MV3-4285F4?logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Dashboard Modules](#dashboard-modules)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Chrome Extension](#chrome-extension)
- [Smart Contract](#smart-contract)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**PhishShield+** is a full-stack, real-time Security Operations Center (SOC) platform designed to detect, analyze, and neutralize phishing attacks using AI heuristics, multi-source threat intelligence, and blockchain-backed forensic logging.

The platform operates across three surfaces:
1. **Chrome Extension (MV3)** — Real-time browser protection with URL scanning, DOM analysis, and chat monitoring
2. **SOC Dashboard** — 8-module mission control with 3D threat visualization, forensic tools, and offensive capabilities
3. **FastAPI Backend** — AI-powered analysis engine with Gemini integration, WebSocket telemetry, and Polygon blockchain audit trail

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Multi-Modal Scanning** | URL, text, transaction, and email breach analysis with 7+ intelligence sources |
| 🧠 **Gemini AI Engine** | Context-aware threat explanation, severity classification, and tactic detection |
| 🌐 **3D Threat Globe** | Real-time geospatial attack visualization using Three.js / React Three Fiber |
| 📡 **Live Telemetry** | WebSocket-powered real-time threat feed, kill-switch events, and stats |
| 🔗 **Blockchain Audit** | Immutable threat proofs logged to Polygon via Solidity smart contract |
| 🐷 **Pig Butchering NLP** | Temporal emotional analysis to detect multi-phase romance/crypto scam grooming patterns |
| 🕵️ **AiTM Detection** | Real network probing — TTFB, TLS certificate inspection, HSTS validation, hop counting |
| 🪤 **Boomerang Honeypot** | Active defense simulation — deploys canary KYC forms that beacon attacker identity |
| ⚔️ **Offensive Suite** | Credential poisoning engine that floods phishing forms with synthetic identities |
| 🔐 **Chrome Extension** | MV3 browser extension with real-time content script scanning and chat monitoring |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHROME EXTENSION (MV3)                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │background│  │ content.js   │  │   chat_monitor.js        │  │
│  │   .js    │──│ DOM Scanner  │  │ WhatsApp/Telegram/IG     │  │
│  └────┬─────┘  └──────────────┘  └──────────────────────────┘  │
│       │ WebSocket                                               │
└───────┼─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND (:8000)                       │
│                                                                 │
│  ┌───────────┐  ┌───────────────┐  ┌─────────────────────┐    │
│  │ Threat    │  │ Gemini AI     │  │ Blockchain Logger   │    │
│  │ Intel     │  │ Analyzer      │  │ (Polygon/Web3)      │    │
│  │ Pipeline  │  │ (Gemini 1.5)  │  │                     │    │
│  └───────────┘  └───────────────┘  └─────────────────────┘    │
│                                                                 │
│  ┌───────────┐  ┌───────────────┐  ┌─────────────────────┐    │
│  │ Socket.IO │  │ Pig Butcher   │  │ AiTM Probe          │    │
│  │ Realtime  │  │ NLP Engine    │  │ (TLS/TTFB/HSTS)     │    │
│  └───────────┘  └───────────────┘  └─────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               SQLite / PostgreSQL                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 REACT SOC DASHBOARD (:3000)                     │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │OpsCenter │  │ Scanner  │  │Offensive │  │ Audit Ledger │  │
│  │ + Globe  │  │ Lab      │  │ Suite    │  │ (Blockchain) │  │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────────┤  │
│  │AiTM      │  │PigButcher│  │Honeypot  │  │ Settings     │  │
│  │Detector  │  │NLP       │  │Boomerang │  │ Config       │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | Component framework |
| Vite 5 | Build tool & dev server |
| Tailwind CSS 3 | Utility-first styling |
| Three.js + R3F | 3D globe visualization |
| Framer Motion | Animations & transitions |
| Zustand | Global state management |
| Socket.IO Client | Real-time WebSocket events |
| Recharts | Data visualization charts |
| Ethers.js | Blockchain interaction |
| Lucide React | Icon system |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Async REST API framework |
| Uvicorn | ASGI server |
| Python Socket.IO | Real-time bidirectional events |
| SQLAlchemy | ORM & database abstraction |
| Web3.py | Polygon blockchain integration |
| Google Gemini AI | LLM-powered threat analysis |
| aiohttp | Async HTTP for probing & intel |
| Faker | Synthetic identity generation |
| scikit-learn | ML model for anomaly detection |
| spaCy | NLP processing |

### Blockchain
| Technology | Purpose |
|------------|---------|
| Solidity ^0.8.0 | Smart contract language |
| Hardhat | Contract development & testing |
| Polygon (Amoy) | L2 deployment target |

---

## Project Structure

```
PhishShieldPlus/
├── backend/                    # FastAPI backend server
│   ├── app/
│   │   ├── main.py            # All API routes & Socket.IO events
│   │   ├── database.py        # SQLAlchemy DB engine & session
│   │   ├── models.py          # ThreatLog ORM model
│   │   └── services/
│   │       ├── ai_analyzer.py       # Gemini AI integration
│   │       └── threat_intelligence.py # Multi-source OSINT pipeline
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React SOC Dashboard
│   ├── src/
│   │   ├── App.jsx            # Router & layout shell
│   │   ├── index.css          # Global design system
│   │   ├── pages/
│   │   │   ├── OpsCenter.jsx          # 3D Globe + Intelligence Grid
│   │   │   ├── Scanner.jsx            # Multi-mode URL/Text/Tx scanner
│   │   │   ├── OffensiveSuite.jsx     # Credential poisoning engine
│   │   │   ├── AuditLedger.jsx        # Blockchain forensic ledger
│   │   │   ├── AiTMDetector.jsx       # AiTM proxy detection + probing
│   │   │   ├── PigButcherDetector.jsx # Temporal NLP grooming detector
│   │   │   ├── BoomerangHoneypot.jsx  # Active defense honeypot
│   │   │   └── Settings.jsx          # Global SOC configuration
│   │   ├── components/
│   │   │   ├── Navigation/Sidebar.jsx
│   │   │   ├── Scene3D/Globe.jsx      # Three.js 3D globe
│   │   │   └── Layout/TopBar.jsx
│   │   └── store/
│   │       └── threatStore.js         # Zustand global state
│   ├── package.json
│   └── vite.config.js
│
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json          # MV3 config with permissions
│   ├── background.js          # Service worker — WebSocket bridge
│   ├── content.js             # DOM scanner & URL interceptor
│   ├── chat_monitor.js        # WhatsApp/Telegram/IG chat parser
│   ├── popup.html             # Extension popup UI
│   ├── popup.js               # Popup logic & scan controls
│   └── icon.png               # Extension icon
│
├── contracts/                  # Blockchain smart contracts
│   ├── contracts/
│   │   └── PhishShieldLog.sol # Immutable threat audit trail
│   ├── scripts/
│   │   └── deploy.js          # Hardhat deployment script
│   └── hardhat.config.cjs
│
├── ml/                        # Machine Learning models
│   ├── train_url_classifier.py    # URL-based phishing classifier
│   └── train_nlp_classifier.py    # NLP text classifier
│
├── docker-compose.yml         # Full stack orchestration
├── .env                       # Environment variables (git-ignored)
└── README.md                  # ← You are here
```

---

## Dashboard Modules

### 1. 🌐 Ops Center (`/ops`)
Real-time mission control with an interactive 3D globe showing live attack origins. Features geospatial focus tracking, threat intelligence grid, and synchronized telemetry from all scanning engines.

### 2. 🔬 Forensic Lab (`/scanner`)
Multi-modal threat scanner supporting 4 analysis types:
- **Remote Origin Scan** — Full URL analysis with 7+ OSINT sources
- **Payload Analysis** — Text content inspection for phishing patterns
- **Transaction Anomaly** — IsolationForest-based financial fraud detection
- **Breach Recon** — Email exposure check across known breaches

### 3. ⚔️ Offensive Suite (`/offensive`)
Active counterstrike module that floods phishing infrastructure with synthetic credentials (names, emails, passwords, OTPs) generated by Faker. Poisons attacker databases and renders stolen data useless.

### 4. 📋 Audit Ledger (`/ledger`)
Blockchain-backed forensic evidence chain. Every threat detection is hashed and logged as an immutable proof on Polygon. Features search, filter, sort, and direct links to PolygonScan for verification.

### 5. 🛡️ AiTM Detector (`/aitm`)
Adversary-in-the-Middle proxy detection using real network probing:
- Time-to-First-Byte (TTFB) latency analysis
- TLS certificate deep inspection (issuer, SANs, self-signed detection)
- HSTS header validation
- Network hop estimation
- Domain heuristic scoring

### 6. 🐷 Pig Butchering Detector (`/pig-butcher`)
Temporal Emotional NLP engine that analyzes full conversation trajectories (not single messages) to detect the 4-phase pig butchering grooming pattern:
1. **The Hook** — "Wrong number" initial contact
2. **Rapport Building** — Emotional bonding
3. **Lifestyle Flex** — Wealth signaling
4. **Financial Exploitation** — Investment pressure

### 7. 🪤 Boomerang Honeypot (`/honeypot`)
Active defense simulation with a dual-panel interface:
- **Left Panel** — Convincing fake KYC portal that captures attacker uploads
- **Right Panel** — Attacker's terminal view showing stolen data being beaconed back
- Deploys steganographic canary tokens in uploaded documents

### 8. ⚙️ Settings (`/settings`)
Global SOC configuration panel:
- Autonomous Kill Switch toggle
- Aggressive AiTM Detection mode
- AI Heuristic Model selector (Strict / Ensemble / Permissive)
- Global Intelligence Broadcast
- Strict HSTS Validation
- Ledger Retention period slider

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **npm** or **yarn**
- **pip** or **pipenv**

### 1. Clone the Repository

```bash
git clone https://github.com/CHANAKYA200501/BANDIT.git
cd BANDIT/PhishShieldPlus
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
pip install aiohttp faker certifi

# Start the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start the dev server
npm run dev
```

The dashboard will be available at **http://localhost:3000**

### 4. Docker (Full Stack)

```bash
# From project root
docker-compose up --build
```

This spins up all services: API, Celery worker, Celery beat, Redis, PostgreSQL, and the frontend.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# AI Engine
GEMINI_API_KEY=your_gemini_api_key

# Threat Intelligence APIs (optional — system degrades gracefully)
VIRUSTOTAL_API_KEY=your_vt_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
SHODAN_API_KEY=your_shodan_key
GOOGLE_SAFE_BROWSING_KEY=your_gsb_key

# Blockchain
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_wallet_private_key

# Database
DATABASE_URL=sqlite:///./phishshield.db
# For production: postgresql://user:pass@host:5432/phishshield

# Redis (for Celery workers)
REDIS_URL=redis://localhost:6379/0
```

---

## Chrome Extension

### Installation (Developer Mode)

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` directory
5. The PhishShield+ icon will appear in your toolbar

### Features

- **Real-time URL scanning** — Every page navigation is analyzed by the backend
- **DOM analysis** — Detects login forms, suspicious iframes, and credential harvesting patterns
- **Chat monitoring** — Parses WhatsApp Web, Telegram Web, and Instagram DMs for scam patterns
- **Kill Switch** — Automatically blocks pages with risk score > 90%
- **Popup dashboard** — Quick scan controls and threat summary

---

## Smart Contract

### PhishShieldLog.sol

Deployed on Polygon (Amoy testnet) — provides an immutable, tamper-proof audit trail for every threat detection.

```solidity
struct ThreatRecord {
    bytes32 inputHash;    // Keccak256 of the phishing URL/payload
    uint8   riskScore;    // 0-99 risk score
    string  threatType;   // "Credential Phishing", "AiTM Proxy", etc.
    uint256 timestamp;    // Block timestamp
    string  ipfsCID;      // Optional IPFS content identifier
    address reporter;     // SOC operator address
}
```

### Deploy

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/scan-url` | Full URL analysis with AI + OSINT pipeline |
| `POST` | `/scan-text` | Text content phishing detection |
| `POST` | `/scan-transaction` | Financial transaction anomaly detection |
| `POST` | `/probe-connection` | Real AiTM network probe (TTFB, TLS, HSTS) |
| `POST` | `/analyze-chat` | Pig butchering temporal NLP analysis |
| `POST` | `/breach-check` | Email breach reconnaissance |
| `POST` | `/log-to-chain` | Write threat proof to Polygon blockchain |
| `POST` | `/offensive/poison` | Launch credential poisoning campaign |
| `GET`  | `/init-data` | Hydrate frontend with historical data |
| `WS`   | `/ws/monitor` | Real-time WebSocket scan pipeline |
| `WS`   | `/socket.io` | Socket.IO telemetry stream |

---

## Screenshots

<p align="center">
  <em>SOC Dashboard — Ops Center with 3D Threat Globe</em>
</p>

> The dashboard features a cyberpunk-inspired design with real-time threat intelligence visualization, interactive 3D globe, and 8 specialized security modules.

---

## Threat Intelligence Sources

PhishShield+ aggregates intelligence from 7+ sources:

| Source | Data Provided |
|--------|---------------|
| VirusTotal | Multi-engine malware/phishing verdict |
| AbuseIPDB | IP reputation & abuse confidence score |
| Shodan | Open ports, services, & infrastructure data |
| URLScan.io | DOM hash, screenshot, & redirect analysis |
| Google Safe Browsing | Real-time phishing/malware blocklist |
| WHOIS | Domain registration age & registrar info |
| SSL Labs | TLS certificate grading & chain validation |
| Gemini AI | LLM-powered contextual threat explanation |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 🛡️ by <strong>PhishShield+ Team</strong>
</p>
