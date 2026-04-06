"""
Text & Message Scanner Service
NLP pipeline: language detection → tokenization → spaCy NER → TF-IDF classification → Gemini explanation
Supports English, Hindi, and Hinglish.
"""
import os
import re
import pickle
import logging
from typing import Optional

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ── Hindi / Hinglish Patterns ────────────────────────────────────────
HINDI_KEYWORDS = {
    "otp": ["otp", "ओटीपी", "one time password"],
    "upi": ["upi", "यूपीआई", "paytm", "phonepe", "gpay", "bhim", "upi id", "upi pin"],
    "account": ["khata", "account", "खाता", "bank", "बैंक"],
    "urgent": ["jaldi", "turant", "fatafat", "जल्दी", "तुरंत", "फटाफट", "urgent"],
    "money": ["paisa", "paise", "rupay", "rupee", "पैसा", "रुपए", "amount", "transfer"],
    "fraud": ["fraud", "scam", "dhokha", "loot", "chori", "धोखा", "लूट", "चोरी"],
    "link": ["link", "click", "press", "tap", "लिंक", "क्लिक"],
    "prize": ["prize", "inaam", "lottery", "jeet", "won", "इनाम", "लॉटरी", "जीत"],
    "verify": ["verify", "jaanch", "confirm", "सत्यापन", "जाँच"],
    "password": ["password", "pin", "passcode", "पासवर्ड", "पिन"],
}

# ── Scam Category Definitions ────────────────────────────────────────
SCAM_PATTERNS = {
    "OTP / Credential Scam": {
        "keywords": ["otp", "pin", "password", "passcode", "verify", "cvv", "card number",
                     "credential", "login", "sign in", "authentication", "ओटीपी", "पासवर्ड", "पिन"],
        "weight": 35,
    },
    "Prize / Lottery Scam": {
        "keywords": ["won", "winner", "prize", "lottery", "reward", "congratulations", "claim",
                     "gift", "cash prize", "lucky", "selected", "इनाम", "लॉटरी", "जीत"],
        "weight": 30,
    },
    "UPI / Payment Fraud": {
        "keywords": ["upi", "paytm", "phonepe", "gpay", "bhim", "transfer", "payment",
                     "receive money", "collect request", "upi pin", "यूपीआई", "पेमेंट"],
        "weight": 30,
    },
    "Urgency Manipulation": {
        "keywords": ["urgent", "immediately", "asap", "right now", "suspended", "blocked",
                     "expire", "last chance", "deadline", "quick", "hurry", "जल्दी", "तुरंत", "फटाफट"],
        "weight": 20,
    },
    "Suspicious Link Delivery": {
        "keywords": ["click", "link", "http", "https", "www", "bit.ly", "t.co", "tinyurl",
                     "tap here", "open this", "visit", "लिंक", "क्लिक"],
        "weight": 15,
    },
    "Impersonation / Authority": {
        "keywords": ["rbi", "police", "government", "income tax", "irs", "fbi", "bank manager",
                     "customer care", "executive", "official", "सरकार", "पुलिस", "अधिकारी"],
        "weight": 25,
    },
    "Job / Investment Scam": {
        "keywords": ["work from home", "earn money", "investment", "guaranteed return",
                     "double money", "crypto", "bitcoin", "trading", "passive income", "mlm",
                     "नौकरी", "कमाई", "निवेश"],
        "weight": 25,
    },
}

# ── Language Detection ───────────────────────────────────────────────
def detect_language(text: str) -> str:
    """Detect if text is English, Hindi, or Hinglish."""
    try:
        from langdetect import detect
        lang = detect(text)
        if lang == "hi":
            # Check if it's actually Hinglish (mixed Hindi + English)
            ascii_ratio = sum(1 for c in text if c.isascii()) / max(1, len(text))
            return "hinglish" if 0.3 < ascii_ratio < 0.8 else "hi"
        return lang
    except Exception:
        return "en"

# ── spaCy NER ────────────────────────────────────────────────────────
def extract_entities(text: str) -> list:
    """Extract named entities using spaCy."""
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found, skipping NER")
            return []
        
        doc = nlp(text[:5000])  # limit to avoid memory issues
        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
            })
        return entities
    except Exception as e:
        logger.warning(f"spaCy NER failed: {e}")
        return []

# ── TF-IDF Classifier ───────────────────────────────────────────────
def tfidf_classify(text: str) -> dict:
    """Classify text using trained TF-IDF + classifier model."""
    model_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models")
    
    try:
        with open(os.path.join(model_dir, "tfidf_vectorizer.pkl"), "rb") as f:
            vectorizer = pickle.load(f)
        with open(os.path.join(model_dir, "text_classifier.pkl"), "rb") as f:
            classifier = pickle.load(f)
        
        X = vectorizer.transform([text.lower()])
        prediction = classifier.predict(X)[0]
        proba = classifier.predict_proba(X)[0]
        
        classes = classifier.classes_
        scores = {cls: round(float(p) * 100, 2) for cls, p in zip(classes, proba)}
        
        return {
            "prediction": str(prediction),
            "scores": scores,
            "model": "TF-IDF-v1",
        }
    except Exception as e:
        logger.warning(f"TF-IDF classification failed, using pattern matching: {e}")
        return None

