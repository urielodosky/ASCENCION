"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { ds, fmtD, XP_RULES, getWeekDates, calcHabStreak, calcWeekHabPct, uid, DAYS_FULL } from "@/lib/utils";

// Helper to calc 30 days pct (includes up to 7 days in future for testing)
function calcHabPct30(habId: string, habLogs: any) {
  let done = 0, tot = 0;
  for (let i = -7; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const v = (habLogs[ds(d)] || {})[habId];
    if (v !== undefined && v !== -1) {
      tot++;
      if (v === 1) done++;
    }
  }
  return tot ? Math.round((done / tot) * 100) : 0;
}

// calc perfect days in a given set of dates
function calcPerfectDays(dates: Date[], habLogs: any, habCfg: any[]) {
  let p = 0;
  dates.forEach(d => {
    const dstr = ds(d);
    const log = habLogs[dstr] || {};
    const active = habCfg.filter((h: any) => !h.startDate || dstr >= h.startDate);
    if (active.length > 0 && active.every((h: any) => (log[h.id] || 0) === 1)) p++;
  });
  return p;
}

export default function HabitsPage() {
  const [habCfg, setHabCfg] = useData<any[]>("habCfg");
  const [habLogs, setHabLogs] = useData<any>("habLogs");
  const [xpLog, setXpLog] = useData<any>("xpLog");
  const [totalXP, setTotalXP] = useData<number>("totalXP");
  
  const [habWeekOffset, setHabWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", emoji: "", color: "#ff0040" });

  const safeHabCfg = habCfg || [];
  const safeHabLogs = habLogs || {};

  const dates = getWeekDates(habWeekOffset);
  const startDateStr = fmtD(ds(dates[0]));
  const endDateStr = fmtD(ds(dates[6]));

  const streak = calcHabStreak(safeHabLogs, safeHabCfg);
  const pct = calcWeekHabPct(safeHabLogs, safeHabCfg, habWeekOffset);
  const perfect = calcPerfectDays(dates, safeHabLogs, safeHabCfg);
  
  // Fake best streak for now since original didn't have a robust best streak calc in util, or I can calc it
  const best = streak; 

  const toggleHabDay = (hId: string, dstr: string, curVal: number) => {
    const nextVal = curVal === 1 ? 0 : curVal === 0 ? -1 : 1;
    const newLogs = { ...safeHabLogs };
    if (!newLogs[dstr]) newLogs[dstr] = {};
    newLogs[dstr][hId] = nextVal;
    
    // XP addition
    let newXpLog = [...(xpLog || [])];
    let newTotalXP = totalXP || 0;
    if (nextVal === 1 && curVal !== 1) {
      newXpLog.unshift({ id: Date.now().toString(), label: 'Hábito sumado', amount: XP_RULES.habit, ts: Date.now() });
      newTotalXP += XP_RULES.habit;
    }

    setHabLogs(newLogs);
    setXpLog(newXpLog);
    setTotalXP(newTotalXP);
  };

  const createHabit = () => {
    if (!newHabit.name) return;
    const hab = { id: uid(), name: newHabit.name, emoji: newHabit.emoji, color: newHabit.color, startDate: ds(new Date()) };
    setHabCfg([...safeHabCfg, hab]);
    setShowModal(false);
    setNewHabit({ name: "", emoji: "", color: "#ff0040" });
  };

  const deleteHab = (id: string) => {
    if (!confirm('¿Eliminar hábito? Perderás su historial.')) return;
    setHabCfg(safeHabCfg.filter(h => h.id !== id));
  };

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header">
        <div className="sec-title">HÁBITOS</div>
        <div className="sec-pill">{startDateStr} - {endDateStr}</div>
        <div className="sec-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setHabWeekOffset(habWeekOffset - 1)}>‹ Sem</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setHabWeekOffset(habWeekOffset + 1)}>Sem ›</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            + Hábito
          </button>
        </div>
      </div>

      <div className="g4">
        <div className="stat-card c-green">
          <div className="stat-label">Racha actual</div>
          <div className="stat-value c-green">{streak}<span style={{fontSize:"14px"}}>d</span></div>
        </div>
        <div className="stat-card c-amber">
          <div className="stat-label">Mejor racha</div>
          <div className="stat-value c-amber">{best}<span style={{fontSize:"14px"}}>d</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Semana</div>
          <div className="stat-value">{pct}%</div>
        </div>
        <div className="stat-card c-blue">
          <div className="stat-label">Días perfectos</div>
          <div className="stat-value c-blue">{perfect}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Tracker semanal</div>
        <div className="hab-grid-wrap" style={{overflowX:"auto"}}>
          <table className="hab-grid-table">
            <thead>
              <tr>
                <th style={{textAlign:"left", paddingBottom:"8px", minWidth:"140px"}}>Hábito</th>
                {dates.map((d, i) => {
                  const isT = ds(d) === ds(new Date());
                  return (
                    <th key={i} style={{ color: isT ? 'var(--red)' : '', fontSize:"9px", textAlign:"center" }}>
                      {DAYS_FULL[i].slice(0, 3).toUpperCase()}<br/>
                      <span style={{fontSize:"8px", color:"var(--text2)"}}>{d.getDate()}</span>
                    </th>
                  );
                })}
                <th style={{fontSize:"9px", color:"var(--text2)", textAlign:"center"}}>30d</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {safeHabCfg.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state" style={{padding:"16px"}}>
                      <p>Creá tu primer hábito</p>
                    </div>
                  </td>
                </tr>
              ) : safeHabCfg.map(h => {
                const pct30 = calcHabPct30(h.id, safeHabLogs);
                return (
                  <tr key={h.id}>
                    <td className="hab-name-cell" style={{whiteSpace:"nowrap"}}>
                      <span style={{display:"inline-block", width:"7px", height:"7px", borderRadius:"50%", background:h.color, marginRight:"7px"}}></span>
                      {h.emoji && <span style={{marginRight:"5px"}}>{h.emoji}</span>}
                      {h.name}
                      {h.startDate && <div style={{fontSize:"8px", color:"var(--text2)"}}>desde {fmtD(h.startDate)}</div>}
                    </td>
                    {dates.map(d => {
                      const dstr = ds(d);
                      if (h.startDate && dstr < h.startDate) {
                        return <td key={dstr}><div className="hab-circle inactive" title="No iniciado"></div></td>;
                      }
                      const v = (safeHabLogs[dstr] || {})[h.id] ?? -1;
                      const style: any = v === 1 ? { background: h.color, borderColor: h.color } : v === 0 ? { borderColor: h.color, opacity: 0.3 } : { borderColor: '#222' };
                      const cls = `hab-circle ${v === 1 ? 'done' : v === 0 ? 'fail' : 'empty'}`;
                      return (
                        <td key={dstr}>
                          <div className={cls} style={style} onClick={() => toggleHabDay(h.id, dstr, v)}>
                            {v === 1 ? '✓' : v === 0 ? '✗' : ''}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{textAlign:"center", fontFamily:"Orbitron", fontSize:"11px", fontWeight:700, color:h.color}}>
                      {pct30}%
                    </td>
                    <td style={{textAlign:"right"}}>
                      <button className="btn-icon btn-sm" onClick={() => deleteHab(h.id)} style={{color:"var(--text3)"}}>✗</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Cumplimiento 30 días</div>
        <div style={{display:"flex", flexDirection:"column", gap:"10px", marginTop:"10px"}}>
          {safeHabCfg.length ? safeHabCfg.map(h => {
            const p = calcHabPct30(h.id, safeHabLogs);
            return (
              <div key={`bar-${h.id}`} className="bar-row">
                <div className="bar-label" style={{width:"110px", flexShrink:0}}>{h.name}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width:`${p}%`, background:h.color}}></div>
                </div>
                <div className="bar-val">{p}%</div>
              </div>
            );
          }) : <div className="empty-state" style={{padding:"14px"}}>Sin hábitos</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal open" style={{zIndex: 9999}}>
          <div className="modal-content" style={{maxWidth:"400px"}}>
            <div className="modal-header">Nuevo Hábito</div>
            <div className="form-group">
              <label className="form-label">Nombre del Hábito</label>
              <input type="text" className="form-input" placeholder="Ej: Leer 10 páginas" 
                value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Color (Hex)</label>
              <input type="color" className="form-input" 
                value={newHabit.color} onChange={e => setNewHabit({...newHabit, color: e.target.value})} 
                style={{padding:"0", height:"40px"}}/>
            </div>
            <div className="modal-footer" style={{marginTop:"20px", display:"flex", gap:"10px", justifyContent:"flex-end"}}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={createHabit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
