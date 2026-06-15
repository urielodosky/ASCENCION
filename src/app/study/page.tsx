"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/db";

// Helper para formatear fecha (YYYY-MM-DD)
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function StudyPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("resumen");

  // DB States
  const [subjects, setSubjects] = useData<any[]>("subjects");
  const [grades, setGrades] = useData<any>("grades");
  const [schedule, setSchedule] = useData<any>("schedule");
  const [studyEvents, setStudyEvents] = useData<any[]>("studyEvents");
  const [studyLogs, setStudyLogs] = useData<any>("studyLogs");

  // Local Form States
  const [newSubj, setNewSubj] = useState({ name: "", professor: "", color: "#ff0040" });
  const [newEvent, setNewEvent] = useState({ title: "", date: todayStr(), subjectId: "", type: "Examen" });
  const [newGrade, setNewGrade] = useState({ subjectId: "", title: "", score: "" });
  const [newLog, setNewLog] = useState({ subjectId: "", duration: 60 });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="section active"><div style={{ padding: '20px' }}>Cargando...</div></div>;

  // --- MATERIAS ---
  const addSubject = () => {
    if (!newSubj.name) return;
    const subj = { id: "sub_" + Date.now(), ...newSubj };
    setSubjects(prev => [...(prev || []), subj]);
    setNewSubj({ name: "", professor: "", color: "#ff0040" });
  };
  const deleteSubject = (id: string) => {
    if (confirm("¿Eliminar materia?")) {
      setSubjects(prev => prev.filter((s: any) => s.id !== id));
      // Cleanup
      setSchedule((prev: any) => {
        const next = { ...prev };
        for (const k in next) if (next[k] === id) delete next[k];
        return next;
      });
      setStudyEvents(prev => prev.filter((e: any) => e.subjectId !== id));
    }
  };

  const getSubj = (id: string) => (subjects || []).find(s => s.id === id);

  // --- HORARIO ---
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const timeSlots = Array.from({ length: 15 }, (_, i) => 8 + i); // 8:00 to 22:00
  
  const toggleSchedule = (day: string, time: number, subjId: string) => {
    const key = `${day}_${time}`;
    setSchedule((prev: any) => {
      const next = { ...prev };
      if (next[key] === subjId) delete next[key];
      else next[key] = subjId;
      return next;
    });
  };

  // --- EVENTOS ---
  const addEvent = () => {
    if (!newEvent.title || !newEvent.subjectId) return;
    const ev = { id: "ev_" + Date.now(), ...newEvent };
    setStudyEvents(prev => [...(prev || []), ev].sort((a, b) => a.date.localeCompare(b.date)));
    setNewEvent({ ...newEvent, title: "" });
  };
  const deleteEvent = (id: string) => {
    setStudyEvents(prev => prev.filter((e: any) => e.id !== id));
  };

  // --- NOTAS ---
  const addGrade = () => {
    if (!newGrade.subjectId || !newGrade.score) return;
    const g = { id: "gr_" + Date.now(), title: newGrade.title || "Nota", score: parseFloat(newGrade.score), date: todayStr() };
    setGrades((prev: any) => {
      const next = { ...(prev || {}) };
      if (!next[newGrade.subjectId]) next[newGrade.subjectId] = [];
      next[newGrade.subjectId].push(g);
      return next;
    });
    setNewGrade({ ...newGrade, title: "", score: "" });
  };
  const deleteGrade = (subjId: string, id: string) => {
    setGrades((prev: any) => {
      const next = { ...prev };
      next[subjId] = next[subjId].filter((g: any) => g.id !== id);
      return next;
    });
  };

  // --- LOGS ---
  const addLog = () => {
    if (!newLog.subjectId || !newLog.duration) return;
    const log = { id: "log_" + Date.now(), duration: newLog.duration, date: todayStr() };
    setStudyLogs((prev: any) => {
      const next = { ...(prev || {}) };
      if (!next[newLog.subjectId]) next[newLog.subjectId] = [];
      next[newLog.subjectId].push(log);
      return next;
    });
    alert(`Añadidos ${newLog.duration} min a la materia.`);
  };

  return (
    <div className="section active" id="sec-study">
      <div className="sec-header">
        <div className="sec-title">FACULTAD</div>
      </div>
      
      <div className="tabs" style={{ marginBottom: "20px" }}>
        {["resumen", "materias", "horario", "eventos", "notas"].map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <div className="g2">
          <div>
            <div className="panel">
              <div className="panel-head">Clases de Hoy</div>
              {(() => {
                const todayName = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][new Date().getDay()];
                const todayClasses = Object.entries(schedule || {})
                  .filter(([k]) => k.startsWith(todayName))
                  .map(([k, v]) => ({ time: parseInt(k.split("_")[1]), subjId: v as string }))
                  .sort((a, b) => a.time - b.time);
                  
                if (todayClasses.length === 0) return <div className="empty-state" style={{ padding: '20px 0' }}><i className="ti ti-coffee"></i><p>No tienes clases hoy</p></div>;
                
                return todayClasses.map((c, i) => {
                  const s = getSubj(c.subjId);
                  if (!s) return null;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', width: '50px', color: 'var(--text2)' }}>{c.time}:00</div>
                      <div style={{ flex: 1, fontWeight: 'bold', color: s.color }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}><i className="ti ti-user"></i> {s.professor}</div>
                    </div>
                  );
                });
              })()}
            </div>
            
            <div className="panel">
              <div className="panel-head">Registro de Estudio</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Materia</label>
                  <select value={newLog.subjectId} onChange={e => setNewLog({ ...newLog, subjectId: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Minutos</label>
                  <input type="number" value={newLog.duration} onChange={e => setNewLog({ ...newLog, duration: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={addLog} style={{ width: '100%', justifyContent: 'center' }}>Registrar Tiempo</button>
            </div>
          </div>
          
          <div>
            <div className="panel">
              <div className="panel-head">Próximos Eventos</div>
              {(!studyEvents || studyEvents.length === 0) ? (
                <div className="empty-state" style={{ padding: '20px 0' }}><i className="ti ti-calendar-check"></i><p>Sin eventos cercanos</p></div>
              ) : (
                studyEvents.filter(e => e.date >= todayStr()).slice(0, 5).map(e => {
                  const s = getSubj(e.subjectId);
                  const daysLeft = Math.ceil((new Date(e.date).getTime() - new Date(todayStr()).getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={e.id} style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px', borderLeft: `4px solid ${s?.color || 'var(--accent)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{e.title}</div>
                          <div style={{ fontSize: '11px', color: s?.color || 'var(--text2)' }}>{s?.name || 'Materia desconocida'}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px' }}>
                          <div style={{ color: daysLeft <= 3 ? 'var(--red)' : 'var(--text2)', fontWeight: 'bold' }}>
                            {daysLeft === 0 ? '¡Hoy!' : daysLeft === 1 ? 'Mañana' : `En ${daysLeft} días`}
                          </div>
                          <div style={{ color: 'var(--text2)' }}>{e.date}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "materias" && (
        <div className="g2">
          <div className="panel">
            <div className="panel-head">Añadir Materia</div>
            <div className="form-group"><label className="form-label">Nombre</label><input type="text" value={newSubj.name} onChange={e => setNewSubj({ ...newSubj, name: e.target.value })} placeholder="Análisis Matemático" /></div>
            <div className="form-group"><label className="form-label">Profesor / Detalles</label><input type="text" value={newSubj.professor} onChange={e => setNewSubj({ ...newSubj, professor: e.target.value })} placeholder="Prof. Ramírez" /></div>
            <div className="form-group"><label className="form-label">Color Distintivo</label><input type="color" value={newSubj.color} onChange={e => setNewSubj({ ...newSubj, color: e.target.value })} style={{ width: '100%', height: '40px', border: 'none', background: 'none', padding: 0 }} /></div>
            <button className="btn btn-primary" onClick={addSubject} style={{ width: '100%', justifyContent: 'center' }}>Guardar Materia</button>
          </div>
          
          <div className="panel">
            <div className="panel-head">Tus Materias</div>
            {(!subjects || subjects.length === 0) ? (
              <div className="empty-state"><p>No has añadido materias.</p></div>
            ) : (
              subjects.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px', borderLeft: `4px solid ${s.color}` }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{s.professor}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => deleteSubject(s.id)}><i className="ti ti-trash" style={{ color: 'var(--red)' }}></i></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "horario" && (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <div className="panel-head">Horario Semanal</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '11px', color: 'var(--text2)' }}>Selecciona una materia y haz clic en las celdas para asignarla:</p>
            <select value={newSubj.name} onChange={e => setNewSubj({ ...newSubj, name: e.target.value })} style={{ width: 'auto' }}>
              <option value="">(Borrar)</option>
              {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', border: '1px solid var(--border)', background: 'var(--bg2)', width: '60px' }}>Hora</th>
                {days.map(d => <th key={d} style={{ padding: '10px', border: '1px solid var(--border)', background: 'var(--bg2)' }}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td style={{ padding: '10px', border: '1px solid var(--border)', background: 'var(--bg2)', fontWeight: 'bold' }}>{time}:00</td>
                  {days.map(day => {
                    const subjId = (schedule || {})[`${day}_${time}`];
                    const s = getSubj(subjId);
                    return (
                      <td 
                        key={day} 
                        style={{ padding: '10px', border: '1px solid var(--border)', cursor: 'pointer', background: s ? `${s.color}22` : 'var(--bg3)', color: s ? s.color : 'var(--text)', transition: 'all 0.2s' }}
                        onClick={() => {
                          if (newSubj.name === "") {
                            // Borrar
                            setSchedule((prev: any) => { const n = {...prev}; delete n[`${day}_${time}`]; return n; });
                          } else {
                            toggleSchedule(day, time, newSubj.name);
                          }
                        }}
                      >
                        {s ? s.name : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "eventos" && (
        <div className="g2">
          <div className="panel">
            <div className="panel-head">Añadir Evento</div>
            <div className="form-group"><label className="form-label">Título</label><input type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Parcial 1" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Fecha</label><input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Tipo</label>
                <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                  <option value="Examen">Examen</option>
                  <option value="Trabajo Práctico">Trabajo Práctico</option>
                  <option value="Entrega">Entrega</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Materia</label>
              <select value={newEvent.subjectId} onChange={e => setNewEvent({ ...newEvent, subjectId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={addEvent} style={{ width: '100%', justifyContent: 'center' }}>Añadir Evento</button>
          </div>

          <div className="panel">
            <div className="panel-head">Todos los Eventos</div>
            {(!studyEvents || studyEvents.length === 0) ? (
              <div className="empty-state"><p>No hay eventos registrados.</p></div>
            ) : (
              studyEvents.map(e => {
                const s = getSubj(e.subjectId);
                const isPast = e.date < todayStr();
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px', borderLeft: `4px solid ${s?.color || 'var(--text2)'}`, opacity: isPast ? 0.6 : 1 }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{e.title} <span style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--bg)', borderRadius: '4px', marginLeft: '5px' }}>{e.type}</span></div>
                      <div style={{ fontSize: '11px', color: s?.color || 'var(--text2)' }}>{s?.name || 'Materia desconocida'} — {e.date}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => deleteEvent(e.id)}><i className="ti ti-trash" style={{ color: 'var(--red)' }}></i></button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === "notas" && (
        <div className="g2">
          <div className="panel">
            <div className="panel-head">Registrar Nota</div>
            <div className="form-group">
              <label className="form-label">Materia</label>
              <select value={newGrade.subjectId} onChange={e => setNewGrade({ ...newGrade, subjectId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Evaluación</label><input type="text" value={newGrade.title} onChange={e => setNewGrade({ ...newGrade, title: e.target.value })} placeholder="Parcial 1" /></div>
              <div className="form-group"><label className="form-label">Nota</label><input type="number" step="0.1" value={newGrade.score} onChange={e => setNewGrade({ ...newGrade, score: e.target.value })} placeholder="8.5" /></div>
            </div>
            <button className="btn btn-primary" onClick={addGrade} style={{ width: '100%', justifyContent: 'center' }}>Guardar Nota</button>
          </div>

          <div className="panel">
            <div className="panel-head">Boletín</div>
            {(!subjects || subjects.length === 0) ? (
              <div className="empty-state"><p>Añade materias primero.</p></div>
            ) : (
              subjects.map(s => {
                const subjGrades = (grades || {})[s.id] || [];
                const avg = subjGrades.length ? (subjGrades.reduce((acc: any, g: any) => acc + g.score, 0) / subjGrades.length).toFixed(2) : '-';
                return (
                  <div key={s.id} style={{ marginBottom: '15px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <strong style={{ color: s.color }}>{s.name}</strong>
                      <strong>Promedio: <span style={{ color: avg !== '-' && parseFloat(avg as string) >= 6 ? 'var(--green)' : avg !== '-' ? 'var(--red)' : 'var(--text)' }}>{avg}</span></strong>
                    </div>
                    {subjGrades.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Sin notas registradas.</div>
                    ) : (
                      subjGrades.map((g: any) => (
                        <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>{g.title} <span style={{ fontSize: '9px', color: 'var(--text2)' }}>({g.date})</span></span>
                          <span style={{ fontWeight: 'bold' }}>{g.score} <i className="ti ti-x" style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '10px' }} onClick={() => deleteGrade(s.id, g.id)}></i></span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
