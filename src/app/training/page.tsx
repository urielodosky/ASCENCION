"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { today, ds, uid } from "@/lib/utils";

const ISRAETEL: Record<string, any> = {
  pecho: { mev: 10, mav: 20, mrv: 22 }, espalda: { mev: 10, mav: 22, mrv: 25 },
  hombros: { mev: 6, mav: 22, mrv: 26 }, biceps: { mev: 8, mav: 20, mrv: 26 },
  triceps: { mev: 6, mav: 14, mrv: 18 }, cuadriceps: { mev: 8, mav: 18, mrv: 20 },
  femoral: { mev: 6, mav: 16, mrv: 20 }, gluteos: { mev: 0, mav: 12, mrv: 16 },
  gemelos: { mev: 8, mav: 16, mrv: 20 }, abs: { mev: 1, mav: 20, mrv: 25 },
  trapecios: { mev: 1, mav: 20, mrv: 26 }, antebrazos: { mev: 4, mav: 10, mrv: 16 }
};

const musclePathMap: Record<string, string> = {
  pecho: 'M 30 42 Q 40 38 48 45 Q 40 55 30 58 Z M 62 42 Q 52 38 44 45 Q 52 55 62 58 Z',
  hombros: 'M 20 35 Q 22 28 30 30 Q 28 40 24 42 Z M 72 35 Q 70 28 62 30 Q 64 40 68 42 Z',
  biceps: 'M 18 45 Q 15 55 17 65 Q 22 62 24 52 Z M 74 45 Q 77 55 75 65 Q 70 62 68 52 Z',
  triceps: 'M 22 45 Q 19 55 21 65 Q 26 60 27 50 Z M 70 45 Q 73 55 71 65 Q 66 60 65 50 Z',
  espalda: 'M 32 42 Q 46 38 60 42 Q 62 60 46 65 Q 30 60 32 42 Z',
  trapecios: 'M 34 28 Q 46 24 58 28 Q 56 36 46 38 Q 36 36 34 28 Z',
  abs: 'M 37 66 Q 46 63 55 66 L 56 90 Q 46 93 36 90 Z',
  cuadriceps: 'M 33 95 Q 38 120 36 140 Q 30 140 28 120 Z M 59 95 Q 54 120 56 140 Q 62 140 64 120 Z',
  femoral: 'M 34 95 Q 40 120 38 140 Q 44 140 44 120 Q 44 100 40 95 Z M 58 95 Q 52 120 54 140 Q 48 140 48 120 Q 48 100 52 95 Z',
  gluteos: 'M 33 85 Q 46 82 59 85 Q 60 95 46 98 Q 32 95 33 85 Z',
  gemelos: 'M 32 142 Q 34 162 33 175 Q 28 173 27 155 Z M 60 142 Q 58 162 59 175 Q 64 173 65 155 Z',
  antebrazos: 'M 16 65 Q 14 78 15 88 Q 19 85 20 72 Z M 76 65 Q 78 78 77 88 Q 73 85 72 72 Z'
};

const DEFAULT_EX = { n: "", section: "Fuerza", sets: 4, reps: 8, weight: 0, time: 0, band: "", rest: 90, notes: "", muscles: [] as string[] };

