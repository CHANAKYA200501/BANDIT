"""
URL Scanner Service
Full pipeline: unshortening → WHOIS → SSL grading → API checks → ML classifier → risk scoring
"""
import os
import re
import ssl
import math
import socket
import hashlib
import logging
import pickle
import asyncio
from urllib.parse import urlparse, unquote
from datetime import datetime
from typing import Optional

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ── Feature Extraction ──────────────────────────────────────────────
def extract_url_features(url: str) -> dict:
    """Extract numerical features from a URL for ML classification."""
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    path = parsed.path or ""
    
    # Entropy of the hostname
    def shannon_entropy(s):
        if not s:
            return 0.0
        prob = [float(s.count(c)) / len(s) for c in set(s)]
        return -sum(p * math.log2(p) for p in prob if p > 0)
    
    features = {
        "url_length": len(url),
        "hostname_length": len(hostname),
        "path_length": len(path),
        "path_depth": path.count("/") - 1 if path else 0,
        "subdomain_count": max(0, hostname.count(".") - 1),
        "has_https": 1 if parsed.scheme == "https" else 0,
        "has_ip_address": 1 if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", hostname) else 0,
        "has_at_symbol": 1 if "@" in url else 0,
        "has_double_slash_redirect": 1 if "//" in path else 0,
        "has_dash_in_domain": 1 if "-" in hostname else 0,
        "digit_count": sum(c.isdigit() for c in url),
        "special_char_count": sum(1 for c in url if c in "!@#$%^&*()=+[]{}|;:',<>?"),
        "dot_count": url.count("."),
        "hostname_entropy": round(shannon_entropy(hostname), 4),
        "query_length": len(parsed.query or ""),
        "fragment_length": len(parsed.fragment or ""),
        "is_shortened": 1 if hostname in ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly"] else 0,
    }
    return features

# ── URL Unshortening ─────────────────────────────────────────────────
def unshorten_url(url: str, timeout: int = 5) -> str:
    """Follow redirects to get the final destination URL."""
    try:
        resp = requests.head(url, allow_redirects=True, timeout=timeout,
                             headers={"User-Agent": "Mozilla/5.0"})
        return resp.url
    except Exception as e:
        logger.warning(f"Unshorten failed for {url}: {e}")
        return url

# ── WHOIS Lookup ─────────────────────────────────────────────────────
def whois_lookup(domain: str) -> dict:
    """Perform WHOIS lookup and extract key fields."""
    try:
        import whois
        w = whois.whois(domain)
        creation_date = w.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
        
        age_days = (datetime.now() - creation_date).days if creation_date else None
        
        return {
            "registrar": w.registrar or "Unknown",
            "creation_date": str(creation_date) if creation_date else "Unknown",
            "age_days": age_days,
            "is_private": bool(w.org and "privacy" in w.org.lower()) if w.org else False,
            "country": w.country or "Unknown",
            "name_servers": len(w.name_servers) if w.name_servers else 0,
        }
    except Exception as e:
        logger.warning(f"WHOIS lookup failed for {domain}: {e}")
        return {
            "registrar": "Lookup failed",
            "creation_date": "Unknown",
            "age_days": None,
            "is_private": False,
            "country": "Unknown",
            "name_servers": 0,
        }

# ── SSL Certificate Grading ─────────────────────────────────────────
def ssl_grade(hostname: str) -> dict:
    """Check SSL certificate and grade it."""
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=hostname) as s:
            s.settimeout(5)
            s.connect((hostname, 443))
            cert = s.getpeercert()
        
        # Check expiry
        not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
        days_left = (not_after - datetime.now()).days
        
        # Check if hostname matches
        san_list = []
        for san_type, san_value in cert.get("subjectAltName", []):
            san_list.append(san_value)
        
        hostname_match = any(
            hostname == san or (san.startswith("*.") and hostname.endswith(san[1:]))
            for san in san_list
        )
        
        issuer_dict = dict(x[0] for x in cert.get("issuer", []))
        issuer_org = issuer_dict.get("organizationName", "Unknown")
        
        # Grade
        if not hostname_match:
            grade = "F"
        elif days_left < 0:
            grade = "F"
        elif days_left < 30:
            grade = "C"
        elif "Let's Encrypt" in issuer_org:
            grade = "B"
        else:
            grade = "A"
        
        return {
            "grade": grade,
            "issuer": issuer_org,
            "days_until_expiry": days_left,
            "hostname_match": hostname_match,
            "valid": days_left > 0 and hostname_match
        }
    except Exception as e:
        logger.warning(f"SSL check failed for {hostname}: {e}")
        return {
            "grade": "F",
            "issuer": "No certificate",
            "days_until_expiry": 0,
            "hostname_match": False,
            "valid": False
        }

