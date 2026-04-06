import asyncio
from app.database import get_db
from app.main import scan_url, ScanUrlRequest

async def test():
    db = next(get_db())
    req = ScanUrlRequest(url="http://google.com")
    try:
        res = await scan_url(req, db)
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
