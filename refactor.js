const fs = require('fs');

let str = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

str = str.replace(
  'import Link from "next/link";', 
  'import Link from "next/link";\nimport CollapsiblePanel from "@/components/ui/CollapsiblePanel";'
);

str = str.replace(
  /<div className="panel" style=\{\{ marginBottom: 0 \}\}>\s*<div className="panel-head">Calorías \(últimos 7 días\)<\/div>/g,
  '<CollapsiblePanel title="Calorías (últimos 7 días)" defaultOpen={false} colorClass="panel-amber" style={{ marginBottom: 0 }}>'
);
// The closing for this panel is before Progreso Semanal
str = str.replace(
  /          <\/div>\s*<\/div>\s*<div className="panel" style=\{\{ marginBottom: 0 \}\}>\s*<div className="panel-head">\s*Progreso Semanal\s*<\/div>/g,
  '          </div>\n        </CollapsiblePanel>\n        \n        <CollapsiblePanel title="Progreso Semanal" defaultOpen={false} colorClass="panel-blue" style={{ marginBottom: 0 }}>'
);

// closing for Progreso Semanal
str = str.replace(
  /            \}\)\}\s*<\/div>\s*<\/div>\s*<\/div>/g,
  '            )})}\n          </div>\n        </CollapsiblePanel>\n      </div>'
);

// Rutina
str = str.replace(
  /<div className="panel" style=\{\{ marginBottom: 0 \}\}>\s*<div className="panel-head">Rutina: \{r \? r.name : "--"\}<\/div>/g,
  '<CollapsiblePanel title={`Rutina: ${r ? r.name : "--"}`} defaultOpen={true} colorClass="panel-red" style={{ marginBottom: 0 }}>'
);

// closing for rutina, starts habitos
str = str.replace(
  /          \}\)\s*<\/div>\s*<div className="panel" style=\{\{ marginBottom: 0 \}\}>\s*<div className="panel-head">Hábitos de Hoy<\/div>/g,
  '          )}\n        </CollapsiblePanel>\n\n        <CollapsiblePanel title="Hábitos de Hoy" defaultOpen={true} colorClass="panel-green" style={{ marginBottom: 0 }}>'
);

// closing for habitos, starts recordatorios
str = str.replace(
  /          \}\)\}\s*<\/div>\s*<div style=\{\{ display: "flex", flexDirection: "column", gap: "16px" \}\}>\s*<div className="panel" style=\{\{ marginBottom: 0 \}\}>\s*<div className="panel-head">Recordatorios<\/div>/g,
  '          )})}\n        </CollapsiblePanel>\n\n        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>\n          <CollapsiblePanel title="Recordatorios" defaultOpen={false} colorClass="panel-purple" style={{ marginBottom: 0 }}>'
);

// closing for recordatorios, starts eventos
str = str.replace(
  /            \}\)\s*<\/div>\s*\{upcomingEvents\.length > 0 && \(\s*<div className="panel" style=\{\{ marginBottom: 0 \}\}>\s*<div className="panel-head">Próximos eventos de facultad 🎓<\/div>/g,
  '            )}\n          </CollapsiblePanel>\n\n          {upcomingEvents.length > 0 && (\n            <CollapsiblePanel title="Próximos eventos de facultad 🎓" defaultOpen={false} colorClass="panel-blue" style={{ marginBottom: 0 }}>'
);

// closing for eventos
str = str.replace(
  /              \}\)\}\s*<\/div>\s*\)\}/g,
  '              )})}\n            </CollapsiblePanel>\n          )}'
);

fs.writeFileSync('src/app/dashboard/page.tsx', str, 'utf8');
