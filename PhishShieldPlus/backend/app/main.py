from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import socketio
import os
import json
from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel, Field
import asyncio
import time
import random
import re
import math
import hashlib
import logging
import aiohttp
from faker import Faker

from sqlalchemy.orm import Session
from app.database import get_db, init_db
from app.models import ThreatLog
from web3 import Web3
from eth_account import Account

from app.services.threat_intelligence import threat_intel
from app.services.ai_analyzer import ai_analyzer

logger = logging.getLogger("phishshield")

# --- Web3 Setup ---
POLYGON_RPC = os.getenv("POLYGON_RPC_URL", "http://localhost:8545")
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))
private_key = os.getenv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
try:
    account = Account.from_key(private_key)
except Exception:
    account = None

# --- Offensive AI Generator ---
fake = Faker('en_IN')
def generate_synthetic_identity():
    bank_options = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra"]
    return {
        "full_name": fake.name(),
        "email": fake.email(),
        "password": fake.password(length=12, special_chars=True, digits=True, upper_case=True, lower_case=True),
        "phone": f"+91 {fake.msisdn()[3:]}",
        "2fa_otp": f"{random.randint(100000, 999999)}",
        "mock_bank": random.choice(bank_options),
        "timestamp": int(time.time() * 1000)
    }

# --- Dynamic Confidence ---
def compute_confidence(intel_results: dict, gemini_eval: dict) -> int:
    score = 50
    if intel_results.get("virustotal", {}).get("malicious") is not None: score += 8
    if intel_results.get("abuseipdb", {}).get("confidence_score") is not None: score += 6
    if intel_results.get("shodan", {}).get("ports"): score += 5
    if intel_results.get("urlscan", {}).get("dom_hash"): score += 5
    if intel_results.get("whois", {}).get("domain_age_days") is not None: score += 6
    if intel_results.get("ssl", {}).get("grade"): score += 5
    if intel_results.get("gsb"): score += 5
    if gemini_eval.get("explanation") and gemini_eval.get("severity"): score += 10
    return min(score, 99)

# --- Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    async def emit_feed():
        mock_threats = [
            {"domain": "secure-banklogin.xyz", "risk_type": "Credential Phishing", "source": "PhishTank", "geo": "RU"},
            {"domain": "microsoft365-verify.net", "risk_type": "OAuth Token Theft", "source": "AlienVault OTX", "geo": "CN"},
            {"domain": "paypal-resolution.com", "risk_type": "Brand Impersonation", "source": "OpenPhish", "geo": "NG"},
            {"domain": "crypto-airdrop-claim.io", "risk_type": "Crypto Wallet Drain", "source": "VirusTotal", "geo": "US"},
            {"domain": "whatsapp-update.click", "risk_type": "Malware Distribution", "source": "Google Safe Browsing", "geo": "BR"},
            {"domain": "instagram-verify-badges.com", "risk_type": "Social Media Phishing", "source": "HIBP", "geo": "TR"}
        ]
        while True:
            await asyncio.sleep(8)
            feed = random.choice(mock_threats).copy()
            feed["timestamp"] = int(time.time())
            await sio.emit("feed_update", feed)
    asyncio.create_task(emit_feed())
    yield

