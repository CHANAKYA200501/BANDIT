"""
Redis Pub/Sub Bridge
Subscribes to Redis channels for threats from Celery workers and forwards to Socket.IO.
"""
import os
import json
import asyncio
import logging
import threading
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CHANNEL_THREATS = "phishshield:threats"
CHANNEL_STATS = "phishshield:stats"

class RedisPubSubBridge:
    """Bridge between Redis Pub/Sub and Socket.IO for real-time event broadcasting."""
    
    def __init__(self, sio):
        self.sio = sio
        self._running = False
        self._thread = None
    
    def start(self):
        """Start the Redis subscriber in a background thread."""
        try:
            import redis
            self._running = True
            self._thread = threading.Thread(target=self._subscribe_loop, daemon=True)
            self._thread.start()
            logger.info("Redis Pub/Sub bridge started")
        except ImportError:
            logger.warning("Redis package not installed, Pub/Sub bridge disabled")
        except Exception as e:
            logger.warning(f"Redis Pub/Sub bridge failed to start: {e}")
    
    def _subscribe_loop(self):
        """Main subscription loop running in a background thread."""
        try:
            import redis
            r = redis.from_url(REDIS_URL)
            pubsub = r.pubsub()
            pubsub.subscribe(CHANNEL_THREATS, CHANNEL_STATS)
            
            logger.info(f"Subscribed to Redis channels: {CHANNEL_THREATS}, {CHANNEL_STATS}")
            
            for message in pubsub.listen():
                if not self._running:
                    break
                
                if message["type"] != "message":
                    continue
                
                try:
                    data = json.loads(message["data"])
                    channel = message["channel"]
                    if isinstance(channel, bytes):
                        channel = channel.decode()
                    
                    if channel == CHANNEL_THREATS:
                        # Emit threat to all connected clients
                        asyncio.run(self.sio.emit("feed_update", data))
                        logger.debug(f"Broadcasted threat: {data.get('domain', 'unknown')}")
                    
                    elif channel == CHANNEL_STATS:
                        asyncio.run(self.sio.emit("stats_update", data))
                        logger.debug("Broadcasted stats update")
                
                except Exception as e:
                    logger.warning(f"Error processing Redis message: {e}")
        
        except Exception as e:
            logger.warning(f"Redis subscription loop error: {e}")
    
    def stop(self):
        """Stop the subscriber."""
        self._running = False

# ── Helper to publish from anywhere ──────────────────────────────────
def publish_threat(threat_data: dict):
    """Publish a threat to the Redis channel (called from Celery workers)."""
    try:
        import redis
        r = redis.from_url(REDIS_URL)
        r.publish(CHANNEL_THREATS, json.dumps(threat_data))
    except Exception as e:
        logger.warning(f"Failed to publish threat to Redis: {e}")

def publish_stats(stats_data: dict):
    """Publish stats update to the Redis channel."""
    try:
        import redis
        r = redis.from_url(REDIS_URL)
        r.publish(CHANNEL_STATS, json.dumps(stats_data))
    except Exception as e:
        logger.warning(f"Failed to publish stats to Redis: {e}")
