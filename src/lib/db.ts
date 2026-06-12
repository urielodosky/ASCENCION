"use client";

import { useState, useEffect } from "react";

export const DEFAULT_CFG = {
  name: "",
  age: 25,
  height: 175,
  sex: "m",
  peso: 80,
  pesoGoal: 75,
  kcal: 2200,
  prot: 180,
  carb: 220,
  fat: 70,
  fiber: 30,
  activity: 1.55,
  goal: "cut",
  e1: "Empresa 1",
  e2: "Empresa 2",
  e3: "Empresa 3",
  goalMonthly: 5000,
  onboarded: false,
  currency: "ARS",
  usdRate: 1000,
  accentColor: "#ff0040",
  darkMode: true,
  fontSize: 1,
  weightUnit: "kg",
  appName: "ASCENSION",
  defaultSections: "Entrada en calor,Rutina principal,ABS",
};

export const DEFAULT_ROUTINES = [
  {
    id: "r1",
    name: "DÍA 1 — PUSH",
    cat: "Hipertrofia",
    notes: "",
    exercises: [
      { id: "e1", n: "Press Banca", sets: 4, reps: 8, weight: 80, rest: 90, notes: "", muscles: ["pecho", "triceps", "hombros"] },
      { id: "e2", n: "Press Inclinado", sets: 3, reps: 10, weight: 65, rest: 75, notes: "", muscles: ["pecho", "hombros"] },
      { id: "e3", n: "Press Militar", sets: 4, reps: 8, weight: 50, rest: 90, notes: "", muscles: ["hombros", "triceps"] },
      { id: "e4", n: "Fondos", sets: 3, reps: 12, weight: 0, rest: 60, notes: "BW", muscles: ["pecho", "triceps"] },
    ],
  },
  {
    id: "r2",
    name: "DÍA 2 — PULL",
    cat: "Fuerza",
    notes: "",
    exercises: [
      { id: "e5", n: "Peso Muerto", sets: 4, reps: 5, weight: 120, rest: 120, notes: "", muscles: ["espalda", "femoral", "gluteos", "trapecios"] },
      { id: "e6", n: "Dominadas", sets: 4, reps: 8, weight: 0, rest: 90, notes: "", muscles: ["espalda", "biceps"] },
      { id: "e7", n: "Remo Barra", sets: 4, reps: 8, weight: 70, rest: 90, notes: "", muscles: ["espalda", "biceps"] },
      { id: "e8", n: "Curl Barra", sets: 3, reps: 12, weight: 40, rest: 60, notes: "", muscles: ["biceps"] },
    ],
  },
  {
    id: "r3",
    name: "DÍA 3 — PIERNAS",
    cat: "Fuerza",
    notes: "",
    exercises: [
      { id: "e9", n: "Sentadilla", sets: 5, reps: 5, weight: 100, rest: 120, notes: "", muscles: ["cuadriceps", "gluteos"] },
      { id: "e10", n: "Prensa", sets: 4, reps: 10, weight: 160, rest: 90, notes: "", muscles: ["cuadriceps", "gluteos"] },
      { id: "e11", n: "Curl Femoral", sets: 3, reps: 12, weight: 40, rest: 60, notes: "", muscles: ["femoral"] },
    ],
  },
];

export const DEFAULT_HAB_CFG = [
  { id: "h1", name: "Sin alcohol", cat: "Salud", color: "#ff0040", startDate: new Date().toISOString().slice(0, 10) },
  { id: "h2", name: "Sin comida basura", cat: "Salud", color: "#00ff88", startDate: new Date().toISOString().slice(0, 10) },
  { id: "h3", name: "Dormí bien", cat: "Salud", color: "#0088ff", startDate: new Date().toISOString().slice(0, 10) },
  { id: "h4", name: "Cumplí rutina", cat: "Salud", color: "#ffaa00", startDate: new Date().toISOString().slice(0, 10) },
  { id: "h5", name: "Sin procrastinar", cat: "Trabajo", color: "#cc00ff", startDate: new Date().toISOString().slice(0, 10) },
];

export const DEFAULTS: Record<string, any> = {
  cfg: DEFAULT_CFG,
  routines: DEFAULT_ROUTINES,
  completedEx: {},
  calStates: {},
  habCfg: DEFAULT_HAB_CFG,
  habLogs: {},
  foodLogs: {},
  foodFavs: [],
  weightLogs: [],
  incomes: [],
  expenses: [],
  sales: [],
  weightHist: [],
  xpLog: [],
  totalXP: 0,
  notes: [],
  reminders: [],
  lastBackup: 0,
  bibleProgress: {},
  subjects: [],
  grades: {},
  schedule: {},
  studyEvents: [],
  weeklyShown: 0,
};

export const DB = {
  get: (k: string, d?: any) => {
    if (typeof window === "undefined") return d ?? DEFAULTS[k];
    try {
      const v = localStorage.getItem("pa8_" + k);
      return v !== null ? JSON.parse(v) : (d ?? DEFAULTS[k]);
    } catch {
      return d ?? DEFAULTS[k];
    }
  },
  set: (k: string, v: any) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("pa8_" + k, JSON.stringify(v));
      window.dispatchEvent(new CustomEvent("pa8_update", { detail: { key: k } }));
      
      // Simulate flashSave by dispatching a custom event that the Sidebar can listen to
      window.dispatchEvent(new Event("pa8_flash_save"));
    } catch (e) {
      console.error(e);
    }
  },
};

export function useData<T>(key: string): [T, (val: T | ((prev: T) => T)) => void] {
  const [data, setDataState] = useState<T>(DEFAULTS[key]);

  useEffect(() => {
    let val = DB.get(key);
    
    // Migration: Patch routines that don't have the muscles array
    if (key === "routines" && Array.isArray(val)) {
      let needsUpdate = false;
      val = val.map((r: any) => {
        if (!r.exercises) return r;
        r.exercises = r.exercises.map((ex: any) => {
          if (!ex.muscles) {
            needsUpdate = true;
            const defR = DEFAULT_ROUTINES.find(dr => dr.id === r.id);
            const defEx = defR?.exercises.find(de => de.id === ex.id);
            return { ...ex, muscles: defEx?.muscles || [] };
          }
          return ex;
        });
        return r;
      });
      if (needsUpdate) {
        DB.set("routines", val);
      }
    }

    setDataState(val);

    const handleUpdate = (e: any) => {
      if (e.detail?.key === key) {
        setDataState(DB.get(key));
      }
    };

    window.addEventListener("pa8_update", handleUpdate);
    return () => window.removeEventListener("pa8_update", handleUpdate);
  }, [key]);

  const setData = (val: T | ((prev: T) => T)) => {
    const newValue = typeof val === "function" ? (val as any)(data) : val;
    DB.set(key, newValue);
  };

  return [data, setData];
}
