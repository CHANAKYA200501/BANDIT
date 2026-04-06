import asyncio
import websockets
async def test():
    try:
        async with websockets.connect("ws://localhost:8000/ws/monitor") as ws:
            print("Connected!")
            await ws.send("http://example.com")
            res = await ws.recv()
            print("Received:", res)
    except Exception as e:
        print("Error:", e)
asyncio.run(test())
