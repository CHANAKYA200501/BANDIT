import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useThreatStore } from '../store/threatStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function useSocket() {
  const { addThreat, setLiveThreats, addFeed, addChainEvent, setChainEvents, setBreach, setStats, triggerKillSwitch, addPoisonLog, addScammerRecord } = useThreatStore();

  useEffect(() => {
    // 🚀 INITIAL HYDRATION
    const initData = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/init-data`);
        if (resp.ok) {
          const { stats, recent_threats, chain_events } = await resp.json();
          setStats(stats);
          setLiveThreats(recent_threats);
          setChainEvents(chain_events || []);
        }
      } catch (e) {
        console.warn("[PhishShield+] Hydration failed:", e);
      }
    };
    initData();

    // 📡 REAL-TIME SOCKET
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    // ... (rest)

    socket.on("connect", () => console.log("Socket connected"));
    
    socket.on("threat_detected", (data) => addThreat(data));
    socket.on("feed_update", (data) => addFeed(data));
    socket.on("chain_event", (data) => addChainEvent(data));
    socket.on("breach_alert", (data) => setBreach(data));
    socket.on("stats_update", (data) => setStats(data));
    socket.on("kill_switch", (data) => triggerKillSwitch(data));
    socket.on("poison_progress", (data) => addPoisonLog(data));
    socket.on("scammer_recv", (data) => addScammerRecord(data));

    return () => socket.disconnect();
  }, [addThreat, addFeed, addChainEvent, setBreach, setStats, triggerKillSwitch, addPoisonLog, addScammerRecord]);
}
