import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useThreatStore } from '../store/threatStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function useSocket() {
  const { addThreat, addFeed, addChainEvent, setBreach, setStats, triggerKillSwitch } = useThreatStore();

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ["websocket"] });

    socket.on("connect", () => console.log("Socket connected"));
    
    socket.on("threat_detected", (data) => addThreat(data));
    socket.on("feed_update", (data) => addFeed(data));
    socket.on("chain_event", (data) => addChainEvent(data));
    socket.on("breach_alert", (data) => setBreach(data));
    socket.on("stats_update", (data) => setStats(data));
    socket.on("kill_switch", (data) => triggerKillSwitch(data));

    return () => socket.disconnect();
  }, [addThreat, addFeed, addChainEvent, setBreach, setStats, triggerKillSwitch]);
}
