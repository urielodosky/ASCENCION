const fs = require('fs');

let str = fs.readFileSync('src/app/training/page.tsx', 'utf8');

// 1. Add States & Logic
const stateInjection = `  // Routine Settings Modal
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [routineForm, setRoutineForm] = useState({ name: "", cat: "", sections: [] as string[] });

  const openRoutineModal = () => {
    if (!r) return;
    const baseNameMatch = r.name.match(/^(?:DÍA\\s+\\d+\\s*—\\s*)(.*)$/i);
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
    const newName = \`DÍA \${activeRoutine + 1} — \${routineForm.name}\`;
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
`;
str = str.replace('const [exForm, setExForm] = useState(DEFAULT_EX);', 'const [exForm, setExForm] = useState(DEFAULT_EX);\n' + stateInjection);

// 2. Add "Editar Día" button next to Routine title
const titleRegex = /<div style=\{\{ flex: 1, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 \}\}>\s*\{r\.name\}\s*<span className=\{\`tag \$\{catColor\}\`\} style=\{\{ marginLeft: "12px" \}\}>\s*\{r\.cat\}\s*<\/span>\s*<\/div>/;
str = str.replace(titleRegex, `<div style={{ flex: 1, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, display: "flex", alignItems: "center", gap: "12px" }}>
              {r.name}
              <span className={\`tag \${catColor}\`}>
                {r.cat}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={openRoutineModal} style={{ padding: "2px 8px", fontSize: "10px" }}>
                <i className="ti ti-settings"></i> Editar Día
              </button>
            </div>`);

// 3. Update the exercise rendering to group by section
const tableRegex = /<table style=\{\{ width: "100%", borderCollapse: "collapse", marginTop: "12px", fontSize: "11px" \}\}>([\s\S]*?)<tbody>([\s\S]*?)<\/tbody>\s*<\/table>/;
// Wait, the table structure is complex. We should wrap the tbody rendering in a map over sections.
// Let's replace the whole table rendering logic.
const newTableRender = `
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {(r.sections || ["Entrada en calor", "Core", "Fuerza", "Flexibilidad"]).map((secName: string, secIdx: number) => {
                const secEx = (r.exercises || []).map((ex: any, i: number) => ({ ex, i })).filter((item: any) => (item.ex.section || "Fuerza") === secName);
                if (secEx.length === 0) return null;
                return (
                  <div key={secIdx}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid #222", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                      {secName}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ color: "var(--text2)", borderBottom: "1px solid #222" }}>
                          <th style={{ width: "24px" }}></th>
                          {["Ejercicio", "Series", "Reps", "Tiempo", "Banda", "Descanso", "kg", ""].map((h, i) => (
                            <th key={i} style={{ padding: "4px 6px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {secEx.map(({ ex, i }: any) => {
                          const isDone = tc[r.id + i];
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #111", opacity: isDone ? 0.5 : 1 }}>
                              <td style={{ padding: "4px" }}>
                                <div
                                  className={\`ex-chk \${isDone ? "done" : ""}\`}
                                  onClick={() => toggleEx(i)}
                                  style={{
                                    width: "20px", height: "20px", borderRadius: "4px", border: "1px solid #333",
                                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                                    flexShrink: 0,
                                    background: isDone ? "var(--accent)" : "transparent",
                                    borderColor: isDone ? "var(--accent)" : "#333"
                                  }}
                                >
                                  <i className="ti ti-check" style={{ fontSize: "10px", opacity: isDone ? 1 : 0 }}></i>
                                </div>
                              </td>
                              <td style={{ padding: "4px 6px", fontWeight: 600, color: isDone ? "var(--text2)" : "var(--text)" }}>
                                {ex.n}
                                <div style={{ fontSize: "9px", color: "var(--accent)", fontWeight: 400, marginTop: "2px" }}>
                                  {(ex.muscles || []).join(", ")}
                                </div>
                              </td>
                              <td style={{ padding: "4px 6px", color: "var(--accent)", fontWeight: 600 }}>{ex.sets}</td>
                              <td style={{ padding: "4px 6px" }}>{ex.reps}</td>
                              <td style={{ padding: "4px 6px" }}>{ex.time ? ex.time + "s" : ""}</td>
                              <td style={{ padding: "4px 6px" }}>{ex.band ? ex.band : ""}</td>
                              <td style={{ padding: "4px 6px" }}>{ex.rest}s</td>
                              <td style={{ padding: "4px 6px" }}>{ex.weight ? ex.weight + wu : "BW"}</td>
                              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openExModal(i)} style={{ padding: "2px 6px", marginRight: "4px" }}>
                                  <i className="ti ti-edit"></i>
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => deleteEx(i)} style={{ padding: "2px 6px", color: "var(--red)" }}>
                                  <i className="ti ti-trash"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
`;
str = str.replace(/<table style=\{\{ width: "100%", borderCollapse: "collapse", marginTop: "12px", fontSize: "11px" \}\}>([\s\S]*?)<\/table>/, newTableRender);

// 4. Exercise Modal: Add "Sección" select
const exModalSectionInput = `
            <div className="form-group">
              <label>Sección</label>
              <select className="form-control" value={exForm.section || "Fuerza"} onChange={(e) => setExForm({ ...exForm, section: e.target.value })}>
                {(r?.sections || ["Entrada en calor", "Core", "Fuerza", "Flexibilidad"]).map((s: string, i: number) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Series</label>
`;
str = str.replace(/<div className="form-group">\s*<label>Series<\/label>/, exModalSectionInput);

// 5. Routine Settings Modal
const routineModalHtml = `
      {/* ROUTINE SETTINGS MODAL */}
      {isRoutineModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: "400px" }}>
            <div className="modal-head">Configuración del Día</div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre del Día</label>
                <input
                  type="text"
                  className="form-control"
                  value={routineForm.name}
                  onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
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
                <label>Secciones del Día (Arrastrar para ordenar)</label>
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
                        className="btn btn-secondary btn-sm" 
                        style={{ color: "var(--red)" }}
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
                    style={{ marginTop: "4px" }}
                    onClick={() => setRoutineForm({ ...routineForm, sections: [...routineForm.sections, "Nueva Sección"] })}
                  >
                    + Agregar Sección
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={() => setIsRoutineModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveRoutineSettings}>Guardar</button>
            </div>
          </div>
        </div>
      )}
`;

str = str.replace(/\{\/\* EXERCISE MODAL \*\/\}/, routineModalHtml + '\n\n      {/* EXERCISE MODAL */}');

fs.writeFileSync('src/app/training/page.tsx', str, 'utf8');
console.log("Refactoring complete");
