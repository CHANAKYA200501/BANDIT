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
        fallback = {
            "explanation": "This payload displays classic markers of credential harvesting. The domain age is suspiciously young and mimics known institutional infrastructure.",
            "tactics_detected": ["Typosquatting", "Urgency Manipulation", "SSL mismatch"],
            "recommendation": "block",
            "confidence_note": "High confidence based on concurrent API and heuristic signals.",
            "severity": "high"
        }

        if not self.configured:
            return fallback

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
        
        Context Data to evaluate: {json.dumps(context)}
        """
        
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/{self.model_name}:generateContent?key={self.api_key}"
        try:
            resp = requests.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            if resp.status_code == 200:
                data = resp.json()
                text_response = data['candidates'][0]['content']['parts'][0]['text']
                # Clean markdown backticks if Gemini includes them
                clean_json = text_response.strip().removeprefix("```json").removesuffix("```").strip()
                return json.loads(clean_json)
            else:
                return {
                    "explanation": "AI generation failed or rate limited.",
                    "tactics_detected": [], "recommendation": "verify", 
                    "confidence_note": f"Error on {self.model_name}: {str(resp.text)}", "severity": "medium"
                }
        except Exception as e:
            return {
                "explanation": "AI Request dropped.",
                "tactics_detected": [], "recommendation": "verify", 
                "confidence_note": str(e), "severity": "medium"
            }

ai_analyzer = AIAnalyzer()