# ── Pattern-Based Scoring ────────────────────────────────────────────
def pattern_score(text: str) -> tuple:
    """Score text using keyword pattern matching. Returns (risk, categories)."""
    text_lower = text.lower()
    categories = []
    risk = 10  # base risk
    
    for category, config in SCAM_PATTERNS.items():
        matches = sum(1 for kw in config["keywords"] if kw in text_lower)
        if matches >= 1:
            categories.append(category)
            risk += config["weight"] * min(matches, 3) / 3  # diminishing returns
    
    # URL detection bonus
    urls = re.findall(r'https?://\S+|www\.\S+|bit\.ly/\S+', text_lower)
    if urls:
        risk += 10
    
    # Phone number detection
    phones = re.findall(r'[\+]?[\d]{10,13}', text)
    if phones:
        risk += 5
    
    risk = int(min(risk, 98))
    
    if not categories:
        categories.append("Low Risk")
    
    return risk, categories

# ── Explanation Generation ───────────────────────────────────────────
EXPLANATION_MAP = {
    "OTP / Credential Scam": "This text requests sensitive authentication data (OTP/password/PIN). Legitimate services NEVER ask for this information via SMS or email. This is a credential harvesting attempt.",
    "Prize / Lottery Scam": "This message claims unexpected winnings or prizes — a classic social engineering technique designed to extract personal/financial information from victims.",
    "UPI / Payment Fraud": "This message involves UPI/payment requests that may trick you into sending money. Never share your UPI PIN, and reject unexpected collect requests.",
    "Urgency Manipulation": "This message uses urgency and fear tactics (account suspension, expiry) to pressure immediate action without careful thought — a hallmark of phishing.",
    "Suspicious Link Delivery": "This message contains or references URLs that may redirect to credential harvesting, malware distribution, or phishing pages.",
    "Impersonation / Authority": "This message impersonates a government agency, bank, or authority figure to establish false trust — a common social engineering technique.",
    "Job / Investment Scam": "This message promotes unrealistic earning opportunities or guaranteed investment returns — classic indicators of advance-fee or ponzi schemes.",
    "Low Risk": "No obvious phishing indicators were detected, but always exercise caution with messages from unknown senders.",
}

# ── Main Scanning Pipeline ───────────────────────────────────────────
async def scan_text_full(text: str, language: str = "auto") -> dict:
    """
    Full text scanning pipeline:
    1. Language detection
    2. spaCy NER extraction
    3. TF-IDF classification (if model available)
    4. Pattern-based scoring
    5. Combined scoring + explanation generation
    """
    import asyncio
    loop = asyncio.get_event_loop()
    
    # Step 1: Language detection
    if language == "auto":
        detected_lang = await loop.run_in_executor(None, detect_language, text)
    else:
        detected_lang = language
    
    # Step 2: NER
    entities = await loop.run_in_executor(None, extract_entities, text)
    
    # Step 3: TF-IDF classification
    tfidf_result = await loop.run_in_executor(None, tfidf_classify, text)
    
    # Step 4: Pattern scoring
    pattern_risk, pattern_categories = pattern_score(text)
    
    # Step 5: Combine scores
    if tfidf_result and tfidf_result.get("scores"):
        # Blend TF-IDF with pattern scoring (60/40)
        tfidf_max_score = max(tfidf_result["scores"].values()) if tfidf_result["scores"] else 0
        risk = int(0.6 * tfidf_max_score + 0.4 * pattern_risk)
        
        # Merge categories from both
        categories = list(set(pattern_categories))
        if tfidf_result["prediction"] != "benign" and tfidf_result["prediction"] not in categories:
            categories.insert(0, tfidf_result["prediction"])
    else:
        risk = pattern_risk
        categories = pattern_categories
    
    risk = max(0, min(98, risk))
    confidence = max(60, min(95, risk + 10))
    
    # Generate explanation
    explanations = []
    for cat in categories:
        if cat in EXPLANATION_MAP:
            explanations.append(EXPLANATION_MAP[cat])
    explanation = " ".join(explanations) if explanations else EXPLANATION_MAP["Low Risk"]
    
    return {
        "risk_level": risk,
        "confidence": confidence,
        "Categories": categories,
        "gemini_explanation": explanation,
        "language_detected": detected_lang,
        "entities": entities[:10],  # top 10
        "tfidf_model_used": tfidf_result is not None,
    }
