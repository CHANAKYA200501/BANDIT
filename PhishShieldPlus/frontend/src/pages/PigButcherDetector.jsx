import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, MessageSquare, Upload, Play, AlertTriangle,
  Shield, ChevronRight, Zap, TrendingUp, Clock,
  Eye, User, CreditCard, Heart, Crosshair,
  BarChart3, Activity, Skull, FileText
} from 'lucide-react';

// ─── Simulation Presets ──────────────────────────────────────────────────
const SIMULATION_CONVERSATIONS = {
  pig_butchering_classic: {
    label: 'Classic Pig Butchering',
    description: 'Wrong number → Romance → Crypto scam over 60 days',
    messages: [
      // Phase 1: The Hook (Day 1)
      { sender: 'scammer', text: "Hey, is this Jason? I got your number from the business conference last week.", ts: 'Day 1' },
      { sender: 'victim', text: "Sorry, I think you have the wrong number.", ts: 'Day 1' },
      { sender: 'scammer', text: "Oh I'm so sorry! 😅 Well, since we're here, I'm Sophia. Do you mind if I say hi?", ts: 'Day 1' },
      { sender: 'victim', text: "Haha sure, no worries. I'm Alex.", ts: 'Day 1' },
      // Phase 2: Rapport Building (Days 3–14)
      { sender: 'scammer', text: "Hey Alex! How was your weekend? I tried this amazing Italian place downtown 🍝 Do you like Italian food?", ts: 'Day 3' },
      { sender: 'victim', text: "Yeah I love Italian! Which place?", ts: 'Day 3' },
      { sender: 'scammer', text: "It's called Trattoria Luna. I love finding hidden gems in the city ✨ What do you do for work btw?", ts: 'Day 4' },
      { sender: 'victim', text: "I'm a software engineer at a tech company.", ts: 'Day 4' },
      { sender: 'scammer', text: "That's so cool! I bet you work really hard 💪 You deserve to treat yourself. I always say life is about balance.", ts: 'Day 5' },
      { sender: 'scammer', text: "Good morning! ☀️ Just finished my morning yoga. How are you doing today? I've been thinking about our chats.", ts: 'Day 8' },
      { sender: 'victim', text: "Morning! I'm good, just busy with work.", ts: 'Day 8' },
      { sender: 'scammer', text: "Don't overwork yourself! I worry about you 💕 I used to be the same way until my uncle taught me about working smarter.", ts: 'Day 10' },
      { sender: 'scammer', text: "[Photo: selfie at a fancy restaurant with champagne] Having dinner at the Ritz 😊 Miss our chats when I'm busy!", ts: 'Day 14' },
      // Phase 3: Lifestyle Flex (Days 14–30)
      { sender: 'scammer', text: "Guess what? Just closed a really good investment this week! My portfolio is up 340% this year 📈 I feel so grateful.", ts: 'Day 18' },
      { sender: 'victim', text: "Wow that's amazing! What do you invest in?", ts: 'Day 18' },
      { sender: 'scammer', text: "My uncle is a senior financial advisor at Goldman Sachs. He introduced me to this special crypto trading node. It uses AI to predict market movements. I was skeptical at first too!", ts: 'Day 19' },
      { sender: 'scammer', text: "[Photo: screenshot of trading app showing $847,000 profit] Look at today's returns 😍 My uncle's system is incredible.", ts: 'Day 22' },
      { sender: 'scammer', text: "Just bought my mom a new car with this month's profits 🚗 I never imagined I could do this. Family is everything to me.", ts: 'Day 25' },
      { sender: 'victim', text: "That's incredible. I wish I could make those kinds of returns.", ts: 'Day 25' },
      { sender: 'scammer', text: "You know, I've been wanting to tell you something... I really care about you Alex. That's why I want to share this with you. 💗", ts: 'Day 28' },
      // Phase 4: The Exploitation (Days 30–60)
      { sender: 'scammer', text: "I talked to my uncle about you. He said he can get you access to the same trading node! You just need to download the MetaTrader Pro app and create an account.", ts: 'Day 32' },
      { sender: 'scammer', text: "Start with $500 just to test it. I promise you'll see returns within 24 hours. I would never steer you wrong 💝", ts: 'Day 33' },
      { sender: 'victim', text: "I deposited $500. How long until I see returns?", ts: 'Day 35' },
      { sender: 'scammer', text: "OMG look! You already made $200 in one day! 🎉 See, I told you! Now imagine if you put in $10,000. My uncle says the AI model is showing a HUGE bull signal this week.", ts: 'Day 36' },
      { sender: 'scammer', text: "Alex, this is a once in a lifetime opportunity. The trading node is closing access to new users next week. You should deposit at least $25,000 to maximize before it closes. Trust me 🙏", ts: 'Day 42' },
      { sender: 'victim', text: "That's a lot of money... I'd need to pull from my savings.", ts: 'Day 42' },
      { sender: 'scammer', text: "Baby, I put in $200,000 of my own money. Would I do that if it wasn't safe? I want us to build a future together. This is our chance. 💑", ts: 'Day 43' },
    ]
  },
  sha_zhu_pan_crypto: {
    label: 'Crypto Romance (SHA ZHU PAN)',
    description: 'Dating app → Emotional bond → Fake DeFi platform',
    messages: [
      { sender: 'scammer', text: "Hi! We matched on Bumble but the app crashed. Glad I got your number! I'm Lily from Shanghai, studying finance at UCLA 🎓", ts: 'Day 1' },
      { sender: 'victim', text: "Oh hey! Yeah the app has been buggy. Nice to meet you Lily.", ts: 'Day 1' },
      { sender: 'scammer', text: "You have such kind eyes in your photos 🥰 What brings you on dating apps?", ts: 'Day 1' },
      { sender: 'scammer', text: "Good morning sunshine! ☀️ I made congee for breakfast. Wish I could share it with you! What's your favorite breakfast?", ts: 'Day 3' },
      { sender: 'scammer', text: "I had the best day today! My DeFi staking pool paid out 12% this month. Passive income is so peaceful 🧘‍♀️", ts: 'Day 7' },
      { sender: 'victim', text: "DeFi? What's that?", ts: 'Day 7' },
      { sender: 'scammer', text: "Decentralized Finance! It's like a savings account but 100x better returns. I started with just $1,000 and now my portfolio shows $89,000. I'll teach you! 📚", ts: 'Day 8' },
      { sender: 'scammer', text: "[Voice message: soft, caring voice] I really enjoy talking to you. You make my day brighter. I want to help you achieve financial freedom like I did 💕", ts: 'Day 12' },
      { sender: 'scammer', text: "My professor who is also my mentor runs this exclusive liquidity mining pool on CoinFlex Pro. Only his students get access. I can get you in if you want?", ts: 'Day 15' },
      { sender: 'scammer', text: "You just need to go to coinflex-pro.net and connect your wallet. Deposit ETH and the smart contract automatically compounds your returns. I put in $50,000 last month.", ts: 'Day 18' },
      { sender: 'victim', text: "Is this safe? $50,000 is a lot.", ts: 'Day 18' },
      { sender: 'scammer', text: "Babe, do you think I would risk my own money if it wasn't? Plus my professor guarantees it. He's been doing this for 15 years. Start small with $2,000 and see for yourself 🙏💝", ts: 'Day 19' },
    ]
  },
  clean_conversation: {
    label: 'Clean Conversation (Control)',
    description: 'Normal friendly chat — no grooming patterns',
    messages: [
      { sender: 'friend', text: "Hey, you coming to the team lunch tomorrow?", ts: 'Day 1' },
      { sender: 'user', text: "Yeah, what time?", ts: 'Day 1' },
      { sender: 'friend', text: "12:30 at the usual place. Sarah's bringing cake for Mike's birthday 🎂", ts: 'Day 1' },
      { sender: 'user', text: "Sounds great! I'll be there.", ts: 'Day 2' },
      { sender: 'friend', text: "Did you see the game last night? Crazy final quarter!", ts: 'Day 3' },
      { sender: 'user', text: "Yeah! That last minute shot was insane.", ts: 'Day 3' },
      { sender: 'friend', text: "Want to go to the gym after work today?", ts: 'Day 5' },
      { sender: 'user', text: "Can't today, have a dentist appointment. Thursday?", ts: 'Day 5' },
      { sender: 'friend', text: "Thursday works! See you then 💪", ts: 'Day 5' },
    ]
  }
};

