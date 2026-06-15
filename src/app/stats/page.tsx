"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/db";
import { getLvl, getRank, XP_PER_LEVEL, getLvlPct } from "@/lib/utils";

// Helper para fecha de hoy y días pasados
const todayStr = () => new Date().toISOString().slice(0, 10);
const getPastDays = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
};

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);

  // DB States
  const [cfg] = useData<any>("cfg");
  const [totalXP] = useData<number>("totalXP");
  const [completedEx] = useData<any>("completedEx");
  const [habLogs] = useData<any>("habLogs");
  const [habCfg] = useData<any[]>("habCfg");
  const [incomes] = useData<any[]>("incomes");
  const [expenses] = useData<any[]>("expenses");
  const [foodLogs] = useData<any>("foodLogs");
  const [studyLogs] = useData<any>("studyLogs");
  const [subjects] = useData<any[]>("subjects");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !cfg) return <div className="section active"><div style={{ padding: '20px' }}>Cargando...</div></div>;

  // --- CALCULATIONS ---

  // 1. XP / Level
  const lvl = getLvl(totalXP || 0);
  const rank = getRank(lvl);
  const xpCurrent = (totalXP || 0) % XP_PER_LEVEL;
  const xpPct = getLvlPct(totalXP || 0);

  // 2. Training
  const trainDaysCount = Object.keys(completedEx || {}).length;
  const trainTotalEx = Object.values(completedEx || {}).reduce((acc: number, day: any) => acc + Object.keys(day).length, 0);

  // 3. Habits (Last 7 days)
  const last7Days = getPastDays(7);
  const totalHabitsIn7Days = (habCfg?.length || 0) * 7;
  let doneHabitsIn7Days = 0;
  last7Days.forEach(d => {
    if (habLogs && habLogs[d]) {
      doneHabitsIn7Days += Object.values(habLogs[d]).filter(Boolean).length;
    }
  });
  const habSuccessRate = totalHabitsIn7Days > 0 ? Math.round((doneHabitsIn7Days / totalHabitsIn7Days) * 100) : 0;

  // 4. Finance (All time & current month)
  const totalInc = (incomes || []).reduce((acc: number, i: any) => acc + i.amount, 0);
  const totalExp = (expenses || []).reduce((acc: number, e: any) => acc + e.amount, 0);
  const balance = totalInc - totalExp;
  
  const currentMonthPrefix = todayStr().slice(0, 7);
  const incThisMonth = (incomes || [])
    .filter((i: any) => i.date.startsWith(currentMonthPrefix))
    .reduce((acc: number, i: any) => acc + i.amount, 0);
  const monthlyGoal = cfg.goalMonthly || 5000;
  const monthlyGoalPct = Math.min(100, Math.round((incThisMonth / monthlyGoal) * 100));

  // 5. Nutrition (Last 7 days avg)
  let sumKcal = 0;
  let daysTracked = 0;
  last7Days.forEach(d => {
    if (foodLogs && foodLogs[d] && foodLogs[d].length > 0) {
      daysTracked++;
      sumKcal += foodLogs[d].reduce((acc: number, f: any) => acc + (f.kcal || 0), 0);
    }
  });
  const avgKcal = daysTracked > 0 ? Math.round(sumKcal / daysTracked) : 0;
  const targetKcal = cfg.kcal || 2000;
  const kcalPct = Math.min(100, Math.round((avgKcal / targetKcal) * 100));

  // 6. Study
  let totalStudyMin = 0;
  const studyBySubj: Record<string, number> = {};
  if (studyLogs) {
    Object.keys(studyLogs).forEach(subjId => {
      const min = studyLogs[subjId].reduce((acc: number, log: any) => acc + (log.duration || 0), 0);
      totalStudyMin += min;
      studyBySubj[subjId] = min;
    });
  }
  const totalStudyHours = (totalStudyMin / 60).toFixed(1);
  const topSubjId = Object.keys(studyBySubj).sort((a, b) => studyBySubj[b] - studyBySubj[a])[0];
  const topSubj = (subjects || []).find((s: any) => s.id === topSubjId);

  return (
    <div className="section active">
      <div className="sec-header">
        <div className="sec-title">ESTADÍSTICAS GLOBALES</div>
      </div>

      <div className="g2">
        {/* COL 1 */}
        <div>
          {/* LEVEL & XP PANEL */}
          <div className="panel" style={{ background: `linear-gradient(135deg, var(--bg2) 0%, ${rank.color}22 100%)`, border: `1px solid ${rank.color}44` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 'bold', textTransform: 'uppercase' }}>Rango Actual</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: rank.color, textShadow: `0 0 10px ${rank.color}44` }}>{rank.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 'bold' }}>Nivel</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{lvl}</div>
              </div>
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>XP de Nivel</span>
              <span>{xpCurrent} / {XP_PER_LEVEL}</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: rank.color, width: `${xpPct}%`, transition: 'width 1s ease-out' }}></div>
            </div>
          </div>

          {/* TRAINING PANEL */}
          <div className="panel">
            <div className="panel-head"><i className="ti ti-barbell"></i> Entrenamiento</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, padding: '15px', background: 'var(--bg3)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent)' }}>{trainDaysCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Días Activos</div>
              </div>
              <div style={{ flex: 1, padding: '15px', background: 'var(--bg3)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent)' }}>{trainTotalEx}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Ejercicios Realizados</div>
              </div>
            </div>
          </div>

          {/* STUDY PANEL */}
          <div className="panel">
            <div className="panel-head"><i className="ti ti-school"></i> Facultad</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Horas Totales (Histórico)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>{totalStudyHours}h</div>
              </div>
              <i className="ti ti-clock" style={{ fontSize: '32px', color: 'var(--accent)', opacity: 0.5 }}></i>
            </div>
            {topSubj && (
              <div style={{ padding: '10px', borderLeft: `3px solid ${topSubj.color}`, background: 'var(--bg3)', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text2)' }}>Materia Más Estudiada</div>
                <div style={{ fontWeight: 'bold', color: topSubj.color }}>{topSubj.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* COL 2 */}
        <div>
          {/* FINANCE PANEL */}
          <div className="panel">
            <div className="panel-head"><i className="ti ti-coin"></i> Finanzas</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Balance Global</span>
              <span style={{ fontWeight: 'bold', color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                ${balance.toLocaleString()} {cfg.currency}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Progreso Mensual (${incThisMonth} / ${monthlyGoal})</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text)' }}>{monthlyGoalPct}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #00ff88, #0088ff)', width: `${monthlyGoalPct}%`, transition: 'width 1s ease-out' }}></div>
            </div>
          </div>

          {/* HABITS PANEL */}
          <div className="panel">
            <div className="panel-head"><i className="ti ti-checks"></i> Hábitos (Últimos 7 días)</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: `conic-gradient(var(--accent) ${habSuccessRate}%, var(--bg) ${habSuccessRate}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: '50px', height: '50px', background: 'var(--bg3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                  {habSuccessRate}%
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>Tasa de Cumplimiento</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{doneHabitsIn7Days} de {totalHabitsIn7Days} hábitos cumplidos esta semana.</div>
              </div>
            </div>
          </div>

          {/* NUTRITION PANEL */}
          <div className="panel">
            <div className="panel-head"><i className="ti ti-salad"></i> Nutrición (Últimos 7 días)</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Promedio Calórico Diario</span>
              <span style={{ fontWeight: 'bold' }}>{avgKcal} / {targetKcal} kcal</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: kcalPct > 110 ? 'var(--red)' : kcalPct > 90 ? 'var(--green)' : 'var(--accent)', width: `${Math.min(100, kcalPct)}%`, transition: 'width 1s ease-out' }}></div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '8px', textAlign: 'right' }}>
              {daysTracked} días registrados esta semana.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
