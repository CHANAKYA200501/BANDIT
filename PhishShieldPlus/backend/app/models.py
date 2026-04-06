from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.database import Base
import datetime

class ThreatLog(Base):
    __tablename__ = "threat_logs"

    id = Column(Integer, primary_key=True, index=True)
    payload_url = Column(String, index=True)
    risk_score = Column(Integer)
    confidence = Column(Integer)
    is_blocked = Column(Boolean, default=False)
    source_ip = Column(String, default="127.0.0.1")
    threat_tactics = Column(String)  # JSON stringified array of tactics
    blockchain_hash = Column(String, default="pending")
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
