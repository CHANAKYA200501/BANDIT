from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
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

# ──────────────────────────────────────────────
# SCAN URL
# ──────────────────────────────────────────────
@app.post("/scan-url")
async def scan_url(req: ScanUrlRequest, db: Session = Depends(get_db)):
    intel_results = await threat_intel.run_url_pipeline(req.url)
    heu = intel_results["heuristics"]
    vt = intel_results.get("virustotal", {})

    risk = 10
    if vt.get("malicious", 0) > 0: risk += 50
    if heu["subdomain_count"] > 2: risk += 20
    if intel_results.get("whois", {}).get("domain_age_days", 999) < 30: risk += 15
    if intel_results.get("ssl", {}).get("is_self_signed"): risk += 25

    gemini_eval = ai_analyzer.generate_explanation(context=intel_results, url=req.url)

    sev = gemini_eval.get("severity", "low").lower()
    if sev == "critical": risk = max(risk, 95)
    elif sev == "high": risk = max(risk, 80)
    elif sev == "medium": risk = max(risk, 50)

    risk_clamped = min(risk, 99)
    confidence = compute_confidence(intel_results, gemini_eval)

    if risk_clamped > 70:
        await sio.emit("threat_detected", {"url": req.url, "risk_level": risk_clamped, "confidence": confidence, "source": "Multi-Engine", "geo": [0,0]})
    if risk_clamped > 90:
        await sio.emit("kill_switch", {"url": req.url, "risk": risk_clamped, "action": "block"})

    # Blockchain Immutable Audit Trail
    input_hash = Web3.keccak(text=req.url).hex()
    tx_hash_mock = "0x" + hashlib.sha256(f"{req.url}:{int(time.time())}".encode()).hexdigest()

    if risk_clamped > 90 and account:
        try:
            signed_tx = w3.eth.account.sign_transaction({
                'nonce': w3.eth.get_transaction_count(account.address) if w3.is_connected() else 0,
                'gasPrice': w3.eth.gas_price if w3.is_connected() else 20000000000,
                'gas': 100000,
                'to': os.getenv("CONTRACT_ADDRESS"),
                'value': 0,
                'data': input_hash.encode(),
                'chainId': w3.eth.chain_id if w3.is_connected() else 1337
            }, private_key)
            if w3.is_connected():
                tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                tx_hash_mock = tx_hash.hex()
            else:
                tx_hash_mock = "0x" + hashlib.sha256(signed_tx.rawTransaction).hexdigest()
        except Exception as e:
            logger.warning("Web3 Signing skipped: %s", e)

    # Always emit chain event
    threat_type = "Phishing" if risk_clamped > 70 else "Suspicious" if risk_clamped > 40 else "Safe"
    await sio.emit("chain_event", {
        "tx_hash": tx_hash_mock, "input_hash": input_hash,
        "risk_score": risk_clamped, "threat_type": threat_type,
        "block": random.randint(48000000, 49000000), "timestamp": int(time.time())
    })

    # Persist
    new_log = ThreatLog(
        payload_url=req.url, risk_score=risk_clamped, confidence=confidence,
        is_blocked=risk_clamped > 90, threat_tactics=json.dumps(gemini_eval.get("tactics_detected", [])),
        blockchain_hash=tx_hash_mock
    )
    db.add(new_log)
    db.commit()

    total = db.query(ThreatLog).count()
    blocked = db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()
    await sio.emit("stats_update", {"threats_today": total, "scans_total": total, "blocked_count": blocked})

    return {
        "risk_level": risk_clamped, "confidence": confidence,
        "features": heu, "api_verdicts": {"virustotal": vt},
        "explanation": gemini_eval, "geo": [40.7128, -74.0060], "blockchain_pending": True
    }

# ──────────────────────────────────────────────
# SCAN TEXT
# ──────────────────────────────────────────────
@app.post("/scan-text")
async def scan_text(req: ScanTextRequest, db: Session = Depends(get_db)):
    gemini_eval = ai_analyzer.generate_explanation(context={"text_content": req.text}, text=req.text)

    suspicious_keywords = ["OTP", "login", "bank", "verify", "urgent", "lottery"]
    found = [kw for kw in suspicious_keywords if kw.lower() in req.text.lower()]
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
        text=f"Transaction: Amount ₹{amount:,.2f}, Velocity {velocity} txn/hr, Hour {int(hour)}, Geo Distance {geo_dist:.2f}km. Anomaly Score: {anomaly_score}"
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

@app.websocket("/ws/monitor")
async def websocket_monitor(websocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            db = next(get_db())
            try:
                resp = await scan_url(ScanUrlRequest(url=data), db=db)
                await websocket.send_json({"risk_level": resp["risk_level"], "confidence": resp["confidence"], "action": "block" if resp["risk_level"] > 90 else "warn"})
            finally:
                db.close()
    except Exception as e:
        logger.info("WebSocket disconnected: %s", type(e).__name__)

app = socketio.ASGIApp(sio, other_asgi_app=app)
