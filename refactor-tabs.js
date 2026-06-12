const fs = require('fs');

let str = fs.readFileSync('src/app/training/page.tsx', 'utf8');

// 1. Add activeSection state
str = str.replace('const [activeRoutine, setActiveRoutine] = useState(0);', 'const [activeRoutine, setActiveRoutine] = useState(0);\n  const [activeSection, setActiveSection] = useState("");');

// 2. Remove the old floating tag and insert the sub-tabs
const panelHeadRegex = /<div className="panel-head">([\s\S]*?)<span className=\{\`tag \$\{catColor\}\`\}>\{r\.cat\}<\/span>([\s\S]*?)<\/div>/;
const newPanelHead = `<div className="panel-head">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                        padding: "4px 12px",
                        background: isSecActive ? "var(--accent)" : "transparent",
                        color: isSecActive ? "#000" : "var(--text2)",
                        border: \`1px solid \${isSecActive ? "var(--accent)" : "#333"}\`,
                        borderRadius: "16px",
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
            </div>$2</div>`;
str = str.replace(panelHeadRegex, newPanelHead);

// 3. Update the table rendering to ONLY render the active section and remove the red section title
const tableMappingRegex = /\{\(r\.sections \|\| \["Entrada en calor", "Core", "Fuerza", "Flexibilidad"\]\)\.map\(\(secName: string, secIdx: number\) => \{([\s\S]*?)return \([\s\S]*?<div style=\{\{ fontSize: "11px"[\s\S]*?>\s*\{secName\}\s*<\/div>\s*<div style=\{\{ overflowX: "auto" \}\}>([\s\S]*?)<\/div>\s*<\/div>\s*\);\s*\}\)\}/;

const activeSecLogic = `
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
                  $2
                </div>
              );
            })()}
`;

str = str.replace(tableMappingRegex, activeSecLogic);

// 4. Update the "Add Exercise" button to auto-select the active section
str = str.replace('openExModal(null)', '(() => { setExForm({ ...DEFAULT_EX, section: activeSection || (r.sections || ["Entrada en calor"])[0] || "Fuerza" }); setIsModalOpen(true); setEditIdx(null); })()');

fs.writeFileSync('src/app/training/page.tsx', str, 'utf8');
console.log("Sub-tabs refactored successfully!");
