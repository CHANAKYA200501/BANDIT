import os
import json
import requests

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
            # Heuristic signals
            heu = context.get("heuristics", {})
            vt = context.get("virustotal", {})
            whois = context.get("whois", {})
            
            malicious_count = vt.get("malicious", 0)
            is_new = whois.get("domain_age_days", 999) < 60
            suspicious_sub = heu.get("subdomain_count", 0) > 2
            
            explanation = "This endpoint matches patterns for "
            tactics = []
            severity = "low"

            if malicious_count > 0:
                explanation += f"known malicious infrastructure flagged by {malicious_count} security engines. "
                tactics.append("Blacklisted Host")
                severity = "high"
            
            if is_new:
                explanation += "suspiciously young domains often used for disposable phishing. "
                tactics.append("Recent Registration")
                severity = "medium"

            if suspicious_sub:
                explanation += "unusual subdomain structures commonly found in credential harvesting campaigns. "
                tactics.append("Subdomain Nesting")
                severity = "medium"

            if not tactics:
                explanation = "Direct analysis shows no immediate signatures, however, behavioral telemetry suggests caution. Recommend further verification."
                tactics = ["Manual Verification Required"]

            return {
                "explanation": explanation,
                "tactics_detected": tactics,
                "recommendation": "block" if severity == "high" else "verify",
                "confidence_note": "Generated via local heuristic reasoning engine (Gemini Fallback).",
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
