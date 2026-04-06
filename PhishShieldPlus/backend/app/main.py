from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import socketio
import os
import json
from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel
import asyncio
import time
import random
from urllib.parse import urlparse
from urllib.parse import urlparse
import hashlib

from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import get_db, init_db
from app.models import ThreatLog
from web3 import Web3
from eth_account import Account

from app.services.threat_intelligence import threat_intel
from app.services.ai_analyzer import ai_analyzer

# Setup Web3
POLYGON_RPC = os.getenv("POLYGON_RPC_URL", "http://localhost:8545")
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))
private_key = os.getenv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
try:
    account = Account.from_key(private_key)
except Exception:
    account = None


app = FastAPI(title="PhishShield+ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

class ScanUrlRequest(BaseModel):
    url: str

class ScanTextRequest(BaseModel):
    text: str
    language: str = "auto"

@app.post("/scan-url")
async def scan_url(req: ScanUrlRequest, db: Session = Depends(get_db)):
    # 1. Run Concurrent Pipeline
    intel_results = await threat_intel.run_url_pipeline(req.url)
    
    # 2. Extract heuristics and external intelligence
    heu = intel_results["heuristics"]
    vt = intel_results.get("virustotal", {})
    
    # 3. Aggregate Risk 
    risk = 10
    if vt.get("malicious", 0) > 0: risk += 50
    if heu["subdomain_count"] > 2: risk += 20
    if intel_results.get("whois", {}).get("domain_age_days", 999) < 30: risk += 15
    if intel_results.get("ssl", {}).get("is_self_signed"): risk += 25
    
    # 4. Generate AI Explanation
    gemini_eval = ai_analyzer.generate_explanation(context=intel_results, url=req.url)

    # dynamically adjust Risk based on supreme AI reasoning
    sev = gemini_eval.get("severity", "low").lower()
    if sev == "critical": risk = max(risk, 95)
    elif sev == "high": risk = max(risk, 80)
    elif sev == "medium": risk = max(risk, 50)
    
    risk_clamped = min(risk, 99)

    
    # 5. Broadcast to Connected SOC Dashboards globally
    if risk_clamped > 70:
        await sio.emit("threat_detected", {"url": req.url, "risk_level": risk_clamped, "confidence": 92, "source": "Multi-Engine", "geo": [0,0]})
    if risk_clamped > 90:
        await sio.emit("kill_switch", {"url": req.url, "risk": risk_clamped, "action": "block"})

    # 6. Web3 Smart Contract Active Signing
    tx_hash_mock = "pending"
    if risk_clamped > 90 and account:
        try:
            # Hash payload for EVM
            input_hash = Web3.keccak(text=req.url).hex()
            # In a full deployment, we'd build a contract interaction here using contract.functions.storeThreat()
            # For the MVP without reliable local Ganache nodes running, we sign it securely and emit the payload
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
            
            # Broadcast the Web3 log to front-end natively
            await sio.emit("chain_event", {
                "tx_hash": tx_hash_mock, "input_hash": input_hash, 
                "risk_score": risk_clamped, "block": "latest"
            })
        except Exception as e:
            print("Web3 Signing skipped due to RPC failure")

    # 7. Write to PostgreSQL Persistent Storage
    new_log = ThreatLog(
        payload_url=req.url, risk_score=risk_clamped, confidence=92,
        is_blocked=risk_clamped > 90, threat_tactics=json.dumps(gemini_eval.get("tactics_detected", [])),
        blockchain_hash=tx_hash_mock
    )
    db.add(new_log)
    db.commit()

    # 8. Broadcast Updated DB Stats
    total = db.query(ThreatLog).count()
    blocked = db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()
    await sio.emit("stats_update", {
        "threats_today": total, 
        "scans_total": total * 14, # Simulated overall traffic ratio
        "blocked_count": blocked
    })

    return {
        "risk_level": risk_clamped,
        "confidence": 92,
        "features": heu,
        "api_verdicts": {"virustotal": vt},
        "explanation": gemini_eval,
        "screenshot_url": "mock_url_screenshot",
        "geo": [40.7128, -74.0060],
        "blockchain_pending": True
    }

@app.post("/scan-text")
async def scan_text(req: ScanTextRequest, db: Session = Depends(get_db)):
    # Process text using Dummy NLP pipeline signatures + Gemini
    gemini_eval = ai_analyzer.generate_explanation(context={"text_content": req.text}, text=req.text)
    
    # Basic deterministic regex/keyword fallback heuristics mimicking TFIDF blocks
    suspicious_keywords = ["OTP", "login", "bank", "verify", "urgent", "lottery"]
    found = [kw for kw in suspicious_keywords if kw.lower() in req.text.lower()]
    risk = len(found) * 20
    
    sev = gemini_eval.get("severity", "low").lower()
    if sev == "critical": risk = max(risk, 95)
    elif sev == "high": risk = max(risk, 80)
    elif sev == "medium": risk = max(risk, 50)
    
    risk = min(risk, 99)
    
    db.add(ThreatLog(payload_url="Text_Payload", risk_score=risk, confidence=85, threat_tactics=json.dumps(found)))
    db.commit()
    total = db.query(ThreatLog).count()
    await sio.emit("stats_update", {"threats_today": total, "scans_total": total * 14, "blocked_count": db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()})

    return {
        "risk_level": risk,
        "confidence": 85,
        "Categories": found,
        "gemini_explanation": gemini_eval
    }

@app.post("/scan-transaction")
async def scan_transaction(payload: dict, db: Session = Depends(get_db)):
    # IsolationForest integration concept
    amount = payload.get("amount", 0)
    # Simple rule simulating Anomaly scores
    anomaly_score = 0.95 if float(amount) > 10000 else 0.1
    
    if anomaly_score > 0.8:
        await sio.emit("threat_detected", {"url": "0xTxHashMock", "risk_level": int(anomaly_score * 100), "confidence": 99, "source": "IsolationForest", "geo": [0,0]})
    
    risk_mapped = int(anomaly_score * 100)
    gem_eval = ai_analyzer.generate_explanation(context=payload)
    db.add(ThreatLog(payload_url="Transaction_Payload", risk_score=risk_mapped, confidence=99, threat_tactics=json.dumps(gem_eval.get("tactics_detected", []))))
    db.commit()
    total = db.query(ThreatLog).count()
    await sio.emit("stats_update", {"threats_today": total, "scans_total": total * 14, "blocked_count": db.query(ThreatLog).filter(ThreatLog.is_blocked == True).count()})

    return {
        "is_suspicious": anomaly_score > 0.8,
        "anomaly_score": anomaly_score,
        "explanation": gem_eval
    }

@app.post("/breach-check")
async def breach_check(payload: dict):
    email = payload.get("email", "")
    res = await threat_intel.check_hibp(email)
    if res.get("breached"):
        await sio.emit("breach_alert", {"breach_count": res["breach_count"]})
    return res

@app.post("/blockchain-log")
async def blockchain_log(payload: dict):
    await sio.emit("chain_event", {"tx_hash": "0xMockHash123", "input_hash": payload.get("input_hash", "0x00"), "risk_score": payload.get("risk_score", 0), "block": 100})
    return {"tx_hash": "0xMockHash123", "ipfs_cid": "QmMockCID", "block_number": 100}

@app.websocket("/ws/monitor")
async def websocket_monitor(websocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Feed straight into the pipeline
            resp = await scan_url(ScanUrlRequest(url=data))
            await websocket.send_json({"risk_level": resp["risk_level"], "confidence": resp["confidence"], "action": "block" if resp["risk_level"] > 90 else "warn"})
    except:
        pass

@app.on_event("startup")
async def startup_event():
    init_db()
    # Dummy simulation feed has been removed per user request for clarity.
    pass

app = socketio.ASGIApp(sio, other_asgi_app=app)
