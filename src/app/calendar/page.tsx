"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { MONTHS, DMIN, p2, ds, fmtD, XP_RULES } from "@/lib/utils";

export default function CalendarPage() {
  const [calStates, setCalStates] = useData<any>("calStates");
  const [xpLog, setXpLog] = useData<any>("xpLog");
  const [totalXP, setTotalXP] = useData<number>("totalXP");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const changeCalMonth = (d: number) => {
    let newM = calMonth + d;
    let newY = calYear;
    if (newM > 11) { newM = 0; newY++; }
    if (newM < 0) { newM = 11; newY--; }
    setCalMonth(newM);
    setCalYear(newY);
  };

  const cycleCalDay = (key: string) => {
    const states = ['', 'done', 'partial', 'missed', 'rest'];
    const cur = (calStates || {})[key] || '';
    const next = states[(states.indexOf(cur) + 1) % 5];
    
    const newStates = { ...(calStates || {}) };
    newStates[key] = next;
    
    // Check if done just now
    let newXpLog = [...(xpLog || [])];
    let newTotalXP = totalXP || 0;
    if (next === 'done' && cur !== 'done') {
      newXpLog.unshift({ id: Date.now().toString(), label: 'Día entrenado', amount: XP_RULES.train, ts: Date.now() });
      newTotalXP += XP_RULES.train;
    }

    setCalStates(newStates);
    setXpLog(newXpLog);
    setTotalXP(newTotalXP);
  };

  const calcCalStreak = () => {
    let s = 0;
    const d = new Date();
    while ((calStates || {})[ds(d)] === 'done' || (calStates || {})[ds(d)] === 'rest') {
      if ((calStates || {})[ds(d)] === 'done') s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  };

  const pre = `${calYear}-${p2(calMonth + 1)}-`;
  const vals = Object.entries(calStates || {}).filter(([k]) => k.startsWith(pre));
  const done = vals.filter(([, v]) => v === 'done').length;
  const total = vals.filter(([, v]) => v !== '').length;
  const streak = calcCalStreak();

  const now = new Date();
  const first = new Date(calYear, calMonth, 1);
  const offset = (first.getDay() + 6) % 7; // Lunes es 0
  const days = new Date(calYear, calMonth + 1, 0).getDate();

  const entries = Object.entries(calStates || {})
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 15);

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header">
        <div className="sec-title">CALENDARIO</div>
        <div className="sec-pill">{MONTHS[calMonth]} {calYear}</div>
        <div className="sec-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => changeCalMonth(-1)}>‹</button>
          <button className="btn btn-secondary btn-sm" onClick={() => changeCalMonth(1)}>›</button>
        </div>
      </div>

      <div className="g3">
        <div className="stat-card c-green">
          <div className="stat-label">Entrenamientos</div>
          <div className="stat-value c-green">{done}</div>
          <div className="stat-diff up">este mes</div>
        </div>
        <div className="stat-card c-amber">
          <div className="stat-label">Cumplimiento</div>
          <div className="stat-value c-amber">{total ? Math.round(done / total * 100) : 0}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Racha</div>
          <div className="stat-value">{streak}<span style={{fontSize:"14px"}}>d</span></div>
        </div>
      </div>

      <div className="g2">
        <div className="panel">
          <div className="panel-head">Mes actual</div>
          <div className="cal-mini-grid">
            {DMIN.map((d, i) => <div key={`h-${i}`} className="cal-mini-hdr">{d}</div>)}
            {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="cal-mini-cell c-empty"></div>)}
            {Array.from({ length: days }).map((_, i) => {
              const d = i + 1;
              const key = `${calYear}-${p2(calMonth + 1)}-${p2(d)}`;
              const st = calStates[key] || '';
              const isToday = now.getDate() === d && now.getMonth() === calMonth && now.getFullYear() === calYear;
              const restTitle = st === 'rest' ? 'Día de descanso' : '';
              
              let cls = "cal-mini-cell";
              if (st) cls += ` c-${st}`;
              if (isToday) cls += " c-today";

              return (
                <div key={key} className={cls} onClick={() => cycleCalDay(key)} title={restTitle}>
                  {d}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span className="tag tag-green">✓ Entrenado</span>
            <span className="tag tag-amber">~ Parcial</span>
            <span className="tag tag-red">✗ Faltó</span>
            <span className="tag tag-blue">↓ Descanso</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">Historial reciente</div>
          <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {entries.length ? entries.map(([k, v]) => {
              const color = v === 'done' ? 'var(--green)' : v === 'rest' ? 'var(--blue)' : v === 'missed' ? 'var(--red)' : 'var(--amber)';
              const bg = v === 'done' ? 'rgba(0,255,136,0.4)' : v === 'rest' ? 'rgba(0,136,255,0.4)' : v === 'missed' ? 'rgba(255,0,64,0.4)' : 'rgba(255,170,0,0.4)';
              const icon = v === 'done' ? '✓' : v === 'rest' ? '↓' : v === 'missed' ? '✗' : '~';
              const label = v === 'done' ? 'Entrenado' : v === 'rest' ? 'Descanso programado' : v === 'missed' ? 'Fallido' : 'Parcial';

              return (
                <div key={k} className="tx-row">
                  <div className="tx-icon" style={{ color, borderColor: bg }}>{icon}</div>
                  <div className="tx-info">
                    <div className="tx-desc">{fmtD(k)}</div>
                    <div className="tx-meta">{label}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="empty-state">
                <i className="ti ti-calendar"></i>
                <p>Sin registros aún</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
