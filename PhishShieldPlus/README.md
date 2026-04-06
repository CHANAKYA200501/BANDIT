# PhishShield+ MVP

PhishShield+ is an autonomous, real-time AI-powered cybersecurity platform featuring 3D threat visualization, blockchain logging, and an immersive Chrome extension kill-switch.

## Features
- **3D Intelligence Hub**: Real-time visualization with Threat Particles and NeuralShield.
- **Blockchain Logging**: Immutable, tamper-proof logs of phishing threats on Polygon Mumbai.
- **AI/ML Pipeline**: URL and NLP text classifiers, plus GenAI logic.
- **Extension Kill-Switch**: Real-time DOM interception blocking 90%+ risk sites.

## Setup Instructions

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (for extension and frontend dev)
- Python 3.11

### 2. Environment Variables
A dummy `.env` has been generated for you. If you wish to use real keys (VirusTotal, AlienVault, HIBP), populate them in the `.env` file at the root.

### 3. Run the Services
Use Docker Compose to bring up the backend, postgres database, redis broker, and celery workers:
```bash
docker-compose up --build -d
```
The backend API will run on `http://localhost:8000`.

### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
The dashboard will run on `http://localhost:3000`.

### 5. Load the Chrome Extension
1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `extension` folder in this repository.

## Architecture

- **Backend**: FastAPI, Celery, Redis, PostgreSQL, Socket.IO
- **Frontend**: React 18, Vite, Three.js, React Three Fiber
- **Contracts**: Hardhat, Solidity
- **Extension**: Chrome Manifest V3
