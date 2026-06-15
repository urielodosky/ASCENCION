"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/db";
import { getLvl } from "@/lib/utils";

export default function AchievementsPage() {
  const [mounted, setMounted] = useState(false);

  // DB States
  const [cfg] = useData<any>("cfg");
  const [totalXP] = useData<number>("totalXP");
  const [completedEx] = useData<any>("completedEx");
  const [habLogs] = useData<any>("habLogs");
  const [habCfg] = useData<any[]>("habCfg");
  const [incomes] = useData<any[]>("incomes");
  const [studyLogs] = useData<any>("studyLogs");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !cfg) return <div className="section active"><div style={{ padding: '20px' }}>Cargando logros...</div></div>;

  // --- CALCULATIONS FOR UNLOCKS ---
  const lvl = getLvl(totalXP || 0);
  const trainDaysCount = Object.keys(completedEx || {}).length;
  
  // Calculate Habits 7-day adherence
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10);
  });
  const totalHabitsIn7Days = (habCfg?.length || 0) * 7;
  let doneHabitsIn7Days = 0;
  last7Days.forEach(d => {
    if (habLogs && habLogs[d]) doneHabitsIn7Days += Object.values(habLogs[d]).filter(Boolean).length;
  });
  const habSuccessRate = totalHabitsIn7Days > 0 ? Math.round((doneHabitsIn7Days / totalHabitsIn7Days) * 100) : 0;

  // Finance
  const totalInc = (incomes || []).reduce((acc: number, i: any) => acc + i.amount, 0);

  // Study
  let totalStudyMin = 0;
  if (studyLogs) {
    Object.keys(studyLogs).forEach(subjId => {
      totalStudyMin += studyLogs[subjId].reduce((acc: number, log: any) => acc + (log.duration || 0), 0);
    });
  }
  const totalStudyHours = totalStudyMin / 60;

  // --- ACHIEVEMENTS LIST ---
  const achievements = [
    {
      id: "lvl2",
      title: "Despertar",
      desc: "Alcanza el Nivel 2 de experiencia.",
      icon: "ti-arrow-up",
      color: "#0088ff",
      progress: Math.min(100, Math.round((lvl / 2) * 100)),
      unlocked: lvl >= 2
    },
    {
      id: "lvl10",
      title: "Guerrero Curtido",
      desc: "Alcanza el Nivel 10.",
      icon: "ti-sword",
      color: "#cc00ff",
      progress: Math.min(100, Math.round((lvl / 10) * 100)),
      unlocked: lvl >= 10
    },
    {
      id: "train7",
      title: "Constancia",
      desc: "Registra 7 días de entrenamiento.",
      icon: "ti-flame",
      color: "#ff6600",
      progress: Math.min(100, Math.round((trainDaysCount / 7) * 100)),
      unlocked: trainDaysCount >= 7
    },
    {
      id: "train30",
      title: "Máquina",
      desc: "Registra 30 días de entrenamiento.",
      icon: "ti-barbell",
      color: "#ff0040",
      progress: Math.min(100, Math.round((trainDaysCount / 30) * 100)),
      unlocked: trainDaysCount >= 30
    },
    {
      id: "habits90",
      title: "Imparable",
      desc: "Logra un 90% de cumplimiento en hábitos en los últimos 7 días.",
      icon: "ti-checks",
      color: "#00ff88",
      progress: Math.min(100, Math.round((habSuccessRate / 90) * 100)),
      unlocked: habSuccessRate >= 90
    },
    {
      id: "fin1000",
      title: "Primeros Pasos Financieros",
      desc: "Genera tus primeros 1,000 en ingresos.",
      icon: "ti-coin",
      color: "#ffaa00",
      progress: Math.min(100, Math.round((totalInc / 1000) * 100)),
      unlocked: totalInc >= 1000
    },
    {
      id: "study10",
      title: "Intelectual",
      desc: "Acumula 10 horas de estudio.",
      icon: "ti-book",
      color: "#00ccff",
      progress: Math.min(100, Math.round((totalStudyHours / 10) * 100)),
      unlocked: totalStudyHours >= 10
    },
    {
      id: "study50",
      title: "Erudito",
      desc: "Acumula 50 horas de estudio.",
      icon: "ti-brain",
      color: "#ff69b4",
      progress: Math.min(100, Math.round((totalStudyHours / 50) * 100)),
      unlocked: totalStudyHours >= 50
    }
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
              <i className={`ti ${ach.icon}`} style={{ position: 'absolute', right: '-10px', bottom: '-15px', fontSize: '100px', opacity: 0.05, color: ach.color }}></i>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <div style={{ 
                width: '50px', height: '50px', borderRadius: '12px', 
                background: ach.unlocked ? `${ach.color}22` : 'var(--bg)',
                color: ach.unlocked ? ach.color : 'var(--text2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', boxShadow: ach.unlocked ? `0 0 15px ${ach.color}33` : 'none'
              }}>
                <i className={`ti ${ach.unlocked ? ach.icon : 'ti-lock'}`}></i>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: ach.unlocked ? 'var(--text)' : 'var(--text2)', fontSize: '14px' }}>{ach.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{ach.desc}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text2)', marginBottom: '5px' }}>
                <span>Progreso</span>
                <span style={{ color: ach.unlocked ? ach.color : 'var(--text2)' }}>{ach.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--bg)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${ach.progress}%`, height: '100%', background: ach.unlocked ? ach.color : 'var(--text2)', transition: 'width 1s' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
