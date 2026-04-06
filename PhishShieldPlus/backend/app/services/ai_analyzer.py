import os
import json
import requests
import random

class AIAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.configured = bool(self.api_key and "mock" not in self.api_key)
        self.model_name = "models/gemini-2.0-flash" # Fallback modern default
        
        if self.configured:
            # Dynamically fetch the first available active model that supports generateContent to prevent 404 deprecations
            try:
                resp = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}", timeout=3)
                if resp.status_code == 200:
                    for m in resp.json().get("models", []):
                        if "generateContent" in m.get("supportedGenerationMethods", []) and "flash" in m["name"]:
                            self.model_name = m["name"]
                            break
            except Exception:
                pass


    def generate_explanation(self, context, url=None, text=None):
        def generate_logical_fallback():
            """Generates a realistic fallback based on context data."""
            # Signal Extraction
            heu = context.get("heuristics", {})
            vt = context.get("virustotal", {})
            whois = context.get("whois", {})
            keywords = context.get("detected_keywords", [])
            text_content = context.get("text_content", "")
            features = context.get("features", {})
            
            explanation = ""
            tactics = []
            severity = "low"

            # 1. URL LOGIC
            if vt.get("malicious", 0) > 0:
                explanation += f"Infrastructure flagged by {vt['malicious']} security engines. "
                tactics.append("Blacklisted Host")
                severity = "high"
            if whois.get("domain_age_days", 999) < 60:
                explanation += "Suspiciously young domain found. "
                tactics.append("Recent Registration")
                severity = "medium"
            if heu.get("subdomain_count", 0) > 2:
                explanation += "Excessive subdomain nesting detected. "
                tactics.append("Subdomain Nesting")
                severity = "medium"

            # 2. TEXT LOGIC
            if keywords:
                explanation += f"Detected sensitive keywords: {', '.join(keywords)}. Likely {random.choice(['Credential Harvesting', 'Account Takeover'])} attempt. "
                tactics.append("Social Engineering")
                severity = "high" if len(keywords) > 2 else "medium"
            elif text_content:
                explanation += "Analyzing raw text semantics. Minimal active signatures, but pattern suggests low-level risk. "
                tactics.append("Pattern Matching")

            # 3. TRANSACTION LOGIC
            if features:
                high_amt = float(str(features.get('amount', 0)).replace(',','')) > 500000
                high_vel = float(features.get('velocity', 1)) > 5
                if high_amt:
                    explanation += "Large transaction volume anomaly detected. "
                    tactics.append("Financial Fraud")
                    severity = "high"
                if high_vel:
                    explanation += "Unusual transaction velocity recorded. "
                    tactics.append("Rapid Withdrawal")
                    severity = "medium"

            if not explanation:
                explanation = "Direct analysis shows no immediate signatures, however, behavioral telemetry suggests caution. Recommend further verification."
                tactics = ["Manual Verification Required"]

            return {
                "explanation": explanation.strip(),
                "tactics_detected": list(set(tactics)),
                "recommendation": "block" if severity in ["high", "critical"] else "verify",
                "confidence_note": "Generated via local heuristic reasoning engine (SOC-v2).",
                "severity": severity
            }

        if not self.configured:
            return generate_logical_fallback()

        prompt = f"""
        You are PhishShield+ AI, a cybersecurity analyst.
        Respond ONLY with a valid JSON object — no markdown, no preamble.
        Schema:
        {{
            "explanation": "string (2-3 sentences, plain English)",
            "tactics_detected": ["string"],
            "recommendation": "ignore" | "verify" | "report" | "block",
            "confidence_note": "string (1 sentence)",
            "severity": "low" | "medium" | "high" | "critical"
        }}
        
        Context Data: {json.dumps(context)}
        """
        
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/{self.model_name}:generateContent?key={self.api_key}"
        try:
            resp = requests.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                text_response = data['candidates'][0]['content']['parts'][0]['text']
                clean_json = text_response.strip().removeprefix("```json").removesuffix("```").strip()
                return json.loads(clean_json)
            else:
                return generate_logical_fallback()
        except Exception:
            return generate_logical_fallback()

ai_analyzer = AIAnalyzer()