export default function TrainingPage() {
  const [cfg] = useData<any>("cfg");
  const [routines, setRoutines] = useData<any[]>("routines");
  const [completedEx, setCompletedEx] = useData<any>("completedEx");
  const [calStates, setCalStates] = useData<any>("calStates");
  const [weightHist, setWeightHist] = useData<any[]>("weightHist");

  const [activeRoutine, setActiveRoutine] = useState(0);
  const [activeSection, setActiveSection] = useState("");

  // Drag and Drop State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    
    const newRoutines = [...(routines || [])];
    const item = newRoutines.splice(draggedIdx, 1)[0];
    newRoutines.splice(targetIdx, 0, item);
    
    // Auto-rename logic
    newRoutines.forEach((rt, idx) => {
      const match = rt.name.match(/^(?:DÍA\s+\d+\s*—\s*)(.*)$/i);
      const baseName = match ? match[1] : rt.name;
      rt.name = `DÍA ${idx + 1} — ${baseName}`;
    });

    setRoutines(newRoutines);
    setActiveRoutine(targetIdx);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const addRoutine = () => {
    const newRoutines = [...(routines || [])];
    newRoutines.push({
      id: "r" + uid(),
      name: `DÍA ${newRoutines.length + 1} — NUEVO`,
      cat: "Hipertrofia",
      exercises: []
    });
    setRoutines(newRoutines);
    setActiveRoutine(newRoutines.length - 1);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [exForm, setExForm] = useState(DEFAULT_EX);
  // Routine Settings Modal
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [routineForm, setRoutineForm] = useState({ name: "", cat: "", sections: [] as string[] });

  const openRoutineModal = () => {
    if (!r) return;
    const baseNameMatch = r.name.match(/^(?:DÍA\s+\d+\s*—\s*)(.*)$/i);
    const baseName = baseNameMatch ? baseNameMatch[1] : r.name;
    setRoutineForm({
      name: baseName,
      cat: r.cat || "Fuerza",
      sections: r.sections || ["Entrada en calor", "Core", "Fuerza", "Flexibilidad"]
    });
    setIsRoutineModalOpen(true);
  };

  const saveRoutineSettings = () => {
    if (!r) return;
    const newRoutines = [...routines];
    const newName = `DÍA ${activeRoutine + 1} — ${routineForm.name}`;
    newRoutines[activeRoutine] = { ...r, name: newName, cat: routineForm.cat, sections: routineForm.sections };
    setRoutines(newRoutines);
    setIsRoutineModalOpen(false);
  };

  const handleSectionDrop = (draggedIdx: number, targetIdx: number) => {
    const newSecs = [...routineForm.sections];
    const item = newSecs.splice(draggedIdx, 1)[0];
    newSecs.splice(targetIdx, 0, item);
    setRoutineForm({ ...routineForm, sections: newSecs });
  };


  const doneTotal = Object.values(calStates || {}).filter((v) => v === "done").length;
  const wu = cfg?.weightUnit || "kg";
  const todayStr = today();

  const calcTotalVolume = () => {
    let v = 0;
    Object.values(completedEx || {}).forEach((day: any) => {
      (routines || []).forEach((rt) => {
        (rt.exercises || []).forEach((ex: any, i: number) => {
          if (day[rt.id + i]) {
            v += (ex.sets || 0) * (ex.reps || 0) * (ex.weight || 1);
          }
        });
      });
    });
    return v;
  };

  const calcWeekSetsForMuscle = (muscle: string) => {
    let sets = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dc = (completedEx || {})[ds(d)] || {};
      (routines || []).forEach((rt) => {
        (rt.exercises || []).forEach((ex: any, ei: number) => {
          if (dc[rt.id + ei] && (ex.muscles || []).includes(muscle)) {
            sets += (ex.sets || 0);
          }
        });
      });
    }
    return sets;
  };

  const r = routines?.[activeRoutine];
  const tc = (completedEx || {})[todayStr] || {};
  const doneCount = r?.exercises ? r.exercises.filter((_: any, i: number) => tc[r.id + i]).length : 0;
  const pct = r?.exercises?.length ? Math.round((doneCount / r.exercises.length) * 100) : 0;
  const catColor = r?.cat === "Fuerza" ? "tag-red" : r?.cat === "Hipertrofia" ? "tag-amber" : "tag-blue";

  const toggleEx = (idx: number) => {
    if (!r) return;
    const newComp = { ...(completedEx || {}) };
    const dayData = { ...(newComp[todayStr] || {}) };
    const key = r.id + idx;
    
    const isDone = !dayData[key];
    if (isDone) {
      dayData[key] = true;
      const ex = r.exercises[idx];
      if (ex && ex.weight) {
        setWeightHist([...(weightHist || []), { date: todayStr, exercise: ex.n, weight: ex.weight }]);
      }
    } else {
      delete dayData[key];
    }
    
    newComp[todayStr] = dayData;
    setCompletedEx(newComp);
  };

  const markRoutineComplete = () => {
    if (!r) return;
    const newComp = { ...(completedEx || {}) };
    const dayData = { ...(newComp[todayStr] || {}) };
    (r.exercises || []).forEach((_: any, i: number) => {
      dayData[r.id + i] = true;
    });
    newComp[todayStr] = dayData;
    setCompletedEx(newComp);

    const newCalStates = { ...(calStates || {}) };
    newCalStates[todayStr] = "done";
    setCalStates(newCalStates);
  };

  const duplicateRoutine = () => {
    if (!r) return;
    const newRoutines = [...routines];
    newRoutines.push({
      ...r,
      id: "r" + uid(),
      name: r.name + " (Copia)",
      exercises: r.exercises.map((ex: any) => ({ ...ex, id: "e" + uid() }))
    });
    setRoutines(newRoutines);
    setActiveRoutine(newRoutines.length - 1);
  };

  const deleteRoutine = () => {
    if (!r || routines.length <= 1) return;
    if (confirm("¿Eliminar esta rutina?")) {
      const newRoutines = routines.filter((_, i) => i !== activeRoutine);
      setRoutines(newRoutines);
      setActiveRoutine(0);
    }
  };

  const deleteEx = (idx: number) => {
    if (!r) return;
    if (confirm("¿Eliminar ejercicio?")) {
      const newRoutines = [...routines];
      newRoutines[activeRoutine].exercises = r.exercises.filter((_: any, i: number) => i !== idx);
      setRoutines(newRoutines);
    }
  };

  const openExModal = (idx: number | null) => {
    setEditIdx(idx);
    if (idx !== null && r) {
      setExForm({ ...DEFAULT_EX, ...r.exercises[idx] });
    } else {
      setExForm({ ...DEFAULT_EX });
    }
    setIsModalOpen(true);
  };

  const saveEx = () => {
    if (!exForm.n) return alert("El nombre es requerido");
    if (!r) return;

    const newRoutines = [...routines];
    const exercises = [...r.exercises];

    if (editIdx !== null) {
      exercises[editIdx] = { ...exercises[editIdx], ...exForm };
    } else {
      exercises.push({ ...exForm, id: "e" + uid() });
    }

    newRoutines[activeRoutine].exercises = exercises;
    setRoutines(newRoutines);
    setIsModalOpen(false);
  };

  const toggleMuscle = (m: string) => {
    setExForm(prev => {
      const muscles = prev.muscles.includes(m)
        ? prev.muscles.filter(x => x !== m)
        : [...prev.muscles, m];
      return { ...prev, muscles };
    });
  };

  const weekVol: Record<string, number> = {};
  Object.keys(ISRAETEL).forEach((m) => {
    weekVol[m] = calcWeekSetsForMuscle(m);
  });

  
  const getDynamicColor = (sets: number, mev: number, mav: number, mrv: number) => {
    if (sets === 0) return "#333333";
    const hex2rgb = (hex: string) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    const rgb2hex = (r: number, g: number, b: number) => "#" + [r,g,b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
    
    const interpolate = (c1: string, c2: string, factor: number) => {
      const f = Math.max(0, Math.min(1, factor));
      const rgb1 = hex2rgb(c1);
      const rgb2 = hex2rgb(c2);
      return rgb2hex(
        rgb1[0] + f * (rgb2[0] - rgb1[0]),
        rgb1[1] + f * (rgb2[1] - rgb1[1]),
        rgb1[2] + f * (rgb2[2] - rgb1[2])
      );
    };

    if (sets < mev) {
      return interpolate("#ff99b3", "#ff0040", (sets - 1) / Math.max(1, mev - 1));
    } else if (sets < mav) {
      return interpolate("#ff0040", "#990026", (sets - mev) / Math.max(1, mav - mev));
    } else if (sets <= mrv) {
      return interpolate("#990026", "#4d0013", (sets - mav) / Math.max(1, mrv - mav));
    } else {
      return "#33000d";
    }
  };

  const todayMuscles = new Set<string>();
  if (r) {
    (r.exercises || []).forEach((ex: any, i: number) => {
      if (tc[r.id + i]) {
        (ex.muscles || []).forEach((m: string) => todayMuscles.add(m));
      }
    });
  }

  const allMuscles = Object.keys(ISRAETEL);
  const activeMuscles = allMuscles.filter((m) => {
    const sets = weekVol[m];
    return sets > 0 || (r && (r.exercises || []).some((ex: any) => (ex.muscles || []).includes(m)));
  });

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header">
        <div className="sec-title">ENTRENAMIENTO</div>
      </div>

      <div className="tabs" style={{ marginBottom: "16px", display: "flex", gap: "8px", overflowX: "auto" }}>
        {(routines || []).map((rt, i) => (
          <button
            key={i}
            draggable={true}
            onDragStart={(e) => { 
              // Set data to force drag
              e.dataTransfer.setData('text/plain', i.toString());
              e.dataTransfer.effectAllowed = "move";
              setDraggedIdx(i); 
            }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIdx(i); }}
            onDragLeave={() => setDragOverIdx(null)}
            onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
            className={`tab ${i === activeRoutine ? "active" : ""}`}
            onClick={() => setActiveRoutine(i)}
            style={{
              opacity: draggedIdx === i ? 0.5 : 1,
              border: dragOverIdx === i ? "1px solid var(--accent)" : undefined,
              transform: dragOverIdx === i ? "scale(1.02)" : "scale(1)",
              transition: "all 0.2s ease",
              cursor: "grab"
            }}
          >
            {rt.name.length > 18 ? rt.name.slice(0, 18) + "⬦" : rt.name}
          </button>
        ))}
        <button
          className="tab"
          onClick={addRoutine}
          style={{
            background: "rgba(255, 0, 64, 0.05)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            fontWeight: 700
          }}
        >
          + Agregar día
        </button>
      </div>

      <div className="g3" style={{ marginBottom: "16px" }}>
        <div className="stat-card c-green">
          <div className="stat-label">Días entrenados</div>
          <div className="stat-value c-green">{doneTotal}</div>
          <div className="stat-diff up">histórico</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Volumen total</div>
          <div className="stat-value" style={{ fontSize: "22px" }}>{calcTotalVolume().toLocaleString("es-AR")}</div>
          <div className="stat-diff up">kg x reps</div>
        </div>
        <div className="stat-card c-amber">
          <div className="stat-label">Rutinas</div>
          <div className="stat-value c-amber">{(routines || []).length}</div>
          <div className="stat-diff up">activas</div>
        </div>
      </div>

      {r ? (
        <div className="panel" style={{ marginBottom: "16px" }}>
          <div className="panel-head">
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, flexWrap: "wrap" }}>
              <div style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                {r.name}
              </div>
              <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                {(r.sections || ["Entrada en calor", "Core", "Fuerza", "Flexibilidad"]).map((sec: string, idx: number) => {
                  const isSecActive = (activeSection || (r.sections || ["Entrada en calor"])[0] || "Fuerza") === sec;
                  return (
                    <button 
                      key={idx}
                      onClick={() => setActiveSection(sec)}
                      style={{
                        padding: "6px 12px",
                        background: isSecActive ? "var(--accent)" : "transparent",
                        color: isSecActive ? "#000" : "var(--text2)",
                        border: `1px solid ${isSecActive ? "var(--accent)" : "#333"}`,
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button className="btn btn-secondary btn-sm" onClick={openRoutineModal} style={{ padding: "4px 8px" }}>
                <i className="ti ti-settings"></i> Editar Día
              </button>
              <button className="btn btn-secondary btn-sm" onClick={duplicateRoutine}>Duplicar</button>
              {(routines || []).length > 1 && (
                <button className="btn-icon" onClick={deleteRoutine}>
                  <i className="ti ti-trash"></i>
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {(() => {
              const currentSec = activeSection || (r.sections || ["Entrada en calor"])[0] || "Fuerza";
              const secEx = (r.exercises || []).map((ex: any, i: number) => ({ ex, i })).filter((item: any) => (item.ex.section || "Fuerza") === currentSec);
              
              if (secEx.length === 0) {
                return (
                  <div className="empty-state" style={{ padding: "16px", border: "1px dashed #333", borderRadius: "8px" }}>
                    <p style={{ color: "var(--text3)" }}>No hay ejercicios en <strong>{currentSec}</strong></p>
                  </div>
                );
              }

              return (
                <div style={{ overflowX: "auto" }}>
                  
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                      <thead>
                        <tr style={{ color: "var(--text2)", fontSize: "11px", letterSpacing: "1px" }}>
                          {["", "Ejercicio", "Series", "Reps", "Tiempo", "Banda", "Descanso", wu, ""].map((h, i) => (
                            <th key={i} style={{ padding: "4px 6px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {secEx.map(({ ex, i }: any) => {
                          const isDone = tc[r.id + i];
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #111" }}>
                              <td style={{ padding: "4px" }}>
                                <div
                                  className={`ex-chk ${isDone ? "done" : ""}`}
                                  onClick={() => toggleEx(i)}
                                  style={{
                                    width: "20px", height: "20px", borderRadius: "4px", border: "1px solid #333",
                                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                                    flexShrink: 0,
                                    background: isDone ? "var(--accent)" : "transparent",
                                    borderColor: isDone ? "var(--accent)" : "#333"
                                  }}
                                >
                                  <i className="ti ti-check" style={{ fontSize: "12px", color: "#000", fontWeight: 900, opacity: isDone ? 1 : 0 }}></i>
                                </div>
                              </td>
                              <td style={{ padding: "4px 6px", fontWeight: 600, color: isDone ? "var(--text2)" : "var(--text)" }}>
                                {ex.n}
                                {ex.muscles?.length > 0 && (
                                  <div style={{ fontSize: "10px", color: "var(--accent)", marginTop: "1px" }}>
                                    {ex.muscles.join(", ")}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "4px 6px", color: "var(--accent)", fontWeight: 700 }}>{ex.sets}</td>
                              <td style={{ padding: "4px 6px", color: "var(--text3)" }}>{ex.reps}</td>
                              <td style={{ padding: "4px 6px", color: "var(--text3)" }}>{ex.time ? ex.time + "s" : "—"}</td>
                              <td style={{ padding: "4px 6px", color: "var(--text3)" }}>{ex.band || "—"}</td>
                              <td style={{ padding: "4px 6px", color: "var(--text3)" }}>{ex.rest ? ex.rest + "s" : "—"}</td>
                              <td style={{ padding: "4px 6px", color: "var(--text3)" }}>{ex.weight ? ex.weight + wu : "BW"}</td>
                              <td style={{ padding: "4px" }}>
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button className="btn-icon" onClick={() => openExModal(i)}><i className="ti ti-edit"></i></button>
                                  <button className="btn-icon" onClick={() => deleteEx(i)}><i className="ti ti-trash"></i></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  
                </div>
              );
            })()}

          </div>

          {!(r.exercises || []).length && (
            <div className="empty-state" style={{ padding: "16px" }}>
              <p>Agregá ejercicios</p>
            </div>
          )}

          <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => (() => { setExForm({ ...DEFAULT_EX, section: activeSection || (r.sections || ["Entrada en calor"])[0] || "Fuerza" }); setIsModalOpen(true); setEditIdx(null); })()}>
              <i className="ti ti-plus"></i> Ejercicio
            </button>
            <button className="btn btn-primary" onClick={markRoutineComplete}>
              <i className="ti ti-check"></i> Marcar día completo
            </button>
            <span style={{ fontSize: "11px", marginLeft: "auto", fontWeight: 600, color: "var(--accent)" }}>
              {pct}% completado
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <i className="ti ti-barbell"></i>
          <p>No hay rutinas. Creá una.</p>
        </div>
      )}

      <div className="g2">
        <div className="panel">
          <div className="panel-head">Mapa Muscular</div>
          <div className="muscle-svg-wrap" style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            <svg viewBox="0 0 92 180" width="120" height="235" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, filter: "drop-shadow(0 0 10px rgba(255,0,64,0.1))" }}>
              {/* Minimal sleek head silhouette */}
              <path d="M 46 4 C 36 4, 34 16, 38 24 C 42 28, 50 28, 54 24 C 58 16, 56 4, 46 4 Z" fill="#0a0a0a" stroke="#222" strokeWidth="0.5" />
              
              {/* The rest of the body is composed organically by the muscle paths themselves! */}
              {Object.entries(musclePathMap).map(([muscle, path]) => {
                const m_vol = weekVol[muscle] || 0;
                const I = ISRAETEL[muscle] || { mev: 8, mav: 16, mrv: 20 };
                const fillCol = m_vol > 0 ? getDynamicColor(m_vol, I.mev, I.mav, I.mrv) : "var(--bg3)";
                // We keep the muscle-part class for stroke, but override fill inline
                return (
                  <path key={muscle} d={path} className="muscle-part" style={{ fill: fillCol, transition: "fill 0.5s ease" }}>
                    <title>{`${muscle}: ${m_vol} series/semana`}</title>
                  </path>
                );
              })}
            </svg>
            <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--text2)", marginBottom: "8px" }}>Análisis ISRAETEL (Semanal)</div>
              {activeMuscles.length ? activeMuscles.map((m) => {
                const sets = weekVol[m];
                const I = ISRAETEL[m];
                const max = I.mrv;
                
                const dynamicColor = getDynamicColor(sets, I.mev, I.mav, I.mrv);
                let badge = "", badgeCls = "";
                if (sets === 0) { badge = "Sin volumen"; badgeCls = "ibadge-low"; }
                else if (sets < I.mev) { badge = "Bajo MEV"; badgeCls = "ibadge-low"; }
                else if (sets <= I.mav) { badge = "Óptimo"; badgeCls = "ibadge-ok"; }
                else if (sets <= I.mrv) { badge = "Alto"; badgeCls = "ibadge-high"; }
                else { badge = "> MRV"; badgeCls = "ibadge-over"; }

                const pct = Math.min(100, Math.round((sets / max) * 100));

                return (
                  <div key={m} className="israetel-row">
                    <div className="israetel-muscle">{m.charAt(0).toUpperCase() + m.slice(1)}</div>
                    <div className="israetel-bar">
                      <div className="israetel-fill" style={{ width: `${pct}%`, background: dynamicColor }}></div>
                    </div>
                    <div className="israetel-sets">{sets} series</div>
                    <div className={`israetel-badge ${badgeCls}`}>{badge}</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", marginLeft: "6px" }}>MEV:{I.mev} MAV:{I.mav} MRV:{I.mrv}</div>
                  </div>
                );
              }) : (
                <div style={{ fontSize: "10px", color: "var(--text2)", padding: "8px 0" }}>Asigná músculos a los ejercicios para ver el análisis Israetel.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROUTINE SETTINGS MODAL */}
      {isRoutineModalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ width: "400px" }}>
            <div className="modal-title">CONFIGURACIÓN DEL DÍA</div>
            <div className="form-group">
              <label className="form-label">Nombre del Día</label>
              <input
                type="text"
                className="form-control"
                value={routineForm.name}
                onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-control"
                value={routineForm.cat}
                onChange={(e) => setRoutineForm({ ...routineForm, cat: e.target.value })}
              >
                <option value="Fuerza">Fuerza</option>
                <option value="Hipertrofia">Hipertrofia</option>
                <option value="Repeticiones">Repeticiones</option>
                <option value="Descanso Activo">Descanso Activo</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label">Secciones del Día (Arrastrar para ordenar)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                {routineForm.sections.map((s, i) => (
                  <div 
                    key={i} 
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', i.toString()); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleSectionDrop(parseInt(e.dataTransfer.getData('text/plain')), i); }}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "8px", 
                      padding: "8px", background: "var(--bg)", border: "1px solid #222", borderRadius: "4px", cursor: "grab" 
                    }}
                  >
                    <i className="ti ti-grid-dots" style={{ color: "var(--text2)" }}></i>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ flex: 1, margin: 0, padding: "4px" }} 
                      value={s}
                      onChange={(e) => {
                        const newSecs = [...routineForm.sections];
                        newSecs[i] = e.target.value;
                        setRoutineForm({ ...routineForm, sections: newSecs });
                      }}
                    />
                    <button 
                      className="btn-icon" 
                      onClick={() => {
                        setRoutineForm({ ...routineForm, sections: routineForm.sections.filter((_, idx) => idx !== i) });
                      }}
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                ))}
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ marginTop: "4px", padding: "8px" }}
                  onClick={() => setRoutineForm({ ...routineForm, sections: [...routineForm.sections, "Nueva Sección"] })}
                >
                  + Agregar Sección
                </button>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginTop: "24px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setIsRoutineModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveRoutineSettings}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ maxWidth: "480px" }}>
            <div className="modal-title">{editIdx !== null ? "EDITAR" : "AGREGAR"} EJERCICIO</div>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input type="text" placeholder="Ej: Press Banca" value={exForm.n} onChange={e => setExForm({ ...exForm, n: e.target.value })} />
            </div>
            <div className="form-row3">
              <div className="form-group">
                <label className="form-label">Series</label>
                <input type="number" placeholder="4" value={exForm.sets || ""} onChange={e => setExForm({ ...exForm, sets: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Reps</label>
                <input type="number" placeholder="8" value={exForm.reps || ""} onChange={e => setExForm({ ...exForm, reps: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input type="number" placeholder="80" step="0.5" value={exForm.weight || ""} onChange={e => setExForm({ ...exForm, weight: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-row3">
              <div className="form-group">
                <label className="form-label">Tiempo (seg)</label>
                <input type="number" placeholder="30" value={exForm.time || ""} onChange={e => setExForm({ ...exForm, time: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Banda</label>
                <select value={exForm.band} onChange={e => setExForm({ ...exForm, band: e.target.value })}>
                  <option value="">Sin banda</option>
                  <option value="Ligera">Ligera</option>
                  <option value="Media">Media</option>
                  <option value="Fuerte">Fuerte</option>
                  <option value="Extra fuerte">Extra fuerte</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descanso (seg)</label>
                <input type="number" placeholder="90" value={exForm.rest || ""} onChange={e => setExForm({ ...exForm, rest: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <input type="text" placeholder="Opcional" value={exForm.notes} onChange={e => setExForm({ ...exForm, notes: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Músculos trabajados</label>
              <div className="muscle-selector">
                {allMuscles.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`tab ${exForm.muscles.includes(m) ? "active" : ""}`}
                    onClick={() => toggleMuscle(m)}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEx}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

