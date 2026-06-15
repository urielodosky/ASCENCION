"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { uid, today, fmtD, ds } from "@/lib/utils";

const DAYS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function NotesPage() {
  const [profile, setProfile] = useData<any>("profile");
  const [notes, setNotes] = useData<any[]>("notes");
  const [reminders, setReminders] = useData<any[]>("reminders");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isRemModalOpen, setIsRemModalOpen] = useState(false);

  const [noteForm, setNoteForm] = useState({ id: "", title: "", content: "" });
  const [remForm, setRemForm] = useState({ text: "", time: "", type: "normal", days: [] as number[] });

  const addXP = (amount: number) => {
    if (profile) {
      setProfile({ ...profile, xp: (profile.xp || 0) + amount });
    }
  };

  // --- Notes Logic ---
  const saveNote = () => {
    if (!noteForm.content.trim()) return;
    const now = new Date();
    const isNew = !noteForm.id;
    const newNote = {
      id: noteForm.id || uid(),
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
      date: ds(now),
      time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    if (isNew) {
      setNotes([...(notes || []), newNote]);
      addXP(2); // +2 XP por nota creada
    } else {
      setNotes((notes || []).map(n => n.id === newNote.id ? { ...n, title: newNote.title, content: newNote.content } : n));
    }
    
    setIsNoteModalOpen(false);
    setNoteForm({ id: "", title: "", content: "" });
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar nota?')) return;
    setNotes((notes || []).filter((n: any) => n.id !== id));
  };

  const editNote = (n: any) => {
    setNoteForm({ id: n.id, title: n.title, content: n.content });
    setIsNoteModalOpen(true);
  };

  const openNewNote = () => {
    setNoteForm({ id: "", title: "", content: "" });
    setIsNoteModalOpen(true);
  };

  // --- Reminders Logic ---
  const toggleReminderDay = (i: number) => {
    if (remForm.days.includes(i)) {
      setRemForm({ ...remForm, days: remForm.days.filter(d => d !== i) });
    } else {
      setRemForm({ ...remForm, days: [...remForm.days, i] });
    }
  };

  const saveReminder = () => {
    if (!remForm.text.trim() || remForm.days.length === 0) return;
    const newRem = {
      id: uid(),
      text: remForm.text.trim(),
      time: remForm.time,
      type: remForm.type,
      days: remForm.days
    };
    setReminders([...(reminders || []), newRem]);
    setIsRemModalOpen(false);
    setRemForm({ text: "", time: "", type: "normal", days: [] });
  };

  const deleteReminder = (id: string) => {
    if (!confirm('¿Eliminar recordatorio?')) return;
    setReminders((reminders || []).filter((r: any) => r.id !== id));
  };

  // --- Render ---
  const todayDow = new Date().getDay();
  const todayRems = (reminders || []).filter(r => r.days?.includes(todayDow));

  return (
    <div className="section active" style={{ paddingBottom: "100px" }}>
      <div className="sec-header" style={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div className="sec-title">NOTES & REMINDERS</div>
      </div>

      <div className="g2">
        {/* LADO IZQUIERDO: NOTAS */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>MIS NOTAS</div>
            <button className="btn btn-primary btn-sm" onClick={openNewNote}>
              <i className="ti ti-plus"></i> Nueva Nota
            </button>
          </div>

          {!notes || notes.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-notes"></i>
              <p>No tienes notas guardadas.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notes.slice().reverse().map((n: any) => (
                <div key={n.id} className="note-card" onClick={() => editNote(n)} style={{ background: "var(--bg3)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", transition: "0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{n.title || 'Sin título'}</div>
                    <button className="btn-icon btn-sm" onClick={(e) => deleteNote(n.id, e)}>
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text2)", whiteSpace: "pre-wrap", marginBottom: "12px", maxHeight: "60px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.content.slice(0, 150)}{n.content.length > 150 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 600 }}>
                    {fmtD(n.date)} · {n.time || ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LADO DERECHO: RECORDATORIOS */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>RECORDATORIOS</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsRemModalOpen(true)}>
              <i className="ti ti-plus"></i> Nuevo
            </button>
          </div>

          {/* RECORDATORIOS DE HOY */}
          <div className="panel" style={{ borderColor: "rgba(255,170,0,0.3)", marginBottom: "20px" }}>
            <div className="panel-head" style={{ color: "var(--amber)", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ti ti-bell-ringing"></i> PARA HOY
            </div>
            {todayRems.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--text2)", padding: "10px 0" }}>Sin recordatorios para hoy.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                {todayRems.map((r: any) => (
                  <div key={r.id} style={{ padding: "10px", background: "rgba(255,170,0,0.1)", border: "1px solid rgba(255,170,0,0.4)", borderRadius: "6px", fontSize: "12px", color: "var(--amber)", fontWeight: 600 }}>
                    🔔 {r.text} {r.time ? ` · ${r.time}` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TODOS LOS RECORDATORIOS */}
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "12px" }}>RUTINAS ACTIVAS</div>
          {!reminders || reminders.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-calendar-time"></i>
              <p>No tienes recordatorios activos.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reminders.map((r: any) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--bg3)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {r.days.map((d: number) => (
                      <span key={d} style={{ fontSize: "9px", background: "var(--bg2)", padding: "2px 4px", borderRadius: "4px", color: "var(--text)", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {DAYS_FULL[d]?.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: r.type === 'facultad' ? 'var(--blue)' : 'var(--amber)' }}>{r.text}</div>
                    {r.time && <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "4px" }}>{r.time}</div>}
                  </div>
                  <button className="btn-icon btn-sm" onClick={() => deleteReminder(r.id)}>
                    <i className="ti ti-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL NOTAS --- */}
      {isNoteModalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ width: "600px", maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div className="modal-title" style={{ margin: 0 }}>{noteForm.id ? "EDITAR NOTA" : "NUEVA NOTA"}</div>
              <button className="btn-icon" onClick={() => setIsNoteModalOpen(false)}><i className="ti ti-x"></i></button>
            </div>
            
            <div className="form-group">
              <input type="text" className="form-control" style={{ fontSize: "16px", fontWeight: 700 }} placeholder="Título de la nota..." value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <textarea className="form-control" style={{ minHeight: "300px", resize: "vertical", fontSize: "14px", lineHeight: "1.6" }} placeholder="Escribe aquí tu idea..." value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})}></textarea>
            </div>
            
            <button className="btn btn-primary" style={{ width: "100%", marginTop: "20px" }} onClick={saveNote}>
              <i className="ti ti-device-floppy"></i> Guardar Nota
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL RECORDATORIOS --- */}
      {isRemModalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ width: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div className="modal-title" style={{ margin: 0 }}>NUEVO RECORDATORIO</div>
              <button className="btn-icon" onClick={() => setIsRemModalOpen(false)}><i className="ti ti-x"></i></button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Texto del recordatorio</label>
              <input type="text" className="form-control" placeholder="Ej. Estudiar Matemáticas" value={remForm.text} onChange={e => setRemForm({...remForm, text: e.target.value})} />
            </div>
            
            <div className="g2">
              <div className="form-group">
                <label className="form-label">Hora (Opcional)</label>
                <input type="time" className="form-control" value={remForm.time} onChange={e => setRemForm({...remForm, time: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-control" value={remForm.type} onChange={e => setRemForm({...remForm, type: e.target.value})}>
                  <option value="normal">Normal (Naranja)</option>
                  <option value="facultad">Facultad (Azul)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label">Días de la semana</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {[1, 2, 3, 4, 5, 6, 0].map(d => ( // Empieza en Lunes(1) y termina en Domingo(0)
                  <div 
                    key={d} 
                    onClick={() => toggleReminderDay(d)}
                    style={{ 
                      flex: 1, textAlign: "center", padding: "8px 0", cursor: "pointer", 
                      borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                      background: remForm.days.includes(d) ? "var(--accent)" : "var(--bg3)",
                      color: remForm.days.includes(d) ? "#fff" : "var(--text2)",
                      border: `1px solid ${remForm.days.includes(d) ? "var(--accent)" : "var(--border)"}`
                    }}
                  >
                    {DAYS_FULL[d].slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setIsRemModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={saveReminder}>
                <i className="ti ti-check"></i> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
