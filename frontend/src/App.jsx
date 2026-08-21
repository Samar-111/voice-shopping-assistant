import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Check, 
  Trash2, 
  Cpu, 
  Layers, 
  Plus, 
  Command, 
  Search, 
  X, 
  Smartphone, 
  LayoutGrid, 
  IndianRupee, 
  Tag, 
  Terminal, 
  Crosshair, 
  Gauge,
  History,
  Sun,
  Flame
} from 'lucide-react';
import { useVoice } from './hooks/useVoice';

const API_BASE = 'https://voice-shopping-assistant-50mm.onrender.com/api/shopping';

function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'start') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'stop') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      [659.25, 880, 1174.66, 1760].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.04);
        g.gain.setValueAtTime(0.05, now + idx * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.04);
        o.stop(now + idx * 0.04 + 0.25);
      });
    } else if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'delete') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {}
}

export default function App() {
  const [items, setItems] = useState([]);
  const [statusMessage, setStatusMessage] = useState('QUANTUM CORE ARMED // STANDBY FOR SPEECH INGEST');
  const [language, setLanguage] = useState('en-US');
  const [substitutes, setSubstitutes] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isMinimalMode, setIsMinimalMode] = useState(false);
  const [pingLatency, setPingLatency] = useState(18);
  const [smartData, setSmartData] = useState({ season: 'Summer', seasonalItems: [], depletionAlerts: [] });

  const loadData = async () => {
    const start = performance.now();
    try {
      const [itemsRes, suggestionsRes] = await Promise.all([
        axios.get(`${API_BASE}/items`),
        axios.get(`${API_BASE}/smart-suggestions`)
      ]);
      if (Array.isArray(itemsRes.data)) setItems(itemsRes.data);
      if (suggestionsRes.data) setSmartData(suggestionsRes.data);
      setActiveFilter(null);
      setPingLatency(Math.round(performance.now() - start));
    } catch (err) {
      setStatusMessage('OFFLINE // SYNAPSE OFFLINE • VERIFY PORT 5000');
    }
  };

  const handleVoiceCommand = async (command) => {
    if (!command || !command.trim()) return;

    const start = performance.now();
    setStatusMessage(`DECODING SPECTRAL STREAM: "${command.toUpperCase()}"...`);
    try {
      const res = await axios.post(`${API_BASE}/voice-command`, { transcript: command });
      
      const updatedList = Array.isArray(res.data?.items) ? res.data.items : [];
      const responseText = res.data?.speechResponse || 'Subroutine executed.';
      
      setItems(updatedList);
      setActiveFilter(res.data?.activeFilter || null);
      if (res.data?.suggestions) setSmartData(res.data.suggestions);
      setStatusMessage(responseText.toUpperCase());
      setPingLatency(Math.round(performance.now() - start));
      
      playSound('success');
      speak(responseText);

      const foundSubstitutes = res.data?.intent?.items?.flatMap(i => i.substitutes || []) || [];
      setSubstitutes(foundSubstitutes);
    } catch (err) {
      console.error(err);
      setStatusMessage('FATAL // BACKEND BUS TIMEOUT');
    }
  };

  const { isListening, transcript, startListening, stopListening, speak } = useVoice({
    onFinalResult: handleVoiceCommand,
    language
  });

  useEffect(() => {
    loadData();
  }, []);

  const toggleItem = async (id) => {
    try {
      playSound('tick');
      const res = await axios.put(`${API_BASE}/items/${id}/toggle`);
      if (res.data && res.data._id) {
        setItems(prev => prev.map(i => i._id === id ? res.data : i));
        axios.get(`${API_BASE}/smart-suggestions`).then(r => setSmartData(r.data)).catch(() => {});
      }
    } catch (err) {}
  };

  const deleteItem = async (id) => {
    try {
      playSound('delete');
      await axios.delete(`${API_BASE}/items/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      axios.get(`${API_BASE}/smart-suggestions`).then(r => setSmartData(r.data)).catch(() => {});
    } catch (err) {}
  };

  const safeItems = Array.isArray(items) ? items : [];
  const completedCount = safeItems.filter(item => item?.purchased).length;
  
  const estimatedTotal = safeItems.reduce((acc, i) => {
    const price = typeof i.price === 'number' ? i.price : parseFloat(i.price) || 0;
    const qty = typeof i.quantity === 'number' ? i.quantity : parseInt(i.quantity) || 1;
    return acc + (price * qty);
  }, 0);

  const categories = safeItems.reduce((acc, item) => {
    if (!item) return acc;
    const cat = item.category || 'Other';
    acc[cat] = acc[cat] || [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 cyber-grid overflow-x-hidden pb-48">
      <div className="fixed inset-0 scanlines pointer-events-none z-50 opacity-40" />
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-500/15 rounded-full blur-[160px] pointer-events-none" />

      
      <header className="sticky top-0 z-40 bg-[#030712]/90 backdrop-blur-2xl border-b border-cyan-950/80 px-4 sm:px-8 py-3.5 shadow-lg shadow-cyan-950/30">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-11 h-11 bg-cyan-950/60 border border-cyan-500/40 cyber-cut-sm">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-cyan-400" />
              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-cyan-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-[0.25em] uppercase text-cyan-400">
                  NEXUS • CART
                </span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[9px] font-bold text-cyan-300 border border-cyan-500/40">
                  AI_ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-widest font-mono">PREDICTIVE REORDER & HARVEST SYNAPSE</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 bg-slate-900/80 border border-slate-800 cyber-cut-sm text-[11px]">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Gauge className="w-3.5 h-3.5" />
                <span>PING: {pingLatency}ms</span>
              </div>
              <div className="w-[1px] h-3 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>EST: ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={() => setIsMinimalMode(!isMinimalMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border cyber-cut-sm text-[11px] font-bold transition ${
                isMinimalMode 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              {isMinimalMode ? <Smartphone className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isMinimalMode ? 'DETAILED DASH' : 'MINIMAL LIST'}</span>
            </button>

            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-900 text-cyan-400 border border-cyan-900/60 cyber-cut-sm px-2.5 py-1.5 text-xs outline-none cursor-pointer"
            >
              <option value="en-US">LOC // EN</option>
              <option value="hi-IN">LOC // HI</option>
              <option value="es-ES">LOC // ES</option>
              <option value="fr-FR">LOC // FR</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        
        <div className="relative bg-slate-950/90 border border-cyan-500/30 p-5 cyber-cut shadow-2xl backdrop-blur-xl mb-6 overflow-hidden">
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3 border-b border-cyan-950 pb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-400/80">
                {isListening ? 'INGESTING AUDIO TELEMETRY...' : 'STATUS FEEDBACK'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
              <Crosshair className="w-3 h-3 text-cyan-400 animate-spin-slow" />
              <span>SYNC: {completedCount}/{safeItems.length}</span>
            </div>
          </div>

          <p className="text-sm sm:text-base font-medium text-cyan-200 tracking-wide break-words">
            {statusMessage}
          </p>

          {transcript && (
            <div className="mt-3 pt-3 border-t border-cyan-950/80 flex items-center gap-2 bg-cyan-950/20 px-3 py-2 border-l-2 border-l-yellow-400">
              <Terminal className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-300">
                RAW SPEECH: <span className="text-white font-bold">"{transcript}"</span>
              </p>
            </div>
          )}
        </div>

        {/* 1. PRODUCT RECOMMENDATIONS & RUNNING LOW ALERTS */}
        {smartData.depletionAlerts && smartData.depletionAlerts.length > 0 && (
          <div className="mb-6 p-4 bg-amber-950/20 border border-amber-500/40 cyber-cut-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  SMART HABIT PREDICTIONS // ITEMS YOU ARE RUNNING LOW ON
                </span>
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono">PURCHASE CYCLE ENGINE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {smartData.depletionAlerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className="bg-amber-950/40 border border-amber-500/30 p-3 cyber-cut-sm flex items-center justify-between gap-3 hover:border-amber-400 transition group"
                >
                  <div>
                    <p className="text-xs text-amber-200 font-semibold italic">"{alert.message}"</p>
                    <p className="text-[10px] text-amber-400/80 font-mono mt-1">EST: ₹{alert.price} • {alert.category}</p>
                  </div>
                  <button
                    onClick={() => handleVoiceCommand(`Add ${alert.name}`)}
                    className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/50 px-2.5 py-1.5 text-xs font-bold shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>RESTOCK</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. SEASONAL RECOMMENDATIONS */}
        {smartData.seasonalItems && smartData.seasonalItems.length > 0 && (
          <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/40 cyber-cut-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {smartData.season.toUpperCase()} SPECIALS // IN-SEASON FRESH PRODUCE
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/70 font-mono">SEASONAL HARVEST</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {smartData.seasonalItems.map((sec, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVoiceCommand(`Add ${sec.name}`)}
                  className="flex items-center justify-between text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border border-emerald-500/30 p-2.5 cyber-cut-sm transition text-left"
                >
                  <div>
                    <p className="font-bold">{sec.name}</p>
                    <p className="text-[10px] text-emerald-400/80 font-mono">₹{sec.price}</p>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. SUBSTITUTES */}
        {substitutes.length > 0 && (
          <div className="mb-6 p-4 bg-indigo-950/20 border border-indigo-500/40 cyber-cut-sm backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI SMART ALTERNATIVES DETECTED
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {substitutes.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => handleVoiceCommand(`Add ${sub}`)}
                  className="flex items-center gap-1.5 text-xs bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-500/40 px-3 py-1.5 cyber-cut-sm transition"
                >
                  <Plus className="w-3 h-3 text-indigo-400" />
                  <span>ADD {sub.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Filter Banner */}
        {activeFilter && (
          <div className="mb-6 p-3 bg-cyan-950/30 border border-cyan-500/50 flex items-center justify-between cyber-cut-sm backdrop-blur-md">
            <div className="flex items-center gap-2 flex-wrap text-xs text-cyan-300">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold tracking-wider uppercase">QUERY FILTER:</span>
              {activeFilter.query && <span className="bg-cyan-500/20 px-2 py-0.5 border border-cyan-500/40">"{activeFilter.query}"</span>}
              {activeFilter.brand && <span className="bg-cyan-500/20 px-2 py-0.5 border border-cyan-500/40">BRAND: {activeFilter.brand}</span>}
              {activeFilter.maxPrice && <span className="bg-cyan-500/20 px-2 py-0.5 border border-cyan-500/40">&lt; ₹{activeFilter.maxPrice}</span>}
              {activeFilter.isOrganic && <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 border border-emerald-500/40">ORGANIC</span>}
              <span className="text-slate-300">[{safeItems.length} MATCHES]</span>
            </div>
            <button onClick={loadData} className="flex items-center gap-1 text-xs text-slate-300 hover:text-rose-400 transition ml-2">
              <X className="w-4 h-4" />
              <span>CLEAR</span>
            </button>
          </div>
        )}

        {/* Main List Display */}
        {isMinimalMode ? (
          <div className="space-y-2">
            {safeItems.map(item => (
              <div 
                key={item._id}
                onClick={() => toggleItem(item._id)}
                className={`p-3.5 border cyber-cut-sm flex items-center justify-between cursor-pointer transition ${
                  item.purchased 
                    ? 'bg-slate-950/40 border-slate-900 text-slate-400 line-through' 
                    : 'bg-slate-900/70 border-slate-800 text-slate-100 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 border flex items-center justify-center ${item.purchased ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-slate-700'}`}>
                    {item.purchased && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <span className="text-xs font-bold bg-slate-950 px-2 py-0.5 border border-slate-800 text-cyan-400">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          Object.keys(categories).length === 0 ? (
            <div className="text-center py-20 border border-dashed border-cyan-950 bg-slate-950/40 cyber-cut">
              <Command className="w-10 h-10 text-cyan-500/40 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-1">
                SHOPPING MATRIX STORAGE EMPTY
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Tap the Arc Reactor below and say: "Add 2 packets of milk under ₹60 and 1 kg apples"
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(categories).map(([category, catItems]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between px-1 border-b border-cyan-950/60 pb-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <h3 className="text-xs font-bold tracking-[0.15em] text-slate-300 uppercase">
                        {category}
                      </h3>
                    </div>
                    <span className="text-[10px] text-cyan-500/80">
                      [COUNT: {catItems.length}]
                    </span>
                  </div>

                  <div className="grid gap-2.5">
                    {catItems.map((item) => (
                      <div
                        key={item._id}
                        className={`group relative flex items-center justify-between p-3.5 sm:p-4 border cyber-cut-sm transition-all duration-200 ${
                          item.purchased
                            ? 'bg-slate-950/30 border-slate-900/60 opacity-40'
                            : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/50'
                        }`}
                      >
                        <div
                          onClick={() => toggleItem(item._id)}
                          className="flex items-start sm:items-center gap-3.5 cursor-pointer flex-1 select-none"
                        >
                          <div
                            className={`w-5 h-5 border mt-0.5 sm:mt-0 flex items-center justify-center shrink-0 transition ${
                              item.purchased
                                ? 'bg-cyan-500 border-cyan-400 text-black'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {item.purchased && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium tracking-wide ${item.purchased ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                {item.name}
                              </span>

                              {item.isOrganic && (
                                <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5">
                                  BIO/ORGANIC
                                </span>
                              )}

                              {item.brand && (
                                <span className="text-[9px] bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5" />
                                  {item.brand}
                                </span>
                              )}
                            </div>

                            {typeof item.price === 'number' && (
                              <p className="text-[11px] text-emerald-400 flex items-center gap-0.5">
                                <IndianRupee className="w-3 h-3" />
                                <span>UNIT: ₹{item.price.toFixed(2)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                          <span className="text-xs font-bold bg-slate-950 border border-cyan-900/60 text-cyan-300 px-2.5 py-1 cyber-cut-sm">
                            {item.quantity} {item.unit}
                          </span>

                          <button
                            onClick={() => deleteItem(item._id)}
                            className="p-1.5 text-slate-300 hover:text-rose-400 transition"
                            title="Purge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Floating Arc Reactor Voice Trigger */}
      <div className="fixed bottom-6 inset-x-0 flex flex-col items-center justify-center z-40 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className={`absolute w-28 h-28 border border-dashed rounded-full pointer-events-none transition-all duration-500 ${
              isListening ? 'border-rose-500 animate-spin-slow scale-125' : 'border-cyan-500/40 animate-spin-slow'
            }`} />

            <div className={`absolute w-24 h-24 border border-dotted rounded-full pointer-events-none transition-all duration-500 ${
              isListening ? 'border-rose-400 animate-spin-reverse scale-110' : 'border-indigo-500/40 animate-spin-reverse'
            }`} />

            <button
              onClick={() => {
                if (isListening) {
                  playSound('stop');
                  stopListening();
                } else {
                  playSound('start');
                  startListening();
                }
              }}
              className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-90 ${
                isListening
                  ? 'bg-rose-600 text-white glow-rose animate-pulse border-2 border-rose-300'
                  : 'bg-gradient-to-tr from-cyan-600 via-cyan-500 to-indigo-600 text-slate-950 glow-cyan hover:scale-105 border-2 border-cyan-300'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6 animate-bounce text-white" />
                  <span className="text-[9px] font-black tracking-widest mt-0.5">HALT</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 text-slate-950" />
                  <span className="text-[9px] font-black tracking-widest mt-0.5">INGEST</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}