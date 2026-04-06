import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from app.database import get_db
from app.main import scan_url, ScanUrlRequest

async def test():
    db = next(get_db())
    urls = [
        "http://bettingexpert.com"
    ]
    for u in urls:
        req = ScanUrlRequest(url=u)
        res = await scan_url(req, db)
        print(f"URL: {u} | Risk: {res['risk_level']} | Sev: {res.get('explanation', {}).get('severity')} | AI: {res.get('explanation')}")

asyncio.run(test())
