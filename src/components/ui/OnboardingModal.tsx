"use client";

import { useState, useEffect } from "react";
import { useData } from "@/lib/db";

export default function OnboardingModal() {
  const [cfg, setCfg] = useData<any>("cfg");
  const [totalXP, setTotalXP] = useData<number>("totalXP");
  const [xpLog, setXpLog] = useData<any>("xpLog");
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);

  // Form states
  const [name, setName] = useState("");
  const [sex, setSex] = useState("m");
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);
  const [peso, setPeso] = useState(80);
  const [pesoGoal, setPesoGoal] = useState(75);
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState("cut");
  const [e1, setE1] = useState("");
  const [e2, setE2] = useState("");
  const [e3, setE3] = useState("");
  const [goalMonthly, setGoalMonthly] = useState(5000);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !cfg) return null;

  // Si ya completó el onboarding, no mostramos nada
  if (cfg.onboarded) return null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const calcMacros = (currentCfg: any) => {
    if (!currentCfg.peso || !currentCfg.height || !currentCfg.age) return currentCfg;
    const isM = currentCfg.sex === "m";
    let bmr = isM
      ? 10 * currentCfg.peso + 6.25 * currentCfg.height - 5 * currentCfg.age + 5
      : 10 * currentCfg.peso + 6.25 * currentCfg.height - 5 * currentCfg.age - 161;

    let tdee = bmr * (currentCfg.activity || 1.55);
    let targetKcal = tdee;

    if (currentCfg.goal === "cut") targetKcal *= 0.8;
    else if (currentCfg.goal === "bulk") targetKcal *= 1.1;

    currentCfg.kcal = Math.round(targetKcal);
    currentCfg.prot = Math.round(currentCfg.peso * 2.2);
    currentCfg.fat = Math.round((currentCfg.kcal * 0.25) / 9);
    currentCfg.carb = Math.round((currentCfg.kcal - (currentCfg.prot * 4 + currentCfg.fat * 9)) / 4);

    return currentCfg;
  };

  const handleFinish = () => {
    const newCfg = {
      ...cfg,
      name, sex, age, height, peso, pesoGoal, activity, goal, e1, e2, e3, goalMonthly, onboarded: true
    };
    
    // Calculates macros and sets it inside newCfg
    const finalizedCfg = calcMacros(newCfg);
    setCfg(finalizedCfg);

    // Give XP
    const newTotalXP = (totalXP || 0) + 50;
    setTotalXP(newTotalXP);
    const newXpLog = [...(xpLog || [])];
    newXpLog.unshift({ id: Date.now().toString(), label: "Perfil configurado", amount: 50, ts: Date.now() });
    setXpLog(newXpLog);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.9)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backdropFilter: "blur(5px)"
    }}>
      <div style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        width: "100%",
        maxWidth: "400px",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
      }}>
        {/* Progress Bar */}
        <div style={{ height: "4px", background: "var(--bg3)", width: "100%" }}>
          <div style={{ 
            height: "100%", 
            background: "var(--accent)", 
            width: `${(step / 3) * 100}%`,
            transition: "width 0.3s ease"
          }}></div>
        </div>

        <div style={{ padding: "30px 24px" }}>
          {step === 0 && (
            <div className="onb-step" style={{ animation: "fadeIn 0.3s" }}>
              <div style={{ fontSize: "24px", fontFamily: "'Orbitron', monospace", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>BIENVENIDO 👋</div>
              <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "20px", lineHeight: "1.5" }}>Configurá tu perfil. Vamos a construir juntos tu mejor versión. 4 pasos rápidos.</div>
              
              <div className="form-group">
                <label className="form-label">Tu nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Ej: Matías" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Sexo</label>
                  <select value={sex} onChange={e => setSex(e.target.value)} style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }}>
                    <option value="m">Masculino</option>
                    <option value="f">Femenino</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Edad</label>
                  <input value={age} onChange={e => setAge(parseInt(e.target.value)||0)} type="number" placeholder="25" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
                </div>
              </div>
              
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "20px", padding: "12px" }} onClick={handleNext}>Siguiente →</button>
            </div>
          )}

          {step === 1 && (
            <div className="onb-step" style={{ animation: "fadeIn 0.3s" }}>
              <div style={{ fontSize: "24px", fontFamily: "'Orbitron', monospace", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>TU CUERPO 💪</div>
              <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "20px", lineHeight: "1.5" }}>Calculamos tus calorías y macros ideales con estos datos.</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Altura (cm)</label>
                  <input value={height} onChange={e => setHeight(parseInt(e.target.value)||0)} type="number" placeholder="175" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Peso actual (kg)</label>
                  <input value={peso} onChange={e => setPeso(parseFloat(e.target.value)||0)} type="number" step="0.1" placeholder="82" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "10px" }}>
                <label className="form-label">Peso objetivo (kg)</label>
                <input value={pesoGoal} onChange={e => setPesoGoal(parseFloat(e.target.value)||0)} type="number" step="0.1" placeholder="75" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={handlePrev}>← Atrás</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={handleNext}>Siguiente →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onb-step" style={{ animation: "fadeIn 0.3s" }}>
              <div style={{ fontSize: "24px", fontFamily: "'Orbitron', monospace", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>TU ACTIVIDAD 🏋️‍♂️</div>
              <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "20px", lineHeight: "1.5" }}>Define tu gasto calórico diario.</div>
              
              <div className="form-group">
                <label className="form-label">Nivel de actividad</label>
                <select value={activity} onChange={e => setActivity(parseFloat(e.target.value)||1.55)} style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white", marginBottom: "10px" }}>
                  <option value="1.2">Sedentario (sin ejercicio)</option>
                  <option value="1.375">Ligero (1-3 días/semana)</option>
                  <option value="1.55">Moderado (3-5 días/semana)</option>
                  <option value="1.725">Activo (6-7 días/semana)</option>
                  <option value="1.9">Muy activo (doble turno)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Objetivo principal</label>
                <select value={goal} onChange={e => setGoal(e.target.value)} style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }}>
                  <option value="cut">Perder grasa (déficit calórico)</option>
                  <option value="maintain">Mantener peso</option>
                  <option value="bulk">Ganar músculo (superávit)</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={handlePrev}>← Atrás</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={handleNext}>Siguiente →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onb-step" style={{ animation: "fadeIn 0.3s" }}>
              <div style={{ fontSize: "24px", fontFamily: "'Orbitron', monospace", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>TUS EMPRESAS 💼</div>
              <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "20px", lineHeight: "1.5" }}>Configurá tus fuentes de ingreso.</div>
              
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">Empresa 1</label>
                <input value={e1} onChange={e => setE1(e.target.value)} type="text" placeholder="Ej: Mi Negocio" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
              </div>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">Empresa 2 (opcional)</label>
                <input value={e2} onChange={e => setE2(e.target.value)} type="text" placeholder="Ej: Freelance" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
              </div>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label className="form-label">Empresa 3 (opcional)</label>
                <input value={e3} onChange={e => setE3(e.target.value)} type="text" placeholder="Ej: Inversiones" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Objetivo mensual ($)</label>
                <input value={goalMonthly} onChange={e => setGoalMonthly(parseFloat(e.target.value)||0)} type="number" placeholder="5000" style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", padding: "10px", borderRadius: "6px", color: "white" }} />
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={handlePrev}>← Atrás</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "12px", background: "var(--green)", borderColor: "var(--green)", color: "#000" }} onClick={handleFinish}>¡EMPEZAR! 🚀</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