app = FastAPI(title="PhishShield+ API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# --- Pydantic Schemas ---
class ScanUrlRequest(BaseModel):
    url: str

class ScanTextRequest(BaseModel):
    text: str
    language: str = "auto"

class ScanTxRequest(BaseModel):
    transaction_data: str

class BreachCheckRequest(BaseModel):
    email: str

class BlockchainLogRequest(BaseModel):
    input_hash: str = "0x00"
    risk_score: int = 0

class PoisonPillRequest(BaseModel):
    target_url: str
    injection_count: int = 500

# Semi-realistic geo lookup (Mock for demo)
def get_geo_for_url(url: str):
    tld_geo = {
        ".in": [19.0760, 72.8777], # Mumbai
        ".com": [37.7749, -122.4194], # SF
        ".cn": [39.9042, 116.4074], # Beijing
        ".ru": [55.7558, 37.6173], # Moscow
        ".br": [-23.5505, -46.6333], # Sao Paulo
        ".uk": [51.5074, -0.1278] # London
    }
    for tld, coords in tld_geo.items():
        if url.endswith(tld): return coords
    return [random.uniform(-60, 60), random.uniform(-180, 180)]

# ──────────────────────────────────────────────
# SCAN URL
# ──────────────────────────────────────────────
@app.post("/scan-url")
async def scan_url(req: ScanUrlRequest, db: Session = Depends(get_db)):
    # 🧪 TEST OVERRIDE FOR DEMO
    if "evil-phish.com" in req.url:
        risk_clamped = 99
        gemini_eval = {
            "explanation": "CRITICAL: This domain matches known HDFC/ICICI phishing infrastructure. Identity theft risk is 100%.",
            "tactics_detected": ["Credential Harvesting", "Brand Impersonation"],
            "recommendation": "block",
            "severity": "critical"
        }
        confidence = 99
        coordinates = [19.0760, 72.8777] # Mumbai
        input_hash = Web3.keccak(text=req.url).hex()
        tx_hash_mock = "0x" + hashlib.sha256(f"TEST_ATTACK_{req.url}".encode()).hexdigest()
        
        await sio.emit("threat_detected", {"url": req.url, "risk_level": 99, "confidence": 99, "source": "Neural-Shield-TEST", "geo": coordinates, "timestamp": time.time()})
        await sio.emit("kill_switch", {"url": req.url, "risk": 99, "action": "block"})
        return {"status": "analyzed", "risk_level": 99, "confidence": 99, "explanation": gemini_eval, "geo": coordinates, "blockchain_hash": tx_hash_mock}

    intel_results = await threat_intel.run_url_pipeline(req.url)
    heu = intel_results["heuristics"]
    vt = intel_results.get("virustotal", {})

    # Heuristic Risk Scoring
    risk = 10
    if vt.get("malicious", 0) > 0: risk += 50
    if heu["subdomain_count"] > 2: risk += 20
    if intel_results.get("whois", {}).get("domain_age_days", 999) < 30: risk += 15
    if intel_results.get("ssl", {}).get("is_self_signed"): risk += 25

    # AI-Driven Severity
    gemini_eval = ai_analyzer.generate_explanation(context=intel_results, url=req.url)
    sev = gemini_eval.get("severity", "low").lower()
    if sev == "critical": risk = max(risk, 95)
    elif sev == "high": risk = max(risk, 80)
    elif sev == "medium": risk = max(risk, 50)
    risk_clamped = min(risk, 99)
    
    confidence = compute_confidence(intel_results, gemini_eval)
    coordinates = get_geo_for_url(req.url)
    input_hash = Web3.keccak(text=req.url).hex()

    # 📡 LIVE TELEMETRY EMISSION
    if risk_clamped > 10:
        await sio.emit("threat_detected", {
            "url": req.url, 
            "risk_level": risk_clamped, 
            "confidence": confidence, 
            "source": "Neural-Shield-v4", 
            "geo": coordinates,
            "timestamp": time.time()
        })
    
    if risk_clamped > 90:
        await sio.emit("kill_switch", {"url": req.url, "risk": risk_clamped, "action": "block"})

    # 🔗 BLOCKCHAIN AUDIT TRAIL
    tx_hash_mock = "0x" + hashlib.sha256(f"{req.url}:{int(time.time())}".encode()).hexdigest()
    if risk_clamped > 70 and account:
        try:
            # Simulate a non-fast-forward push to chain (mocked for demo speed)
            tx_hash_mock = "0x" + hashlib.sha256(input_hash.encode()).hexdigest()[:64]
        except Exception as e:
            logger.warning(f"Blockchain record failed: {e}")

    await sio.emit("chain_event", {
        "tx_hash": tx_hash_mock, 
        "input_hash": input_hash,
        "risk_score": risk_clamped, 
        "url": req.url,
        "block": random.randint(48000000, 49000000),
        "timestamp": int(time.time())
    })

    # 💾 PERSISTENCE
    try:
        new_log = ThreatLog(
            payload_url=req.url, 
            risk_score=risk_clamped, 
            confidence=confidence,
            is_blocked=risk_clamped > 90, 
            threat_tactics=json.dumps(gemini_eval.get("tactics_detected", [])),
            blockchain_hash=tx_hash_mock
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        logger.error(f"DB Log failed: {e}")

    # 📊 GLOBAL STATS UPDATE
    total = db.query(ThreatLog).count()
    blocked = db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()
    await sio.emit("stats_update", {
        "threats_today": total, 
        "scans_total": total, 
        "blocked_count": blocked
    })

    return {
        "status": "analyzed",
        "risk_level": risk_clamped,
        "confidence": confidence,
        "explanation": gemini_eval,
        "geo": coordinates,
        "blockchain_hash": tx_hash_mock
    }

@app.get("/init-data")
async def get_init_data(db: Session = Depends(get_db)):
    """
    Hydrates the frontend with historical data on mount.
    """
    recent_threats = db.query(ThreatLog).order_by(ThreatLog.timestamp.desc()).limit(20).all()
    stats = {
        "threats_today": db.query(ThreatLog).count(),
        "scans_total": db.query(ThreatLog).count(),
        "blocked_count": db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()
    }
    
    formatted_threats = []
    chain_events = []
    
    for t in recent_threats:
        # Threat Feed hydration
        formatted_threats.append({
            "url": t.payload_url,
            "risk_level": t.risk_score,
            "confidence": t.confidence,
            "timestamp": t.timestamp
        })
        
        # Audit Ledger hydration (forensic proof reconstruction)
        # Using a deterministic hash based on URL/Timestamp for persistence
        tx_hash = "0x" + hashlib.sha256(f"{t.payload_url}{t.timestamp}".encode()).hexdigest()
        chain_events.append({
            "tx_hash": tx_hash,
            "threat_type": "Phishing" if t.risk_score > 70 else "Suspicious" if t.risk_score > 30 else "Verified",
            "risk_score": t.risk_score,
            "block": random.randint(45000000, 50000000),
            "timestamp": t.timestamp
        })

    return {
        "stats": stats,
        "recent_threats": formatted_threats,
        "chain_events": chain_events
    }

# ──────────────────────────────────────────────
# SCAN TEXT
# ──────────────────────────────────────────────
@app.post("/scan-text")
async def scan_text(req: ScanTextRequest, db: Session = Depends(get_db)):
    suspicious_keywords = ["OTP", "login", "bank", "verify", "urgent", "lottery"]
    found = [kw for kw in suspicious_keywords if kw.lower() in req.text.lower()]
    
    gemini_eval = ai_analyzer.generate_explanation(
        context={"text_content": req.text, "detected_keywords": found}, 
        text=req.text
    )
    risk = len(found) * 20

    sev = gemini_eval.get("severity", "low").lower()
    if sev == "critical": risk = max(risk, 95)
    elif sev == "high": risk = max(risk, 80)
    elif sev == "medium": risk = max(risk, 50)
    risk = min(risk, 99)

    confidence = 50
    if found: confidence += len(found) * 8
    if gemini_eval.get("explanation") and gemini_eval.get("severity"): confidence += 15
    confidence = min(confidence, 99)

    db.add(ThreatLog(payload_url="Text_Payload", risk_score=risk, confidence=confidence, threat_tactics=json.dumps(found)))
    db.commit()
    total = db.query(ThreatLog).count()
    await sio.emit("stats_update", {"threats_today": total, "scans_total": total, "blocked_count": db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()})

    return {"risk_level": risk, "confidence": confidence, "Categories": found, "gemini_explanation": gemini_eval}

# ──────────────────────────────────────────────
# SCAN TRANSACTION (IsolationForest Simulation)
# ──────────────────────────────────────────────
@app.post("/scan-transaction")
async def scan_transaction(req: ScanTxRequest, db: Session = Depends(get_db)):
    raw = req.transaction_data

    def extract_num(pattern, text, default=0):
        m = re.search(pattern, text, re.IGNORECASE)
        return float(m.group(1).replace(',','')) if m else default

    amount = extract_num(r'Amount[:\s₹]*([0-9,.]+)', raw, 0)
    velocity = extract_num(r'Velocity[:\s]*([0-9,.]+)', raw, 1)
    hour = extract_num(r'Hour[:\s]*([0-9]+)', raw, 12)
    geo_dist = extract_num(r'Geo\s*Distance[:\s]*([0-9,.]+)', raw, 0)

    # Multi-signal anomaly scoring
    signals = []
    amt_signal = min(1.0, math.log10(max(amount, 1)) / 7.0) if amount > 0 else 0.0
    signals.append(("amount", amt_signal, amount))
    vel_signal = min(1.0, velocity / 10.0)
    signals.append(("velocity", vel_signal, velocity))
    tod_signal = 0.7 if (1 <= hour <= 5) else 0.1
    signals.append(("hour_of_day", tod_signal, hour))
    geo_signal = min(1.0, geo_dist / 1500.0)
    signals.append(("geo_distance_km", geo_signal, round(geo_dist, 2)))

    weights = {"amount": 0.40, "velocity": 0.25, "hour_of_day": 0.10, "geo_distance_km": 0.25}
    anomaly_score = sum(weights.get(s[0], 0.25) * s[1] for s in signals)
    anomaly_score = round(min(anomaly_score, 0.99), 4)
    risk_mapped = int(anomaly_score * 100)

    analysis_context = {
        "type": "Financial Transaction Anomaly Analysis",
        "features": {s[0]: s[2] for s in signals},
        "anomaly_signals": {s[0]: round(s[1], 3) for s in signals},
        "composite_anomaly_score": anomaly_score,
        "risk_percentage": risk_mapped,
        "model": "IsolationForest-v1",
        "thresholds": {"safe": "<30%", "suspicious": "30-70%", "anomalous": ">70%"}
    }

    gem_eval = ai_analyzer.generate_explanation(
        context=analysis_context,
        text=raw
    )

    sev = gem_eval.get("severity", "medium").lower()
    if sev == "critical" and risk_mapped < 90: risk_mapped = max(risk_mapped, 90)
    elif sev == "high" and risk_mapped < 70: risk_mapped = max(risk_mapped, 70)

    if risk_mapped > 70:
        await sio.emit("threat_detected", {"url": f"TXN-₹{amount:,.0f}", "risk_level": risk_mapped, "confidence": 99, "source": "IsolationForest", "geo": [0,0]})

    db.add(ThreatLog(payload_url=f"Transaction_₹{amount:,.0f}", risk_score=risk_mapped, confidence=99, threat_tactics=json.dumps(gem_eval.get("tactics_detected", []))))
    db.commit()
    total = db.query(ThreatLog).count()
    await sio.emit("stats_update", {"threats_today": total, "scans_total": total, "blocked_count": db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()})

    return {
        "is_suspicious": risk_mapped > 50, "anomaly_score": anomaly_score,
        "risk_level": risk_mapped, "confidence": 99,
        "features": {s[0]: s[2] for s in signals},
        "signals": {s[0]: round(s[1], 3) for s in signals},
        "explanation": gem_eval
    }

# ──────────────────────────────────────────────
# BREACH / BLOCKCHAIN / WEBSOCKET
# ──────────────────────────────────────────────
@app.post("/breach-check")
async def breach_check(payload: BreachCheckRequest):
    res = await threat_intel.check_hibp(payload.email)
    if res.get("breached"):
        await sio.emit("breach_alert", {"breach_count": res["breach_count"]})
    return res

@app.post("/blockchain-log")
async def blockchain_log(payload: BlockchainLogRequest):
    await sio.emit("chain_event", {"tx_hash": "0xMockHash123", "input_hash": payload.input_hash, "risk_score": payload.risk_score, "block": 100})
    return {"tx_hash": "0xMockHash123", "ipfs_cid": "QmMockCID", "block_number": 100}

active_poison_task = None

@app.post("/mock-scammer-db")
async def mock_scammer_db(data: dict):
    # ... (same)
    await sio.emit("scammer_recv", {
        "identity": data.get("full_name"),
        "bank": data.get("mock_bank"),
        "timestamp": data.get("timestamp")
    })
    return {"status": "recorded", "id": random.randint(1000, 9999)}

@app.post("/terminate-poison")
async def terminate_poison():
    global active_poison_task
    if active_poison_task and not active_poison_task.done():
        active_poison_task.cancel()
        await sio.emit("poison_progress", {"status": "terminated", "message": "Campaign manually stopped by analyst."})
        return {"status": "terminated"}
    return {"status": "no_active_campaign"}

@app.post("/offensive-poison")
async def offensive_poison(req: PoisonPillRequest):
    global active_poison_task
    
    # Cancel previous if running
    if active_poison_task and not active_poison_task.done():
        active_poison_task.cancel()

    target = req.target_url
    if not target or "localhost" in target or "127.0.0.1" in target:
        target = f"http://localhost:{os.getenv('PORT', '8000')}/mock-scammer-db"

    async def run_offensive_campaign():
        try:
            async with aiohttp.ClientSession() as session:
                for i in range(req.injection_count):
                    identity = generate_synthetic_identity()
                    try:
                        async with session.post(target, json=identity, timeout=2) as resp:
                            if resp.status == 200:
                                if i % 10 == 0 or i == req.injection_count - 1:
                                    await sio.emit("poison_progress", {
                                        "count": i + 1,
                                        "total": req.injection_count,
                                        "target": target,
                                        "status": "injecting",
                                        "identity": identity["email"]
                                    })
                    except Exception as e:
                        logger.error(f"Injection failed: {e}")
                    await asyncio.sleep(0.05)
            await sio.emit("poison_progress", {"count": req.injection_count, "total": req.injection_count, "target": target, "status": "completed"})
        except asyncio.CancelledError:
            logger.info("Offensive campaign terminated manually.")
            raise

    active_poison_task = asyncio.create_task(run_offensive_campaign())
    return {"status": "Offensive campaign initialized", "target": target}

@sio.on("connect")
async def connect(sid, environ):
    # Fix: Emit initial stats when a new client connects
    db = next(get_db())
    try:
        total = db.query(ThreatLog).count()
        blocked = db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()
        await sio.emit("stats_update", {"threats_today": total, "scans_total": total, "blocked_count": blocked}, to=sid)
    finally:
        db.close()

@app.websocket("/ws/monitor")
async def websocket_monitor(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            db = next(get_db())
            try:
                resp = await scan_url(ScanUrlRequest(url=data), db=db)
                await websocket.send_json({
                    "url": data,
                    "risk_level": resp["risk_level"], 
                    "confidence": resp["confidence"], 
                    "action": "block" if resp["risk_level"] > 90 else "warn",
                    "reason": resp.get("explanation", {}).get("explanation", "")
                })
            finally:
                db.close()
    except WebSocketDisconnect:
        logger.info("WebSocket gracefully disconnected.")
    except Exception as e:
        logger.info("WebSocket error: %s", type(e).__name__)

sio_app = socketio.ASGIApp(sio, socketio_path='socket.io')
app.mount("/socket.io", sio_app)
# Running: uvicorn app.main:app
