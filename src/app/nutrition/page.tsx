"use client";

import { useData } from "@/lib/db";
import { ds, pd, fmtD, today, uid } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

// Mock implementation for addXP and showToast for now
const addXP = (amount: number, label: string) => { console.log(`XP Added: ${amount} - ${label}`); };
const showToast = (msg: string) => { console.log(`Toast: ${msg}`); };

const FOOD: Record<string, any> = { huevo: { kcal: 78, p: 6.3, c: 0.6, g: 5.3, f: 0 }, tostada: { kcal: 80, p: 3, c: 15, g: 1, f: 1.5 }, pan: { kcal: 265, p: 9, c: 49, g: 3.2, f: 2.7 }, pechuga: { kcal: 165, p: 31, c: 0, g: 3.6, f: 0 }, pollo: { kcal: 165, p: 31, c: 0, g: 3.6, f: 0 }, arroz: { kcal: 130, p: 2.7, c: 28, g: 0.3, f: 0.4 }, pasta: { kcal: 131, p: 5, c: 25, g: 1.1, f: 1.8 }, fideos: { kcal: 131, p: 5, c: 25, g: 1.1, f: 1.8 }, carne: { kcal: 250, p: 26, c: 0, g: 15, f: 0 }, milanesa: { kcal: 280, p: 22, c: 12, g: 16, f: 0.5 }, bife: { kcal: 250, p: 26, c: 0, g: 15, f: 0 }, leche: { kcal: 61, p: 3.2, c: 4.8, g: 3.3, f: 0 }, yogur: { kcal: 100, p: 9, c: 12, g: 2, f: 0 }, queso: { kcal: 400, p: 25, c: 1.3, g: 33, f: 0 }, manzana: { kcal: 52, p: 0.3, c: 14, g: 0.2, f: 2.4 }, banana: { kcal: 89, p: 1.1, c: 23, g: 0.3, f: 2.6 }, naranja: { kcal: 47, p: 0.9, c: 12, g: 0.1, f: 2.4 }, atun: { kcal: 132, p: 28, c: 0, g: 1, f: 0 }, salmon: { kcal: 208, p: 20, c: 0, g: 13, f: 0 }, brocoli: { kcal: 34, p: 2.8, c: 6.6, g: 0.4, f: 2.6 }, ensalada: { kcal: 20, p: 1.4, c: 3.7, g: 0.2, f: 2 }, "papas fritas": { kcal: 312, p: 3.4, c: 41, g: 15, f: 3.8 }, papa: { kcal: 77, p: 2, c: 17, g: 0.1, f: 2.2 }, batata: { kcal: 86, p: 1.6, c: 20, g: 0.1, f: 3 }, avena: { kcal: 389, p: 17, c: 66, g: 7, f: 10.6 }, almendra: { kcal: 579, p: 21, c: 22, g: 50, f: 12.5 }, nuez: { kcal: 654, p: 15, c: 14, g: 65, f: 6.7 }, mani: { kcal: 567, p: 26, c: 16, g: 49, f: 8.5 }, aceite: { kcal: 884, p: 0, c: 0, g: 100, f: 0 }, proteina: { kcal: 400, p: 80, c: 8, g: 4, f: 0 }, whey: { kcal: 400, p: 80, c: 8, g: 4, f: 0 }, cafe: { kcal: 5, p: 0.3, c: 0.7, g: 0, f: 0 }, chocolate: { kcal: 546, p: 5, c: 60, g: 31, f: 7 }, pizza: { kcal: 266, p: 11, c: 33, g: 10, f: 2.3 }, manteca: { kcal: 717, p: 0.9, c: 0.1, g: 81, f: 0 }, jamon: { kcal: 145, p: 18, c: 1, g: 7, f: 0 }, tomate: { kcal: 18, p: 0.9, c: 3.9, g: 0.2, f: 1.2 }, zanahoria: { kcal: 41, p: 0.9, c: 10, g: 0.2, f: 2.8 }, lechuga: { kcal: 15, p: 1.4, c: 2.9, g: 0.2, f: 1.8 }, pepino: { kcal: 16, p: 0.7, c: 3.6, g: 0.1, f: 0.5 }, hamburguesa: { kcal: 250, p: 12, c: 30, g: 9, f: 1 } };
const AI_RECOMMENDATIONS = [{ title: '💧 Hidratación', msg: 'Tomá al menos 2.5L de agua hoy. Si entrenaste, sumá 500ml extra.' }, { title: '🥚 Proteína temprana', msg: 'Desayunar con proteína (huevos, queso, yogur) reduce el hambre y preserva músculo.' }, { title: '🌾 Carbos post-entreno', msg: 'Los mejores momentos para carbos son pre-entreno y dentro de las 2h post-entrenamiento.' }, { title: '🥗 Fibra & saciedad', msg: 'Comé verduras antes de la proteína y carbos. Te vas a saciar antes.' }, { title: '⏰ Timing de comidas', msg: 'Intentá comer cada 3-4hs. Omitir comidas no acelera la pérdida de grasa y puede costarte músculo.' }, { title: '🍳 Preparación semanal', msg: 'Cocinás arroz, pollo y verduras el domingo → comidas listas toda la semana.' }, { title: '📊 Déficit sostenible', msg: 'Un déficit de 300-500 kcal/día es lo ideal. Más de eso te quita energía y músculo.' }];

