import { create } from 'zustand';

export const useThreatStore = create((set) => ({
  liveThreats: [],
  feedUpdates: [],
  chainEvents: [],
  breachInfo: null,
  stats: {
    threats_today: 0,
    scans_total: 0,
    blocked_count: 0
  },
  killSwitchTriggered: null,
  poisonLogs: [],
  offensiveMode: false,

  addThreat: (threat) => set((state) => ({
    liveThreats: [threat, ...state.liveThreats].slice(0, 50)
  })),

  addFeed: (feed) => set((state) => ({
    feedUpdates: [feed, ...state.feedUpdates].slice(0, 100)
  })),

  addChainEvent: (event) => set((state) => ({
    chainEvents: [event, ...state.chainEvents].slice(0, 50)
  })),

  setBreach: (info) => set({ breachInfo: info }),
  
  setStats: (stats) => set({ stats }),

  triggerKillSwitch: (data) => set({ killSwitchTriggered: data }),
  
  clearKillSwitch: () => set({ killSwitchTriggered: null }),

  addPoisonLog: (log) => set((state) => ({
    poisonLogs: [log, ...state.poisonLogs].slice(0, 200)
  })),

  clearPoisonLogs: () => set({ poisonLogs: [] }),

  setOffensiveMode: (mode) => set({ offensiveMode: mode })
}));
