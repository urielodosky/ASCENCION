"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/db";
import { getLvl } from "@/lib/utils";

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

// SVG Icons for Badges
const SVG = {
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  fire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3v18"/><path d="M11 9h11"/><path d="M2 9h9"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  muscle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4V2M14 4V2M5.5 8.5L4 7M18.5 8.5L20 7M6 14a6 6 0 1012 0c0-3-2.5-6-6-6s-6 3-6 6z"/><path d="M8 14h8"/></svg>`,
  barbell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M4 10v4"/><path d="M20 10v4"/><path d="M7 8v8"/><path d="M17 8v8"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 01-10 0V4"/><path d="M4 4h3v8a5 5 0 005 5h0a5 5 0 005-5V4h3"/></svg>`,
  money: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>`,
  cash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M5.5 5.5l13 13"/><path d="M18.5 5.5l-13 13"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
  trident: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V2"/><path d="M5 8v2a7 7 0 0014 0V8"/><path d="M5 2v6"/><path d="M19 2v6"/><path d="M12 2l-2 3h4z"/></svg>`,
  medal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="5"/><path d="M12 10V2L9 6H5l1 5"/><path d="M12 10V2l3 4h4l-1 5"/></svg>`,
  plate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7"/><path d="M12 5v14"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
  scroll: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"/><path d="M4 6h16"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>`,
  floppy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`
};

export default function AchievementsPage() {
  const [mounted, setMounted] = useState(false);

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
  const lvl = getLvl(totalXP || 0);
  const trainCount = Object.values(calStates || {}).filter(v => v === "done").length;
  const streak = calcHabStreak(habLogs);
  const salesCount = (sales || []).length;
  const foodDays = Object.keys(foodLogs || {}).length;
  const hasBackup = (lastBackup || 0) > 0;
  
  const hasHabit = Object.values(habLogs || {}).some((l: any) => Object.values(l).includes(1));
  const hasTrain = trainCount > 0;
  const hasSale = salesCount > 0;
  const hasBible = Object.values(bibleProgress || {}).some((b: any) => Object.values(b).includes(true));

  // Perfect Week calculation
  let perfectWeek = false;
  if (habLogs) {
    let perfectDays = 0;
    const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
    last7.forEach(d => {
      if (habLogs[d] && Object.values(habLogs[d]).filter(Boolean).length > 0) perfectDays++;
    });
    perfectWeek = perfectDays === 7;
  }

  // Bible % calculation
  let bibleRead = 0, bibleTotal = 0;
  if (bibleProgress) {
    Object.values(bibleProgress).forEach((b: any) => {
      bibleTotal += Object.keys(b).length;
      bibleRead += Object.values(b).filter(Boolean).length;
    });
  }
  const biblePct = bibleTotal > 0 ? (bibleRead / bibleTotal) * 100 : 0;

  // --- FULL BADGES LIST ---
  const achievements = [
    { id: "first_habit", title: "Primer hábito", desc: "Cumple tu primer hábito.", svg: SVG.target, color: "#ff0040", unlocked: hasHabit },
    { id: "streak7", title: "7 días", desc: "Mantén una racha de 7 días.", svg: SVG.fire, color: "#ff6600", unlocked: streak >= 7 },
    { id: "streak30", title: "30 días", desc: "Mantén una racha de 30 días.", svg: SVG.diamond, color: "#00ccff", unlocked: streak >= 30 },
    { id: "streak100", title: "100 días", desc: "Mantén una racha de 100 días.", svg: SVG.star, color: "#ffdd00", unlocked: streak >= 100 },
    { id: "first_train", title: "Primer entreno", desc: "Registra tu primer entrenamiento.", svg: SVG.muscle, color: "#ff0040", unlocked: hasTrain },
    { id: "train10", title: "10 entrenos", desc: "Completa 10 entrenamientos.", svg: SVG.barbell, color: "#ffaa00", unlocked: trainCount >= 10 },
    { id: "train50", title: "50 entrenos", desc: "Completa 50 entrenamientos.", svg: SVG.trophy, color: "#ffdd00", unlocked: trainCount >= 50 },
    { id: "first_sale", title: "Primera venta", desc: "Registra tu primera venta.", svg: SVG.money, color: "#00ff88", unlocked: hasSale },
    { id: "sales10", title: "10 ventas", desc: "Registra 10 ventas en el CRM.", svg: SVG.cash, color: "#00ccff", unlocked: salesCount >= 10 },
    { id: "perfect_week", title: "Semana perfecta", desc: "Cumple hábitos los 7 días de la semana.", svg: SVG.sparkles, color: "#cc00ff", unlocked: perfectWeek },
    { id: "lvl5", title: "Nivel 5", desc: "Alcanza el Nivel 5.", svg: SVG.rocket, color: "#0088ff", unlocked: lvl >= 5 },
    { id: "lvl10", title: "Nivel 10", desc: "Alcanza el Nivel 10.", svg: SVG.moon, color: "#cc00ff", unlocked: lvl >= 10 },
    { id: "lvl50", title: "Nivel 50", desc: "Alcanza el Nivel 50.", svg: SVG.trident, color: "#ff0040", unlocked: lvl >= 50 },
    { id: "lvl100", title: "ASCENSION 100", desc: "Llega a lo más alto. Nivel 100.", svg: SVG.medal, color: "#ffdd00", unlocked: lvl >= 100 },
    { id: "food_logger", title: "Nutricionista", desc: "Registra comidas en 30 días distintos.", svg: SVG.plate, color: "#ff69b4", unlocked: foodDays >= 30 },
    { id: "bible_start", title: "Estudiante bíblico", desc: "Lee tu primer capítulo.", svg: SVG.book, color: "#0088ff", unlocked: hasBible },
    { id: "bible_50", title: "50% Biblia", desc: "Completa la mitad de la Biblia.", svg: SVG.scroll, color: "#ffaa00", unlocked: biblePct >= 50 },
    { id: "backup_hero", title: "Backup Hero", desc: "Exporta tus datos por primera vez.", svg: SVG.floppy, color: "#00ff88", unlocked: hasBackup },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="section active">
      <div className="sec-header">
        <div className="sec-title">LOGROS</div>
      </div>
      
      <div className="panel" style={{ marginBottom: '20px', background: 'var(--bg2)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '20px' }}>Progreso de Logros</h2>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)', marginTop: '10px' }}>
          {unlockedCount} / {totalCount}
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden', marginTop: '15px' }}>
          <div style={{ width: `${(unlockedCount / totalCount) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s' }}></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
        {achievements.map(ach => (
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
                boxShadow: ach.unlocked ? `0 0 15px ${ach.color}33` : 'none'
              }}>
                <div style={{ width: '28px', height: '28px' }} dangerouslySetInnerHTML={{ __html: ach.unlocked ? ach.svg : SVG.floppy }} />
                {!ach.unlocked && (
                  <div style={{ position: 'absolute', width: '28px', height: '28px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ width: '20px', height: '20px' }}>
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
