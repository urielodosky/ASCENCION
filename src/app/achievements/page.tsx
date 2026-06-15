"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/db";
import { getLvlInfo } from "@/lib/utils";

// Helper para calcular racha de hábitos
const calcHabStreak = (habLogs: any) => {
  if (!habLogs) return 0;
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = d.toISOString().slice(0, 10);
    const dayLog = habLogs[ds];
    if (!dayLog || !Object.values(dayLog).includes(1)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

// SVG Icons Dictionary (Expanded)
const SVG = {
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  fire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3v18"/><path d="M11 9h11"/><path d="M2 9h9"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  muscle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4V2M14 4V2M5.5 8.5L4 7M18.5 8.5L20 7M6 14a6 6 0 1012 0c0-3-2.5-6-6-6s-6 3-6 6z"/><path d="M8 14h8"/></svg>`,
  barbell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M4 10v4"/><path d="M20 10v4"/><path d="M7 8v8"/><path d="M17 8v8"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 01-10 0V4"/><path d="M4 4h3v8a5 5 0 005 5h0a5 5 0 005-5V4h3"/></svg>`,
  money: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>`,
  cash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M5.5 5.5l13 13"/><path d="M18.5 5.5l-13 13"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
  trident: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V2"/><path d="M5 8v2a7 7 0 0014 0V8"/><path d="M5 2v6"/><path d="M19 2v6"/><path d="M12 2l-2 3h4z"/></svg>`,
  medal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="5"/><path d="M12 10V2L9 6H5l1 5"/><path d="M12 10V2l3 4h4l-1 5"/></svg>`,
  plate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7"/><path d="M12 5v14"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
  scroll: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"/><path d="M4 6h16"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>`,
  floppy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  crown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
  sword: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0017 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 00-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>`,
  mountain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3l4 8 5-5 5 15H2L8 3z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`
};

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'habits', label: 'Hábitos' },
  { id: 'training', label: 'Entrenamiento' },
  { id: 'finances', label: 'Finanzas' },
  { id: 'nutrition', label: 'Nutrición' },
  { id: 'study', label: 'Estudio' },
  { id: 'general', label: 'General' },
];

