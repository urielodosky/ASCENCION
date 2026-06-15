"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useData } from "@/lib/db";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { uid, today, ds } from "@/lib/utils";

export default function BiblePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [bibleProgress, setBibleProgress] = useData<any>('bibleProgress');
  const [customBooks, setCustomBooks] = useData<any[]>('customBooks');
  const [studyLogs, setStudyLogs] = useData<any>('studyLogs');

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCustomBookId, setSelectedCustomBookId] = useState<string | null>(null);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [isAddingStudy, setIsAddingStudy] = useState(false);
  const [studySubject, setStudySubject] = useState("");
  const [studyMaterial, setStudyMaterial] = useState("");
  
  const [newBookName, setNewBookName] = useState("");
  const [newBookSections, setNewBookSections] = useState<any[]>([
    { id: uid(), name: "Sección 1", chapters: [{ id: uid(), name: "Cap. 1" }] }
  ]);

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(today());

  // Wait for data
  if (!bibleProgress || !customBooks || !studyLogs) return <div style={{ padding: '20px' }}>Cargando datos...</div>;

  const otBooks = BIBLE_BOOKS.filter(b => b.ot);
  const ntBooks = BIBLE_BOOKS.filter(b => !b.ot);

  // --- KPIS ---
  let readCh = 0;
  let totalCh = 0;
  BIBLE_BOOKS.forEach(b => {
    totalCh += b.ch;
    const prog = bibleProgress[b.id];
    if (prog) {
      for (let c = 1; c <= b.ch; c++) {
        if (prog[c]) readCh++;
      }
    }
  });

  const completedBooks = BIBLE_BOOKS.filter(b => {
    const prog = bibleProgress[b.id];
    if (!prog) return false;
    let done = 0;
    for (let c = 1; c <= b.ch; c++) { if (prog[c]) done++; }
    return done === b.ch;
  }).length;

  const pct = Math.round((readCh / totalCh) * 100);

  // --- STUDY LOGS HELPERS ---
  const addStudyLog = (dateStr: string, text: string) => {
    setStudyLogs((prev: any) => {
      const logs = prev[dateStr] || [];
      if (!logs.includes(text)) {
        return { ...prev, [dateStr]: [...logs, text] };
      }
      return prev;
    });
  };

  const removeStudyLog = (dateStr: string, text: string) => {
    setStudyLogs((prev: any) => {
      const logs = prev[dateStr] || [];
      return { ...prev, [dateStr]: logs.filter((l: string) => l !== text) };
    });
  };

  // --- BIBLE ACTIONS ---
  const toggleChapter = (bId: string, ch: number) => {
    const book = BIBLE_BOOKS.find(b => b.id === bId);
    if (!book) return;
    
    const prog = { ...bibleProgress[bId] };
    const dateStr = today();
    const logStr = `${book.n} Cap. ${ch}`;

    if (prog[ch]) {
      delete prog[ch];
      removeStudyLog(dateStr, logStr); // Note: might remove today's log even if completed in the past, but it's okay for now
    } else {
      prog[ch] = true;
      addStudyLog(dateStr, logStr);
    }
    setBibleProgress((prev: any) => ({ ...prev, [bId]: prog }));
  };

  const markAllChapters = (bId: string, total: number) => {
    const prog = bibleProgress[bId] || {};
    let done = 0;
    for (let c = 1; c <= total; c++) { if (prog[c]) done++; }
    
    const newProg: any = {};
    if (done < total) {
      for (let c = 1; c <= total; c++) newProg[c] = true;
    }
    setBibleProgress((prev: any) => ({ ...prev, [bId]: newProg }));
  };

  // --- CUSTOM BOOK ACTIONS ---
  const addSection = () => {
    setNewBookSections([...newBookSections, { id: uid(), name: `Sección ${newBookSections.length + 1}`, chapters: [{ id: uid(), name: "Cap. 1" }] }]);
  };

  const updateSectionName = (sId: string, name: string) => {
    setNewBookSections(newBookSections.map(s => s.id === sId ? { ...s, name } : s));
  };

  const addChapterToSection = (sId: string) => {
    setNewBookSections(newBookSections.map(s => {
      if (s.id === sId) {
        return { ...s, chapters: [...s.chapters, { id: uid(), name: `Cap. ${s.chapters.length + 1}` }] };
      }
      return s;
    }));
  };

  const updateChapterName = (sId: string, cId: string, name: string) => {
    setNewBookSections(newBookSections.map(s => {
      if (s.id === sId) {
        return { ...s, chapters: s.chapters.map((c: any) => c.id === cId ? { ...c, name } : c) };
      }
      return s;
    }));
  };

  const saveNewBook = () => {
    if (!newBookName.trim()) return;
    const newBook = {
      id: uid(),
      name: newBookName.trim(),
      sections: newBookSections,
      progress: {} // { chapterId: "2026-06-15T..." }
    };
    setCustomBooks((prev: any[]) => [...prev, newBook]);
    setIsCreatingBook(false);
    setNewBookName("");
    setNewBookSections([{ id: uid(), name: "Sección 1", chapters: [{ id: uid(), name: "Cap. 1" }] }]);
  };

  const deleteCustomBook = (bId: string) => {
    if(!confirm("¿Eliminar este libro?")) return;
    setCustomBooks((prev: any[]) => prev.filter(b => b.id !== bId));
    setSelectedCustomBookId(null);
  };

  const toggleCustomChapter = (book: any, chapterId: string, chapterName: string) => {
    const prog = { ...(book.progress || {}) };
    const dateStr = today();
    const logStr = `${book.name}: ${chapterName}`;

    if (prog[chapterId]) {
      delete prog[chapterId];
      removeStudyLog(dateStr, logStr); // Note: might remove today's log even if completed in the past, but it's okay for now
    } else {
      prog[chapterId] = new Date().toISOString(); // store completion date
      addStudyLog(dateStr, logStr);
    }

    setCustomBooks((prev: any[]) => prev.map(b => b.id === book.id ? { ...b, progress: prog } : b));
  };

  // --- PERSONAL STUDY ACTIONS ---
  const savePersonalStudy = () => {
    if (!studySubject.trim()) return;
    const dateStr = today();
    const materialStr = studyMaterial.trim() ? ` (con: ${studyMaterial.trim()})` : "";
    addStudyLog(dateStr, `${studySubject.trim()}${materialStr}`);
    setIsAddingStudy(false);
    setStudySubject("");
    setStudyMaterial("");
  };

  // --- RENDERING HELPERS ---
  const renderBibleBook = (book: any) => {
    const prog = bibleProgress[book.id] || {};
    let done = 0;
    for (let c = 1; c <= book.ch; c++) { if (prog[c]) done++; }
    const bookPct = Math.round((done / book.ch) * 100);
    const completed = done === book.ch;

    const borderColor = completed ? 'rgba(0,255,136,0.5)' : done > 0 ? 'rgba(255,0,64,0.3)' : 'var(--border2)';
    const textColor = completed ? 'var(--green)' : done > 0 ? 'var(--amber)' : 'var(--text2)';
    const barColor = completed ? 'var(--green)' : 'var(--amber)';

    return (
      <div key={book.id} className="bible-book" style={{ borderColor, cursor: 'pointer' }} onClick={() => setSelectedBookId(book.id)}>
        <div className="bible-book-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
          <div className="bible-book-name" style={{ fontWeight: 600 }}>{book.n}</div>
          <div className="bible-book-prog" style={{ color: textColor }}>{done}/{book.ch}</div>
        </div>
        <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${bookPct}%`, background: barColor }}></div>
        </div>
      </div>
    );
  };

  const renderCustomBookCard = (book: any) => {
    const totalC = book.sections.reduce((acc: number, s: any) => acc + s.chapters.length, 0);
    const doneC = Object.keys(book.progress || {}).length;
    const pct = totalC > 0 ? Math.round((doneC / totalC) * 100) : 0;
    const completed = totalC > 0 && doneC === totalC;

    const borderColor = completed ? 'rgba(0,255,136,0.5)' : doneC > 0 ? 'rgba(0,136,255,0.3)' : 'var(--border2)';
    const textColor = completed ? 'var(--green)' : doneC > 0 ? 'var(--blue)' : 'var(--text2)';
    const barColor = completed ? 'var(--green)' : 'var(--blue)';

    return (
      <div key={book.id} className="bible-book" style={{ borderColor, cursor: 'pointer' }} onClick={() => setSelectedCustomBookId(book.id)}>
        <div className="bible-book-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
          <div className="bible-book-name" style={{ fontWeight: 600 }}>{book.name}</div>
          <div className="bible-book-prog" style={{ color: textColor }}>{doneC}/{totalC}</div>
        </div>
        <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor }}></div>
        </div>
      </div>
    );
  };

  // --- CALENDAR LOGIC ---
  const MSHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => (new Date(y, m, 1).getDay() + 6) % 7;

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calMonth, calYear);
    const firstDay = getFirstDay(calMonth, calYear);
    const days = [];
    
    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`e-${i}`} style={{ opacity: 0 }}></div>);
    }

    const todayStr = today();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(calYear, calMonth, i);
      const dStr = ds(d);
      const logs = studyLogs[dStr] || [];
      const hasLogs = logs.length > 0;
      const isToday = dStr === todayStr;
      const isSel = dStr === selectedCalDate;

      days.push(
        <div 
          key={dStr}
          onClick={() => setSelectedCalDate(dStr)}
          style={{
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            cursor: 'pointer',
            borderRadius: '4px',
            background: isSel ? 'var(--accent)' : hasLogs ? 'rgba(0,255,136,0.1)' : 'transparent',
            border: `1px solid ${isSel ? 'var(--accent)' : hasLogs ? 'var(--green)' : 'var(--border3)'}`,
            color: isSel ? '#fff' : hasLogs ? 'var(--green)' : 'var(--text)',
            fontWeight: hasLogs || isSel ? 700 : 400
          }}
        >
          {i}
        </div>
      );
    }

    return (
      <div className="panel">
        <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Calendario de Estudio</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn-icon btn-sm" onClick={() => { let m = calMonth - 1; let y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); }}><i className="ti ti-chevron-left"></i></button>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{MSHORT[calMonth]} {calYear}</span>
            <button className="btn-icon btn-sm" onClick={() => { let m = calMonth + 1; let y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); }}><i className="ti ti-chevron-right"></i></button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center', fontSize: '9px', color: 'var(--text2)' }}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {days}
            </div>
          </div>
          
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
            <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--accent)' }}>Registro: {selectedCalDate ? new Date(selectedCalDate + 'T12:00:00').toLocaleDateString('es-AR') : ''}</h4>
            {selectedCalDate && studyLogs[selectedCalDate] && studyLogs[selectedCalDate].length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {studyLogs[selectedCalDate].map((item: string, i: number) => (
                  <li key={i}><strong style={{ color: 'var(--text)' }}>{item}</strong></li>
                ))}
              </ul>
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>No hay actividad registrada este día.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const selectedBook = BIBLE_BOOKS.find(b => b.id === selectedBookId);
  const selectedCustomBook = (customBooks || []).find(b => b.id === selectedCustomBookId);

  return (
    <div className="section active">
      <div className="sec-header">
        <div className="sec-title">BIBLE & STUDIO</div>
      </div>

      <div id="bible-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div className="stat-card c-green">
          <div className="stat-label">Capítulos Bíblicos leídos</div>
          <div className="stat-value c-green">{readCh}</div>
          <div className="stat-diff up">de {totalCh} total</div>
        </div>
        <div className="stat-card c-amber">
          <div className="stat-label">Libros Bíblicos completos</div>
          <div className="stat-value c-amber">{completedBooks}</div>
          <div className="stat-diff up">de {BIBLE_BOOKS.length}</div>
        </div>
        <div className="stat-card c-blue">
          <div className="stat-label">Progreso Bíblico global</div>
          <div className="stat-value c-blue">{pct}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Otros Libros creados</div>
          <div className="stat-value">{(customBooks || []).length}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Escrituras Hebreoarameas (A.T.)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {otBooks.map(renderBibleBook)}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Escrituras Griegas Cristianas (N.T.)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {ntBooks.map(renderBibleBook)}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span>Otros Libros de Estudio</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsAddingStudy(true)}>
              <i className="ti ti-pencil"></i> Estudio Personal
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsCreatingBook(true)}>
              <i className="ti ti-plus"></i> Crear Libro
            </button>
          </div>
        </div>
        
        {(!customBooks || customBooks.length === 0) ? (
          <div className="empty-state">
            <i className="ti ti-book"></i>
            <p>No tienes otros libros. Crea uno para llevar tu progreso de lectura.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {(customBooks || []).map(renderCustomBookCard)}
          </div>
        )}
      </div>

      {renderCalendar()}

      {/* Modal for Bible Chapters */}
      {mounted && selectedBook && createPortal(
        <div className="overlay open" onClick={(e) => { if(e.target === e.currentTarget) setSelectedBookId(null) }}>
          <div className="modal" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{selectedBook.n}</h3>
              <button className="btn-icon" onClick={() => setSelectedBookId(null)}>
                <i className="ti ti-x"></i>
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 0', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '8px' }}>
                {Array.from({ length: selectedBook.ch }, (_, i) => i + 1).map(c => {
                  const isDone = bibleProgress[selectedBook.id]?.[c];
                  return (
                    <div 
                      key={c} onClick={() => toggleChapter(selectedBook.id, c)}
                      style={{
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${isDone ? 'var(--green)' : 'var(--border2)'}`,
                        background: isDone ? 'rgba(0,255,136,0.1)' : 'transparent',
                        color: isDone ? 'var(--green)' : 'var(--text)',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
                        fontWeight: isDone ? 700 : 400, transition: 'all 0.2s'
                      }}
                    >
                      {c}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => markAllChapters(selectedBook.id, selectedBook.ch)}>Marcar / Desmarcar Todo</button>
              <button className="btn btn-primary" onClick={() => setSelectedBookId(null)}>Cerrar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal for Custom Book Chapters */}
      {mounted && selectedCustomBook && createPortal(
        <div className="overlay open" onClick={(e) => { if(e.target === e.currentTarget) setSelectedCustomBookId(null) }}>
          <div className="modal" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{selectedCustomBook.name}</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => deleteCustomBook(selectedCustomBook.id)}><i className="ti ti-trash"></i></button>
                <button className="btn-icon" onClick={() => setSelectedCustomBookId(null)}><i className="ti ti-x"></i></button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 0', flex: 1 }}>
              {selectedCustomBook.sections.map((sec: any) => (
                <div key={sec.id} style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>{sec.name}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                    {sec.chapters.map((cap: any) => {
                      const doneDate = selectedCustomBook.progress?.[cap.id];
                      return (
                        <div 
                          key={cap.id} onClick={() => toggleCustomChapter(selectedCustomBook, cap.id, cap.name)}
                          style={{
                            padding: '10px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                            border: `1px solid ${doneDate ? 'var(--blue)' : 'var(--border2)'}`,
                            background: doneDate ? 'rgba(0,136,255,0.1)' : 'transparent',
                            color: doneDate ? 'var(--blue)' : 'var(--text)',
                            borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: doneDate ? 700 : 400 }}>{cap.name}</div>
                          {doneDate && <div style={{ fontSize: '9px', marginTop: '4px', color: 'var(--text2)' }}>{new Date(doneDate).toLocaleDateString('es-AR')}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedCustomBookId(null)}>Cerrar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal for Creating Book */}
      {mounted && isCreatingBook && createPortal(
        <div className="overlay open" onClick={(e) => { if(e.target === e.currentTarget) setIsCreatingBook(false) }}>
          <div className="modal" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Crear Nuevo Libro</h3>
              <button className="btn-icon" onClick={() => setIsCreatingBook(false)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div className="input-group">
                <label>Nombre del Libro</label>
                <input type="text" className="input" placeholder="Ej: Hábitos Atómicos" value={newBookName} onChange={e => setNewBookName(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>SECCIONES Y CAPÍTULOS</label>
                {newBookSections.map((sec, sIdx) => (
                  <div key={sec.id} style={{ background: 'var(--bg2)', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input 
                        type="text" className="input" style={{ flex: 1 }} 
                        value={sec.name} onChange={e => updateSectionName(sec.id, e.target.value)} 
                        placeholder="Nombre de la sección"
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                      {sec.chapters.map((cap: any, cIdx: number) => (
                        <input 
                          key={cap.id} type="text" className="input" style={{ fontSize: '11px', padding: '6px' }}
                          value={cap.name} onChange={e => updateChapterName(sec.id, cap.id, e.target.value)} 
                          placeholder={`Cap. ${cIdx + 1}`}
                        />
                      ))}
                      <button className="btn btn-secondary" style={{ padding: '6px', fontSize: '11px' }} onClick={() => addChapterToSection(sec.id)}>
                        + Cap
                      </button>
                    </div>
                  </div>
                ))}
                
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={addSection}>
                  <i className="ti ti-plus"></i> Agregar Sección
                </button>
              </div>

            </div>
            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreatingBook(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveNewBook} disabled={!newBookName.trim()}>Guardar Libro</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal for Personal Study */}
      {mounted && isAddingStudy && createPortal(
        <div className="overlay open" onClick={(e) => { if(e.target === e.currentTarget) setIsAddingStudy(false) }}>
          <div className="modal" style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Estudio Personal</h3>
              <button className="btn-icon" onClick={() => setIsAddingStudy(false)}><i className="ti ti-x"></i></button>
            </div>
            <div style={{ padding: '10px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="input-group">
                <label>¿Qué estudiaste?</label>
                <input type="text" className="input" placeholder="Ej: ¿Quién es Dios?" value={studySubject} onChange={e => setStudySubject(e.target.value)} />
              </div>
              <div className="input-group">
                <label>¿Con qué material?</label>
                <input type="text" className="input" placeholder="Ej: Folleto de buenas noticias" value={studyMaterial} onChange={e => setStudyMaterial(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddingStudy(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={savePersonalStudy} disabled={!studySubject.trim()}>Guardar Estudio</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSS adjustments */}
      <style dangerouslySetInnerHTML={{__html: `
        .bible-book {
          padding: 12px;
          border-width: 1px;
          border-style: solid;
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
          transition: border-color 0.2s;
        }
        .bible-book:hover {
          border-color: var(--accent) !important;
        }
      `}} />
    </div>
  );
}
