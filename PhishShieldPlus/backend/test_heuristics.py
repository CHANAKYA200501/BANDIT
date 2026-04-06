import asyncio
from app.database import get_db
from app.main import scan_url, ScanUrlRequest
from app.services.threat_intelligence import threat_intel

async def test():
    db = next(get_db())
    urls = [
        "http://google.com",
        "http://paypal-security-update.com",
        "http://apple-verification.com/login",
        "http://chase-bank-support.com"
    ]
    for u in urls:
        vt = await threat_intel.check_virustotal(u)
        print(f"URL: {u} | VT: {vt}")

asyncio.run(test())
