"""
Transaction Anomaly Detection Service
Uses IsolationForest to score transactions based on amount, velocity, and geographic distance.
"""
import os
import pickle
import math
import logging
import random
from datetime import datetime
from typing import Optional

import numpy as np
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ── Feature Engineering ──────────────────────────────────────────────
def compute_geo_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in km between two points."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def extract_tx_features(tx: dict) -> list:
    """
    Extract feature vector from a transaction.
    Expected tx fields: amount, sender_lat, sender_lng, receiver_lat, receiver_lng,
                        velocity (txns/hour), hour_of_day
    """
    amount = float(tx.get("amount", 0))
    velocity = float(tx.get("velocity", 1))
    hour = int(tx.get("hour_of_day", datetime.now().hour))
    
    sender_lat = float(tx.get("sender_lat", 28.6))
    sender_lng = float(tx.get("sender_lng", 77.2))
    receiver_lat = float(tx.get("receiver_lat", 28.6))
    receiver_lng = float(tx.get("receiver_lng", 77.2))
    
    geo_distance = compute_geo_distance(sender_lat, sender_lng, receiver_lat, receiver_lng)
    
    # Normalize features
    amount_log = math.log1p(amount)  # log-scale amount
    velocity_norm = min(velocity / 10, 5)  # cap at 50 txns/hour
    hour_sin = math.sin(2 * math.pi * hour / 24)  # cyclic encoding
    hour_cos = math.cos(2 * math.pi * hour / 24)
    geo_log = math.log1p(geo_distance)
    
    return [amount_log, velocity_norm, hour_sin, hour_cos, geo_log]

# ── ML Model Loading ────────────────────────────────────────────────
def load_anomaly_model():
    """Load the trained IsolationForest model."""
    model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "anomaly_detector.pkl")
    try:
        with open(model_path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        logger.warning(f"Failed to load anomaly model: {e}")
        return None

# ── Heuristic Scoring ───────────────────────────────────────────────
def heuristic_anomaly_score(tx: dict) -> float:
    """Fallback heuristic scoring when model is unavailable."""
    score = 0.0
    
    amount = float(tx.get("amount", 0))
    velocity = float(tx.get("velocity", 1))
    hour = int(tx.get("hour_of_day", 12))
    
    # Large amounts
    if amount > 50000:
        score += 0.3
    elif amount > 10000:
        score += 0.15
    
    # High velocity
    if velocity > 10:
        score += 0.3
    elif velocity > 5:
        score += 0.15
    
    # Unusual hours (midnight to 5am)
    if 0 <= hour <= 5:
        score += 0.2
    
    # Large geo distance
    sender_lat = float(tx.get("sender_lat", 0))
    sender_lng = float(tx.get("sender_lng", 0))
    receiver_lat = float(tx.get("receiver_lat", 0))
    receiver_lng = float(tx.get("receiver_lng", 0))
    dist = compute_geo_distance(sender_lat, sender_lng, receiver_lat, receiver_lng)
    if dist > 5000:
        score += 0.2
    elif dist > 1000:
        score += 0.1
    
    return min(score, 1.0)

# ── Main Scanning Pipeline ──────────────────────────────────────────
async def scan_transaction(tx: dict) -> dict:
    """
    Transaction anomaly detection pipeline:
    1. Feature extraction
    2. IsolationForest scoring (or heuristic fallback)
    3. Return anomaly score + risk level + explanation
    """
    features = extract_tx_features(tx)
    model = load_anomaly_model()
    
    if model is not None:
        try:
            X = np.array([features])
            # IsolationForest: decision_function returns anomaly score (more negative = more anomalous)
            raw_score = model.decision_function(X)[0]
            prediction = model.predict(X)[0]  # -1 = anomaly, 1 = normal
            
            # Convert to 0-1 range (higher = more anomalous)
            anomaly_score = max(0, min(1, 0.5 - raw_score))
            model_used = "IsolationForest-v1"
        except Exception as e:
            logger.warning(f"IsolationForest prediction failed: {e}")
            anomaly_score = heuristic_anomaly_score(tx)
            prediction = -1 if anomaly_score > 0.5 else 1
            model_used = "HeuristicFallback"
    else:
        anomaly_score = heuristic_anomaly_score(tx)
        prediction = -1 if anomaly_score > 0.5 else 1
        model_used = "HeuristicFallback"
    
    risk_level = int(anomaly_score * 100)
    is_anomalous = bool(prediction == -1)
    anomaly_score = float(anomaly_score)
    
    # Generate explanation
    explanations = []
    amount = float(tx.get("amount", 0))
    velocity = float(tx.get("velocity", 1))
    hour = int(tx.get("hour_of_day", 12))
    
    if amount > 50000:
        explanations.append(f"Unusually large transaction amount (₹{amount:,.2f})")
    if velocity > 10:
        explanations.append(f"High transaction velocity ({velocity} txns/hour)")
    if 0 <= hour <= 5:
        explanations.append(f"Transaction at unusual hour ({hour}:00)")
    
    sender_lat = float(tx.get("sender_lat", 0))
    sender_lng = float(tx.get("sender_lng", 0))
    receiver_lat = float(tx.get("receiver_lat", 0))
    receiver_lng = float(tx.get("receiver_lng", 0))
    dist = compute_geo_distance(sender_lat, sender_lng, receiver_lat, receiver_lng)
    if dist > 1000:
        explanations.append(f"Large geographic distance between sender and receiver ({dist:,.0f} km)")
    
    if not explanations:
        explanations.append("Transaction appears within normal parameters")
    
    # Generate flow data for TxFlowGraph visualization
    flow_nodes = [
        {"id": tx.get("sender", "sender_001"), "label": tx.get("sender", "Sender"), "type": "sender",
         "lat": sender_lat, "lng": sender_lng},
        {"id": tx.get("receiver", "receiver_001"), "label": tx.get("receiver", "Receiver"), "type": "receiver",
         "lat": receiver_lat, "lng": receiver_lng},
    ]
    flow_edges = [
        {"from": tx.get("sender", "sender_001"), "to": tx.get("receiver", "receiver_001"),
         "amount": float(amount), "suspicious": bool(is_anomalous)}
    ]
    
    return {
        "risk_level": risk_level,
        "confidence": min(95, risk_level + 15),
        "anomaly_score": round(anomaly_score, 4),
        "is_anomalous": is_anomalous,
        "model": model_used,
        "explanation": " | ".join(explanations),
        "features": {
            "amount": amount,
            "velocity": velocity,
            "hour_of_day": hour,
            "geo_distance_km": round(dist, 2),
        },
        "flow_graph": {
            "nodes": flow_nodes,
            "edges": flow_edges,
        },
    }
