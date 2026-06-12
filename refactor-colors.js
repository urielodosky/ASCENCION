const fs = require('fs');

let str = fs.readFileSync('src/app/training/page.tsx', 'utf8');

// 1. Inject getDynamicColor inside the component body, right after weekVol calculation
const funcToInject = `
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
`;

str = str.replace('const todayMuscles = new Set<string>();', funcToInject + '\n  const todayMuscles = new Set<string>();');

// 2. Replace the SVG muscle path logic
const svgLogicRegex = /\{Object\.entries\(musclePathMap\)\.map\(\(\[muscle, path\]\) => \{([\s\S]*?)return \([\s\S]*?<path key=\{muscle\} d=\{path\} className=\{cls\}>[\s\S]*?<\/path>\s*\);\s*\}\)\}/;

const newSvgLogic = `{Object.entries(musclePathMap).map(([muscle, path]) => {
                const m_vol = weekVol[muscle] || 0;
                const I = ISRAETEL[muscle] || { mev: 8, mav: 16, mrv: 20 };
                const fillCol = m_vol > 0 ? getDynamicColor(m_vol, I.mev, I.mav, I.mrv) : "var(--bg3)";
                // We keep the muscle-part class for stroke, but override fill inline
                return (
                  <path key={muscle} d={path} className="muscle-part" style={{ fill: fillCol, transition: "fill 0.5s ease" }}>
                    <title>{\`\${muscle}: \${m_vol} series/semana\`}</title>
                  </path>
                );
              })}`;

str = str.replace(svgLogicRegex, newSvgLogic);

// 3. Replace the horizontal bars logic
const barsLogicRegex = /let badge = "", badgeCls = "", color = "#ff99b3";[\s\S]*?else \{ badge = "> MRV"; badgeCls = "ibadge-over"; color = "#4d0013"; \}/;

const newBarsLogic = `
                const dynamicColor = getDynamicColor(sets, I.mev, I.mav, I.mrv);
                let badge = "", badgeCls = "";
                if (sets === 0) { badge = "Sin volumen"; badgeCls = "ibadge-low"; }
                else if (sets < I.mev) { badge = "Bajo MEV"; badgeCls = "ibadge-low"; }
                else if (sets <= I.mav) { badge = "Óptimo"; badgeCls = "ibadge-ok"; }
                else if (sets <= I.mrv) { badge = "Alto"; badgeCls = "ibadge-high"; }
                else { badge = "> MRV"; badgeCls = "ibadge-over"; }
`;

str = str.replace(barsLogicRegex, newBarsLogic);

// 4. Update the background: color inline style to background: dynamicColor
str = str.replace('style={{ width: `${pct}%`, background: color }}', 'style={{ width: `${pct}%`, background: dynamicColor }}');

fs.writeFileSync('src/app/training/page.tsx', str, 'utf8');
console.log("Dynamic colors applied!");