export default function AchievementsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // DB States
  const [cfg] = useData<any>("cfg");
  const [totalXP] = useData<number>("totalXP");
  const [calStates] = useData<any>("calStates");
  const [habLogs] = useData<any>("habLogs");
  const [foodLogs] = useData<any>("foodLogs");
  const [sales] = useData<any[]>("sales");
  const [bibleProgress] = useData<any>("bibleProgress");
  const [lastBackup] = useData<number>("lastBackup");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !cfg) return <div className="section active"><div style={{ padding: '20px' }}>Cargando logros...</div></div>;

  // --- CALCULATIONS FOR UNLOCKS ---
  const { lvl } = getLvlInfo(totalXP || 0);
  
  // Habits
  const streak = calcHabStreak(habLogs);
  const hasHabit = Object.values(habLogs || {}).some((l: any) => Object.values(l).includes(1));
  const habitCountTotal = Object.values(habLogs || {}).reduce((acc: number, log: any) => acc + Object.values(log).filter(Boolean).length, 0);
  let perfectWeek = false;
  if (habLogs) {
    let perfectDays = 0;
    const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
    last7.forEach(d => {
      if (habLogs[d] && Object.values(habLogs[d]).filter(Boolean).length > 0) perfectDays++;
    });
    perfectWeek = perfectDays === 7;
  }

  // Training
  const trainDays = Object.keys(calStates || {}).filter(k => calStates[k] === "done");
  const trainCount = trainDays.length;
  const hasTrain = trainCount > 0;
  const weekendTrain = trainDays.some(d => {
    const day = new Date(d + 'T12:00:00Z').getUTCDay();
    return day === 0 || day === 6;
  });

  // Finances
  const salesList = sales || [];
  const salesCount = salesList.length;
  const hasSale = salesCount > 0;
  const totProfit = salesList.reduce((acc, s) => acc + (s.profit || 0), 0);
  const hasHighTicket = salesList.some(s => (s.profit || 0) >= 500);

  // Nutrition
  const foodDays = Object.keys(foodLogs || {}).length;

  // Study
  const hasBible = Object.values(bibleProgress || {}).some((b: any) => Object.values(b).includes(true));
  let bibleRead = 0, bibleTotal = 0;
  if (bibleProgress) {
    Object.values(bibleProgress).forEach((b: any) => {
      bibleTotal += Object.keys(b).length;
      bibleRead += Object.values(b).filter(Boolean).length;
    });
  }
  const biblePct = bibleTotal > 0 ? (bibleRead / bibleTotal) * 100 : 0;

  // General
  const hasBackup = (lastBackup || 0) > 0;

  // --- FULL BADGES LIST (50) ---
  const achievements = [
    // HABITS (10)
    { id: "h1", category: "habits", title: "Primer hábito", desc: "Cumple tu primer hábito.", svg: SVG.target, color: "#ff0040", unlocked: hasHabit },
    { id: "h2", category: "habits", title: "Disciplina Inicia", desc: "Mantén una racha de 3 días.", svg: SVG.sun, color: "#ffaa00", unlocked: streak >= 3 },
    { id: "h3", category: "habits", title: "7 días de fuego", desc: "Mantén una racha de 7 días.", svg: SVG.fire, color: "#ff6600", unlocked: streak >= 7 },
    { id: "h4", category: "habits", title: "Dos semanas", desc: "Mantén una racha de 14 días.", svg: SVG.shield, color: "#00ccff", unlocked: streak >= 14 },
    { id: "h5", category: "habits", title: "Mes imparable", desc: "Mantén una racha de 30 días.", svg: SVG.diamond, color: "#00ccff", unlocked: streak >= 30 },
    { id: "h6", category: "habits", title: "60 días", desc: "Mantén una racha de 60 días.", svg: SVG.heart, color: "#ff0040", unlocked: streak >= 60 },
    { id: "h7", category: "habits", title: "Centurión", desc: "Mantén una racha de 100 días.", svg: SVG.star, color: "#ffdd00", unlocked: streak >= 100 },
    { id: "h8", category: "habits", title: "Titán de Hábitos", desc: "Mantén una racha de 365 días.", svg: SVG.crown, color: "#ffdd00", unlocked: streak >= 365 },
    { id: "h9", category: "habits", title: "Semana perfecta", desc: "Cumple hábitos los 7 días de la semana.", svg: SVG.sparkles, color: "#cc00ff", unlocked: perfectWeek },
    { id: "h10", category: "habits", title: "Multi-Tasker", desc: "Acumula 100 hábitos completados.", svg: SVG.sword, color: "#ffaa00", unlocked: habitCountTotal >= 100 },

    // TRAINING (10)
    { id: "t1", category: "training", title: "Primer entreno", desc: "Registra tu primer entrenamiento.", svg: SVG.muscle, color: "#ff0040", unlocked: hasTrain },
    { id: "t2", category: "training", title: "Constante", desc: "Completa 5 entrenamientos.", svg: SVG.calendar, color: "#00ff88", unlocked: trainCount >= 5 },
    { id: "t3", category: "training", title: "10 entrenos", desc: "Completa 10 entrenamientos.", svg: SVG.barbell, color: "#ffaa00", unlocked: trainCount >= 10 },
    { id: "t4", category: "training", title: "Soldado", desc: "Completa 25 entrenamientos.", svg: SVG.shield, color: "#0088ff", unlocked: trainCount >= 25 },
    { id: "t5", category: "training", title: "50 entrenos", desc: "Completa 50 entrenamientos.", svg: SVG.trophy, color: "#ffdd00", unlocked: trainCount >= 50 },
    { id: "t6", category: "training", title: "Máquina", desc: "Completa 75 entrenamientos.", svg: SVG.rocket, color: "#ff0040", unlocked: trainCount >= 75 },
    { id: "t7", category: "training", title: "Centenario", desc: "Completa 100 entrenamientos.", svg: SVG.crown, color: "#ffdd00", unlocked: trainCount >= 100 },
    { id: "t8", category: "training", title: "Guerrero", desc: "Completa 150 entrenamientos.", svg: SVG.sword, color: "#cc00ff", unlocked: trainCount >= 150 },
    { id: "t9", category: "training", title: "Espartano", desc: "Completa 300 entrenamientos.", svg: SVG.mountain, color: "#ffaa00", unlocked: trainCount >= 300 },
    { id: "t10", category: "training", title: "Sin excusas", desc: "Entrena en fin de semana.", svg: SVG.fire, color: "#ff6600", unlocked: weekendTrain },

    // FINANCES (10)
    { id: "f1", category: "finances", title: "Primera venta", desc: "Registra tu primera venta.", svg: SVG.money, color: "#00ff88", unlocked: hasSale },
    { id: "f2", category: "finances", title: "En marcha", desc: "Registra 5 ventas en el CRM.", svg: SVG.chart, color: "#00ccff", unlocked: salesCount >= 5 },
    { id: "f3", category: "finances", title: "10 ventas", desc: "Registra 10 ventas en el CRM.", svg: SVG.cash, color: "#0088ff", unlocked: salesCount >= 10 },
    { id: "f4", category: "finances", title: "Vendedor", desc: "Registra 25 ventas en el CRM.", svg: SVG.barbell, color: "#ffaa00", unlocked: salesCount >= 25 },
    { id: "f5", category: "finances", title: "Top Seller", desc: "Registra 50 ventas en el CRM.", svg: SVG.star, color: "#ffdd00", unlocked: salesCount >= 50 },
    { id: "f6", category: "finances", title: "Magnate", desc: "Registra 100 ventas en el CRM.", svg: SVG.crown, color: "#ffdd00", unlocked: salesCount >= 100 },
    { id: "f7", category: "finances", title: "Primeros $1K", desc: "Supera los $1,000 en ganancias.", svg: SVG.money, color: "#00ff88", unlocked: totProfit >= 1000 },
    { id: "f8", category: "finances", title: "Club $10K", desc: "Supera los $10,000 en ganancias.", svg: SVG.diamond, color: "#00ccff", unlocked: totProfit >= 10000 },
    { id: "f9", category: "finances", title: "Club $100K", desc: "Supera los $100,000 en ganancias.", svg: SVG.rocket, color: "#ff0040", unlocked: totProfit >= 100000 },
    { id: "f10", category: "finances", title: "High Ticket", desc: "Cierra una venta de $500 o más.", svg: SVG.target, color: "#cc00ff", unlocked: hasHighTicket },

    // NUTRITION (5)
    { id: "n1", category: "nutrition", title: "Nutricionista novato", desc: "Registra tus comidas 1 día.", svg: SVG.plate, color: "#ff69b4", unlocked: foodDays >= 1 },
    { id: "n2", category: "nutrition", title: "Una semana fit", desc: "Registra tus comidas 7 días.", svg: SVG.apple, color: "#00ff88", unlocked: foodDays >= 7 },
    { id: "n3", category: "nutrition", title: "Nutricionista", desc: "Registra comidas en 30 días.", svg: SVG.heart, color: "#ff0040", unlocked: foodDays >= 30 },
    { id: "n4", category: "nutrition", title: "Medio año saludable", desc: "Registra comidas en 180 días.", svg: SVG.calendar, color: "#0088ff", unlocked: foodDays >= 180 },
    { id: "n5", category: "nutrition", title: "365 Nutrición", desc: "Registra comidas en 365 días.", svg: SVG.crown, color: "#ffdd00", unlocked: foodDays >= 365 },

    // STUDY / BIBLE (8)
    { id: "s1", category: "study", title: "Estudiante", desc: "Lee tu primer capítulo.", svg: SVG.book, color: "#0088ff", unlocked: hasBible },
    { id: "s2", category: "study", title: "10 Capítulos", desc: "Lee 10 capítulos en total.", svg: SVG.scroll, color: "#00ccff", unlocked: bibleRead >= 10 },
    { id: "s3", category: "study", title: "50 Capítulos", desc: "Lee 50 capítulos en total.", svg: SVG.mountain, color: "#ffaa00", unlocked: bibleRead >= 50 },
    { id: "s4", category: "study", title: "100 Capítulos", desc: "Lee 100 capítulos en total.", svg: SVG.star, color: "#ffdd00", unlocked: bibleRead >= 100 },
    { id: "s5", category: "study", title: "10% Biblia", desc: "Completa el 10% de la Biblia.", svg: SVG.chart, color: "#00ff88", unlocked: biblePct >= 10 },
    { id: "s6", category: "study", title: "25% Biblia", desc: "Completa el 25% de la Biblia.", svg: SVG.diamond, color: "#00ccff", unlocked: biblePct >= 25 },
    { id: "s7", category: "study", title: "50% Biblia", desc: "Completa la mitad de la Biblia.", svg: SVG.shield, color: "#ffaa00", unlocked: biblePct >= 50 },
    { id: "s8", category: "study", title: "100% Biblia", desc: "Completa la Biblia entera.", svg: SVG.crown, color: "#ffdd00", unlocked: biblePct >= 100 },

    // GENERAL / LEVELS (7)
    { id: "g1", category: "general", title: "Nivel 5", desc: "Alcanza el Nivel 5.", svg: SVG.rocket, color: "#0088ff", unlocked: lvl >= 5 },
    { id: "g2", category: "general", title: "Nivel 10", desc: "Alcanza el Nivel 10.", svg: SVG.moon, color: "#cc00ff", unlocked: lvl >= 10 },
    { id: "g3", category: "general", title: "Nivel 25", desc: "Alcanza el Nivel 25.", svg: SVG.shield, color: "#00ff88", unlocked: lvl >= 25 },
    { id: "g4", category: "general", title: "Nivel 50", desc: "Alcanza el Nivel 50.", svg: SVG.trident, color: "#ff0040", unlocked: lvl >= 50 },
    { id: "g5", category: "general", title: "Nivel 75", desc: "Alcanza el Nivel 75.", svg: SVG.star, color: "#ffdd00", unlocked: lvl >= 75 },
    { id: "g6", category: "general", title: "ASCENSION 100", desc: "Llega a lo más alto. Nivel 100.", svg: SVG.medal, color: "#ffdd00", unlocked: lvl >= 100 },
    { id: "g7", category: "general", title: "Backup Hero", desc: "Exporta tus datos por primera vez.", svg: SVG.floppy, color: "#00ff88", unlocked: hasBackup },
  ];

  const filteredAchievements = activeTab === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeTab);

  const totalCount = achievements.length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const currentCatCount = filteredAchievements.length;
  const currentCatUnlocked = filteredAchievements.filter(a => a.unlocked).length;

  return (
    <div className="section active">
      <div className="sec-header">
        <div className="sec-title">LOGROS</div>
      </div>
      
      {/* GLOBAL PROGRESS */}
      <div className="panel" style={{ marginBottom: '20px', background: 'var(--bg2)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '20px' }}>Progreso Global</h2>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)', marginTop: '10px' }}>
          {unlockedCount} / {totalCount}
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden', marginTop: '15px' }}>
          <div style={{ width: `${(unlockedCount / totalCount) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s' }}></div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs" style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === cat.id ? 'var(--accent)' : 'var(--bg2)',
              color: activeTab === cat.id ? '#fff' : 'var(--text2)',
              border: `1px solid ${activeTab === cat.id ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              fontFamily: 'Inter'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* CATEGORY PROGRESS */}
      {activeTab !== 'all' && (
        <div style={{ marginBottom: '20px', textAlign: 'right', fontSize: '12px', color: 'var(--text2)' }}>
          Desbloqueados en esta categoría: <strong style={{ color: 'var(--text)' }}>{currentCatUnlocked} / {currentCatCount}</strong>
        </div>
      )}

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {filteredAchievements.map(ach => (
          <div key={ach.id} style={{
            background: ach.unlocked ? `linear-gradient(135deg, var(--bg3) 0%, ${ach.color}11 100%)` : 'var(--bg3)',
            border: ach.unlocked ? `1px solid ${ach.color}44` : '1px solid var(--border)',
            borderRadius: '8px',
            padding: '15px',
            position: 'relative',
            overflow: 'hidden',
            opacity: ach.unlocked ? 1 : 0.6,
            transition: 'all 0.3s'
          }}>
            {/* Fondo de icono difuminado */}
            {ach.unlocked && (
              <div 
                style={{ position: 'absolute', right: '-10px', bottom: '-20px', width: '120px', height: '120px', opacity: 0.03, color: ach.color }}
                dangerouslySetInnerHTML={{ __html: ach.svg }}
              />
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ 
                width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0,
                background: ach.unlocked ? `${ach.color}22` : 'var(--bg)',
                color: ach.unlocked ? ach.color : 'var(--text2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: ach.unlocked ? `0 0 15px ${ach.color}33` : 'none',
                position: 'relative'
              }}>
                <div style={{ width: '28px', height: '28px', opacity: ach.unlocked ? 1 : 0.2 }} dangerouslySetInnerHTML={{ __html: ach.svg }} />
                {!ach.unlocked && (
                  <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: 'var(--bg2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', color: 'var(--text3)' }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: ach.unlocked ? 'var(--text)' : 'var(--text2)', fontSize: '14px' }}>{ach.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{ach.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