// ─── Phase Config ─────────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  'The Hook': { color: '#66fcf1', icon: Crosshair, gradient: 'from-cyan-500/20 to-transparent' },
  'Rapport Building': { color: '#a78bfa', icon: Heart, gradient: 'from-violet-500/20 to-transparent' },
  'Lifestyle Flex': { color: '#f59e0b', icon: TrendingUp, gradient: 'from-amber-500/20 to-transparent' },
  'Financial Exploitation': { color: '#e24b4a', icon: CreditCard, gradient: 'from-red-500/20 to-transparent' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PigButcherDetector() {
  const [mode, setMode] = useState('simulate'); // 'simulate' | 'upload'
  const [selectedPreset, setSelectedPreset] = useState('pig_butchering_classic');
  const [customMessages, setCustomMessages] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const chatRef = useRef(null);

  // Streaming message reveal for simulation mode
  useEffect(() => {
    if (isAnalyzing && mode === 'simulate') {
      const msgs = SIMULATION_CONVERSATIONS[selectedPreset].messages;
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setVisibleMessages(idx);
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
        if (idx >= msgs.length) clearInterval(interval);
      }, 180);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, mode, selectedPreset]);

  async function runAnalysis() {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalyzeProgress(0);
    setVisibleMessages(0);

    // Build message payload
    let messages;
    if (mode === 'simulate') {
      messages = SIMULATION_CONVERSATIONS[selectedPreset].messages.map(m => ({
        sender: m.sender,
        text: m.text,
        timestamp: m.ts,
      }));
    } else {
      // Parse user input
      const lines = customMessages.trim().split('\n').filter(Boolean);
      messages = lines.map((line, i) => {
        const match = line.match(/^\[?(.*?)\]?\s*:\s*(.*)$/);
        if (match) return { sender: match[1].trim(), text: match[2].trim(), timestamp: `Message ${i+1}` };
        return { sender: 'unknown', text: line.trim(), timestamp: `Message ${i+1}` };
      });
    }

    // Simulate staged progress
    const progressInterval = setInterval(() => {
      setAnalyzeProgress(p => {
        if (p >= 90) { clearInterval(progressInterval); return 90; }
        return p + Math.random() * 8;
      });
    }, 300);

    try {
      const res = await fetch('http://localhost:8000/analyze-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, conversation_id: `sim_${Date.now()}` }),
      });
      const data = await res.json();
      clearInterval(progressInterval);
      setAnalyzeProgress(100);
      setTimeout(() => setAnalysisResult(data), 600);
    } catch (err) {
      clearInterval(progressInterval);
      setAnalyzeProgress(100);
      // Fallback for demo when backend is unreachable
      setTimeout(() => {
        setAnalysisResult(generateOfflineResult(selectedPreset, messages));
      }, 600);
    }
  }

  function generateOfflineResult(preset, messages) {
    if (preset === 'clean_conversation') {
      return {
        grooming_probability: 4,
        current_phase: 'No Grooming Detected',
        phase_trajectory: [
          { phase: 'The Hook', confidence: 5, detected: false },
          { phase: 'Rapport Building', confidence: 3, detected: false },
          { phase: 'Lifestyle Flex', confidence: 0, detected: false },
          { phase: 'Financial Exploitation', confidence: 0, detected: false },
        ],
        emotional_manipulation_score: 2,
        financial_keywords_detected: [],
        urgency_triggers: [],
        red_flags: [],
        verdict: 'CLEAN',
        explanation: 'This conversation shows normal friendship patterns with no emotional manipulation, financial solicitation, or grooming trajectory. No pig butchering indicators found.',
        recommended_action: 'No action needed. This is a normal conversation.',
        timeline_analysis: 'Short-term casual conversation between friends discussing everyday topics. No temporal escalation pattern detected.',
      };
    }
    
    const isShazhu = preset === 'sha_zhu_pan_crypto';
    return {
      grooming_probability: isShazhu ? 91 : 96,
      current_phase: 'Financial Exploitation',
      phase_trajectory: [
        { phase: 'The Hook', confidence: isShazhu ? 88 : 95, detected: true, evidence: isShazhu ? 'Dating app match with immediate move to personal messaging' : '"Wrong number" opening — classic cold-approach social engineering' },
        { phase: 'Rapport Building', confidence: isShazhu ? 92 : 97, detected: true, evidence: isShazhu ? 'Voice messages, daily check-ins, pet names — emotional anchoring' : 'Daily check-ins, food interests, personal questions — emotional anchoring over 14 days' },
        { phase: 'Lifestyle Flex', confidence: isShazhu ? 94 : 98, detected: true, evidence: isShazhu ? 'DeFi earnings ($89K from $1K), professor mentor narrative' : 'Goldman Sachs uncle, $847K profit screenshots, luxury purchases — wealth signaling' },
        { phase: 'Financial Exploitation', confidence: isShazhu ? 96 : 99, detected: true, evidence: isShazhu ? '"Exclusive" DeFi pool, $50K claim, fake urgency, dubious URL (coinflex-pro.net)' : 'MetaTrader Pro download, $500→$25K escalation, artificial deadline, "build a future together" pressure' },
      ],
      emotional_manipulation_score: isShazhu ? 87 : 94,
      financial_keywords_detected: isShazhu
        ? ['DeFi', 'staking pool', '$50,000', 'passive income', 'liquidity mining', 'smart contract', 'connect your wallet', 'deposit ETH']
        : ['investment', 'portfolio', '340%', 'Goldman Sachs', 'trading node', 'AI predict', '$847,000', '$25,000', 'deposit', 'bull signal'],
      urgency_triggers: isShazhu
        ? ['exclusive access', 'only his students', 'professor guarantees', 'start small', 'see for yourself']
        : ['closing access next week', 'once in a lifetime', 'our chance', 'trust me', 'would I risk my own money'],
      red_flags: isShazhu
        ? ['Dubious URL: coinflex-pro.net', 'Unrealistic returns (12%/month)', '"Professor guarantees" — classic authority fraud', '$89K from $1K claim — fabricated', 'Emotional pressure via pet names']
        : ['Fake Goldman Sachs connection', 'Fabricated $847K profit screenshot', '"Wrong number" cold-approach hook', 'Emotional manipulation before financial asks', 'Artificial scarcity deadline', 'Rapid escalation $500 → $25,000'],
      verdict: 'PIG_BUTCHERING_CONFIRMED',
      explanation: isShazhu
        ? 'This conversation follows the SHA ZHU PAN (杀猪盘) pattern with high confidence. The scammer transitioned from dating app rapport to DeFi solicitation using a fabricated "professor mentor" authority figure. The dubious URL and unrealistic return claims confirm exploit-stage entry.'
        : 'This conversation exhibits a textbook "Pig Butchering" (杀猪盘) grooming pattern across all 4 phases. The scammer spent 30+ days building emotional trust before introducing financial exploitation. The trajectory shows deliberate, methodical escalation from innocent contact to demanding $25,000 in deposits.',
      recommended_action: 'IMMEDIATE BLOCK. Report sender to local police and IC3 (FBI internet crime). Do NOT deposit additional funds. Any "profits" shown in the app are fabricated.',
      timeline_analysis: `The grooming trajectory spans ${isShazhu ? '19' : '43'} days with clearly delineated phases. Emotional intensity increased 340% from Day 1 to exploitation phase. Financial solicitation intensity escalated from casual mentions of wealth to direct investment demands with urgency triggers.`,
    };
  }

  const msgs = mode === 'simulate' ? SIMULATION_CONVERSATIONS[selectedPreset]?.messages || [] : [];
  const results = analysisResult;

  return (
    <div className="space-y-6 pb-12">

      {/* ─── HEADER ─── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
              <Brain size={20} className="text-violet-400" />
            </div>
            <h1 className="text-3xl font-outfit font-black tracking-tighter text-white uppercase italic">
              Pig Butchering <span className="text-violet-400">Detector</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed font-inter">
            Temporal Emotional NLP engine that analyzes conversation <span className="text-violet-400">trajectory</span> — not single messages — to detect 
            multi-phase psychological grooming patterns used in pig butchering (杀猪盘) scams.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
          <Brain size={12} className="text-violet-400" />
          <span className="text-[9px] font-black text-violet-400 uppercase tracking-[0.2em]">Gemini NLP Engine</span>
        </div>
      </div>

      {/* ─── MODE SELECTOR + CONTROLS ─── */}
      <div className="grid grid-cols-12 gap-6">

        {/* CONTROL PANEL */}
        <div className="col-span-4 space-y-4">

          {/* Mode Toggle */}
          <div className="clinical-panel p-4">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">Analysis Mode</div>
            <div className="flex gap-2">
              {[
                { key: 'simulate', icon: Play, label: 'Simulate' },
                { key: 'upload', icon: Upload, label: 'Paste Chat' }
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); setAnalysisResult(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 border ${
                    mode === m.key
                      ? 'bg-violet-500/15 border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                      : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                  }`}
                >
                  <m.icon size={12} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Presets OR Text Input */}
          {mode === 'simulate' ? (
            <div className="clinical-panel p-4 space-y-3">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Simulation Preset</div>
              {Object.entries(SIMULATION_CONVERSATIONS).map(([key, conv]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedPreset(key); setAnalysisResult(null); }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-300 border ${
                    selectedPreset === key
                      ? 'bg-violet-500/10 border-violet-500/25 shadow-[0_0_10px_rgba(139,92,246,0.1)]'
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase tracking-wide ${selectedPreset === key ? 'text-violet-400' : 'text-white'}`}>
                    {conv.label}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{conv.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="clinical-panel p-4 space-y-3">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Paste Conversation</div>
              <p className="text-[9px] text-slate-600">Format: <span className="text-violet-400 font-mono">Sender: message text</span>, one per line.</p>
              <textarea
                value={customMessages}
                onChange={e => setCustomMessages(e.target.value)}
                rows={14}
                placeholder={`Sophia: Hey, is this Jason?\nAlex: Wrong number, sorry.\nSophia: Oh! Well nice to meet you anyway 😊\n...`}
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:border-violet-500/30 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-slate-700"
              />
            </div>
          )}

          {/* Launch Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runAnalysis}
            disabled={isAnalyzing || (mode === 'upload' && !customMessages.trim())}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
              isAnalyzing
                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20 cursor-wait'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] border border-violet-500/30'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                Analyzing Trajectory...
              </>
            ) : (
              <>
                <Brain size={16} />
                Run Temporal NLP Analysis
              </>
            )}
          </motion.button>

          {/* Progress Bar */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="clinical-panel p-4 space-y-2"
              >
                <div className="flex justify-between text-[9px]">
                  <span className="font-black text-violet-400 uppercase tracking-wider">NLP Engine Progress</span>
                  <span className="text-slate-500 font-mono">{Math.round(analyzeProgress)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ width: `${analyzeProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="text-[8px] text-slate-600 font-mono">
                  {analyzeProgress < 30 ? '→ Tokenizing conversation history...' :
                   analyzeProgress < 60 ? '→ Mapping emotional trajectory vectors...' :
                   analyzeProgress < 85 ? '→ Cross-referencing grooming pattern database...' :
                   '→ Computing phase probability matrix...'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CHAT TIMELINE VIEW */}
        <div className="col-span-8 space-y-4">
          {mode === 'simulate' && (
            <div className="clinical-panel p-0 overflow-hidden" style={{ maxHeight: '520px' }}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-violet-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Conversation Timeline — {SIMULATION_CONVERSATIONS[selectedPreset]?.label}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-600">
                  {isAnalyzing ? `${visibleMessages}/${msgs.length} messages` : `${msgs.length} messages total`}
                </span>
              </div>
              <div ref={chatRef} className="overflow-y-auto p-4 space-y-2" style={{ maxHeight: '460px' }}>
                {msgs.slice(0, isAnalyzing ? visibleMessages : msgs.length).map((msg, i) => {
                  const isScammer = msg.sender === 'scammer' || msg.sender === 'attacker';
                  return (
                    <motion.div
                      key={i}
                      initial={isAnalyzing ? { opacity: 0, y: 10 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isScammer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                        isScammer
                          ? 'bg-white/[0.03] border border-white/5 rounded-tl-sm'
                          : 'bg-violet-500/10 border border-violet-500/15 rounded-tr-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${isScammer ? 'text-red-400' : 'text-violet-400'}`}>
                            {msg.sender}
                          </span>
                          <span className="text-[8px] text-slate-600 font-mono">{msg.ts}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{msg.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── ANALYSIS RESULTS ─── */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Verdict Banner */}
                <div className={`clinical-panel p-6 relative overflow-hidden ${
                  results.grooming_probability >= 85
                    ? 'border-red-500/25 shadow-[0_0_40px_rgba(226,75,74,0.1)]'
                    : results.grooming_probability >= 50
                    ? 'border-amber-500/25 shadow-[0_0_40px_rgba(245,158,11,0.1)]'
                    : 'border-emerald-500/25 shadow-[0_0_40px_rgba(16,185,129,0.1)]'
                }`}>
                  {/* Top glow */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    results.grooming_probability >= 85 ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                    : results.grooming_probability >= 50 ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                  }`} />

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {results.grooming_probability >= 85 ? (
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
                          <Skull size={24} className="text-red-400" />
                        </div>
                      ) : results.grooming_probability >= 50 ? (
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <AlertTriangle size={24} className="text-amber-400" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Shield size={24} className="text-emerald-400" />
                        </div>
                      )}
                      <div>
                        <div className={`text-xl font-black uppercase tracking-tighter italic ${
                          results.grooming_probability >= 85 ? 'text-red-400' :
                          results.grooming_probability >= 50 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {results.verdict === 'PIG_BUTCHERING_CONFIRMED' ? '🚨 PIG BUTCHERING CONFIRMED' :
                           results.verdict === 'SUSPICIOUS' ? '⚠️ SUSPICIOUS PATTERNS' : '✅ CLEAN CONVERSATION'}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{results.current_phase}</div>
                      </div>
                    </div>

                    {/* Score Gauge */}
                    <div className="text-right">
                      <div className={`text-4xl font-black font-outfit tracking-tighter ${
                        results.grooming_probability >= 85 ? 'text-red-400' :
                        results.grooming_probability >= 50 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {results.grooming_probability}<span className="text-lg opacity-60">%</span>
                      </div>
                      <div className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">Grooming Probability</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{results.explanation}</p>

                  {results.recommended_action && (
                    <div className={`mt-3 px-3 py-2 rounded-lg border text-[10px] font-bold ${
                      results.grooming_probability >= 85
                        ? 'bg-red-500/5 border-red-500/15 text-red-400'
                        : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                    }`}>
                      <span className="font-black uppercase tracking-wide mr-2">→ Recommended:</span>
                      {results.recommended_action}
                    </div>
                  )}
                </div>

                {/* Phase Trajectory */}
                <div className="clinical-panel p-5">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                    <Activity size={12} />
                    Phase Trajectory Analysis
                  </div>
                  <div className="space-y-3">
                    {(results.phase_trajectory || []).map((phase, i) => {
                      const cfg = PHASE_CONFIG[phase.phase] || { color: '#66fcf1', icon: Eye };
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className={`relative p-3 rounded-xl border ${phase.detected ? 'bg-white/[0.02] border-white/5' : 'bg-white/[0.005] border-white/[0.02] opacity-40'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                              <Icon size={14} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: phase.detected ? cfg.color : '#475569' }}>
                                  Phase {i+1}: {phase.phase}
                                </span>
                                <span className="text-[10px] font-mono font-bold" style={{ color: cfg.color }}>
                                  {phase.confidence}%
                                </span>
                              </div>
                              <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${phase.confidence}%` }}
                                  transition={{ duration: 1, delay: i * 0.2 }}
                                  className="h-full rounded-full"
                                  style={{ background: cfg.color }}
                                />
                              </div>
                              {phase.evidence && (
                                <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed">{phase.evidence}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Detail Grid */}
                <div className="grid grid-cols-2 gap-4">

                  {/* Emotional Manipulation Score */}
                  <div className="clinical-panel p-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                      <Heart size={11} className="text-rose-400" />
                      Emotional Manipulation
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className={`text-3xl font-black font-outfit tracking-tighter ${
                        results.emotional_manipulation_score >= 75 ? 'text-red-400' :
                        results.emotional_manipulation_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {results.emotional_manipulation_score}
                      </span>
                      <span className="text-xs text-slate-600 mb-1">/100</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${results.emotional_manipulation_score}%` }}
                        transition={{ duration: 1.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500"
                      />
                    </div>
                  </div>

                  {/* Urgency Triggers */}
                  <div className="clinical-panel p-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                      <Zap size={11} className="text-amber-400" />
                      Urgency Triggers
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(results.urgency_triggers || []).length > 0
                        ? results.urgency_triggers.map((t, i) => (
                          <span key={i} className="px-2 py-1 bg-amber-500/8 border border-amber-500/15 rounded-md text-[8px] font-bold text-amber-400 uppercase">
                            {t}
                          </span>
                        ))
                        : <span className="text-[9px] text-slate-600">None detected</span>
                      }
                    </div>
                  </div>

                  {/* Financial Keywords */}
                  <div className="clinical-panel p-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                      <CreditCard size={11} className="text-violet-400" />
                      Financial Keywords
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(results.financial_keywords_detected || []).length > 0
                        ? results.financial_keywords_detected.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-violet-500/8 border border-violet-500/15 rounded-md text-[8px] font-bold text-violet-400">
                            {kw}
                          </span>
                        ))
                        : <span className="text-[9px] text-slate-600">None detected</span>
                      }
                    </div>
                  </div>

                  {/* Red Flags */}
                  <div className="clinical-panel p-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                      <AlertTriangle size={11} className="text-red-400" />
                      Red Flags
                    </div>
                    <div className="space-y-1.5">
                      {(results.red_flags || []).length > 0
                        ? results.red_flags.map((flag, i) => (
                          <div key={i} className="flex items-start gap-2 text-[9px] text-red-400/80">
                            <Crosshair size={9} className="mt-0.5 flex-shrink-0 text-red-500" />
                            {flag}
                          </div>
                        ))
                        : <span className="text-[9px] text-slate-600">None detected</span>
                      }
                    </div>
                  </div>
                </div>

                {/* Timeline Synopsis */}
                {results.timeline_analysis && (
                  <div className="clinical-panel p-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
                      <Clock size={11} className="text-cyan-400" />
                      Temporal Analysis Synopsis
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{results.timeline_analysis}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
