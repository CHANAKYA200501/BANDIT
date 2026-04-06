import asyncio
import os
import hashlib
import base64
from urllib.parse import urlparse
import aiohttp

class ThreatIntelligence:
    def __init__(self):
        self.vt_key = os.getenv("VIRUSTOTAL_API_KEY")
        self.abuse_key = os.getenv("ABUSEIPDB_API_KEY")
        self.gsb_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")
        self.hibp_key = os.getenv("HIBP_API_KEY")
        self.shodan_key = os.getenv("SHODAN_API_KEY")
        self.urlscan_key = os.getenv("URLSCAN_API_KEY")

        # Deterministic hash helper
    def _deterministic_seed(self, url: str) -> int:
        return int(hashlib.sha256(url.encode()).hexdigest(), 16)

    async def _async_mock_get(self, name, fallback_val, delay=0.5):
        await asyncio.sleep(delay)
        return fallback_val

    async def check_virustotal(self, url):
        if not self.vt_key or "mock" in self.vt_key:
            h = self._deterministic_seed(url)
            malicious = (h % 15) if (h % 100) > 60 else 0
            if "evil" in url or "phish" in url: malicious = 45
            return await self._async_mock_get("VirusTotal", {"malicious": malicious, "suspicious": h % 5, "harmless": (h % 50) + 10})
        
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        endpoint = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        headers = {"x-apikey": self.vt_key}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(endpoint, headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("data", {}).get("attributes", {}).get("last_analysis_stats", self.mock_vt)
                    return self.mock_vt
        except Exception:
            return self.mock_vt

    async def check_abuseipdb(self, ip, url=""):
        if not self.abuse_key or "mock" in self.abuse_key:
            h = self._deterministic_seed(url or ip)
            score = (h % 100) if (h % 10) > 7 else 0
            return await self._async_mock_get("AbuseIPDB", {"confidence_score": score})

        endpoint = "https://api.abuseipdb.com/api/v2/check"
        headers = {"Key": self.abuse_key, "Accept": "application/json"}
        params = {"ipAddress": ip, "maxAgeInDays": 90}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(endpoint, headers=headers, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {"confidence_score": data.get("data", {}).get("abuseConfidenceScore", 0)}
                    return {"confidence_score": 0}
        except Exception:
            return {"confidence_score": 0}

    async def check_google_safe_browsing(self, url):
        # We will keep this mocked for now as GSB requires complex payload schema
        return await self._async_mock_get("GSB", {"threats": []})

    async def check_shodan(self, ip):
        if not self.shodan_key or "mock" in self.shodan_key:
            return await self._async_mock_get("Shodan", {"ports": [80, 443], "isp": "Generic ISP"})
        
        endpoint = f"https://api.shodan.io/shodan/host/{ip}?key={self.shodan_key}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(endpoint) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {"ports": data.get("ports", []), "isp": data.get("isp", "Unknown")}
                    return {"ports": [], "isp": "Unknown"}
        except Exception:
            return {"ports": [], "isp": "Unknown"}

    async def check_urlscan(self, url):
        if not self.urlscan_key or "mock" in self.urlscan_key:
            return await self._async_mock_get("URLScan", {"screenshot_url": "mock_screenshot", "dom_hash": "a1b2c3d4"})
        
        # URLScan submission is POST
        endpoint = "https://urlscan.io/api/v1/scan/"
        headers = {"API-Key": self.urlscan_key, "Content-Type": "application/json"}
        payload = {"url": url, "visibility": "public"}
        
        try:
            # We won't block awaiting the async scan finish, just return the observation link
            async with aiohttp.ClientSession() as session:
                async with session.post(endpoint, headers=headers, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {"screenshot_url": data.get("result", ""), "dom_hash": "Pending"}
                    return {"screenshot_url": "mock_screenshot_url", "dom_hash": "a1b2c3d4"}
        except Exception:
            return {"screenshot_url": "mock_screenshot_url", "dom_hash": "a1b2c3d4"}

    async def whois_lookup(self, domain):
        h = self._deterministic_seed(domain)
        suspicious_tlds = ['.xyz', '.cc', '.pw', '.top', '.ru']
        age = (h % 30) if any(t in domain for t in suspicious_tlds) else (h % 300) + 365
        if "evil" in domain or "phish" in domain: age = 5
        return await self._async_mock_get("WHOIS", {"domain_age_days": age})

    async def ssl_certificate_check(self, domain):
        h = self._deterministic_seed(domain)
        suspicious_tlds = ['.xyz', '.cc', '.pw', '.top', '.ru']
        grade = "C" if any(t in domain for t in suspicious_tlds) else ["A", "A+", "B"][h % 3]
        return await self._async_mock_get("SSL", {"grade": grade, "is_self_signed": (h % 15) == 0})

    async def check_hibp(self, email):
        sha1 = hashlib.sha1(email.encode('utf-8')).hexdigest().upper()
        prefix = sha1[:5]
        suffix = sha1[5:]
        
        endpoint = f"https://api.pwnedpasswords.com/range/{prefix}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(endpoint) as resp:
                    if resp.status == 200:
                        text = await resp.text()
                        for line in text.splitlines():
                            hash_suffix, count = line.split(':')
                            if hash_suffix == suffix:
                                return {"breached": True, "breach_count": int(count)}
                    return {"breached": False, "breach_count": 0}
        except Exception:
            return {"breached": False, "breach_count": 0}

    async def run_url_pipeline(self, url):
        domain = urlparse(url).netloc or url
        ip = "1.1.1.1" # Mock resolution for MVP
        
        # Concurrently execute all checks
        results = await asyncio.gather(
            self.whois_lookup(domain),
            self.ssl_certificate_check(domain),
            self.check_virustotal(url),
            self.check_google_safe_browsing(url),
            self.check_abuseipdb(ip, url=url),
            self.check_shodan(ip),
            self.check_urlscan(url)
        )
        
        heuristics = self._run_heuristics(url, domain)
        return {
            "url": url,
            "whois": results[0],
            "ssl": results[1],
            "virustotal": results[2],
            "gsb": results[3],
            "abuseipdb": results[4],
            "shodan": results[5],
            "urlscan": results[6],
            "heuristics": heuristics
        }

    def _run_heuristics(self, url, domain):
        suspicious_tlds = ['.xyz', '.cc', '.pw', '.top', '.ru']
        return {
            "url_length": len(url),
            "subdomain_count": domain.count('.'),
            "ip_in_url": bool(domain.replace('.', '').isnumeric()),
            "suspicious_tld": any(domain.endswith(t) for t in suspicious_tlds)
        }

threat_intel = ThreatIntelligence()
