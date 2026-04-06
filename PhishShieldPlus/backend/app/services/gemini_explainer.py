"""
Gemini Explainable AI Service
Uses Gemini 1.5 Pro to provide contextual threat analysis and plain English explanations.
Falls back to rule-based explanations when API key is unavailable.
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ── Rule-Based Explanations (Fallback) ───────────────────────────────
def generate_rule_explanation(scan_type: str, context: dict) -> dict:
    """Generate detailed explanation using rules when Gemini API is unavailable."""
    
    if scan_type == "url":
        risk = context.get("risk_level", 0)
        features = context.get("features", {})
        verdicts = context.get("api_verdicts", {})
        whois = context.get("whois", {})
        ssl_info = context.get("ssl", {})
        ml = context.get("ml_prediction", {})
        
        findings = []
        recommendations = []
        
        # Risk assessment
        if risk >= 80:
            findings.append("⚠️ This URL is classified as HIGH RISK and is very likely a phishing attempt.")
        elif risk >= 50:
            findings.append("⚡ This URL has moderate risk indicators that require caution.")
        else:
            findings.append("✅ This URL appears relatively safe, though vigilance is always recommended.")
        
        # Feature-based findings
        if features.get("has_ip_address"):
            findings.append("🔴 URL uses an IP address instead of a domain name — a common phishing technique.")
            recommendations.append("Never enter credentials on sites identified by IP address.")
        
        if features.get("subdomain_count", 0) >= 3:
            findings.append(f"🟠 Excessive subdomains ({features['subdomain_count']}) — may be mimicking a legitimate site.")
        
        if features.get("url_length", 0) > 75:
            findings.append("🟠 Unusually long URL — often used to hide the actual destination.")
        
        if features.get("hostname_entropy", 0) > 3.5:
            findings.append("🟡 High entropy in hostname — may be auto-generated or randomized.")
        
        if not features.get("has_https"):
            findings.append("🔴 No HTTPS encryption — data sent to this site is unprotected.")
            recommendations.append("Never enter sensitive data on non-HTTPS sites.")
        
        # API findings
        if verdicts.get("virustotal") == "malicious":
            findings.append("🔴 VirusTotal: Multiple antivirus engines flagged this URL as malicious.")
        if verdicts.get("google_safe_browsing") == "dangerous":
            findings.append("🔴 Google Safe Browsing: This URL is listed as dangerous.")
        if verdicts.get("phishtank") == "listed":
            findings.append("🔴 PhishTank: This URL is in the confirmed phishing database.")
        
        # WHOIS findings
        age = whois.get("age_days")
        if age is not None and age < 30:
            findings.append(f"🟠 Domain was registered only {age} days ago — very new domains are high-risk.")
            recommendations.append("Be extremely cautious with recently registered domains.")
        if whois.get("is_private"):
            findings.append("🟡 Domain WHOIS data is privacy-protected — the owner's identity is hidden.")
        
        # SSL findings
        if ssl_info.get("grade") == "F":
            findings.append("🔴 SSL certificate is invalid, expired, or missing.")
        elif ssl_info.get("grade") == "C":
            findings.append("🟠 SSL certificate expires within 30 days.")
        
        if not recommendations:
            if risk >= 50:
                recommendations = [
                    "Do not enter any credentials or personal information.",
                    "Verify the URL carefully against the official website.",
                    "Report this URL to your security team."
                ]
            else:
                recommendations = ["Continue with standard online safety practices."]
        
        return {
            "explanation": " ".join(findings),
            "findings": findings,
            "recommendations": recommendations,
            "risk_summary": f"Risk Level: {risk}% | ML Model: {ml.get('model', 'N/A')} | Confidence: {ml.get('phishing_probability', 0)}%",
        }
    
    elif scan_type == "text":
        risk = context.get("risk_level", 0)
        categories = context.get("Categories", [])
        
        findings = []
        recommendations = []
        
        if risk >= 80:
            findings.append("⚠️ This message contains strong phishing indicators.")
        elif risk >= 50:
            findings.append("⚡ This message has suspicious characteristics.")
        else:
            findings.append("✅ This message appears relatively harmless.")
        
        for cat in categories:
            if cat == "OTP / Credential Scam":
                findings.append("🔴 Requests sensitive authentication data (OTP/passwords).")
                recommendations.append("NEVER share OTP/PIN/passwords — no legitimate service asks for these.")
            elif cat == "UPI / Payment Fraud":
                findings.append("🔴 Contains UPI/payment manipulation tactics.")
                recommendations.append("Never share UPI PIN. Reject unexpected collect requests.")
            elif cat == "Prize / Lottery Scam":
                findings.append("🟠 Claims prize/lottery winnings — classic social engineering.")
                recommendations.append("If you didn't enter a contest, you didn't win one.")
        
        if not recommendations:
            recommendations = ["Exercise standard caution with unknown senders."]
        
        return {
            "explanation": " ".join(findings),
            "findings": findings,
            "recommendations": recommendations,
        }
    
    return {"explanation": "Analysis complete.", "findings": [], "recommendations": []}

# ── Gemini API Integration ───────────────────────────────────────────
async def explain_with_gemini(scan_type: str, context: dict) -> dict:
    """
    Use Gemini 1.5 Pro to generate contextual threat explanation.
    Falls back to rule-based when API key is unavailable.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    
    if not api_key or api_key.startswith("mock"):
        logger.info("Gemini API key not configured, using rule-based explanation")
        return generate_rule_explanation(scan_type, context)
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel("gemini-1.5-pro")
        
        if scan_type == "url":
            prompt = f"""You are a cybersecurity threat analyst. Analyze this URL scan result and provide:
1. A clear explanation of the threat (2-3 sentences)
2. Key findings (bullet points)
3. Specific recommendations for the user

Scan Results:
- URL: {context.get('final_url', 'Unknown')}
- Risk Level: {context.get('risk_level', 0)}%
- Features: {context.get('features', {})}
- WHOIS: {context.get('whois', {})}
- SSL Grade: {context.get('ssl', {}).get('grade', 'Unknown')}
- VirusTotal: {context.get('api_verdicts', {}).get('virustotal', 'Unknown')}
- Google Safe Browsing: {context.get('api_verdicts', {}).get('google_safe_browsing', 'Unknown')}
- ML Prediction: {context.get('ml_prediction', {})}

Respond in JSON format with keys: explanation, findings (array), recommendations (array)"""
        
        elif scan_type == "text":
            prompt = f"""You are a cybersecurity analyst specializing in phishing/scam detection. Analyze this text message and provide:
1. A clear explanation of why this is/isn't suspicious
2. Key findings
3. Recommendations

Text: "{context.get('text', '')[:500]}"
Risk Level: {context.get('risk_level', 0)}%
Categories: {context.get('Categories', [])}
Language: {context.get('language_detected', 'en')}

Respond in JSON format with keys: explanation, findings (array), recommendations (array)"""
        
        else:
            return generate_rule_explanation(scan_type, context)
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Try to parse as JSON
        import json
        # Strip markdown code fences if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        
        try:
            result = json.loads(text.strip())
            return result
        except json.JSONDecodeError:
            return {
                "explanation": text.strip(),
                "findings": [],
                "recommendations": [],
            }
    
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")
        return generate_rule_explanation(scan_type, context)
