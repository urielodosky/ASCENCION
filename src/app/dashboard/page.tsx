"use client";

import { useData } from "@/lib/db";
import { getLvlInfo, getRank, calcHabStreak, today, ds } from "@/lib/utils";
import Link from "next/link";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";

const VERSES = [
  { t: "Filipenses 4:13", v: "\"Todo lo puedo en Cristo que me fortalece.\"" },
  { t: "Josué 1:9", v: "\"Sé fuerte y valiente. No tengas miedo.\"" },
];

export default function DashboardPage() {
  const [cfg] = useData<any>("cfg");
  const [totalXP] = useData<number>("totalXP");
  const [lastBackup] = useData<number>("lastBackup");
  const [habLogs, setHabLogs] = useData<any>("habLogs");
  const [habCfg] = useData<any[]>("habCfg");
  const [foodLogs] = useData<any>("foodLogs");
  const [weightLogs] = useData<any[]>("weightLogs");
  const [calStates] = useData<any>("calStates");
  const [incomes] = useData<any[]>("incomes");
  const [expenses] = useData<any[]>("expenses");

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "BUENOS DÍAS" : hour < 18 ? "BUENAS TARDES" : "BUENAS NOCHES";

  const { lvl } = getLvlInfo(totalXP);
  const rank = getRank(lvl);
  const streak = calcHabStreak(habLogs, habCfg);

  const verse = VERSES[Math.floor(Date.now() / 86400000) % VERSES.length];

  const todayFood = foodLogs[today()] || [];
  const kcalToday = todayFood.reduce((a: any, b: any) => a + b.kcal, 0);

  const currentWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : cfg.peso;

  const p2 = (n: number) => String(n).padStart(2, "0");
  const nowM = now.getMonth();
  const nowY = now.getFullYear();
  const pre = `${nowY}-${p2(nowM + 1)}-`;

  const monthTrain = Object.entries(calStates).filter(([k, v]) => k.startsWith(pre) && v === "done").length;
  const monthInc = incomes.filter(i => i.date.startsWith(`${nowY}-${p2(nowM + 1)}`)).reduce((a, b) => a + b.amount, 0);
  const monthExp = expenses.filter(e => e.date.startsWith(`${nowY}-${p2(nowM + 1)}`)).reduce((a, b) => a + b.amount, 0);
  const saldo = monthInc - monthExp;

  const dateStr = now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dstr = ds(d);
    last7.push({ d, kcal: (foodLogs[dstr] || []).reduce((a: any, b: any) => a + b.kcal, 0) });
  }
  const maxK = Math.max(...last7.map(x => x.kcal), cfg.kcal, 1);

  const [routines] = useData<any[]>("routines");
  const [completedEx, setCompletedEx] = useData<any>("completedEx");
  const [reminders] = useData<any[]>("reminders");
  const [studyEvents] = useData<any[]>("studyEvents");

  const dow = (now.getDay() + 6) % 7;

  const getDatesBeforeTodayThisWeek = () => {
    const dates = [];
    for (let i = 1; i <= dow; i++) {
      const prevD = new Date(now);
      prevD.setDate(now.getDate() - i);
      dates.push(ds(prevD));
    }
    return dates;
  };
  
  const isRoutineCompletedOnDate = (dstr: string) => {
    const compData = completedEx[dstr];
    if (!compData) return false;
    for (const routine of routines) {
       if (routine.exercises && routine.exercises.length > 0) {
          const allDone = routine.exercises.every((_: any, i: number) => compData[routine.id + i]);
          if (allDone) return true;
       }
    }
    return false;
  };

  const prevDays = getDatesBeforeTodayThisWeek();
  const completedCount = prevDays.filter(dstr => isRoutineCompletedOnDate(dstr)).length;
  
  const isRestDay = completedCount >= routines.length || completedCount >= 7;
  const r = isRestDay ? null : routines[completedCount];
  const comp = completedEx[today()] || {};
  const done = r ? r.exercises.filter((_: any, i: number) => comp[r.id + i]).length : 0;

  const { calcWeekHabPct, DMIN, fmtD } = require("@/lib/utils");
  const weekHabPct = calcWeekHabPct(habLogs, habCfg);

  const weeklyStats = [
    { l: "Calorías hoy", v: kcalToday, m: cfg.kcal, c: "var(--amber)", s: " kcal" },
    { l: "Hábitos semana", v: weekHabPct, m: 100, c: "var(--green)", s: "%" },
    { l: "Entrenos mes", v: monthTrain, m: 25, c: "var(--red)", s: "" },
    { l: "Balance mes", v: Math.max(0, saldo), m: Math.max(monthInc, 1), c: "var(--blue)", s: "" },
  ];

  const todayLog = habLogs[today()] || {};
  const todayDow = (now.getDay() + 6) % 7;
  const todayRems = reminders.filter((rm: any) => rm.days.includes(todayDow));

  const todayStr = today();
  const upcomingEvents = studyEvents.filter((e: any) => e.date >= todayStr).sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(0, 3);

  const toggleHabit = (hid: string) => {
    const newLogs = { ...habLogs };
    if (!newLogs[todayStr]) newLogs[todayStr] = {};
    const cur = newLogs[todayStr][hid] ?? -1;
    const next = cur === 1 ? 0 : cur === 0 ? -1 : 1;
    if (next === -1) delete newLogs[todayStr][hid];
    else newLogs[todayStr][hid] = next;

    setHabLogs(newLogs);
  };

  const toggleExercise = (idx: number) => {
    if (!r) return;
    const newComp = { ...comp };
    const key = r.id + idx;
    if (newComp[key]) {
      delete newComp[key];
    } else {
      newComp[key] = true;
    }
    const fullCompletedEx = { ...completedEx };
    fullCompletedEx[todayStr] = newComp;
    setCompletedEx(fullCompletedEx);
  };

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header">
        <div>
          <div className="sec-title" id="dash-greeting">
            {cfg.name ? `${greeting}, ${cfg.name.toUpperCase()}` : greeting}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text2)", marginTop: "2px" }}>
            {dateStr}
          </div>
        </div>
        <div className="sec-actions">
          <span className="tag tag-red">🔥 {streak} días</span>
          <span className="tag tag-amber">{rank.name} LVL{lvl}</span>
        </div>
      </div>

      <div style={{ background: "rgba(255,0,64,0.04)", border: "1px solid var(--border3)", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "22px" }}>📖</span>
        <div style={{ fontSize: "11px", color: "var(--text2)", fontStyle: "italic", flex: 1, lineHeight: "1.6" }}>
          <span style={{ color: "var(--amber)", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>{verse.t}</span><br />
          {verse.v}
        </div>
      </div>

      <div className="g4">
        <div className="stat-card c-amber">
          <div className="stat-label">Calorías hoy</div>
          <div className="stat-value c-amber" style={{ fontSize: "28px", display: "flex", alignItems: "baseline", gap: "4px" }}>
            {kcalToday} <span style={{ fontSize: "14px", color: "var(--text2)", textShadow: "none", fontWeight: 600 }}>/ {cfg.kcal} kcal</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255, 0, 64, 0.15)", borderRadius: "3px", marginTop: "12px", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (kcalToday / (cfg.kcal || 1)) * 100)}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease", boxShadow: "0 0 8px rgba(255, 0, 64, 0.8)" }}></div>
          </div>
        </div>
        <div className="stat-card c-green">
          <div className="stat-label">Racha hábitos</div>
          <div className="stat-value c-green">{streak}<span style={{ fontSize: "12px" }}>d</span></div>
          <div className="stat-diff up">🔥 días seguidos</div>
        </div>
        <div className="stat-card c-red">
          <div className="stat-label">Peso actual</div>
          <div className="stat-value c-red">{currentWeight || "--"}<span style={{ fontSize: "12px" }}>kg</span></div>
          <div className={`stat-diff ${currentWeight && currentWeight <= cfg.pesoGoal ? "up" : "down"}`}>
            Obj: {cfg.pesoGoal}kg
          </div>
        </div>
        <div className={`stat-card ${saldo >= 0 ? "c-green" : ""}`}>
          <div className="stat-label">Saldo mes</div>
          <div className={`stat-value ${saldo >= 0 ? "c-green" : "c-red"}`} style={{ fontSize: "26px" }}>
            ${saldo.toLocaleString("es-AR")}
          </div>
          <div className={`stat-diff ${saldo >= 0 ? "up" : "down"}`}>
            {monthTrain} entrenos este mes
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginTop: "16px", alignItems: "flex-start" }}>
        <CollapsiblePanel title="Calorías (últimos 7 días)" defaultOpen={false} colorClass="panel-amber" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "100px", padding: "10px 0" }}>
            {last7.map((x, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "100%", height: "66px", display: "flex", alignItems: "flex-end", background: "var(--bg)" }}>
                  <div className="sparkbar" style={{ width: "100%", height: `${Math.max(4, Math.round((x.kcal / maxK) * 66))}px`, background: i === 6 ? "var(--red)" : "rgba(255,0,64,0.3)" }}></div>
                </div>
                <div className="sparklabel">{DMIN[(x.d.getDay() + 6) % 7]}</div>
              </div>
            ))}
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Progreso Semanal" defaultOpen={false} colorClass="panel-blue" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
            {weeklyStats.map((st, i) => (
              <div key={i} className="bar-row">
                <div className="bar-label" style={{ width: "120px", flexShrink: 0 }}>{st.l}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(100, Math.round((st.v / st.m) * 100))}%`, background: st.c }}></div>
                </div>
                <div className="bar-val">{st.v.toLocaleString("es-AR")}{st.s}</div>
              </div>
            ))}
          </div>
        </CollapsiblePanel>
      </div>

      <div className="g3" style={{ marginTop: "16px", alignItems: "flex-start" }}>
        <CollapsiblePanel title={isRestDay ? "Día de descanso 🌴" : `Rutina: ${r ? r.name : "--"}`} defaultOpen={false} colorClass="panel-red" style={{ marginBottom: 0 }}>
          {isRestDay ? (
            <div className="empty-state"><i className="ti ti-bed"></i><p>Has completado las rutinas de esta semana</p></div>
          ) : r ? (
            <>
              {r.exercises.slice(0, 4).map((ex: any, i: number) => {
                const isDone = comp[r.id + i];
                return (
                  <div key={i} className="ex-item" style={{ opacity: isDone ? 0.5 : 1 }}>
                    <div
                      className={`ex-chk ${isDone ? "done" : ""}`}
                      style={isDone ? { background: "var(--accent)", borderColor: "var(--accent)", cursor: "pointer" } : { cursor: "pointer" }}
                      onClick={() => toggleExercise(i)}
                    >
                      <i className="ti ti-check" style={{ opacity: isDone ? 1 : 0 }}></i>
                    </div>
                    <div className="ex-name">{ex.n}</div>
                    <div className="ex-meta">{ex.sets}×{ex.reps}</div>
                    <div className="ex-wt">{ex.weight ? ex.weight + "kg" : "BW"}</div>
                  </div>
                );
              })}
              <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`tag ${done === r.exercises.length && r.exercises.length > 0 ? "tag-green" : done > 0 ? "tag-amber" : "tag-red"}`}>
                  {done}/{r.exercises.length}
                </span>
                <Link href="/training" className="btn btn-secondary btn-sm">Ver 💪</Link>
              </div>
            </>
          ) : (
            <div className="empty-state"><i className="ti ti-barbell"></i><p>Sin rutinas</p></div>
          )}
        </CollapsiblePanel>

        <CollapsiblePanel title="Hábitos de Hoy" defaultOpen={false} colorClass="panel-green" style={{ marginBottom: 0 }}>
          {habCfg.slice(0, 5).map((h: any) => {
            const v = todayLog[h.id] ?? -1;
            return (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: "1px solid #111" }}>
                <div
                  className={`hab-circle ${v === 1 ? "done" : v === 0 ? "fail" : "empty"}`}
                  style={{ borderColor: h.color, background: v === 1 ? h.color : "transparent", cursor: "pointer" }}
                  onClick={() => toggleHabit(h.id)}
                >
                  {v === 1 ? "✔️" : v === 0 ? "✖️" : ""}
                </div>
                <div style={{ flex: 1, fontSize: "11px", fontWeight: 500 }}>{h.name}</div>
              </div>
            );
          })}
        </CollapsiblePanel>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <CollapsiblePanel title="Recordatorios" defaultOpen={false} colorClass="panel-purple" style={{ marginBottom: 0 }}>
            {todayRems.length > 0 ? todayRems.map((rm: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 0", borderBottom: "1px solid #111" }}>
                <span style={{ fontSize: "14px" }}>{rm.type === "facultad" ? "🎓" : "💊"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: rm.type === "facultad" ? "var(--blue)" : "var(--amber)" }}>{rm.text}</div>
                  {rm.time && <div style={{ fontSize: "11px", color: "var(--text2)" }}>{rm.time}</div>}
                </div>
              </div>
            )) : (
              <div style={{ fontSize: "12px", color: "var(--text2)", padding: "8px 0" }}>Sin recordatorios para hoy.</div>
            )}
          </CollapsiblePanel>

          {upcomingEvents.length > 0 && (
            <CollapsiblePanel title="Próximos eventos de facultad 🎓" defaultOpen={false} colorClass="panel-blue" style={{ marginBottom: 0 }}>
              {upcomingEvents.map((e: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #111" }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "12px", fontWeight: 700, color: e.type === "exam" ? "var(--red)" : e.type === "task" ? "var(--amber)" : "var(--blue)", minWidth: "50px" }}>
                    {fmtD(e.date)}
                  </span>
                  <div style={{ flex: 1, fontSize: "12px" }}>
                    {e.desc}{e.subject && <span style={{ color: "var(--text2)" }}> · {e.subject}</span>}
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", color: "#000", background: e.type === "exam" ? "var(--red)" : e.type === "task" ? "var(--amber)" : "var(--blue)" }}>
                    {e.type === "exam" ? "PARCIAL" : e.type === "task" ? "ENTREGA" : "CLASE"}
                  </span>
                </div>
              ))}
            </CollapsiblePanel>
          )}
        </div>
      </div>
    </div>
  );
}