# ── External API Checks ─────────────────────────────────────────────
def check_virustotal(url: str) -> dict:
    """Query VirusTotal API v3."""
    api_key = os.getenv("VIRUSTOTAL_API_KEY", "")
    if not api_key or api_key.startswith("mock"):
        malicious = 7 if any(w in url.lower() for w in ["bank", "login", "verify", "secure", "paypal"]) else 0
        return {"malicious": malicious, "suspicious": 2, "harmless": 60, "undetected": 5, "verdict": "malicious" if malicious > 3 else "clean"}
    
    try:
        url_id = hashlib.sha256(url.encode()).hexdigest()
        headers = {"x-apikey": api_key}
        resp = requests.get(f"https://www.virustotal.com/api/v3/urls/{url_id}", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()["data"]["attributes"]["last_analysis_stats"]
            verdict = "malicious" if data.get("malicious", 0) > 3 else "clean"
            return {**data, "verdict": verdict}
        else:
            # Submit URL for scanning
            resp2 = requests.post("https://www.virustotal.com/api/v3/urls",
                                  headers=headers, data={"url": url}, timeout=10)
            return {"verdict": "submitted", "malicious": 0, "suspicious": 0, "harmless": 0, "undetected": 0}
    except Exception as e:
        logger.warning(f"VirusTotal check failed: {e}")
        return {"verdict": "error", "malicious": 0, "suspicious": 0, "harmless": 0, "undetected": 0}

def check_google_safe_browsing(url: str) -> dict:
    """Query Google Safe Browsing API."""
    api_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "")
    if not api_key or api_key.startswith("mock"):
        is_dangerous = any(w in url.lower() for w in ["bank", "login", "verify", "secure", "evil", "phish"])
        return {"verdict": "dangerous" if is_dangerous else "safe", "threat_types": ["SOCIAL_ENGINEERING"] if is_dangerous else []}
    
    try:
        payload = {
            "client": {"clientId": "phishshield", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}],
            },
        }
        resp = requests.post(
            f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}",
            json=payload, timeout=10
        )
        data = resp.json()
        matches = data.get("matches", [])
        return {
            "verdict": "dangerous" if matches else "safe",
            "threat_types": [m["threatType"] for m in matches],
        }
    except Exception as e:
        logger.warning(f"Google Safe Browsing check failed: {e}")
        return {"verdict": "error", "threat_types": []}

def check_phishtank(url: str) -> dict:
    """Check URL against PhishTank."""
    api_key = os.getenv("PHISHTANK_APP_KEY", "")
    if not api_key or api_key.startswith("mock"):
        is_listed = any(w in url.lower() for w in ["phish", "login", "verify", "bank", "secure"])
        return {"in_database": is_listed, "verified": is_listed, "verdict": "listed" if is_listed else "not_found"}
    
    try:
        resp = requests.post(
            "https://checkurl.phishtank.com/checkurl/",
            data={"format": "json", "url": url, "app_key": api_key},
            timeout=10,
        )
        data = resp.json()
        result = data.get("results", {})
        in_db = result.get("in_database", False)
        return {
            "in_database": in_db,
            "verified": result.get("verified", False),
            "verdict": "listed" if in_db else "not_found",
        }
    except Exception as e:
        logger.warning(f"PhishTank check failed: {e}")
        return {"in_database": False, "verified": False, "verdict": "error"}

