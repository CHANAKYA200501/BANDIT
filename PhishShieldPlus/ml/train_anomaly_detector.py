"""
Anomaly Detector Training Script
Trains IsolationForest on synthetic transaction data.
Features: amount_log, velocity_norm, hour_sin, hour_cos, geo_log
"""
import os
import math
import pickle
import numpy as np
from sklearn.ensemble import IsolationForest

def generate_normal_transactions(n=3000):
    """Generate normal transaction features."""
    np.random.seed(42)
    amounts = np.random.lognormal(7, 1.5, n).clip(100, 50000)
    velocities = np.random.exponential(2, n).clip(0.1, 8)
    hours = np.random.choice(range(8, 22), n)  # Normal business hours
    geo_distances = np.random.exponential(100, n).clip(0, 2000)
    
    return np.column_stack([
        np.log1p(amounts),
        np.minimum(velocities / 10, 5),
        np.sin(2 * np.pi * hours / 24),
        np.cos(2 * np.pi * hours / 24),
        np.log1p(geo_distances),
    ])

def generate_anomalous_transactions(n=200):
    """Generate anomalous transaction features."""
    np.random.seed(123)
    amounts = np.random.lognormal(10, 2, n).clip(50000, 500000)  # Very large
    velocities = np.random.uniform(8, 50, n)  # Very fast
    hours = np.random.choice([0, 1, 2, 3, 4, 5], n)  # Unusual hours
    geo_distances = np.random.uniform(3000, 15000, n)  # Cross-continent
    
    return np.column_stack([
        np.log1p(amounts),
        np.minimum(velocities / 10, 5),
        np.sin(2 * np.pi * hours / 24),
        np.cos(2 * np.pi * hours / 24),
        np.log1p(geo_distances),
    ])

def train():
    print("=" * 60)
    print("PhishShield+ Transaction Anomaly Detector Training")
    print("=" * 60)
    
    # Generate data - IsolationForest is unsupervised, trained on normal data
    X_normal = generate_normal_transactions(3000)
    X_anomaly = generate_anomalous_transactions(200)
    
    print(f"\nNormal transactions: {len(X_normal)}")
    print(f"Anomalous transactions: {len(X_anomaly)} (for evaluation only)")
    
    # Train on normal data only (unsupervised)
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        max_samples=256,
        random_state=42,
    )
    model.fit(X_normal)
    
    # Evaluate
    normal_preds = model.predict(X_normal)
    anomaly_preds = model.predict(X_anomaly)
    
    normal_correct = np.sum(normal_preds == 1) / len(normal_preds)
    anomaly_detected = np.sum(anomaly_preds == -1) / len(anomaly_preds)
    
    print(f"\nNormal correctly identified: {normal_correct:.2%}")
    print(f"Anomalies detected: {anomaly_detected:.2%}")
    
    # Save
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", "anomaly_detector.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"\nModel saved to {model_path}")
    
    # Feature names for reference
    print("Features: amount_log, velocity_norm, hour_sin, hour_cos, geo_log")

if __name__ == "__main__":
    train()