const DMIN = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const p2 = (n: number) => String(n).padStart(2, "0");

export default function NutritionPage() {
  const [cfg] = useData<any>("cfg");
  const [foodLogs, setFoodLogs] = useData<any>("foodLogs");
  const [foodFavs, setFoodFavs] = useData<any[]>("foodFavs");
  const [weightLogs, setWeightLogs] = useData<any[]>("weightLogs");
  const [weightHist, setWeightHist] = useData<any[]>("weightHist");

  const [nutDate, setNutDate] = useState(today());
  const [activeMealTab, setActiveMealTab] = useState('Desayuno');
  const [chatMsgs, setChatMsgs] = useState<{from: string, text: string, html?: string}[]>([
    { from: 'ai', text: '', html: '<div class="ai-tag">⬡ ASCENSION AI</div>Hola. Escribime qué comiste y lo registro.<br><br><em style="color:var(--text2)">"3 huevos, 2 tostadas y café"</em>' }
  ]);
  const [chatInp, setChatInp] = useState("");
  const [weightInp, setWeightInp] = useState("");
  const [recIndex, setRecIndex] = useState(0);
  
  const [pendingAiFoods, setPendingAiFoods] = useState<{ food: string, m2: any }[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", kcal: "", p: "", c: "", g: "", f: "" });
  const [isChatLoading, setIsChatLoading] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);

  const getMealByTime = () => {
    const h = new Date().getHours();
    if (h >= 11 && h < 15) return "Almuerzo";
    if (h >= 15 && h < 19) return "Merienda";
    if (h >= 19) return "Cena";
    if (h >= 0 && h < 6) return "Snack";
    return "Desayuno";
  };

  const saveManualFood = () => {
    if (!manualForm.name || !manualForm.kcal) return;
    const newLogs = { ...foodLogs };
    if (!newLogs[nutDate]) newLogs[nutDate] = [];
    newLogs[nutDate].push({
      name: manualForm.name,
      meal: activeMealTab,
      kcal: +manualForm.kcal || 0,
      p: +manualForm.p || 0,
      c: +manualForm.c || 0,
      g: +manualForm.g || 0,
      f: +manualForm.f || 0,
      ts: Date.now()
    });
    setFoodLogs(newLogs);
    addXP(3, 'Comida manual registrada');
    showToast(`✓ ${manualForm.name} guardado`);
    setShowManual(false);
    setManualForm({ name: "", kcal: "", p: "", c: "", g: "", f: "" });
  };

  useEffect(() => {
    setRecIndex(Math.floor(Date.now() / 86400000) % AI_RECOMMENDATIONS.length);
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMsgs]);

  const changeNutDay = (d: number) => {
    const x = pd(nutDate);
    x.setDate(x.getDate() + d);
    setNutDate(ds(x));
  };

  const isToday = nutDate === today();

  const logs = foodLogs[nutDate] || [];
  const tot = { kcal: 0, p: 0, c: 0, g: 0, f: 0 };
  logs.forEach((l: any) => { tot.kcal += l.kcal; tot.p += l.p; tot.c += l.c; tot.g += l.g; tot.f += l.f; });
  const deficit = cfg.kcal - tot.kcal;

  const pct = Math.min(1, tot.kcal / (cfg.kcal || 1));
  const dashoffset = Math.round(289 * (1 - pct));

  const lastW = weightLogs.length ? weightLogs[weightLogs.length - 1] : null;
  const firstW = weightLogs.length ? weightLogs[0] : null;
  let weightProgPct = 0;
  if (lastW && cfg.pesoGoal) {
    const goal = cfg.pesoGoal;
    const cur = lastW.weight;
    weightProgPct = cur <= goal ? Math.round((cur / goal) * 100) : Math.round((goal / cur) * 100);
  }

  const mealLogs = logs.filter((l: any) => l.meal === activeMealTab);

  const deleteFoodItem = (date: string, idx: number) => {
    const newLogs = { ...foodLogs };
    if (!newLogs[date]) return;
    newLogs[date].splice(idx, 1);
    if (!newLogs[date].length) delete newLogs[date];
    setFoodLogs(newLogs);
  };

  const logWeight = () => {
    const val = parseFloat(weightInp);
    if (isNaN(val) || val < 20 || val > 400) return;
    const t = today();
    const newLogs = Array.isArray(weightLogs) ? [...weightLogs] : [];
    const ex = newLogs.findIndex(w => w.date === t);
    if (ex >= 0) newLogs[ex] = { ...newLogs[ex], weight: val };
    else newLogs.push({ date: t, weight: val });
    
    const newHist = Array.isArray(weightHist) ? [...weightHist] : [];
    newHist.push({ date: t, weight: val });
    
    setWeightLogs(newLogs);
    setWeightHist(newHist);
    addXP(8, 'Peso registrado');
    showToast('⚖️ Peso registrado +8 XP');
    setWeightInp("");
  };

  const logFoodFav = (id: string) => {
    const f = foodFavs.find(x => x.id === id);
    if (!f) return;
    const newLogs = { ...foodLogs };
    if (!newLogs[nutDate]) newLogs[nutDate] = [];
    newLogs[nutDate].push({ name: f.name, meal: activeMealTab, kcal: f.kcal, p: f.p, c: f.c, g: f.g, f: f.f, ts: Date.now() });
    setFoodLogs(newLogs);
    addXP(3, 'Fav registrado');
    showToast(`✓ ${f.name} registrado`);
  };

  const sendChat = async () => {
    const msg = chatInp.trim();
    if (!msg) return;

    const newMsgs = [...chatMsgs, { from: 'user', text: msg }];
    setChatMsgs(newMsgs);
    setChatInp("");
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        let errorMsg = "Error de IA";
        if (data.error && (data.error.includes("503") || data.error.toLowerCase().includes("high demand") || data.error.includes("saturada") || data.error.includes("unavailable"))) {
          errorMsg = "IA saturada (está siendo utilizada por muchos usuarios)";
        }
        setChatMsgs(prev => [...prev, { from: 'ai', text: '', html: `<div class="ai-tag">⬡ ASCENSION AI</div>${errorMsg}` }]);
        setIsChatLoading(false);
        return;
      }

      let totK = 0, totP = 0, totC = 0, totG = 0, totF = 0;
      const names: string[] = [];
      
      if (data.isFoodLog && data.foods && data.foods.length > 0) {
        data.foods.forEach((f: any) => {
          names.push(f.name);
          totK += f.kcal || 0;
          totP += f.p || 0;
          totC += f.c || 0;
          totG += f.g || 0;
          totF += f.f || 0;
        });

        const mealToUse = getMealByTime();
        const newLogs = { ...foodLogs };
        if (!newLogs[nutDate]) newLogs[nutDate] = [];
        
        newLogs[nutDate].push({ name: names.join(', '), meal: mealToUse, kcal: totK, p: totP, c: totC, g: totG, f: totF, ts: Date.now() });
        setFoodLogs(newLogs);
        addXP(5, 'Comida procesada por Gemini');

        const aiResponse = `<div class="ai-tag">⬡ ASCENSION AI</div>${data.message || 'Registrado con éxito.'}`;
        
        setChatMsgs(prev => [...prev, { from: 'ai', text: '', html: aiResponse }]);
      } else {
        setChatMsgs(prev => [...prev, { from: 'ai', text: '', html: `<div class="ai-tag">⬡ ASCENSION AI</div>${data.message || 'No se reconocieron alimentos.'}` }]);
      }
    } catch (err) {
      setChatMsgs(prev => [...prev, { from: 'ai', text: '', html: `<div class="ai-tag">⬡ ASCENSION AI</div>Error de IA` }]);
    }
    
    setIsChatLoading(false);
  };

  // Rendering Calendar
  const renderCalendarGrid = () => {
    const now = new Date(); 
    const m = now.getMonth(); 
    const y = now.getFullYear(); 
    const first = new Date(y, m, 1); 
    const offset = (first.getDay() + 6) % 7; 
    const days = new Date(y, m + 1, 0).getDate();
    
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(<div key={`empty-${i}`}></div>);
    
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${p2(m + 1)}-${p2(d)}`;
      const fl = foodLogs[key] || [];
      const kcalDay = fl.reduce((a: any, b: any) => a + b.kcal, 0);
      const isTodayCell = now.getDate() === d && now.getMonth() === m && now.getFullYear() === y;
      
      let cls = '';
      if (fl.length > 0) {
        cls = kcalDay >= cfg.kcal * 0.85 && kcalDay <= cfg.kcal * 1.1 ? 'c-green' : kcalDay > cfg.kcal * 1.1 ? 'c-red' : 'c-amber';
      }
      
      const wl = weightLogs.find((w: any) => w.date === key);
      cells.push(
        <div key={key} className={`nut-cal-cell ${cls} ${isTodayCell ? 'c-today' : ''}`} title={`${kcalDay} kcal`}>
          {d}
          {wl && <span style={{ fontSize: "8px", color: "#fff", background: "var(--accent)", padding: "1px 3px", borderRadius: "3px", display: "inline-block", marginTop: "2px", fontWeight: 700 }}>{wl.weight}kg</span>}
          {fl.length > 0 && <span style={{ fontSize: "7px", display: "block", marginTop: "2px" }}>{kcalDay} kcal</span>}
        </div>
      );
    }
    
    return cells;
  };

  const currentRec = AI_RECOMMENDATIONS[recIndex];

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header">
        <div className="sec-title">NUTRICIÓN</div>
        <div className="sec-pill" id="nut-date-lbl">{isToday ? "HOY" : fmtD(nutDate).toUpperCase()}</div>
        <div className="sec-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => changeNutDay(-1)}>‹ Día</button>
          <button className="btn btn-secondary btn-sm" onClick={() => changeNutDay(1)}>Día ›</button>
        </div>
      </div>
      
      <div className="g4" id="nut-macro-cards">
        <div className="stat-card c-red">
          <div className="stat-label">Calorías consumidas</div>
          <div className="stat-value c-red">{tot.kcal}</div>
          <div className={`stat-diff ${deficit >= 0 ? 'up' : 'down'}`}>
            {deficit >= 0 ? '↓ Déficit' : '↑ Excedido'} {Math.abs(deficit)} kcal
          </div>
        </div>
        <div className="stat-card c-blue">
          <div className="stat-label">Proteína</div>
          <div className="stat-value c-blue">{tot.p}<span style={{ fontSize: "16px" }}>g</span></div>
          <div className="stat-diff up">de {cfg.prot}g</div>
        </div>
        <div className="stat-card c-amber">
          <div className="stat-label">Carbohidratos</div>
          <div className="stat-value c-amber">{tot.c}<span style={{ fontSize: "16px" }}>g</span></div>
          <div className="stat-diff up">de {cfg.carb}g</div>
        </div>
        <div className="stat-card c-green">
          <div className="stat-label">Objetivo diario</div>
          <div className="stat-value c-green">{cfg.kcal}</div>
          <div className="stat-diff up">
            {cfg.goal === 'cut' ? 'Déficit' : cfg.goal === 'bulk' ? 'Superávit' : 'Mantenimiento'}
          </div>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: "14px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="panel" style={{ marginBottom: "0" }}>
            <div className="panel-head">Macros del día</div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="ring-container" style={{ flexShrink: 0 }}>
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="46" fill="none" stroke="#111" strokeWidth="10" />
                  <circle cx="55" cy="55" r="46" fill="none" stroke="var(--red)" strokeWidth="10" strokeLinecap="round" strokeDasharray="289" strokeDashoffset={dashoffset} transform="rotate(-90 55 55)" style={{ transition: "stroke-dashoffset 0.8s", filter: "drop-shadow(0 0 6px var(--red))" }} />
                </svg>
                <div className="ring-inner">
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "18px", fontWeight: 900, color: "var(--text)" }}>{tot.kcal}</div>
                  <div style={{ fontSize: "8px", color: "var(--text2)", marginTop: "1px" }}>kcal</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="macro-row">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ color: "#00ff88", letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "10px" }}>Proteína</span>
                    <span style={{ color: "var(--text)" }}>{tot.p} <span style={{ color: "var(--text2)", fontSize: "10px", fontWeight: 500 }}>/ {cfg.prot}g</span></span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Math.round(tot.p / (cfg.prot || 1) * 100))}%`, background: "#00ff88", borderRadius: "3px", transition: "width 0.8s ease", boxShadow: "0 0 8px rgba(0, 255, 136, 0.5)" }}></div>
                  </div>
                </div>
                <div className="macro-row">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ color: "#0088ff", letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "10px" }}>Carbohidratos</span>
                    <span style={{ color: "var(--text)" }}>{tot.c} <span style={{ color: "var(--text2)", fontSize: "10px", fontWeight: 500 }}>/ {cfg.carb}g</span></span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Math.round(tot.c / (cfg.carb || 1) * 100))}%`, background: "#0088ff", borderRadius: "3px", transition: "width 0.8s ease", boxShadow: "0 0 8px rgba(0, 136, 255, 0.5)" }}></div>
                  </div>
                </div>
                <div className="macro-row">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ color: "#ffaa00", letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "10px" }}>Grasas</span>
                    <span style={{ color: "var(--text)" }}>{tot.g} <span style={{ color: "var(--text2)", fontSize: "10px", fontWeight: 500 }}>/ {cfg.fat}g</span></span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Math.round(tot.g / (cfg.fat || 1) * 100))}%`, background: "#ffaa00", borderRadius: "3px", transition: "width 0.8s ease", boxShadow: "0 0 8px rgba(255, 170, 0, 0.5)" }}></div>
                  </div>
                </div>
                <div className="macro-row">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ color: "#ff0040", letterSpacing: "0.5px", textTransform: "uppercase", fontSize: "10px" }}>Fibra</span>
                    <span style={{ color: "var(--text)" }}>{tot.f} <span style={{ color: "var(--text2)", fontSize: "10px", fontWeight: 500 }}>/ {cfg.fiber || 30}g</span></span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, Math.round(tot.f / (cfg.fiber || 30) * 100))}%`, background: "#ff0040", borderRadius: "3px", transition: "width 0.8s ease", boxShadow: "0 0 8px rgba(255, 0, 64, 0.5)" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="panel" style={{ marginBottom: "0" }}>
            <div className="panel-head">Registro del día</div>
            <div className="tabs">
              {['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'].map(tab => (
                <button key={tab} className={`tab ${activeMealTab === tab ? 'active' : ''}`} onClick={() => setActiveMealTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="food-favs-wrap" style={{ marginTop: "8px" }}>
              {foodFavs.map((f: any) => (
                <button key={f.id} className="food-fav-btn" onClick={() => logFoodFav(f.id)} title={`${f.kcal} kcal · P:${f.p}g C:${f.c}g G:${f.g}g`}>
                  {f.name}
                </button>
              ))}
              <button className="food-fav-btn" style={{ borderColor: "var(--accent)", color: "var(--accent)" }} onClick={() => setShowManual(!showManual)}>
                {showManual ? 'Cancelar' : '＋ Manual'}
              </button>
            </div>
            {showManual && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <input placeholder="Nombre (ej. Hamburguesa)" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} style={{ background: "var(--bg3)", border: "none", padding: "8px", color: "var(--text)", fontSize: "11px", borderRadius: "4px" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                   <input placeholder="Kcal" type="number" value={manualForm.kcal} onChange={e => setManualForm({...manualForm, kcal: e.target.value})} style={{ background: "var(--bg3)", border: "none", padding: "8px", color: "var(--text)", fontSize: "11px", borderRadius: "4px" }} />
                   <input placeholder="Proteína (g)" type="number" value={manualForm.p} onChange={e => setManualForm({...manualForm, p: e.target.value})} style={{ background: "var(--bg3)", border: "none", padding: "8px", color: "var(--text)", fontSize: "11px", borderRadius: "4px" }} />
                   <input placeholder="Carbos (g)" type="number" value={manualForm.c} onChange={e => setManualForm({...manualForm, c: e.target.value})} style={{ background: "var(--bg3)", border: "none", padding: "8px", color: "var(--text)", fontSize: "11px", borderRadius: "4px" }} />
                   <input placeholder="Grasas (g)" type="number" value={manualForm.g} onChange={e => setManualForm({...manualForm, g: e.target.value})} style={{ background: "var(--bg3)", border: "none", padding: "8px", color: "var(--text)", fontSize: "11px", borderRadius: "4px" }} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={saveManualFood} style={{ width: "100%", marginTop: "4px" }}>Guardar en {activeMealTab}</button>
              </div>
            )}
            <div style={{ marginTop: "14px" }}>
              {mealLogs.length ? mealLogs.map((f: any, idx: number) => (
                <div key={idx} className="food-item">
                  <div className="food-name">{f.name}</div>
                  <div className="food-kcal">{f.kcal} kcal</div>
                  <div className="food-macros">P:{f.p}g C:{f.c}g G:{f.g}g</div>
                  <div className="food-del" onClick={() => deleteFoodItem(nutDate, logs.indexOf(f))}>×</div>
                </div>
              )) : (
                <div className="empty-state" style={{ padding: "16px" }}>
                  <i className="ti ti-soup"></i>
                  <p>Sin registros en {activeMealTab}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="panel" style={{ marginBottom: "0" }}>
            <div className="panel-head">Peso corporal</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "40px", fontWeight: 900, color: "var(--text)" }}>
                  {lastW ? lastW.weight : '--'}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text2)" }}>
                  kg {lastW && firstW && lastW.weight - firstW.weight !== 0 ? `· ${(lastW.weight - firstW.weight) > 0 ? '+' : ''}${(lastW.weight - firstW.weight).toFixed(1)} desde inicio` : ''}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: "var(--text2)" }}>OBJETIVO</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "22px", fontWeight: 700, color: "var(--green)" }}>
                  {cfg.pesoGoal}kg
                </div>
                <div style={{ fontSize: "10px", color: "var(--text2)" }}>
                  {lastW && (lastW.weight - cfg.pesoGoal) > 0 ? `Faltan ${(lastW.weight - cfg.pesoGoal).toFixed(1)}kg` : '¡Meta!'}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text2)", marginBottom: "5px" }}>
                <span>{cfg.peso ? `Inicio: ${cfg.peso}kg` : '--'}</span>
                <span>{weightProgPct}%</span>
              </div>
              <div style={{ height: "8px", background: "var(--bg3)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,var(--red),var(--green))", borderRadius: "4px", transition: "width 0.7s", width: `${weightProgPct}%` }}></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="number" value={weightInp} onChange={e => setWeightInp(e.target.value)} placeholder="82.4" step="0.1" style={{ flex: 1 }} />
              <span style={{ alignSelf: "center", fontSize: "11px", color: "var(--text2)" }}>kg</span>
              <button className="btn btn-primary btn-sm" onClick={logWeight}>Registrar</button>
            </div>
            <div style={{ marginTop: "10px" }}>
              {weightLogs.length ? [...weightLogs].slice(-4).reverse().map((w, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #0d0d0d", fontSize: "11px" }}>
                  <span style={{ fontWeight: 600 }}>{w.weight} kg</span>
                  <span style={{ color: "var(--text2)" }}>{fmtD(w.date)}</span>
                </div>
              )) : (
                <div style={{ fontSize: "10px", color: "var(--text2)", padding: "6px 0" }}>Sin registros aún.</div>
              )}
            </div>
          </div>
          
          <div className="panel" style={{ marginBottom: "0" }}>
            <div className="panel-head">Calendario nutricional</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", marginBottom: "5px" }}>
              {DMIN.map(d => <div key={d} style={{ fontSize: "8px", color: "var(--text2)", textAlign: "center", fontWeight: 700 }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
              {renderCalendarGrid()}
            </div>
          </div>
          
          <div className="panel" style={{ marginBottom: "0" }}>
            <div className="panel-head">Proyección</div>
            <div>
              {weightLogs.length < 2 ? (
                <div style={{ fontSize: "11px", color: "var(--text2)" }}>Registrá tu peso 2+ veces para ver la proyección.</div>
              ) : (() => {
                const rate = (weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight) / weightLogs.length; 
                const remaining = weightLogs[weightLogs.length - 1].weight - cfg.pesoGoal; 
                if (remaining <= 0) return <div style={{ color: "var(--green)", fontSize: "13px", fontWeight: 700 }}>🎉 ¡Objetivo alcanzado! Seguí así.</div>;
                if (rate < 0) {
                  const days = Math.ceil(remaining / Math.abs(rate)); 
                  const goal = new Date(); 
                  goal.setDate(goal.getDate() + days); 
                  return (
                    <>
                      <div style={{ fontSize: "12px", color: "var(--text2)" }}>A este ritmo llegás a <strong style={{ color: "var(--green)" }}>{cfg.pesoGoal}kg</strong> el <strong style={{ color: "var(--text)" }}>{fmtD(ds(goal))}</strong></div>
                      <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "4px" }}>~{(Math.abs(rate) * 30).toFixed(1)}kg/mes</div>
                    </>
                  );
                }
                return <div style={{ fontSize: "12px", color: "var(--amber)" }}>⚠️ Tendencia al alza. Revisá tu plan.</div>;
              })()}
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="panel" style={{ marginBottom: "0", height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="panel-head">IA Nutricional</div>
            <div className="chat-box" ref={chatBoxRef} style={{ flex: 1 }}>
              {chatMsgs.map((msg, idx) => (
                <div key={idx} className={msg.from === 'ai' ? 'msg-ai' : 'msg-user'} dangerouslySetInnerHTML={{ __html: msg.html || msg.text }}></div>
              ))}
              {isChatLoading && (
                <div className="msg-ai" style={{ opacity: 0.7, fontStyle: "italic" }}>
                  <div className="ai-tag">⬡ ASCENSION AI</div>
                  Calculando los datos
                </div>
              )}
            </div>
            {currentRec && (
              <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,0,64,0.2)", borderRadius: "6px", padding: "10px", marginBottom: "10px" }}>
                <div style={{ fontSize: "9px", color: "var(--red)", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>{currentRec.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)", lineHeight: "1.5" }}>{currentRec.msg}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: "6px" }}>
              <input 
                value={chatInp} 
                onChange={e => setChatInp(e.target.value)} 
                placeholder='Ej: "Pollo con arroz..."'
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                style={{ flex: 1, fontSize: "11px", padding: "8px 10px" }} 
              />
              <button className="btn btn-primary btn-sm" onClick={sendChat}>
                <i className="ti ti-send"></i>
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