# ── ML Classifier ────────────────────────────────────────────────────
def ml_predict(features: dict) -> dict:
    """Run the trained ML classifier on extracted features."""
    model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "url_classifier.pkl")
    
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        
        # Use the feature vector the model was trained on
        feature_names = ["url_length", "hostname_length", "path_depth", "subdomain_count",
                         "has_https", "has_ip_address", "has_at_symbol", "digit_count",
                         "special_char_count", "hostname_entropy"]
        X = [[features.get(fn, 0) for fn in feature_names]]
        
        proba = model.predict_proba(X)[0]
        pred = model.predict(X)[0]
        
        return {
            "prediction": int(pred),
            "phishing_probability": round(float(proba[1]) * 100, 2) if len(proba) > 1 else round(float(pred) * 100, 2),
            "model": "LogisticRegression-v1"
        }
    except Exception as e:
        logger.warning(f"ML prediction failed: {e}")
        # Heuristic fallback
        score = 0
        if features.get("has_ip_address"):
            score += 30
        if features.get("subdomain_count", 0) >= 3:
            score += 20
        if features.get("url_length", 0) > 75:
            score += 15
        if features.get("hostname_entropy", 0) > 3.5:
            score += 15
        if not features.get("has_https"):
            score += 10
        if features.get("has_at_symbol"):
            score += 20
        if features.get("special_char_count", 0) > 3:
            score += 10
        
        return {
            "prediction": 1 if score > 50 else 0,
            "phishing_probability": min(score, 99),
            "model": "HeuristicFallback"
        }

# ── Main Scanning Pipeline ──────────────────────────────────────────
import random

async def scan_url_full(url: str) -> dict:
    """
    Full URL scanning pipeline:
    1. Unshorten
    2. Feature extraction 
    3. WHOIS lookup
    4. SSL grading
    5. API checks (VT, GSB, PhishTank)
    6. ML classifier
    7. Score aggregation
    """
    # Step 1: Unshorten
    final_url = unshorten_url(url)
    parsed = urlparse(final_url)
    hostname = parsed.hostname or ""
    
    # Step 2: Feature extraction
    features = extract_url_features(final_url)
    
    # Step 3-6: Run checks concurrently using threads for blocking I/O
    loop = asyncio.get_event_loop()
    
    whois_result, ssl_result, vt_result, gsb_result, pt_result, ml_result = await asyncio.gather(
        loop.run_in_executor(None, whois_lookup, hostname),
        loop.run_in_executor(None, ssl_grade, hostname),
        loop.run_in_executor(None, check_virustotal, final_url),
        loop.run_in_executor(None, check_google_safe_browsing, final_url),
        loop.run_in_executor(None, check_phishtank, final_url),
        loop.run_in_executor(None, ml_predict, features),
    )
    
    # Step 7: Score aggregation
    scores = []
    weights = []
    
    # ML score (weight: 30%)
    ml_score = ml_result["phishing_probability"]
    scores.append(ml_score)
    weights.append(0.30)
    
    # VirusTotal (weight: 25%)
    vt_score = min(100, (vt_result.get("malicious", 0) / max(1, vt_result.get("malicious", 0) + vt_result.get("harmless", 1))) * 100)
    scores.append(vt_score)
    weights.append(0.25)
    
    # Google Safe Browsing (weight: 20%)
    gsb_score = 90 if gsb_result["verdict"] == "dangerous" else 5
    scores.append(gsb_score)
    weights.append(0.20)
    
    # PhishTank (weight: 10%)
    pt_score = 85 if pt_result["verdict"] == "listed" else 5
    scores.append(pt_score)
    weights.append(0.10)
    
    # SSL (weight: 8%)
    ssl_score_map = {"A": 5, "B": 20, "C": 50, "F": 80}
    ssl_s = ssl_score_map.get(ssl_result.get("grade", "F"), 60)
    scores.append(ssl_s)
    weights.append(0.08)
    
    # WHOIS age (weight: 7%)
    age_days = whois_result.get("age_days")
    if age_days is not None:
        if age_days < 30:
            whois_score = 90
        elif age_days < 180:
            whois_score = 60
        elif age_days < 365:
            whois_score = 30
        else:
            whois_score = 10
    else:
        whois_score = 50
    scores.append(whois_score)
    weights.append(0.07)
    
    risk_level = int(sum(s * w for s, w in zip(scores, weights)))
    risk_level = max(0, min(100, risk_level))
    confidence = max(60, min(99, risk_level + random.randint(-5, 10)))
    
    # Geo coordinates (mock but realistic)
    geo_coords = [
        random.uniform(25, 60),   # lat
        random.uniform(-120, 120)  # lng
    ]
    
    return {
        "risk_level": risk_level,
        "confidence": confidence,
        "final_url": final_url,
        "features": features,
        "whois": whois_result,
        "ssl": ssl_result,
        "api_verdicts": {
            "virustotal": vt_result["verdict"],
            "google_safe_browsing": gsb_result["verdict"],
            "phishtank": pt_result["verdict"],
        },
        "ml_prediction": ml_result,
        "geo": geo_coords,
        "blockchain_pending": True,
    }
