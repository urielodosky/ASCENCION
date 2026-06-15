"use client";

import { useState, useEffect } from "react";
import { useData, DB } from "@/lib/db";

export default function ConfigPage() {
  const [cfg, setCfg] = useData<any>('cfg');
  const [mounted, setMounted] = useState(false);

  // Form states for Perfil & Nutrición
  const [name, setName] = useState("");
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);
  const [sex, setSex] = useState("m");
  const [peso, setPeso] = useState(80);
  const [pesoGoal, setPesoGoal] = useState(75);
  const [kcal, setKcal] = useState(2200);
  const [prot, setProt] = useState(180);
  const [carb, setCarb] = useState(220);
  const [fat, setFat] = useState(70);
  const [fiber, setFiber] = useState(30);
  const [activity, setActivity] = useState(1.55);

  // Form states for Empresas & Moneda
  const [e1, setE1] = useState("Empresa 1");
  const [e2, setE2] = useState("Empresa 2");
  const [e3, setE3] = useState("Empresa 3");
  const [goalMonthly, setGoalMonthly] = useState(5000);
  const [currency, setCurrency] = useState("ARS");
  const [usdRate, setUsdRate] = useState(1000);

  // Visual settings
  const [appName, setAppName] = useState("ASCENSION");

  // Load from cfg when it changes or initially
  useEffect(() => {
    if (cfg) {
      setName(cfg.name || "");
      setAge(cfg.age || 25);
      setHeight(cfg.height || 175);
      setSex(cfg.sex || "m");
      setPeso(cfg.peso || 80);
      setPesoGoal(cfg.pesoGoal || 75);
      setKcal(cfg.kcal || 2200);
      setProt(cfg.prot || 180);
      setCarb(cfg.carb || 220);
      setFat(cfg.fat || 70);
      setFiber(cfg.fiber || 30);
      setActivity(cfg.activity || 1.55);

      setE1(cfg.e1 || "Empresa 1");
      setE2(cfg.e2 || "Empresa 2");
      setE3(cfg.e3 || "Empresa 3");
      setGoalMonthly(cfg.goalMonthly || 5000);
      setCurrency(cfg.currency || "ARS");
      setUsdRate(cfg.usdRate || 1000);
      
      setAppName(cfg.appName || "ASCENSION");
    }
    setMounted(true);
  }, [cfg]);

  // Apply Visual Settings
  const applyAccent = (color: string) => {
    const r = document.documentElement;
    r.style.setProperty('--accent', color);
    r.style.setProperty('--red', color);
    const hex = color.replace('#', '');
    const rc = parseInt(hex.slice(0, 2), 16), gc = parseInt(hex.slice(2, 4), 16), bc = parseInt(hex.slice(4, 6), 16);
    r.style.setProperty('--accent2', `rgba(${rc},${gc},${bc},0.15)`);
    r.style.setProperty('--accent3', `rgba(${rc},${gc},${bc},0.08)`);
    r.style.setProperty('--red2', `rgba(${rc},${gc},${bc},0.15)`);
    r.style.setProperty('--red3', `rgba(${rc},${gc},${bc},0.08)`);
    r.style.setProperty('--border', `rgba(${rc},${gc},${bc},0.5)`);
  };

  const applyTheme = (darkMode: boolean) => {
    document.body.classList.toggle('light', !darkMode);
  };

  const applyFontScale = (scale: number) => {
    document.documentElement.style.setProperty('--font-scale', scale.toString());
  };

  useEffect(() => {
    if (mounted && cfg) {
      applyAccent(cfg.accentColor || '#ff0040');
      applyTheme(cfg.darkMode !== false);
      applyFontScale(cfg.fontSize || 1);
    }
  }, [mounted, cfg]);

  const saveProfile = () => {
    setCfg((prev: any) => ({
      ...prev,
      name, age, height, sex, peso, pesoGoal, kcal, prot, carb, fat, fiber, activity, onboarded: true
    }));
    alert("Perfil guardado!");
  };

  const saveFinance = () => {
    setCfg((prev: any) => ({
      ...prev,
      e1, e2, e3, goalMonthly, currency, usdRate
    }));
    alert("Configuración de finanzas guardada!");
  };

  const saveAppNameBtn = () => {
    setCfg((prev: any) => ({ ...prev, appName }));
    document.title = appName;
    alert("Nombre de la app actualizado!");
  };

  const setAccentColor = (color: string) => {
    setCfg((prev: any) => ({ ...prev, accentColor: color }));
    applyAccent(color);
  };

  const toggleTheme = () => {
    setCfg((prev: any) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const setFontSize = (scale: number) => {
    setCfg((prev: any) => ({ ...prev, fontSize: scale }));
    applyFontScale(scale);
  };

  const exportData = () => {
    const data: any = {};
    const keys = ["cfg", "routines", "completedEx", "calStates", "habCfg", "habLogs", "foodLogs", "foodFavs", "weightLogs", "incomes", "expenses", "sales", "weightHist", "xpLog", "totalXP", "notes", "reminders", "bibleProgress", "subjects", "grades", "schedule", "studyEvents", "weeklyShown", "customBooks", "studyLogs"];
    keys.forEach(k => { data[k] = DB.get(k); });
    data.exportedAt = new Date().toISOString();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascension_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    DB.set('lastBackup', Date.now());
  };

  if (!mounted || !cfg) return <div className="section active"><div style={{ padding: '20px' }}>Cargando datos...</div></div>;

  return (
    <div className="section active">
      <div className="sec-header">
        <div className="sec-title">CONFIGURACIÓN</div>
      </div>
      
      <div className="g2">
        <div>
          <div className="panel">
            <div className="panel-head">Perfil & Nutrición</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Nombre</label><input value={name} onChange={e => setName(e.target.value)} type="text" /></div>
              <div className="form-group"><label className="form-label">Edad</label><input value={age} onChange={e => setAge(parseInt(e.target.value) || 0)} type="number" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Altura (cm)</label><input value={height} onChange={e => setHeight(parseInt(e.target.value) || 0)} type="number" /></div>
              <div className="form-group"><label className="form-label">Sexo</label>
                <select value={sex} onChange={e => setSex(e.target.value)}>
                  <option value="m">Masculino</option>
                  <option value="f">Femenino</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Peso actual (kg)</label><input value={peso} onChange={e => setPeso(parseFloat(e.target.value) || 0)} type="number" step="0.1" /></div>
              <div className="form-group"><label className="form-label">Peso objetivo (kg)</label><input value={pesoGoal} onChange={e => setPesoGoal(parseFloat(e.target.value) || 0)} type="number" step="0.1" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Calorías objetivo</label><input value={kcal} onChange={e => setKcal(parseInt(e.target.value) || 0)} type="number" /></div>
              <div className="form-group"><label className="form-label">Proteína (g)</label><input value={prot} onChange={e => setProt(parseInt(e.target.value) || 0)} type="number" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Carbos (g)</label><input value={carb} onChange={e => setCarb(parseInt(e.target.value) || 0)} type="number" /></div>
              <div className="form-group"><label className="form-label">Grasas (g)</label><input value={fat} onChange={e => setFat(parseInt(e.target.value) || 0)} type="number" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Fibra (g)</label><input value={fiber} onChange={e => setFiber(parseInt(e.target.value) || 0)} type="number" /></div>
              <div className="form-group"><label className="form-label">Actividad</label>
                <select value={activity} onChange={e => setActivity(parseFloat(e.target.value) || 1.2)}>
                  <option value="1.2">Sedentario</option>
                  <option value="1.375">Ligero</option>
                  <option value="1.55">Moderado</option>
                  <option value="1.725">Activo</option>
                  <option value="1.9">Muy activo</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveProfile} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Guardar perfil</button>
          </div>
          
          <div className="panel">
            <div className="panel-head">Empresas & Moneda</div>
            <div className="form-group"><label className="form-label">Empresa 1</label><input value={e1} onChange={e => setE1(e.target.value)} type="text" /></div>
            <div className="form-group"><label className="form-label">Empresa 2</label><input value={e2} onChange={e => setE2(e.target.value)} type="text" /></div>
            <div className="form-group"><label className="form-label">Empresa 3</label><input value={e3} onChange={e => setE3(e.target.value)} type="text" /></div>
            <div className="form-group"><label className="form-label">Objetivo mensual (ganancia)</label><input value={goalMonthly} onChange={e => setGoalMonthly(parseFloat(e.target.value) || 0)} type="number" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Moneda</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="ARS">ARS — Peso argentino</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="BRL">BRL — Real brasileño</option>
                  <option value="CLP">CLP — Peso chileno</option>
                  <option value="MXN">MXN — Peso mexicano</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="UYU">UYU — Peso uruguayo</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Valor del dólar (1 USD = ?)</label><input value={usdRate} onChange={e => setUsdRate(parseFloat(e.target.value) || 0)} type="number" placeholder="1000" /></div>
            </div>
            <button className="btn btn-primary" onClick={saveFinance} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Guardar</button>
          </div>
        </div>
        
        <div>
          <div className="panel">
            <div className="panel-head">Personalización</div>
            <div className="form-group">
              <label className="form-label">Nombre de la app</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={appName} onChange={e => setAppName(e.target.value)} type="text" placeholder="ASCENSION" />
                <button className="btn btn-secondary btn-sm" onClick={saveAppNameBtn}>Aplicar</button>
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label className="form-label">Color de acento</label>
              <div className="accent-swatches" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {["#ff0040", "#0088ff", "#00ff88", "#ffaa00", "#cc00ff", "#00ccff", "#ff6600", "#ff69b4"].map(c => (
                  <div 
                    key={c}
                    className={`accent-swatch ${cfg.accentColor === c ? 'active' : ''}`}
                    style={{ background: c, width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', border: cfg.accentColor === c ? '2px solid #fff' : '2px solid transparent' }}
                    onClick={() => setAccentColor(c)}
                  ></div>
                ))}
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Modo visual</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={toggleTheme}>
                  {cfg.darkMode !== false ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Tamaño de fuente</label>
              <div className="tabs" style={{ marginTop: '8px' }}>
                {[0.9, 1, 1.1].map(size => (
                  <button 
                    key={size}
                    className={`tab ${cfg.fontSize === size || (!cfg.fontSize && size === 1) ? 'active' : ''}`}
                    onClick={() => setFontSize(size)}
                  >
                    {size === 0.9 ? 'Pequeña' : size === 1.1 ? 'Grande' : 'Normal'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="panel">
            <div className="panel-head">Datos & Backup</div>
            <p style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '15px' }}>Exporta todos tus datos a un archivo JSON para mantenerlos seguros o moverlos a otro dispositivo.</p>
            <button className="btn btn-green" onClick={exportData} style={{ width: '100%', justifyContent: 'center' }}>
              <i className="ti ti-download"></i> Exportar Backup (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
