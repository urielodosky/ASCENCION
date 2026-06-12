export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const MSHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

export const DMIN = ["L", "M", "X", "J", "V", "S", "D"];
export const DAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const XP_PER_LEVEL = 200;

export const XP_RULES = {
  habit: 5,
  train: 40,
  food: 3,
  weight: 8,
  income: 3,
  sale: 15,
};

export const RANKS = [
  { min: 1, max: 5, name: "RECLUTA", color: "#888" },
  { min: 6, max: 10, name: "SOLDADO", color: "#aaa" },
  { min: 11, max: 20, name: "GUERRERO", color: "#00ccff" },
  { min: 21, max: 35, name: "ÉLITE", color: "#0088ff" },
  { min: 36, max: 50, name: "MAESTRO", color: "#cc00ff" },
  { min: 51, max: 75, name: "LEYENDA", color: "#ffaa00" },
  { min: 76, max: 99, name: "ASCENDIDO", color: "#ff0040" },
  { min: 100, max: 9999, name: "ASCENSION", color: "#ffdd00" },
];

export function p2(n: number): string {
  return String(n).padStart(2, "0");
}

export function ds(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function today(): string {
  return ds(new Date());
}

export function pd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtD(s: string): string {
  return pd(s).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export function uid(): string {
  return "_" + Math.random().toString(36).slice(2);
}

export function fmtMoney(n: number | string): string {
  return Number(n).toLocaleString("es-AR");
}

export function fmtUSD(n: number, usdRate: number = 1000): string {
  return (n / usdRate).toFixed(0);
}

export function getRank(lvl: number) {
  return RANKS.find((r) => lvl >= r.min && lvl <= r.max) || RANKS[0];
}

export function getLvl(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
}

export function getLvlPct(totalXP: number): string {
  return (((totalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100).toFixed(1);
}

export function calcHabStreak(habLogs: any, habCfg: any[]): number {
  let s = 0;
  let d = new Date();
  while (true) {
    const dstr = ds(d);
    const log = habLogs[dstr] || {};
    const active = habCfg.filter((h: any) => !h.startDate || dstr >= h.startDate);
    const ok = active.length > 0 && active.every((h: any) => (log[h.id] || 0) === 1);
    if (ok) {
      s++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return s;
}

export function getWeekDates(offset: number = 0): Date[] {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  const start = new Date(d.setDate(diff));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const nd = new Date(start);
    nd.setDate(start.getDate() + i);
    dates.push(nd);
  }
  return dates;
}

export function calcWeekHabPct(habLogs: any, habCfg: any[], offset: number = 0): number {
  const dates = getWeekDates(offset);
  let tot = 0, done = 0;
  dates.forEach((d) => {
    const dstr = ds(d);
    const log = habLogs[dstr] || {};
    habCfg.filter((h: any) => !h.startDate || dstr >= h.startDate).forEach((h: any) => {
      const v = log[h.id] ?? -1;
      if (v !== -1) {
        tot++;
        if (v === 1) done++;
      }
    });
  });
  return tot ? Math.round((done / tot) * 100) : 0;
}
