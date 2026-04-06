"""
Text Classifier Training Script
Trains TF-IDF + LogisticRegression for scam category detection.
Categories: benign, otp_scam, lottery_scam, upi_fraud, phishing_link, urgency_scam, job_scam
"""
import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# ── Synthetic Training Data ──────────────────────────────────────────
TRAINING_DATA = [
    # Benign messages
    ("Hey, are you coming to the party tonight?", "benign"),
    ("The meeting is scheduled for 3 PM tomorrow.", "benign"),
    ("Please review the attached document and share your feedback.", "benign"),
    ("Happy birthday! Wishing you all the best.", "benign"),
    ("Your order has been shipped and will arrive by Friday.", "benign"),
    ("Thanks for your email, I'll get back to you soon.", "benign"),
    ("Let's grab lunch together this week.", "benign"),
    ("The weather looks great for the weekend hike.", "benign"),
    ("Don't forget to submit the project report by Monday.", "benign"),
    ("Great presentation today! Really well done.", "benign"),
    ("Can you send me the address for tomorrow's event?", "benign"),
    ("Movie starts at 7, meet at the mall at 6:30.", "benign"),
    ("Your package has been delivered to the front door.", "benign"),
    ("Reminder: dentist appointment on Thursday at 2 PM.", "benign"),
    ("The new restaurant downtown is really good!", "benign"),
    
    # OTP / Credential Scam
    ("Your OTP is 482910. Share this code with our agent to verify your account.", "otp_scam"),
    ("Dear customer, your bank account will be blocked. Enter your PIN to reactivate.", "otp_scam"),
    ("Verify your account by entering the OTP sent to your phone: 839201", "otp_scam"),
    ("Your password has expired. Click here to enter your new credentials immediately.", "otp_scam"),
    ("We detected suspicious activity. Please confirm your identity with your CVV and card number.", "otp_scam"),
    ("Share your OTP with our executive to complete the verification process.", "otp_scam"),
    ("Enter your login credentials to prevent your account from being deactivated.", "otp_scam"),
    ("Your account security code is 1234. Forward this to us for verification.", "otp_scam"),
    ("Please provide your ATM PIN for account verification process.", "otp_scam"),
    ("Click to verify your email password: your current password is needed.", "otp_scam"),
    
    # Lottery / Prize Scam
    ("Congratulations! You have won $1,000,000 in the International Lottery!", "lottery_scam"),
    ("You've been selected as the lucky winner of a brand new iPhone 15!", "lottery_scam"),
    ("Claim your prize of ₹50,000 now! You are our special winner.", "lottery_scam"),
    ("Dear winner, your lottery ticket number 84729 has won the grand prize!", "lottery_scam"),
    ("You've won a free gift card worth $500! Claim before it expires.", "lottery_scam"),
    ("Congratulations! You are selected for a cash reward of Rs. 25 lakhs.", "lottery_scam"),
    ("WINNER WINNER! Spin to claim your guaranteed cash prize now!", "lottery_scam"),
    ("You have been randomly selected to receive a $10,000 reward!", "lottery_scam"),
    
    # UPI / Payment Fraud
    ("Send ₹1 to verify your Paytm KYC, or your wallet will be blocked.", "upi_fraud"),
    ("You received a collect request of ₹5000 from unknown merchant on PhonePe.", "upi_fraud"),
    ("Enter your UPI PIN to receive ₹10,000 cashback from Google Pay.", "upi_fraud"),
    ("Your GPay account needs re-verification. Transfer ₹10 to this UPI ID.", "upi_fraud"),
    ("Accept this BHIM request to receive your refund of ₹2500.", "upi_fraud"),
    ("Complete KYC verification by sending ₹100 via any UPI app.", "upi_fraud"),
    ("Your PhonePe wallet will be deactivated. Send ₹1 to reactivate.", "upi_fraud"),
    ("Claim your payment by entering UPI PIN on the incoming request.", "upi_fraud"),
    
    # Phishing Link
    ("Click this link to reset your password: http://bit.ly/fake-reset", "phishing_link"),
    ("Visit www.secure-bank-login.com to update your banking details.", "phishing_link"),
    ("Open this link immediately to avoid account suspension: https://t.co/abc123", "phishing_link"),
    ("Tap here to track your package: http://delivery-status-check.xyz", "phishing_link"),
    ("Click to verify: https://amazon-secure-verification.tk/login", "phishing_link"),
    ("Your WhatsApp will expire unless you visit: http://whatsapp-renew.click", "phishing_link"),
    ("Verify your email at http://google-security-update.ml/verify", "phishing_link"),
    
    # Urgency / Pressure Scam
    ("URGENT: Your account will be permanently deleted in 24 hours!", "urgency_scam"),
    ("IMMEDIATE ACTION REQUIRED: Suspicious login detected on your account.", "urgency_scam"),
    ("Your bank account has been suspended. Act NOW to restore access.", "urgency_scam"),
    ("LAST CHANCE: Your insurance expires today. Call immediately.", "urgency_scam"),
    ("ACT FAST! This offer expires in the next 10 minutes.", "urgency_scam"),
    ("WARNING: Unauthorized transaction detected. Respond immediately.", "urgency_scam"),
    ("Your account will be blocked permanently if you don't respond within 1 hour.", "urgency_scam"),
    
    # Job / Investment Scam
    ("Earn $500/day working from home! No experience needed.", "job_scam"),
    ("Invest $100 and get guaranteed returns of $1000 per week!", "job_scam"),
    ("Double your Bitcoin investment in just 48 hours! Guaranteed.", "job_scam"),
    ("Work from home opportunity: 4 hours daily, earn ₹50000/month.", "job_scam"),
    ("Join our crypto trading group for 500% guaranteed returns.", "job_scam"),
    ("PASSIVE INCOME: Make money while you sleep with our MLM program.", "job_scam"),
    ("Invest in our forex trading platform. Minimum 200% weekly return.", "job_scam"),
]

def train():
    print("=" * 60)
    print("PhishShield+ Text Classifier Training")
    print("=" * 60)
    
    texts = [t[0] for t in TRAINING_DATA]
    labels = [t[1] for t in TRAINING_DATA]
    
    # Augment data by repeating with slight variations
    augmented_texts = list(texts)
    augmented_labels = list(labels)
    for text, label in TRAINING_DATA:
        augmented_texts.append(text.upper())
        augmented_labels.append(label)
        augmented_texts.append(text.lower())
        augmented_labels.append(label)
    
    print(f"\nTotal samples: {len(augmented_texts)}")
    print(f"Categories: {set(augmented_labels)}")
    
    # TF-IDF Vectorization
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words="english",
        min_df=1,
    )
    X = vectorizer.fit_transform(augmented_texts)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, augmented_labels, test_size=0.2, random_state=42, stratify=augmented_labels
    )
    
    # Train classifier
    classifier = LogisticRegression(max_iter=1000, C=1.0, random_state=42)
    classifier.fit(X_train, y_train)
    
    y_pred = classifier.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    accuracy = classifier.score(X_test, y_test)
    print(f"Accuracy: {accuracy:.4f}")
    
    # Save models
    os.makedirs("models", exist_ok=True)
    
    with open(os.path.join("models", "tfidf_vectorizer.pkl"), "wb") as f:
        pickle.dump(vectorizer, f)
    with open(os.path.join("models", "text_classifier.pkl"), "wb") as f:
        pickle.dump(classifier, f)
    
    print("\nModels saved to models/tfidf_vectorizer.pkl and models/text_classifier.pkl")

if __name__ == "__main__":
    train()
